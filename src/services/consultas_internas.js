import { pool } from '../conection.js';

export const inventario = async (skus) => {
    const { rows } = await pool.query("SELECT (unidades - unidades_virtuales) AS unidades, sku FROM productos INNER JOIN sku_producto ON sku_producto.producto_id = productos.id WHERE sku = ANY($1)", [skus]);
    console.log("datos", rows)
    return rows;
}