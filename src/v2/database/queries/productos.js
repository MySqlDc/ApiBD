import { getdatos } from "../../services/api_elian.js";
import { pool } from "../conection.js";

export const actualizarReservados = async () => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query("UPDATE productos pr SET unidades_virtuales = -subquery.total_cantidad FROM ( SELECT pp.producto_id, SUM(pp.cantidad) AS total_cantidad FROM producto_pedido pp JOIN pedidos pd ON pp.pedido_id = pd.id WHERE pd.fecha > '2024-07-07' AND pd.estado_id = 1 AND pd.tipo = 2 GROUP BY pp.producto_id ) AS subquery WHERE pr.id = subquery.producto_id AND pr.unidades_virtuales != -subquery.total_cantidad");

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK")
        console.log("Error")
    } finally{
        client.release()
    }
}

export const traerDatos = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {rows} = await client.query('SELECT * FROM vista_sku_producto');

        if(rows.length === 0) throw new Error('No hubo datos');

        await client.query('COMMIT');
        return rows
    } catch (error) {
        await client.query('ROLLBACK');
        return [];
    } finally {
        client.release();
    }
}


export const actualizarDatosGeneral = async () => {
    let productos = [];
    console.log("continuo");
    const datos = await getdatos();
    console.log("paso", datos);

    const datosDB = await traerDatos();

    console.log("datos", datosDB)

    let cambios = datos.map( dato => {
        const producto = datosDB.find(db_dato => db_dato.sku == dato.sku);
        if(dato.cantidad < 0) dato.cantidad = 0;
        if(producto){
            if(dato.cantidad != producto.unidades){
                return {...dato, id: producto.id}
            }
        }
    }).filter(cambio => cambio !== undefined);

    for (const cambio of cambios){
        const client = await pool.connect();

        try {
            console.log("cambio", cambio);
            await client.query('BEGIN');

            const { rows } = await client.query('UPDATE productos SET unidades = $1 WHERE id = $2 RETURNING *', [cambio.cantidad, cambio.id]);

            if(rows.length === 0) throw new Error('No se actualizo ningun producto');

            await client.query('COMMIT');
            productos.push(cambio.id);
        } catch (error) {
            await client.query('ROLLBACK');
            console.log("No se actualizo el producto", cambio);
        } finally {
            client.release();
        }
    };

    console.log("actualizado Stock", productos);
}