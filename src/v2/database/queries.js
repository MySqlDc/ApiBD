import { pool } from './conection.js';

export const getQuery = async(query, values = []) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(query, values);
        await client.query('COMMIT');
        
        if(rows.length === 0) return {status: 200, response: {mensaje: "No existen elementos"}}

        return {status: 200, response: {data: rows}}
    } catch (error) {
        await client.query('ROLLBACK');
        switch (error.code){
            default: 
                return {status: 400, response: {error}}
        }
    } finally {
        client.release()
    }
}

export const postQuery = async(query, values) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(query+" RETURNING *", values);

        await client.query('COMMIT');

        if(rows.length === 0) return {status: 200, response: {error: "No se creo ningún registro"}}

        if(rows.length === 1) return {status: 201, response: {data: rows[0]}}

    } catch (error) {
        await client.query('ROLLBACK');
        switch (error.code){
            case "23502":
                return { status: 400, response: {error: "No se envió "+error.column+" para crear "+error.table}}
            case "23505":
                return { status: 400, response: {error: "Se viola la restriccion "+error.constraint+" al crear "+error.table}}
            default:
                return { status: 400, response: {error}}
        }
    } finally {
        client.release()
    }
}

export const putQuery = async(query, values) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(query+" RETURNING *", values);

        await client.query('COMMIT');

        if(rows.length === 0) return {status: 200, response: {error: "No se actualizo ningún registro"}}

        if(rows.length === 1) return {status: 200, response: {data: rows[0]}}

        return {status: 200, response: {data: rows}}
    } catch (error) {
        await client.query('ROLLBACK');
        switch(error.code){
            case "23505":
                return { status: 400, response: {error: "Se viola la restriccion "+error.constraint+" al actualizar "+error.table}}
            case "22P02":
                return {status: 400, response: {error: "Hay un error en los tipos de datos enviados, por favor revisar"}}
            default:
                return {status: 400, response: {error}}
        }
    } finally {
        client.release()
    }
}

export const deleteQuery = async (query, values) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rowCount, rows } = await client.query(query+" RETURNING *", values);

        await client.query('COMMIT');

        if(rows.length === 0) return {status: 200, response: {error: "No se actualizo ningún registro"}}

        if(rows.length === 1) return {status: 200, response: {confirmacion: "Se Elimino un registro", data: rows[0]}}

        return {status: 200, response: {confirmacion: "Se Eliminaron "+rowCount+" registros", data: rows}}
    } catch (error) {
        await client.query('ROLLBACK');
        return {status: 400, response: {error}}
    } finally {
        client.release()
    }
}