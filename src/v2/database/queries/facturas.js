import { pool } from "../conection.js";

// Crear una nueva factura
// recibe datos factura 
// {
//   "tipo": int,
//   "plataforma": int,
//   "codigo": String,
//   "fecha": String date YYYY-MM-DD,
//   "items": [
//     {
//       "sku": String,
//       "cantidad": int,
//       "precio": int
//     },
//     {
//       "sku": String,
//       "cantidad": int,
//       "precio": int
//     }
//   ]
// }
export const crearFactura = async (datosFactura) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const pedido = await client.query(
      "INSERT INTO pedidos (plataforma_id, estado_id, fecha, codigo, tipo) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [datosFactura.plataforma, datosFactura.status?datosFactura.status:1, datosFactura.fecha, datosFactura.codigo, datosFactura.tipo]
    );

    if(pedido.rows == 0) throw new Error('No se genero el pedido');

    for(const item of datosFactura.items){

      const producto = await client.query("SELECT * FROM productos WHERE id = ANY(SELECT producto_id FROM sku_producto WHERE sku = $1)", [item.sku]);

      if(producto.rows.length == 0) {
        console.log("crear producto", item)
        continue;
      }

      const registro = await client.query("INSERT INTO producto_pedido (pedido_id, producto_id, cantidad, precio) VALUES ($1, $2, $3, $4) RETURNING *", [pedido.rows[0].id, producto.rows[0].id, item.cantidad, item.precio])

      if(registro.rows.length == 0) console.log('error al registrar', item, registro);
    }

    const productos = await client.query("SELECT * FROM producto_pedido WHERE pedido_id = $1", [pedido.rows[0].id])

    if(productos.rows.length == 0) throw new Error('El pedido no tiene productos');

    const resultado = {...pedido.rows[0], productos: productos.rows}
    await client.query("COMMIT");
    console.log('Factura creada:', resultado);
    return resultado;
  } catch (error) {
    client.query("ROLLBACK");
    console.error('Error al crear factura:', error);
    throw error;
  } finally {
    client.release()
  }
};

export const updateFactura = async (datosFactura) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");


    const pedido = await client.query(
      "UPDATE pedidos SET estado_id = $1 WHERE codigo = $2 RETURNING *",
      [datosFactura.status?datosFactura.status:1, datosFactura.codigo]
    );

    if(pedido.rows == 0) throw new Error('No se actualizo el pedido');

    await client.query("COMMIT");
    console.log('Factura editada:', pedido.rows[0]);
    return pedido.rows[0];
  } catch (error) {
    client.query("ROLLBACK");
    console.error('Error al editar la factura:', error);
    throw error;
  } finally {
    client.release()
  }
};