import { pool } from '../database/conection.js';
import { actualizarDatosGeneral } from '../database/queries/productos.js';

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

export const getAllProductsData = async (req, res, next) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows: productsData} = await client.query("SELECT p.id AS producto_id, p.tipo_id AS tipo, p.nombre, p.url_imagen, COALESCE((SELECT ARRAY_AGG(jsonb_build_object('codigo', pub.codigo, 'variante', pub.variante, 'plataforma', pub.plataforma_id, 'id', pub.id, 'active', pub.active, 'medellin', pub.medellin, 'fijo', CASE WHEN pf.publicacion_id IS NOT NULL THEN true ELSE false END)) FROM publicaciones pub LEFT JOIN publicaciones_fijas pf ON pub.id = pf.publicacion_id WHERE pub.producto_id = p.id), '{}'::jsonb[]) AS publicaciones, COALESCE(jsonb_agg(DISTINCT replace(sku.sku, 'caracter_problematico', '')) FILTER (WHERE sku.sku IS NOT NULL), '[]'::jsonb ) AS skus FROM productos p LEFT JOIN sku_producto sku ON p.id = sku.producto_id GROUP BY p.id, p.nombre, p.url_imagen ORDER BY p.id;");

        await client.query('COMMIT');

        res.status(200).send({data: productsData});
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

export const getProductData = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        if(id === undefined) throw new Error('No se ingreso un ID');
        const { rows: productData } = await client.query("SELECT p.id AS producto_id, p.tipo_id AS tipo, p.nombre, p.url_imagen, COALESCE((SELECT ARRAY_AGG(jsonb_build_object('codigo', pub.codigo, 'variante', pub.variante, 'plataforma', pub.plataforma_id, 'id', pub.id, 'active', pub.active, 'medellin', pub.medellin, 'fijo', CASE WHEN pf.publicacion_id IS NOT NULL THEN true ELSE false END)) FROM publicaciones pub LEFT JOIN publicaciones_fijas pf ON pub.id = pf.publicacion_id WHERE pub.producto_id = p.id), '{}'::jsonb[]) AS publicaciones, COALESCE(jsonb_agg(DISTINCT replace(sku.sku, 'caracter_problematico', '')) FILTER (WHERE sku.sku IS NOT NULL), '[]'::jsonb ) AS skus FROM productos p LEFT JOIN sku_producto sku ON p.id = sku.producto_id WHERE p.id = $1 GROUP BY p.id, p.nombre, p.url_imagen ORDER BY p.id;", [id]);

        await client.query('COMMIT');
        res.status(200).send({data: productData})
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
    const { nombre, imagen, marcaNombre } = req.body;
    const client = await pool.connect();

    res.on('finish', async() => {await actualizarDatosGeneral()})

    try {
        await client.query('BEGIN');

        let marca_id = undefined;

        let marca = await client.query('SELECT * FROM marcas WHERE nombre = $1', [marcaNombre.toString().toUpperCase()]);
            
        if(marca.rows.length === 0) {
            marca = await client.query('INSERT INTO marcas (nombre) VALUES ($1) RETURNING *', [marcaNombre.toString().toUpperCase()])
        }

        marca_id = marca.rows[0].id;

        const { rows } = await client.query('INSERT INTO productos (nombre, url_imagen, marca_id) VALUES ($1, $2, $3) RETURNING *', [nombre, imagen, marca_id]);

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Se creo correctamente el producto", data: rows})
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const createProducts = async (req, res, next) => {
    const { productos } = req.body;

    try {
        if(!productos || productos.lenght === 0 ) throw new Error('No hay productos para crear')

        res.on('finish', async() => {await actualizarDatosGeneral()})
    
        for(const producto of productos){
            const client = await pool.connect();
    
            try {
                await client.query('BEGIN');
        
                let marca_id = undefined;
        
                let marca = await client.query('SELECT * FROM marcas WHERE nombre = $1', [producto.marca.toString().toUpperCase()]);
                    
                if(marca.rows.length === 0) {
                    marca = await client.query('INSERT INTO marcas (nombre) VALUES ($1) RETURNING *', [producto.marca.toString().toUpperCase()])
                }
        
                marca_id = marca.rows[0].id;
        
                const { rows: productos } = await client.query('INSERT INTO productos (nombre, url_imagen, marca_id) VALUES ($1, $2, $3) RETURNING *', [producto.nombre, producto.imagen, marca_id]);
        
                if(productos.length > 0){
                    const { rows: sku } = await client.query('INSERT INTO sku_producto (sku, producto_id) VALUES ($1, $2) RETURNING *', [producto.sku, productos[0].id])
    
                    if(sku.length === 0) throw new Error('No se creo el sku')
                }
                
                await client.query('COMMIT');
            } catch (error) {
                console.log(error)
                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        }        

        res.status(200).send({confirmacion: "Se crearon los productos"})
    } catch (error) {
        next(error)
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