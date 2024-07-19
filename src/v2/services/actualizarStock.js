import { pool } from "../database/conection.js";
import { crearFactura, updateFactura } from "../database/queries/facturas.js";
import { getPedidos } from './api_elian.js'

export const actualizarItems = async (items) => {
    for(const item of items){
        if(item.sku === null) continue;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const {rows} = await client.query("SELECT producto_id FROM sku_producto WHERE sku = $1", [item.sku])

            if(rows.length === 0) throw new Error('No se obtuvo datos del producto');

            if(!item.sku.startsWith('KIT')){
                await client.query("UPDATE productos SET unidades_virtuales = unidades_virtuales "+(item.status==="SIN SALIDA"?"-":"+")+" $1 WHERE id = $2", [item.unidades, rows[0].producto_id])
            } else {
                await client.query("UPDATE productos SET unidades_virtuales = unidades_virtuales "+(item.status==="SIN SALIDA"?"-":"+")+" $1 WHERE id = ANY(SELECT producto_id FROM kit_producto WHERE id = $2)", [item.unidades, rows[0].producto_id])
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.log("Error al actualizar item:", item, error);
        } finally {
            client.release();
        }
    }

    console.log("items actualizados")
}

export const createOrders = async() => {
    let dia = new Date();
    let dataPedidos = [];
    const dataBD = await getOrders();

    dia.setDate(dia.getDate() - 5);

    let datosTemp = await getPedidos("FALABELLA");
    dataPedidos.push(...datosTemp);

    datosTemp = await getPedidos("MERCADOLIBRE");
    dataPedidos.push(...datosTemp);

    datosTemp = await getPedidos("SHOPIFY");
    dataPedidos.push(...datosTemp);

    console.log(dataPedidos.length);
    dataPedidos = dataPedidos.map(pedido => {
        let plataforma = 0;
        let estado = 2;
        switch(pedido.order.platform){
            case 'mercadolibre': plataforma = 3;break;
            case 'falabella': plataforma = 1;break;
            case 'shopify': plataforma = 4;break;
        }

        switch(pedido.order.status){
            case 'SIN SALIDA': estado = 1;break;
            case 'CANCELADO': estado = 2;break;
            case 'ANULADO': estado = 3;break;
            default: estado = 4;break;
        }

        return {
            tipo: 2,
            codigo: pedido.order.id, 
            fecha: new Date(pedido.date_generate),
            plataforma, 
            items: pedido.order.items.map(item => {return {sku: item.item.sku, cantidad: item.item.quantity, precio: parseInt(item.item.price)}}).filter(item => item.sku != null), 
            status: estado
        }
    }).filter(
        pedido => {
            let match = dataBD.some(data => data.codigo == pedido.codigo && data.estado_id == 1);
            return pedido.fecha > dia || match}
    )

    const createPedidos = dataPedidos.filter(pedido => !dataBD.some(data => data.codigo == pedido.codigo))
    const changePedidos = dataPedidos.filter(pedido => {
        const dataMatch = dataBD.find(data => data.codigo == pedido.codigo);
        return (dataMatch && dataMatch.estado_id != pedido.status && pedido.status != 1);
    })
    
    for(const pedido of createPedidos){
        if(pedido.items.length == 0) continue;

        if(pedido.items.length == 1 && pedido.items[0].sku == '1111111111') continue;
        try{
            await crearFactura(pedido);   
        } catch(error) {
            console.log("error")
        }
    }

    for(const pedido of changePedidos){
        try{
            await updateFactura(pedido);   
        } catch(error) {
            console.log("error")
        }
    }

    return {status: 200, confirmacion: "Completado"}
}

export const getOrders = async() => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM pedidos WHERE tipo = 2');

        await client.query('COMMIT');

        return rows;
    } catch (error) {
        console.log('error al pedir los datos');
        await client.query('ROLLBACK');

        return [];
    } finally {
        client.release();
    }
}