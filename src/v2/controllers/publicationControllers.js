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
    const { codigo, variante, plataforma, producto, nombre, marcaNombre, precio, descuento, medellin, full } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        if(descuento > precio) throw new Error('El descuento es mayor que el precio de venta')

        let marca_id = undefined;

        if(plataforma === 2){
            
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
            marca_id,
            medellin,
            full
        ]

        const {rows} = await client.query('INSERT INTO publicaciones (codigo, variante, plataforma_id, producto_id, nombre, precio, descuento, marca_id, medellin, full_bolean) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *', valores);

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
    const { active, codigo , variante, plataforma, precio, descuento, marca_nombre, medellin } = req.body;
    const { id } = req.params;
    const client = await pool.connect();

    try {
        let marca = null;
        await client.query('BEGIN');

        const marcas = await client.query('SELECT * FROM marcas WHERE nombre = $1', [marca_nombre])

        if(marca_nombre && marcas.rows.length != 0) marca = marcas.rows[0].id;

        const { rows } = await client.query('UPDATE publicaciones SET active = COALESCE($1, active), codigo = COALESCE($2,codigo), variante = COALESCE($3, variante), plataforma_id = COALESCE($4, plataforma_id), precio = COALESCE($5, precio), descuento = COALESCE($6, descuento), marca_id = COALESCE($7, marca_id), medellin = COALESCE($8, medellin) WHERE id = $9 RETURNING *', [active, codigo , variante, plataforma, precio, descuento, marca, medellin, id])

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