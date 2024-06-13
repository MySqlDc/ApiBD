import { pool } from '../database/conection.js';

export const getAllBrands = async (req, res, next) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM marcas');;

        if(rows.length === 0) throw new Error('No hay marcas')
        
        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const getBrand = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM marcas WHERE id = $1', [id]);

        if(rows.length === 0) throw new Error('No hay una marca asociada a ese id');

        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const createBrand = async (req, res, next) => {
    const { nombre } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('INSERT INTO marcas (nombre) VALUES ($1) RETURNING *', [nombre]);

        if(rows.length === 0) throw new Error('No se agrego ninguna marca');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se ha creado la marca correctamente", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const updateBrand = async (req, res, next) => {
    const { id } = req.params;
    const { nombre } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await pool.query('UPDATE marcas SET nombre = $1 WHERE id = $2 RETURNING *', [nombre, id]);

        if(rows.length === 0) throw new Error('No se actualizo ninguna marca');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se actualizo la marca correctamente", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error)
    } finally {
        client.release();
    }
}

export const deleteBrand = async (req, res, next) => {
    const { id } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('DELETE FROM marcas WHERE id = $1 RETURNING *', [id]);

        if(rows.length === 0) throw new Error('No se elimino ninguna marca');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se elimino la marca correctamente", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}