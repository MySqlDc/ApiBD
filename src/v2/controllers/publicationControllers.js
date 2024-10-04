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

export const getPublicationFijas = async (req, res, next) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows: publicaciones } = await client.query('SELECT id, codigo, variante, cantidad, medellin, unidades_venta, (SELECT sku_producto.sku FROM sku_producto WHERE sku_producto.producto_id = publicaciones.producto_id LIMIT 1) AS sku FROM publicaciones INNER JOIN publicaciones_fijas ON publicaciones.id = publicaciones_fijas.publicacion_id WHERE plataforma_id = 3')

        if (publicaciones.length == 0) throw new Error('No hay publicaciones asociadas a este parametro');

        await client.query('COMMIT');
        res.status(200).send({data:publicaciones})
    } catch (error){
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const createPublication = async (req, res, next) => {
    const { codigo, variante, plataforma, producto, nombre, marcaNombre, precio, descuento, medellin, full, unidades } = req.body;
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
            full?full:false,
            unidades?unidades:1
        ]

        const {rows} = await client.query('INSERT INTO publicaciones (codigo, variante, plataforma_id, producto_id, nombre, precio, descuento, marca_id, medellin, full_bolean, unidades_venta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *', valores);

        if(rows.length === 0) throw new Error('No se pudo crear la publicacion');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: 'Se ha creado correctamente la publicacion', data: rows})
    } catch (error) {
        await client.query('ROLLBACK');
        console.log(error)
        next(error);
    } finally {
        client.release();
    }
}

export const createPublications = async (req, res, next) => {
    const { publicaciones } = req.body;

    console.log(publicaciones)
    for(const publicacion of publicaciones){
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
    
            if(publicacion.descuento > publicacion.precio) throw new Error('El descuento es mayor que el precio de venta')
    
            let marca_id = undefined;
    
            const {rows: plataformas} = await client.query('SELECT * FROM plataformas WHERE nombre = $1', [publicacion.plataforma]);

            if(plataformas[0].id === 2){
                
                if(!publicacion.marca) throw new Error('No se envio la marca');
                let marca = await client.query('SELECT * FROM marcas WHERE nombre = $1', [publicacion.marca.toString().toUpperCase()]);
        
                
                if(marca.rows.length === 0) {
                    marca = await client.query('INSERT INTO marcas (nombre) VALUES ($1) RETURNING *', [publicacion.marca.toString().toUpperCase()])
                }
    
                marca_id = marca.rows[0].id;
            }

            const {rows: producto} = await client.query('SELECT * FROM sku_producto WHERE sku = $1', [publicacion.producto_sku])
    
            const valores = [
                publicacion.codigo, 
                publicacion.variante,
                plataformas[0].id, 
                producto[0].producto_id, 
                publicacion.nombre, 
                publicacion.precio?parseInt(publicacion.precio):1, 
                publicacion.descuento?parseInt(publicacion.descuento):null, 
                marca_id,
                publicacion.medellin?true:false,
                publicacion.full?true:false,
                parseInt(publicacion.unidades_venta)>0?parseInt(publicacion.unidades_venta):1
            ]

            const {rows} = await client.query('INSERT INTO publicaciones (codigo, variante, plataforma_id, producto_id, nombre, precio, descuento, marca_id, medellin, full_bolean, unidades_venta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *', valores);
    
            if(rows.length === 0) throw new Error('No se pudo crear la publicacion');
    
            await client.query('COMMIT');
        } catch (error) {
            console.log(error)
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }
    }

    res.status(200).send({confirmacion: "Se craron las publicaciones"})
}

export const updatePublication = async (req, res, next) => {
    const { active, codigo , variante, plataforma, precio, descuento, marca_nombre, medellin, unidades } = req.body;
    const { id } = req.params;
    const client = await pool.connect();

    try {
        let marca = null;
        await client.query('BEGIN');

        const marcas = await client.query('SELECT * FROM marcas WHERE nombre = $1', [marca_nombre])

        if(marca_nombre && marcas.rows.length != 0) marca = marcas.rows[0].id;

        const { rows } = await client.query('UPDATE publicaciones SET active = COALESCE($1, active), codigo = COALESCE($2,codigo), variante = COALESCE($3, variante), plataforma_id = COALESCE($4, plataforma_id), precio = COALESCE($5, precio), descuento = COALESCE($6, descuento), marca_id = COALESCE($7, marca_id), medellin = COALESCE($8, medellin), unidades_venta = COALESCE($9, unidades_venta) WHERE id = $10 RETURNING *', [active, codigo , variante, plataforma, precio, descuento, marca, medellin, unidades, id])

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

        const { rows } = await client.query('UPDATE publicaciones SET active = false WHERE id = ANY($1) RETURNING *', [ids]);

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