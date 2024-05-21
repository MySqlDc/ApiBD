import { deleteQuery, getQuery, postQuery } from "../database/queries.js";

export const getAllSkus = async (req, res) => {
    const data = await getQuery("SELECT * FROM vista_sku_producto");
    res.status(data.status);
    res.send(data.response);
}

export const getSku = async (req, res) => {
    const { sku } = req.params;

    const data = await getQuery("SELECT * FROM vista_sku_producto WHERE sku = $1", [sku]);
    res.status(data.status);
    res.send(data.response);
}

export const createSku = async (req, res) => {
    const { id } = req.params;
    const { sku } = req.body;

    const data = await postQuery("INSERT INTO sku_producto (sku, producto_id) VALUES ($1, $2)", [sku, id]);

    res.status(data.status);
    res.send(data.response);
}

export const deleteSku = async (req, res) => {
    const { id } = req.params;
    const { sku } =  req.body;

    const data = await deleteQuery("DELETE FROM sku_producto WHERE sku = $1 AND producto_id = $2", [sku, id]);

    res.status(data.status);
    res.send(data.response);
}