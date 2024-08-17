import { pool } from '../database/conection.js';

export const getAllProducts = async (req, res, next) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await pool.query('SELECT * FROM productos');

        if(rows.length === 0) throw new Error('No se obtuvo productos')

        await client.query('COMMIT');
        res.status(200).send({data: rows})
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const getAllProductsPlatform = async (req, res, next) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const productsData = await client.query('SELECT p.id AS producto_id, p.nombre AS producto_nombre, p.url_imagen AS imagen, bool_or(pub.active AND pl.id = 1) AS Falabella, bool_or(pub.active AND pl.id = 2) AS Rappi, bool_or(pub.active AND pl.id = 3) AS Mercado_Libre FROM productos p LEFT JOIN publicaciones pub ON p.id = pub.producto_id LEFT JOIN plataformas pl ON pub.plataforma_id = pl.id GROUP BY p.id, p.nombre ORDER BY p.id');

        const platformsData = await client.query('SELECT * FROM plataformas');

        const data = productsData.rows.map( product => {
            let statusPlatforms = platformsData.rows.map( platform => {
                const active = product[platform.nombre.replace(" ", "_").toLowerCase()];

                return {...platform, active}
            })
            return {id: product.producto_id, nombre: product.producto_nombre, imagen: product.imagen, plataformas: statusPlatforms}
        });
        await client.query('COMMIT');

        res.status(200).send({data});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const getProduct = async (req, res, next) => {
    const {id} = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM productos WHERE id = $1', [id]);

        if(rows.length === 0) throw new Error('No se encontro el producto');

        await client.query('COMMIT');
        res.status(200).send({data: rows})
    } catch (error) {
        await client.query('ROLLBACk');
        next(error);
    } finally {
        client.release();
    }
}

export const getProductKits = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM productos WHERE id = ANY(SELECT kit_id FROM kit_producto WHERE producto_id = $1)', [id]);

        if(rows.length === 0) throw new Error('el producto no esta asociado a ningun kit')

        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const getProductPlatform = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        if(id === undefined) throw new Error('No se ingreso un ID');
        const productData = await client.query('SELECT p.id AS producto_id, p.nombre AS producto_nombre, p.url_imagen AS imagen, bool_or(pub.active AND pl.id = 1) AS Falabella, bool_or(pub.active AND pl.id = 2) AS Rappi, bool_or(pub.active AND pl.id = 3) AS Mercado_Libre, bool_or(pub.active AND pl.id = 4) AS Shopify, bool_or(pub.active AND pl.id = 5) AS Addi FROM productos p LEFT JOIN publicaciones pub ON p.id = pub.producto_id LEFT JOIN plataformas pl ON pub.plataforma_id = pl.id WHERE p.id = $1 GROUP BY p.id, p.nombre ORDER BY p.id', [id]);

        const platformsData = await client.query('SELECT * FROM plataformas');

        const data = productData.rows.map( product => {
            let statusPlatforms = platformsData.rows.map( platform => {
                const active = product[platform.nombre.replace(" ", "_").toLowerCase()];

                return {...platform, active}
            })
            return {id: product.producto_id, nombre: product.producto_nombre, imagen: product.imagen, plataformas: statusPlatforms}
        });

        await client.query('COMMIT');
        res.status(200).send({data: data})
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const getProductPublication = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT p.id AS key, p.codigo, p.variante, plataformas.nombre AS plataforma, p.active FROM publicaciones p INNER JOIN plataformas ON p.plataforma_id = plataformas.id WHERE p.producto_id = $1', [id]);

        if(rows.length === 0) throw new Error('El producto no tiene publicaciones asociadas')
        await client.query('COMMIT');
        res.status(200).send({data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const getProductSkus = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT sku FROM sku_producto WHERE producto_id = $1', [id]);

        await client.query('COMMIT');
        res.status(200).send({data: rows.map(row => row.sku)});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error)
    } finally {
        client.release();
    }
}

export const createProduct = async (req, res, next) => {
    const { nombre, imagen, marca } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('INSERT INTO productos (nombre, url_imagen, marca_id) VALUES ($1, $2, $3) RETURNING *', [nombre, imagen, marca]);

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se creo correctamente el producto", data: rows})
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const updateProduct = async (req, res, next) => {
    const { nombre, imagen } = req.body;
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('UPDATE productos SET nombre = COALESCE($1,nombre), url_imagen = COALESCE($2, url_imagen) WHERE id = $3 RETURNING *', [nombre, imagen, id]);

        if(rows.length === 0) throw new Error('No se actualizo ningun producto');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: 'producto actualizado', data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const updateUnidades = async (req, res, next) => {
    const { unidades } = req.body;
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const producto = await client.query('SELECT id, unidades_prueba AS unidades FROM productos WHERE id = $1', [id]);

        if(producto.rows[0].unidades == unidades) throw new Error('las unidades son las mismas que hay en la base de datos');

        const { rows } = await client.query('UPDATE productos SET unidades_prueba = $1 WHERE id = $2 RETURNING *', [unidades, id]);

        if(rows.length == 0) throw new Error('No se actualizaron las unidades del producto');

        const registro = await client.query('INSERT INTO registro_ajuste (producto_id, fecha, cantidad_ingresada, cantidad_antigua) VALUES ($1, now(), $2, $3) RETURNING *', [id, unidades, producto.rows[0].unidades])

        if(registro.rows.lenght == 0) console.log("ajuste no se registro", [id, unidades, producto.rows[0].unidades])

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se actualizaron las unidades del producto", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const updateUnidadesVirtuales = async (req, res, next) => {
    const { unidades } = req.body;
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('UPDATE productos SET unidades_virtuales = $1 WHERE id = $2 RETURNING *', [unidades, id]);

        if(rows.length === 0) throw new Error('No se actualizaron las unidades virtuales del producto');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se actualizaron las unidades virtuales del producto", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const updateUnidadesMedellin = async (req, res, next) => {
    const { unidades } = req.body;
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('UPDATE productos SET unidades_medellin = $1 WHERE id = $2 RETURNING *', [unidades, id]);

        if(rows.length === 0) throw new Error('No se actualizaron las unidades de medellin');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se actualizaron las unidades de medellin del producto", data: rows});
    } catch (error) {
        await client.query('ROLLBACk');
        next(error);
    } finally {
        client.release()
    }
}

export const activeProductPublication = async (req, res, next) => {
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

export const inactiveProductPublication = async (req, res, next) => {
    const { ids } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('UPDATE publicaciones SET active = false WHERE producto_id = ANY($1) RETURNING *', [ids]);

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

export const deleteProduct = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);

        if(rows.length === 0) throw new Error('No se elimino el producto');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se elimino el producto, correctamente", data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const setUpdateProduct = async (req, res, next) => {
    const { ids } = req.body
    const client = await pool.connect()

    try{
        await client.query('BEGIN');

        const { rows } = await client.query('UPDATE productos SET update_status = true WHERE id = ANY($1) RETURNING *', [ids]);

        if(rows.length == 0) throw new Error('No se actualizo ningun producto');

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se activaron los productos para actualizar"})
    }catch(error){
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}