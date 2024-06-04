import { pool } from "../database/conection.js";

export const getAllSkus = async (req, res, next) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM vista_sku_producto');

        if(rows.length === 0) throw new Error('No se obtuvo ningun sku');

        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const getSku = async (req, res, next) => {
    const { sku } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM vista_sku_producto WHERE sku = $1', [sku]);

        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error)
    } finally {
        client.release();
    }
}

export const createSku = async (req, res, next) => {
    const { id } = req.params;
    const { sku } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('INSERT INTO sku_producto (sku, producto_id) VALUES ($1, $2)', [sku, id]);

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se agrego correctamente el sku", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const deleteSku = async (req, res, next) => {
    const { id } = req.params;
    const { sku } =  req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('DELETE FROM sku_producto WHERE sku = $1 AND producto_id = $2 RETURNING *', [sku, id]);

        if(rows.length === 0) throw new Error('No se elimino ningun sku');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se elimino correctamente el sku", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}