import { getQuery, postQuery } from "../database/queries.js";

export const getAllKits = async (req, res) => {
    const data = await getQuery("SELECT * FROM productos WHERE tipo_id = 2");
    res.status(data.status);
    res.send(data.response);
}

export const getKit = async (req, res) => {
    const { id } = req.params;
    
    const data = await getQuery("SELECT * FROM productos WHERE id = $1", [id]);

    res.status(data.status);
    res.send(data.response);
}

export const getKitProducts = async (req, res) => {
    const { id } = req.params;

    const data = await getQuery("SELECT * FROM productos WHERE id = ANY(SELECT producto_id FROM kit_producto WHERE kit_id = $1)", [id]);

    res.status(data.status);
    res.send(data.response);
}

export const createKit = async (req, res) => {
    const { nombre, imagen, marca, productos } = req.body;
    
    if(productos.length <= 1) return res.status(400).send({mensaje: "No se ingreso productos para unir al kit o se agrego solo uno"})

    const agregados = []
    const errados = []

    const dataKit = await postQuery("INSERT INTO productos (nombre,url_imagen, tipo_id, marca_id) VALUES ($1, $2, 2, $3)", [nombre, imagen, marca]);
    for(const productoId of productos){
        const asociationProducto = await postQuery("INSERT INTO kit_producto (kit_id, producto_id) VALUES ($1, $2)", [dataKit.response.data?.id, productoId]);
        if(asociationProducto.response.data){
            agregados.push(asociationProducto.response.data);
        } else {
            errados.push(asociationProducto.response.mensaje)
        }
    }

    res.status(dataKit.status);
    res.send({data: dataKit.response, agregados, errados});
}

export const deleteKit = async (req, res) => {
    const { id } = req.params;
    const { producto_id } = req.body;

    const data = await deleteQuery("DELETE FROM kit_producto WHERE kit_id = $1 AND producto_id = $2", [id, producto_id]);

    res.status(data.status);
    res.send(data.response);
}