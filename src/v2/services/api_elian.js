import { DUCOR_DATA, DUCOR_PLATFOMS } from '../../config.js';
import { getQuery, putQuery } from '../database/queries.js';

export const getdatos = async () => {
    const response = await fetch(DUCOR_DATA);
    const data = await response.json();

    let anterior = '';
    const datos = data.map( dato => {
        if(dato.code !== anterior){
            const producto = {
                sku: dato.sku,
                cantidad: dato.quantity
            }
            return producto
        }
    });

    return datos
}

export const traerDatos = async (skus) => {
    const { response } = await getQuery("SELECT sku_producto.sku, productos.unidades, productos.id FROM productos INNER JOIN sku_producto ON sku_producto.producto_id = productos.id WHERE sku = ANY($1)", [skus]);

    return response.data;
}

export const actualizarDatos = async (datos) => {
    let productos = [];

    const skus = datos.map( dato => {
        return dato.sku;
    });

    const datosDB = await traerDatos(skus);

    let cambios = datos.map( dato => {
        const producto = datosDB.find(datoDB => datoDB.sku === dato.sku);
        dato.cantidad<0?dato.cantidad=0:dato.cantidad;
        if(producto){
            if(dato.cantidad !== producto.unidades){
                return {...dato, id: producto.id};
            }
        }
    }).filter(cambio => cambio !== undefined);

    for (const cambio of cambios){
        const { response } = await putQuery("UPDATE productos SET unidades = $1 WHERE id = $2 RETURNING *", [cambio.cantidad, cambio.id]);

        if(!response.data) continue;

        productos.push(cambio.id)
    };
    return productos;
}

export const actualizarDatosGeneral = async () => {
    const datos = await getdatos();

    const skus = datos.map( dato => {
        return dato.sku;
    });

    const datosDB = await traerDatos(skus);

    let cambios = datos.map( dato => {
        const producto = datosDB.find(datoDB => datoDB.sku === dato.sku);
        dato.cantidad<0?dato.cantidad=0:dato.cantidad;
        if(producto){
            if(dato.cantidad !== producto.unidades){
                return {...dato, id: producto.id};
            }
        }
    }).filter(cambio => cambio !== undefined);

    for (const cambio of cambios){
        await putQuery("UPDATE productos SET unidades = $1 WHERE id = $2 RETURNING *", [cambio.cantidad, cambio.id]);
    };

    await getQuery("SELECT inventario_kit_general()");
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