import { API_CLIENT_ML, API_KEY_FALABELLA, API_KEY_VTEX, API_REFRESH_ML, API_REFRESH_ML_MED, API_SECRET_ML, STORE_NAME_VTEX, TOKEN_VTEX, USER_FALABELLA } from "../../config.js";

import { pool } from "../database/conection.js";
import { actualizarStockRappi } from "./api_rappi.js";

import APIFalabella from "./api_falabella.js";
import APIMl from "./api_ml.js";
import APIVTEX from "./api_vtex.js";


const APIMl_Bog = new APIMl({TOKEN: '', API_CLIENT: API_CLIENT_ML, API_SECRET: API_SECRET_ML, API_REFRESH: API_REFRESH_ML})
const APIMl_Med = new APIMl({TOKEN: '', API_CLIENT: API_CLIENT_ML, API_SECRET: API_SECRET_ML, API_REFRESH: API_REFRESH_ML_MED})
const APIFala = new APIFalabella({USER: USER_FALABELLA, API_KEY: API_KEY_FALABELLA})
const APIAddi = new APIVTEX({STORE_NAME: STORE_NAME_VTEX, API_KEY: API_KEY_VTEX, TOKEN: TOKEN_VTEX})

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

        await client.query('UPDATE productos SET update_status = false WHERE id = ANY($1)', [rows.map(row => row.id)])

        console.log("Fin actualizacion publicaciones");
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
    } finally {
        client.release();
    }
}

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

export const actualizarPublicaciones = async (data) => {
    if(data.length === 0) return {status: "error", mensaje: "no hay productos para actualizar"}

    const ids = data.map(dato => {
        if(!isNaN(dato.id)) return dato.id
    }).filter(dato => dato !== undefined)

    console.log(ids);
    const responseML = await actualizarML(ids)

    //const responseRappi = await actualizarRappi(ids)

    const responseFalabella = await actualizarFalabella(ids)
    
    const responseAddi = await actualizarAddi(ids);

    const respuesta = respuestaGeneral(responseML, responseAddi, responseFalabella);

    console.log("bandera actualizacion", respuesta);
    return respuesta;
}

const actualizarML = async(ids) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const dataOk = [];
        const dataErr = [];

        const { rows } = await client.query('SELECT codigo, variante, stock, stock_dim, full_bolean FROM publicaciones_stock_view WHERE plataforma_id = 3 AND active = true AND producto_id = ANY($1)', [ids]);

        if(rows.length === 0) throw new Error('No hay publicaciones');

        for(const publicacion of rows){
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
        console.log('ml fallo', error);
        return {status: "error"};
    } finally {
        client.release();
    }
}

export const actualizarFijo = async() => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN')

        const { rows: Falabella } = await client.query('SELECT codigo, cantidad AS stock FROM publicaciones INNER JOIN publicaciones_fijas ON publicaciones.id = publicaciones_fijas.publicacion_id WHERE plataforma_id = 1');

        await APIFala.actualizarStock(Falabella);

        const { rows: Addi } = await client.query('SELECT * FROM publicaciones WHERE plataforma_id = 5');

        await APIAddi.actualizarStock(Addi);

        await client.query('COMMIT');
        return response;
    } catch (error) {
        await client.query('ROLLBACK');
        console.log('ml fallo', error);
        return {status: "error"};
    } finally {
        client.release()
    }
}

export const actualizarAddi = async (ids) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const dataOk = [];
        const dataErr = [];

        const { rows } = await client.query('SELECT * FROM publicaciones_stock_view WHERE plataforma_id = 5 AND active = true AND producto_id = ANY($1)', [ids] );

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

export const actualizarRappiFull = async(medellin = false)  => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let query = 'SELECT * FROM publicaciones_stock_view WHERE plataforma_id = 2';

        if(medellin) query += ' AND medellin = true';

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

const actualizarRappi = async(ids) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM publicaciones_stock_view WHERE plataforma_id = 2 AND active = true AND producto_id = ANY($1)', [ids] );

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

const actualizarFalabella = async(ids) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT codigo, stock FROM publicaciones_stock_view WHERE plataforma_id = 1 AND active = true AND producto_id = ANY($1)', [ids] );

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

const respuestaGeneral = (responseML, responseRappi, responseFalabella) => {
    if(responseML.status === "ok" && responseRappi.status === "ok" && responseFalabella.status === "ok"){
        return {status: "ok", mensaje: "se actualizaron todas las plataformas"}
    } else if(responseML.status === "error" && responseRappi.status === "error" && responseFalabella.status === "error"){
        return {status: "error", mensaje: "No se actualizo ninguna plataforma"}
    }else if(responseML.status === "error"){
        if(responseRappi.status === "ok" && responseFalabella.status === "ok"){
            return {status: "warning", mensaje: "Se actualizo Falabella y Addi"}
        }
        if(responseRappi.status === "error"){
            return {status: "warning", mensaje: "Solo se actualizo Falabella"}
        } else {
            return {status: "warning", mensaje: "Solo se actualizo Addi"}
        }
    } else {
        if(responseRappi.status === "error" && responseFalabella.status === "error"){
            return {status: "warning", mensaje: "Solo se actulizo Mercado Libre"}
        }
        if(responseRappi.status === "error"){
            return {status: "warning", mensaje: "Se actualizo Mercado Libre y Falabella"}
        } else {
            return {status: "warning", mensaje: "Se actualizo Mercado Libre y Addi"}
        }
    }
}