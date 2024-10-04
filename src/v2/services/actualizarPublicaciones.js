import { API_CLIENT_ML, API_KEY_FALABELLA, API_KEY_VTEX, API_REFRESH_ML, API_REFRESH_ML_MED, API_SECRET_ML, STORE_NAME_VTEX, TOKEN_VTEX, USER_FALABELLA } from "../../config.js";

import { pool } from "../database/conection.js";
import { actualizarStockRappi } from "./api_rappi.js";
import { addPublicacionesToQueue } from "./bullQueue.js";

import APIFalabella from "./api_falabella.js";
import APIMl from "./api_ml.js";
import APIVTEX from "./api_vtex.js";

const APIMl_Bog = new APIMl({TOKEN: '', API_CLIENT: API_CLIENT_ML, API_SECRET: API_SECRET_ML, API_REFRESH: API_REFRESH_ML})
const APIMl_Med = new APIMl({TOKEN: '', API_CLIENT: API_CLIENT_ML, API_SECRET: API_SECRET_ML, API_REFRESH: API_REFRESH_ML_MED})
const APIFala = new APIFalabella({USER: USER_FALABELLA, API_KEY: API_KEY_FALABELLA})
const APIAddi = new APIVTEX({STORE_NAME: STORE_NAME_VTEX, API_KEY: API_KEY_VTEX, TOKEN: TOKEN_VTEX})

//actualiza los productos que tenga update_status en la base de datos
export const actualizar = async (urgente = false) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let query = 'SELECT id FROM productos WHERE update_status = true';

        if(urgente) query = 'SELECT id, nombre FROM productos WHERE update_status = true AND (unidades + unidades_virtuales) <= 0';
        
        const {rows} = await client.query(query);

        if(rows.length === 0) throw new Error('No hay publicaciones que actualizar');

        await client.query('COMMIT');

        const response = await actualizarPublicaciones(rows);

        await client.query('BEGIN');
        
        if(response.status === 'error') throw new Error(response.mensaje);

        //await client.query('UPDATE productos SET update_status = false WHERE id = ANY($1)', [rows.map(row => row.id)])

        console.log("Fin actualizacion publicaciones");
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
    } finally {
        client.release();
    }
}

//Elimina flex de las publicaciones
export const eliminarFlex = async(publicaciones) => {
    try {
        await APIMl_Med.token_ml();

        for(const publicacion of publicaciones){
            const response = await APIMl_Med.flex(publicacion, false)
            console.log(response)
        }
    } catch (error) {
        console.log(error);
    }
}

//actualiza las publicaciones 
//recibe data, es un arreglo de objetos [{id: int}]
export const actualizarPublicaciones = async (data) => {
    const response = [];
    if(data.length === 0) return {status: "error", mensaje: "no hay productos para actualizar"}

    const ids = data.map(dato => {
        if(!isNaN(dato.id)) return dato.id
    }).filter(dato => dato !== undefined)

    console.log(ids);
    response.push({response: await agregarML(ids), nombre: 'Mercado Libre'});

    //response.push({response: await actualizarRappi(ids), nombre: 'Rappi'});

    response.push({response: await actualizarFalabella(ids), nombre: 'Falabella'});
    
    response.push({response: await actualizarAddi(ids), nombre: 'Addi'});

    const respuesta = respuestaGeneral(response);

    console.log("bandera actualizacion", respuesta);
    return respuesta;
}


//actualiza las publicaciones de mercadoLibre
//recibe una publicacion que tiene los siguientes datos {
//  codigo: string,
//  varitante: string,
//  stock: int,
//  stock_dim: int,
//  full_bolean: boolean,
//  medellin: boolean
//}
export const actualizarML = async(publicacion) => {
    let response = undefined;
    if(publicacion.medellin){
        let flex = true;
        if(publicacion.stock_dim == 0 && publicacion.stock > publicacion.stock_dim){
            flex = false;
        } else {
            publicacion.stock = publicacion.stock_dim;
        }
        response = await APIMl_Med.actualizar(publicacion, flex);
    } else {
        response = await APIMl_Bog.actualizar(publicacion);
    }
    if(!response) {
        console.log("Error undefined", publicacion);
    }

    console.log(response)
}

//agrega las publicaciones de mercadoLibre en la cola de ejecucion
//recibe ids, es un arreglo de enteros [id: int]
const agregarML = async(ids) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT codigo, variante, FLOOR(stock/unidades_venta) AS stock, FLOOR(stock_dim/unidades_venta) AS stock_dim, full_bolean, medellin FROM publicaciones_stock_view WHERE plataforma_id = 3 AND active = true AND producto_id = ANY($1)', [ids]);

        if(rows.length === 0) throw new Error('No hay publicaciones');

        addPublicacionesToQueue(rows);
        return {status: "ok"};
    } catch (error) {
        await client.query('ROLLBACK');
        console.log('ml fallo', error);
        return {status: "error"};
    } finally {
        client.release();
    }
}

//actualizar publicaciones de falabella y addi que esten en fijas
//se puede enviar ids, es un arreglo de enteros [ids: int]
export const actualizarFijo = async(ids = []) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN')

        const params = [];

        let falabellaQuery = 'SELECT codigo, FLOOR(cantidad/unidades_venta) AS stock FROM publicaciones INNER JOIN publicaciones_fijas ON publicaciones.id = publicaciones_fijas.publicacion_id WHERE plataforma_id = 1';

        let AddiQuery = 'SELECT codigo, FLOOR(cantidad/unidades_venta) AS stock FROM publicaciones INNER JOIN publicaciones_fijas ON publicaciones.id = publicaciones_fijas.publicacion_id WHERE plataforma_id = 5';

        let mlQuery = 'SELECT codigo, variante, FLOOR(cantidad/unidades_venta) AS stock, medellin, full_bolean FROM publicaciones INNER JOIN publicaciones_fijas ON publicaciones.id = publicaciones_fijas.publicacion_id WHERE plataforma_id = 3';

        if(ids.length !== 0){
            falabellaQuery += ' AND producto_id = ANY($1)';
            AddiQuery += ' AND producto_id = ANY($1)';
            mlQuery += ' AND producto_id = ANY($1)';
            params.push(ids)
        }

        const {rows: ML} = await client.query(mlQuery, params);

        if(ML.length > 0) addPublicacionesToQueue(ML);

        const { rows: Falabella } = await client.query(falabellaQuery, params);

        if(Falabella.length > 0) await APIFala.actualizarStock(Falabella);

        const { rows: Addi } = await client.query(AddiQuery, params);

        if(Addi.length > 0){
            for(const publicacion of Addi){
                await APIAddi.actualizarStock(publicacion);
            }
        }

        await client.query('COMMIT');
        return {response: 'Ok', mensaje: 'Se actualizo las plataformas fijas'};
    } catch (error) {
        await client.query('ROLLBACK');
        console.log('ml fallo', error);
        return {status: "error"};
    } finally {
        client.release()
    }
}

//Coloca publicaciones con stock en 0 en mercado libre
export const pausarPublicacion = async() => {
    APIMl_Bog.token_ml()
    APIMl_Med.token_ml()
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query('SELECT * FROM publicaciones WHERE plataforma_id = 3 AND producto_id = ANY(SELECT producto_id FROM pausar)');

        if(rows.length === 0) throw new Error('No hay publicaciones');

        for(const publicacion of rows){
            let response = undefined;
            if(publicacion.medellin){
                response = await APIMl_Med.obtenerStock(publicacion);
            } else {
                response = await APIMl_Bog.obtenerStock(publicacion);
            }

            if(!response) {
                console.log("Error undefined consultar stock", publicacion);
                continue;
            }

            if(response.status === "ok" && response.stock !== 0){
                response = undefined;
                if(publicacion.medellin){
                    response = await APIMl_Med.actualizarStock({...publicacion, stock: 0});
                } else{
                    response = await APIMl_Bog.actualizarStock({...publicacion, stock: 0});
                }

                if(!response) {
                    console.log("Error undefined actualizar stock", publicacion);
                    continue;
                } 

                await client.query('DELETE FROM pausar WHERE producto_id = $1', [publicacion.producto_id])
            }
            
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.log(error);
    } finally {
        client.release();
    }
}

//actualizar publicaciones Addi
//recibe ids, es un arreglo de enteros [ids: int]
export const actualizarAddi = async (ids) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const dataOk = [];
        const dataErr = [];

        const { rows } = await client.query('SELECT codigo, FLOOR(cantidad/unidades_venta) AS stock FROM publicaciones_stock_view WHERE plataforma_id = 5 AND active = true AND producto_id = ANY($1)', [ids] );

        if(rows.length === 0) throw new Error('No hay publicaciones');

        for(const publicacion of rows){
            const response = await APIAddi.actualizarStock(publicacion);
            console.log(response);

            if(!response) {
                console.log("Error undefined", publicacion);
                continue;
            }

            if(response.status === "ok"){
                dataOk.push(response);continue;
            }
            
            dataErr.push(response);
        }

        await client.query('COMMIT');

        console.log('actualizados', dataOk);
        console.log('error', dataErr);
        return {status: "ok"};
    } catch (error) {
        await client.query('ROLLBACK');
        console.log('Addi fallo', error);
        return {status: "error"};
    } finally {
        client.release();
    }
}

//actualiza Rappi Full, envia todos los prouctos
//recibe medellin que es un boolean
export const actualizarRappiFull = async(medellin = false)  => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let query = 'SELECT codigo, nombre, marca, FLOOR(stock/unidades_venta) AS stock, FLOOR(stock_dim/unidades_venta) AS stock_dim, precio, descuento FROM publicaciones_stock_view WHERE plataforma_id = 2';

        if(medellin){
            query += ' AND medellin = true'
        } else {
            query += ' AND medellin = false'
        }

        const { rows } = await client.query(query);

        if(rows.length === 0) throw new Error('No hay publicaciones');
        
        const response = await actualizarStockRappi(rows, false, medellin);

        await client.query('COMMIT');
        return {status: "ok", response};
    } catch (error) {
        await client.query('ROLLBACK');
        console.log('Rappi Full fallo', error);
        return {status: "error"}
    } finally {
        client.release();
    }
}

//Actualiza las publicaciones de rappi
//obteniendo ids, es un arreglo de enteros [ids: int]
const actualizarRappi = async(ids) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT codigo, nombre, marca, FLOOR(stock/unidades_venta) AS stock, FLOOR(stock_dim/unidades_venta) AS stock_dim, precio, descuento FROM publicaciones_stock_view WHERE plataforma_id = 2 AND active = true AND producto_id = ANY($1)', [ids] );

        if(rows.length === 0) throw new Error('No hay publicaciones');

        console.log('rows', rows.length)

        const response = await actualizarStockRappi(rows, true);
        
        await client.query('COMMIT');
        console.log('rappi actualizado');
        return response;
    } catch (error) {
        await client.query('ROLLBACK');
        console.log('Rappi fallo', error);
        return {status: "error"}
    } finally {
        client.release();
    }
}

//Actualiza las publicaciones de falabella
//obteniendo ids, es un arreglo de enteros [ids: int]
const actualizarFalabella = async(ids) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT codigo, FLOOR(stock/unidades_venta) AS stock FROM publicaciones_stock_view WHERE plataforma_id = 1 AND active = true AND producto_id = ANY($1)', [ids] );

        if(rows.length === 0) throw new Error('No hay publicaciones');
        
        const response = await APIFala.actualizarStock(rows);

        await client.query('COMMIT');
        console.log('falabella actualizado');
        return response;
    } catch (error) {
        await client.query('ROLLBACK');
        console.log('falabella fallo', error);
        return {status: "error"}
    } finally {
        client.release();
    }
}

//generar respues que se devolvera
//recibe un arreglo de objetos [{response: {status: string}, nombre: string}]
const respuestaGeneral = (plataformas) => {
    let booleanY = false;
    let mensaje = 'Se actualizo';

    const estados = plataformas.map(plataforma => plataforma.response.status);

    if(estados.every(status => status === "ok")) return {status: "ok", mensaje: "Se actualizaron todas las plataformas"};

    if(estados.every(status => status === "error")) return {status: "error", mensaje: "No se actualizó ninguna plataforma"};

    plataformas.forEach(plataforma => {
        const { response, nombre } = plataforma;
        if (response.status === 'ok') {
            mensaje = booleanY ? `${mensaje} y ${nombre}` : `${mensaje} ${nombre}`;
            booleanY = true;
        }
    });

    return {status: 'warning', mensaje};
};