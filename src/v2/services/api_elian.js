import { DUCOR_DATA, DUCOR_PLATFOMS } from '../../config.js';
import { pool } from '../database/conection.js';
import { crearFactura, updateFactura } from '../database/queriesMongo/facturas.js';

export const getdatos = async () => {
    try {
        const response = await fetch(DUCOR_DATA);
        const data = await response.json();

        let anterior = '';
        const datos = data.map( dato => {
            if(dato.code !== anterior){
                anterior = dato.code;
                const producto = {
                    sku: dato.sku,
                    cantidad: dato.quantity
                }
                return producto
            }
        }).filter(cambio => cambio !== undefined);

        const ceros = datos.filter(dato => dato.cantidad <= 0);
        console.log("ceros ", ceros.length);
        if(ceros.length > 4500){
            const cantidades = await getdatos();
            return cantidades;
        } else {
            return datos;
        }
    } catch (error) {
        console.log("Fallo en la obtencion de datos", error);
        return [];
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

export const actualizarDatos = async (datos) => {
    let productos = [];

    const datosDB = await traerDatos();

    let cambios = datos.map( dato => {
        const producto = datosDB.find(datoDB => datoDB.sku === dato.sku);
        if(dato.cantida < 0) dato.cantidad = 0;
        if(producto){
            if(dato.cantidad !== producto.unidades){
                return {...dato, id: producto.id};
            }
        }
    }).filter(cambio => cambio !== undefined);

    for (const cambio of cambios){
        const client = await pool.connect();

        try {
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

    return productos;
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

export const getPedidos = async (plataforma) => {
    try {
        console.log(DUCOR_PLATFOMS+plataforma)

        const response = await fetch(DUCOR_PLATFOMS+plataforma);

        const data = await response.json();

        return data;
    } catch (error) {
        console.log(error)
        throw error
    }
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
}

export const getOrders = async() => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM pedidos');

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