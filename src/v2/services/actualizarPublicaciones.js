import { pool } from "../database/conection.js";
import { actualizarStockFalabella } from "./api_falabella.js";
import APIMl from "./api_ml.js";
import { actualizarStockRappi } from "./api_rappi.js";
import { actualizarStockVTEX } from "./api_vtex.js";
import { API_CLIENT_ML, API_REFRESH_ML, API_REFRESH_ML_MED, API_SECRET_ML } from "../../config.js";

const APIMl_Bog = new APIMl({TOKEN: '', API_CLIENT: API_CLIENT_ML, API_SECRET: API_SECRET_ML, API_REFRESH: API_REFRESH_ML})
const APIMl_Med = new APIMl({TOKEN: '', API_CLIENT: API_CLIENT_ML, API_SECRET: API_SECRET_ML, API_REFRESH: API_REFRESH_ML_MED})

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

    console.log('entro')
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

export const actualizarMLFijo = async() => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN')

        const dataOk = [];
        const dataErr = [];

        const { rows } = await client.query('SELECT * FROM publicaciones INNER JOIN publicaciones_fijas ON publicaciones.id = publicaciones_fijas.publicacion_id');

        const pubs = rows.map(row => {
            return { codigo: row.codigo, variante: row.variante, stock: row.cantidad, full_bolean: row.full_bolean, medellin: row.medellin}
        })

        for(const publicacion of pubs){
            let response = undefined;
            if(publicacion.medellin){
                response = await APIMl_Med.actualizar(publicacion, false);
            } else {
                response = await APIMl_Bog.actualizar(publicacion);
            }

            if(response.status === "ok"){
                dataOk.push(response);continue;
            } else {
                console.log("Error", publicacion);
                dataErr.push(response);
                continue;
            }
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
        client.release()
    }
}

export const actualizarMLForzado = async() => {
    const client = await pool.connect();

    try {
        console.log("inicio")
        await client.query('BEGIN');

        const dataOk = [];
        const dataErr = [];
        const { rows } = await client.query("SELECT codigo, variante, stock, full_bolean FROM publicaciones_stock_view INNER JOIN sku_producto ON sku_producto.producto_id = publicaciones_stock_view.producto_id WHERE plataforma_id = 3 AND full_bolean = true AND medellin = false");
        //const { rows } = await client.query("SELECT codigo, variante, stock, full_bolean FROM publicaciones_stock_view INNER JOIN sku_producto ON sku_producto.producto_id = publicaciones_stock_view.producto_id WHERE plataforma_id = 3 AND sku_producto.sku = ANY('{898633316,898677800,898669036,898594464,1157055570,1237265532,1157034129,898562103,1157000783,898562474,904730734,1157000772,898614339,898790250,898614437,898676434,1210942090,1157008250,1899867062,913156751,913202032,1205347163,1206951958,1205369256,1205289480,1205371849,1204207217,2002052242,2209216824,1354846631,1205282136,1205378016,2223796628,1205361124,2183389324,1205370901,1375876909,1412637377,1412678361,2177833486,2617143516,2617181916}')");
        //const {rows} = await client.query("SELECT codigo, variante, stock FROM publicaciones_stock_view WHERE codigo = '823981694'");
        //const { rows } = await client.query("SELECT codigo, variante, stock FROM publicaciones_stock_view INNER JOIN sku_producto ON sku_producto.producto_id = publicaciones_stock_view.producto_id WHERE plataforma_id = 3 AND sku_producto.sku = ANY('{7702045538731.7702045538878,7702045593914,7702045900903}')");
        //const {rows} = await client.query("SELECT codigo, variante, stock FROM publicaciones_stock_view WHERE codigo = '851486802'");
        //const { rows } = await client.query("SELECT codigo, variante, stock FROM publicaciones_stock_view INNER JOIN sku_producto ON sku_producto.producto_id = publicaciones_stock_view.producto_id WHERE plataforma_id = 3 AND sku_producto.sku = ANY('{7702045538533,7702045538625,7702045552362,7702045146127,7702045538380,7702045538953,7702045538847,7702045538717,7702045538595,7702045538519,7702045538854,7702045326819}')");
        //const { rows } = await client.query("SELECT codigo, variante, stock FROM publicaciones_stock_view INNER JOIN productos ON productos.id = publicaciones_stock_view.producto_id WHERE publicaciones_stock_view.codigo = '503263690' AND publicaciones_stock_view.active = false");
        //const { rows } = await client.query("SELECT codigo, variante, stock FROM publicaciones_stock_view WHERE plataforma_id = 3 AND producto_id = ANY(SELECT id FROM productos WHERE (nombre LIKE '%Evolution%' OR nombre LIKE '%Koleston Perfect%') AND unidades < 2 AND tipo_id = 1)");
        //const { rows } = await client.query("SELECT codigo, variante, stock FROM publicaciones_stock_view WHERE plataforma_id =3 AND producto_id = ANY(SELECT id FROM productos WHERE nombre LIKE '%Royal%' AND nombre LIKE '%Tono%' AND (nombre LIKE '%77%' OR nombre LIKE '%88%' OR nombre LIKE '%99%' OR nombre LIKE '%-0%' OR nombre LIKE '%00%' OR nombre LIKE '%-1%') AND NOT nombre LIKE '%1-1%' AND tipo_id = 1)");

        const pubs = rows.map(row => {
            return { codigo: row.codigo, variante: row.variante, stock: 0, full_bolean: true}
        })

        console.log("actualizando");
        for(const publicacion of pubs){
            const response = APIMl_Bog.actualizar(publicacion);

            if(response.status === "ok"){
                dataOk.push(response);continue;
            } else {
                console.log("Error", publicacion);
                dataErr.push(response);
                continue;
            }
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

export const actualizarAddi = async (ids) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const dataOk = [];
        const dataErr = [];

        const { rows } = await client.query('SELECT * FROM publicaciones_stock_view WHERE plataforma_id = 5 AND active = true AND producto_id = ANY($1)', [ids] );

        if(rows.length === 0) throw new Error('No hay publicaciones');

        for(const publicacion of rows){
            const response = await actualizarStockVTEX(publicacion);
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
        
        const response = await actualizarStockFalabella(rows);

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
            return {status: "warning", mensaje: "Se actualizo Falabella y Rappi"}
        }
        if(responseRappi.status === "error"){
            return {status: "warning", mensaje: "Solo se actualizo Falabella"}
        } else {
            return {status: "warning", mensaje: "Solo se actualizo Rappi"}
        }
    } else {
        if(responseRappi.status === "error" && responseFalabella.status === "error"){
            return {status: "warning", mensaje: "Solo se actulizo Mercado Libre"}
        }
        if(responseRappi.status === "error"){
            return {status: "warning", mensaje: "Se actualizo Mercado Libre y Falabella"}
        } else {
            return {status: "warning", mensaje: "Se actualizo Mercado Libre y Rappi"}
        }
    }
}