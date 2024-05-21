import { pool } from './conection.js';

export const getQuery = async(query, values = []) => {
    try {
        const { rows } = await pool.query(query, values);

        if(rows.length === 0) return {status: 200, response: {mensaje: "No existen elementos"}}

        return {status: 200, response: {data: rows}}
    } catch (error) {
        switch (error.code){
            default: 
                return {status: 400, response: {mensaje: error}}
        }
    }
}

export const postQuery = async(query, values) => {
    try {
        const { rows } = await pool.query(query+" RETURNING *", values);

        if(rows.length === 0) return {status: 200, response: {mensaje: "No se creo ningún registro"}}

        if(rows.length === 1) return {status: 201, response: {data: rows[0]}}
    } catch (error) {
        switch (error.code){
            case "23502":
                return { status: 400, response: {mensaje: "No se envió "+error.column+" para crear "+error.table}}
            case "23505":
                return { status: 400, response: {mensaje: "Se viola la restriccion "+error.constraint+" al crear "+error.table}}
            default:
                return { status: 400, response: {mensaje: error}}
        }
    }
}

export const putQuery = async(query, values) => {
    try {
        const { rows } = await pool.query(query+" RETURNING *", values);

        if(rows.length === 0) return {status: 200, response: {mensaje: "No se actualizo ningún registro"}}

        if(rows.length === 1) return {status: 200, response: {data: rows[0]}}

        return {status: 200, response: {data: rows}}
    } catch (error) {
        switch(error.code){
            case "23505":
                return { status: 400, response: {mensaje: "Se viola la restriccion "+error.constraint+" al actualizar "+error.table}}
            case "22P02":
                return {status: 400, response: {mensaje: "Hay un error en los tipos de datos enviados, por favor revisar"}}
            default:
                return {status: 400, response: {mensaje: error}}
        }
    }
}

export const deleteQuery = async (query, values) => {
    try {
        const { rowCount, rows } = await pool.query(query+" RETURNING *", values);

        if(rows.length === 0) return {status: 200, response: {mensaje: "No se actualizo ningún registro"}}

        if(rows.length === 1) return {status: 200, response: {confirmacion: "Se Elimino un registro", data: rows[0]}}

        return {status: 200, response: {confirmacion: "Se Eliminaron "+rowCount+" registros", data: rows}}
    } catch (error) {
        return {status: 400, response: {mensaje: error}}
    }
}