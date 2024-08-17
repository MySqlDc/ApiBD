import { getdatos } from "../../services/api_elian.js";
import { pool } from "../conection.js";

export const actualizarReservados = async () => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { rows } = await client.query('SELECT id, unidades_virtuales FROM productos WHERE unidades_virtuales <> 0');

        const pedidos = await client.query("SELECT pp.producto_id, SUM(pp.cantidad) AS total_cantidad FROM producto_pedido pp JOIN pedidos pd ON pp.pedido_id = pd.id WHERE pd.fecha > '2024-07-07' AND pd.estado_id = 1 AND pd.tipo = 2 GROUP BY pp.producto_id")

        let sinPedientes = rows;

        for(const pedido of pedidos.rows){
            const match = rows.filter((row) => row.id == pedido.producto_id)[0];

            if(match.unidades_virtuales != (parseInt(pedido.total_cantidad) * -1) || !match){
                await client.query("UPDATE productos SET unidades_virtuales = $1 WHERE id = $2", [pedido.producto_id,(parseInt(pedido.total_cantidad) * -1)])
            }

            if(match) sinPedientes = sinPedientes.filter((pendiente) => pendiente.id != pedido.producto_id)
        }

        if(sinPedientes.length > 0){
            for(const sinPendiente of sinPedientes){
                await client.query("UPDATE productos SET unidades_virtuales = 0 WHERE id = $1", [sinPendiente.id]);
            }
        }

        await client.query("SELECT agregar_pendientes()");

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK")
        console.log("Error", error)
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
    const datos = await getdatos();

    const datosDB = await traerDatos();

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