import { pool } from '../database/conection.js';

export const getAllPlatform = async (req, res, next) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const {rows} = await client.query('SELECT * FROM plataformas');

        if(rows.length === 0) throw new Error('No se encontraron plataformas');

        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const getPlatform = async (req, res, next) => {
    const {id} = req.params;
    const client = await pool.connect();
        
    try{
        await client.query('BEGIN');
        const {rows} = await client.query('SELECT * FROM plataformas WHERE id = $1', [id]);

        if(rows.length === 0) throw new Error('No se encontraron datos');

        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error){
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const createPlatform = async (req, res, next) => {
    const { nombre } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('INSERT INTO plataformas (nombre) VALUES ($1)', [nombre]);

        await client.query('COMMIT');
        res.status(200).send({confirm: 'Se registro la plataforma', data: rows[0]})
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const updatePlatform = async (req, res, next) => {
    const { nombre } = req.body;
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { rows } = await client.query('UPDATE plataformas SET nombre = COALESCE($1,nombre) WHERE id = $2 RETURNING *', [nombre, id]);

        if(rows.length === 0) throw new Error('No se actualizo ninguna plataforma')

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se actualizo la plataforma", data: rows})
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const deletePlatform = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { rows } = await client.query('DELETE FROM plataformas WHERE id = $1 RETURNING *', [id]);

        if(rows.length === 0) throw new Error('No se elimino ninguna plataforma');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Plataforma eliminada correctamente", data: rows[0]});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error)
    } finally {
        client.release();
    }
}