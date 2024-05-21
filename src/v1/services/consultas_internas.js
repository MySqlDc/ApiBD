import { pool } from '../conection.js';

export const inventario = async (skus) => {
    const { rows } = await pool.query("SELECT (unidades + unidades_virtuales) AS unidades, sku FROM productos INNER JOIN sku_producto ON sku_producto.producto_id = productos.id WHERE sku = ANY($1)", [skus]);
    return rows;
}

export const identificador = async(sku) => {
    const { rows } = await pool.query("SELECT * FROM sku_producto WHERE sku = $1", [sku]);
    return rows;
}