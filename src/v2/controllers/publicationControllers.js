import { pool } from '../database/conection.js';

export const getAllPublication = async (req, res, next)=> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM publicaciones');;

        if(rows.length === 0) throw new Error('No hay publicaciones')
        
        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const getPublicationPlatform = async ( req, res, next ) => {
    const { plataforma } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM publicaciones WHERE plataforma_id = (SELECT id FROM plataformas WHERE nombre = $1)', [plataforma]);

        if(rows.length === 0) throw new Error('No se encontro ninguna publicacion asociada con esa plataforma');

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
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM publicaciones WHERE id = $1', [id]);

        if(rows.length === 0) throw new Error('No hay publicaciones asociadas con ese codigo')

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
        await client.query('BEGIN');

        let marca_id = undefined;

        if(plataforma === 20){
            
            if(!marcaNombre) throw new Error('No se envio la marca');
            let marca = await client.query('SELECT * FROM marcas WHERE nombre = $1', [marcaNombre.toString().toUpperCase()]);
    
            
            if(marca.rows.length === 0) {
                marca = await client.query('INSERT INTO marcas (nombre) VALUES ($1) RETURNING *', [marcaNombre.toString().toUpperCase()])
            }

            marca_id = marca.rows[0].id;
        }

        const valores = [
            codigo, 
            variante,
            plataforma, 
            producto, 
            nombre, 
            precio, 
            descuento, 
            marca_id
        ]

        const {rows} = await client.query('INSERT INTO publicaciones (codigo, variante, plataforma_id, producto_id, nombre, precio, descuento, marca_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', valores);

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
    const { codigo , variante, plataforma, precio, descuento, marca_nombre } = req.body;
    const { id } = req.params;
    const client = await pool.connect();

    try {
        let marca = null;
        await client.query('BEGIN');

        const marcas = await client.query('SELECT * FROM marcas WHERE nombre = $1', [marca_nombre])

        if(marcas.rows.length === 0) {
            console.log('No existe la marca', id)
        } else {
            marca = marcas.rows[0].id;
        }

        const { rows } = await client.query('UPDATE publicaciones SET codigo = COALESCE($1,codigo), variante = COALESCE($2, variante), plataforma_id = COALESCE($3, plataforma_id), precio = COALESCE($4, precio), descuento = COALESCE($5, descuento), marca_id = COALESCE($6, marca_id) WHERE id = $7 RETURNING *', [codigo , variante, plataforma, precio, descuento, marca, id])

        if(rows.length === 0) throw new Error('No se actualizo ninguna publicacion')

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

        const { rows } = await client.query('UPDATE publicaciones SET active = true WHERE id = ANY($1) RETURNING *', [ids]);

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

        const { rows } = await client.query('UPDATE publicaciones SET active = false WHERE id = ANY($1)', [ids]);

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