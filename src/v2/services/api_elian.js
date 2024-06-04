import { DUCOR_DATA, DUCOR_PLATFOMS } from '../../config.js';
import { pool } from '../database/conection.js';

export const getdatos = async () => {
    try {
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
    } catch (error) {
        console.log("Fallo en la obtencion de datos", error);
        return [];
    }
    
}

export const traerDatos = async (skus) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {rows} = await client.query('SELECT sku_producto.sku, productos.unidades, productos.id FROM productos INNER JOIN sku_producto ON sku_producto.producto_id = productos.id WHERE sku = ANY($1)', [skus]);

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

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        for (const cambio of cambios){
            await client.query('UPDATE productos SET unidades = $1 WHERE id = $2 RETURNING *', [cambio.cantidad, cambio.id]);
        };    

        await client.query('SELECT inventario_kit_general()');
        await client.query('COMMIT');
    } catch (error) {
        client.query('ROLLBACK');
        console.log("error al actualizar datos",error);
    } finally {
        client.release();
    }
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