import { pool } from "../database/conection.js";

export const getAllKits = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {rows} = await client.query('SELECT * FROM productos WHERE tipo_id = 2');

        if(rows.length === 0) throw new Error('No se encontraron kits');

        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const getKit = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const {rows} = await client.query('SELECT * FROM productos WHERE id = $1 AND tipo_id = 2', [id]);

        if(rows.length === 0) throw new Error('No existe ese kit');

        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error)
    } finally {
        client.release();
    }
}

export const getKitProducts = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const {rows} = await client.query('SELECT * FROM productos WHERE id = ANY(SELECT producto_id FROM kit_producto WHERE kit_id = $1)', [id]);

        if(rows.length === 0) throw new Error('No existen productos asociado a ese kit');

        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

//creacion de kits
//envio nombre String, imagen String, marca Int, productos [id Int]
export const createKit = async (req, res, next) => {
    const { nombre, imagen, marcaNombre, productos } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        if(productos.length <= 1) throw new Error('El kit no puede llevar solo un producto');

        let marca_id = undefined;

        let marca = await client.query('SELECT * FROM marcas WHERE nombre = $1', [marcaNombre.toString().toUpperCase()]);
            
        if(marca.rows.length === 0) {
            marca = await client.query('INSERT INTO marcas (nombre) VALUES ($1) RETURNING *', [marcaNombre.toString().toUpperCase()])
        }

        marca_id = marca.rows[0].id;

        const datakit = await client.query('INSERT INTO productos (nombre, url_imagen, tipo_id, marca_id) VALUES ($1, $2, 2, $3) RETURNING *', [nombre, imagen, marca_id]);

        for(const productoId of productos){
            const asociacionProducto = await client.query('INSERT INTO kit_producto (kit_id, producto_id) VALUES ($1, $2) RETURNING *', [datakit.rows[0].id, productoId]);

            if(asociacionProducto.rows.length === 0) throw new Error('No se pudo asociar el producto', productoId)
        }

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Kit creado", data: datakit.rows, productos})
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally  {
        client.release();
    }
}

export const deleteKit = async (req, res, next) => {
    const { id } = req.params;
    const { producto_id } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { rows } = await client.query('DELETE FROM kit_producto WHERE kit_id = $1 AND producto_id = $2 RETURNING *', [id, producto_id]);

        if(rows.length === 0) throw new Error('No se elimino ningún producto');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: 'Se elimino el kit correctamente', data: rows[0]})
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}