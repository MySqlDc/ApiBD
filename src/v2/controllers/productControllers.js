import { deleteQuery, getQuery, postQuery, putQuery } from '../database/queries.js';

export const getAllProducts = async (req, res) => {
    const data = await getQuery("SELECT * FROM productos");
    res.status(data.status);
    res.send(data.response);
}

export const getAllProductsPlatform = async (req, res) => {
    const products = await getQuery("SELECT p.id AS producto_id, p.nombre AS producto_nombre, p.url_imagen AS imagen, bool_or(pub.active AND pl.id = 1) AS Falabella, bool_or(pub.active AND pl.id = 2) AS Rappi, bool_or(pub.active AND pl.id = 3) AS Mercado_Libre FROM productos p LEFT JOIN publicaciones pub ON p.id = pub.producto_id LEFT JOIN plataformas pl ON pub.plataforma_id = pl.id GROUP BY p.id, p.nombre ORDER BY p.id");

    const platforms = await getQuery("SELECT * FROM plataformas");

    let arrayProducts = products.response.data;
    let arrayPlatforms = platforms.response.data;

    const data = arrayProducts.map( product => {
        let dataPlatforms = arrayPlatforms.map( platform => {
            if(platform === null) return {...plataforma, active: false}

            const active = product[platform.nombre.replace(" ", "_").toLowerCase()];

            return {...platform, active}
        });
        return {id: product.producto_id, nombre: product.producto_nombre, imagen: product.imagen, plataformas: dataPlatforms}
    });
    
    res.status(products.status);
    res.send({data});
}

export const getProduct = async (req, res) => {
    const {id} = req.params;

    const data = await getQuery("SELECT * FROM productos WHERE id = $1", [id]);

    res.status(data.status);
    res.send(data.response);
}

export const getProductKits = async (req, res) => {
    const { id } = req.params;

    const data = await getQuery("SELECT * FROM productos WHERE id = ANY(SELECT kit_id FROM kit_producto WHERE producto_id = $1)", [id]);

    res.status(data.status);
    res.send(data.response);
}

export const getProductPlatform = async (req, res) => {
    const { id } = req.params;

    if(id === undefined){
        res.status(400);
        res.send({mensaje: "debe ingresar un id"});
        return
    } 

    const products = await getQuery("SELECT p.id AS producto_id, p.nombre AS producto_nombre, p.url_imagen AS imagen, bool_or(pub.active AND pl.id = 1) AS Falabella, bool_or(pub.active AND pl.id = 2) AS Rappi, bool_or(pub.active AND pl.id = 3) AS Mercado_Libre FROM productos p LEFT JOIN publicaciones pub ON p.id = pub.producto_id LEFT JOIN plataformas pl ON pub.plataforma_id = pl.id WHERE p.id = $1 GROUP BY p.id, p.nombre ORDER BY p.id", [id]);

    const platforms = await getQuery("SELECT * FROM plataformas");

    let arrayProducts = products.response.data;
    let arrayPlatforms = platforms.response.data;

    const data = arrayProducts.map( product => {
        let dataPlatforms = arrayPlatforms.map( platform => {
            if(platform === null) return {...plataforma, active: false}

            const active = product[platform.nombre.replace(" ", "_").toLowerCase()];

            return {...platform, active}
        });
        return {id: product.producto_id, nombre: product.producto_nombre, imagen: product.imagen, plataformas: dataPlatforms}
    });
    
    res.status(products.status);
    res.send({data: data[0]});
}

export const createProduct = async (req, res) => {
    const { nombre, imagen, marca } = req.body;

    const data = await postQuery("INSERT INTO productos (nombre, url_imagen, marca_id) VALUES ($1, $2, $3)", [nombre, imagen, marca])
    res.status(data.status);
    res.send(data.response);
}

export const updateProduct = async (req, res) => {
    const { nombre, imagen } = req.body;
    const { id } = req.params;

    const data = await putQuery("UPDATE productos SET nombre = COALESCE($1,nombre), url_imagen = COALESCE($2, url_imagen) WHERE id = $3", [nombre, imagen, id]);

    res.status(data.status);
    res.send(data.response);
}

export const updateUnidades = async (req, res) => {
    const { unidades } = req.body;
    const { id } = req.params;

    const data = await putQuery("UPDATE productos SET unidades = $1 WHERE id = $2", [unidades, id]);

    res.status(data.status);
    res.send(data.response);
}

export const updateUnidadesVirtuales = async (req, res) => {
    const { unidades } = req.body;
    const { id } = req.params;

    const data = await putQuery("UPDATE productos SET unidades_virtuales = $1 WHERE id = $2", [unidades, id]);

    res.status(data.status);
    res.send(data.response);
}

export const deleteProduct = async (req, res) => {
    const { id } = req.params;

    const data = await deleteQuery("DELETE FROM productos WHERE id = $1", [id]);

    res.status(data.status);
    res.send(data.response);
}