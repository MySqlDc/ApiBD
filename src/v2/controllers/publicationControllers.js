import { pool } from '../database/conection.js';

export const getAllPublication = async (req, res, next)=> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM publicaciones');;

        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const getPublication = async (req, res, next) => {
    const {id} = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT p.id AS key, p.codigo, p.variante, plataformas.nombre AS plataforma, p.active FROM publicaciones p INNER JOIN plataformas ON p.plataforma_id = plataformas.id WHERE p.producto_id = $1', [id]);

        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const createPublication = async (req, res, next) => {
    const { codigo, variante, plataforma, producto, nombre, marcaNombre, precio, descuento } = req.body;
    const client = await pool.connect();

    try {
        let marca_id = null;
        await client.query('BEGIN');

        if(plataforma === 2){
            
            let marca = await client.query('SELECT * FROM marcas WHERE nombre = $1', [marcaNombre.toString().toLowerCase()]);
    
            if(marca.rows.length === 0) {
                marca = await client.query('INSERT INTO marcas (nombre) VALUES ($1)', [marcaNombre.toString().toLowerCase()])
            }

            marca_id = marca.rows[0];
        }

        const { rows } = await client.query('INSERT INTO publicaciones (codigo, variante, plataforma_id, producto_id, nombre, precio, descuento, marca_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [codigo, variante, plataforma, producto, nombre, precio, descuento, marca_id]);

        if(rows.length === 0) throw new Error('No se pudo crear la publicacion');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: 'Se ha creado correctamente la publicacion', data: rows})
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const updatePublication = async (req, res, next) => {
    const { codigo , variante, plataforma, active } = req.body;
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('UPDATE publicaciones SET codigo = COALESCE($1,codigo), variante = COALESCE($2, variante), plataforma_id = COALESCE($3, plataforma_id), active = COALESCE($4, active) WHERE id = $5 RETURNING *', [codigo , variante, plataforma, active, id])


        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se actualizo la publicacion", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const activePublication = async (req, res, next) => {
    const { ids } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('UPDATE publicaciones SET active = true WHERE producto_id = ANY($1) RETURNING *', [ids]);

        if(rows.length === 0) throw new Error('No se activo ninguna publicacion');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se activaron las publicaciones", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const inactivePublication = async (req, res, next) => {
    const { ids } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('UPDATE publicaciones SET active = false WHERE producto_id = ANY($1)', [ids]);

        if(rows.length === 0) throw new Error('No se desactivo ninguna publicacion');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se desactivaron las publicaciones", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const deletePublication = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('DELETE FROM publicaciones WHERE id = $1 RETURNING *', [id]);

        if(rows.length === 0) throw new Error('No se elimino la publicacion');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se elimino la publicacion correctamente", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}