import { pool } from "../database/conection.js";
import { actualizarStockFalabella } from "./api_falabella.js";
import { actualizarStockML } from "./api_ml.js";
import { actualizarStockRappi } from "./api_rappi.js";

export const actualizarPublicaciones = async (data) => {
    if(data.length === 0) return {status: "error", mensaje: "no hay productos para actualizar"}

    const ids = data.map(dato => {
        if(!isNaN(dato.id)) return dato.id
    }).filter(dato => dato !== undefined)

    const responseML = await actualizarML(ids)

    const responseRappi = await actualizarRappi(ids)

    const responseFalabella = await actualizarFalabella(ids)

    const respuesta = respuestaGeneral(responseML, responseRappi, responseFalabella);

    return respuesta;
}

const actualizarML = async(ids) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const dataOk = [];
        const dataErr = [];

        const { rows } = await client.query('SELECT codigo, variante, stock FROM publicaciones_stock_view WHERE plataforma_id = 3 AND active = true AND producto_id = ANY($1)', [ids] );

        if(rows.length === 0) throw new Error('No hay publicaciones');

        for(const publicacion of rows){
            const response = await actualizarStockML(publicacion);
            console.log(response);

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

export const actualizarRappiFull = async()  => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM publicaciones_stock_view WHERE plataforma_id = 2');

        if(rows.length === 0) throw new Error('No hay publicaciones');
        
        const response = await actualizarStockRappi(rows, false);

        await client.query('COMMIT');
        return response;
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

        const { rows } = await client.query('SELECT codigo AS sku, stock FROM publicaciones_stock_view WHERE plataforma_id = 1 AND active = true AND producto_id = ANY($1)', [ids] );

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