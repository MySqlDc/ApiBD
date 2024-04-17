import {DUCOR_DATA} from '../config.js';
import { pool } from '../conection.js';

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
                let id = producto.id;
                return {...dato, id};
            }
        }
    });

    cambios = cambios.filter(cambio => cambio !== undefined);
    console.log(cambios);

    for (const cambio of cambios){
        try {
            const {rows} = await pool.query("UPDATE productos SET unidades = $1 WHERE id = $2 RETURNING *", [cambio.cantidad, cambio.id]);

            if(rows.length === 0) continue;                

            productos.push(cambio.id);

        } catch (error) {
            console.log(error);
        }
    };
    return productos;
}

export const traerDatos = async (skus) => {
    try {
        const {rows} = await pool.query("SELECT sku_producto.sku, productos.unidades, productos.id FROM productos INNER JOIN sku_producto ON sku_producto.producto_id = productos.id WHERE sku = ANY($1)", [skus]);

        return rows;
    } catch (e){
        console.log(e);
    }
}