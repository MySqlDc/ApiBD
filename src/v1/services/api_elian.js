import { DUCOR_DATA, DUCOR_PLATFOMS } from '../../config.js';
import { pool } from '../conection.js';

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

        return datos;    
    } catch (error) {
        console.log(error)
        return null;
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
                let id = producto.id;
                return {...dato, id};
            }
        }
    }).filter(cambio => cambio !== undefined);

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

export const actualizarDatosGeneral = async () => {
    const datos = await getdatos();

    const skus = datos.map( dato => {
        return dato.sku;
    });

    const datosDB = await traerDatos(skus);

    console.log(datosDB)

    let cambios = datos.map( dato => {
        const producto = datosDB.find(datoDB => datoDB.sku === dato.sku);
        dato.cantidad<0?dato.cantidad=0:dato.cantidad;
        if(producto){
            if(dato.cantidad !== producto.unidades){
                let id = producto.id;
                return {...dato, id};
            }
        }
    }).filter(cambio => cambio !== undefined);

    const client = await pool.connect(); // Obtén una conexión del pool una vez
    try {
        for (const cambio of cambios) {
            try {
                await client.query('BEGIN');
                const { rows } = await client.query(
                    "UPDATE productos SET unidades = $1 WHERE id = $2 RETURNING *", 
                    [cambio.cantidad, cambio.id]
                );
                await client.query('COMMIT');
                
                if (rows.length === 0) continue;
            } catch (error) {
                await client.query('ROLLBACK');
                console.log(`Error al actualizar el producto con id ${cambio.id}:`, error);
            }
        }
        await client.query('BEGIN');
        await client.query("SELECT inventario_kit_general()");
        await client.query('COMMIT');
    } finally {
        client.release(); // Libera la conexión al pool después de completar todas las operaciones
    }

    
    
}

export const traerDatos = async (skus) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {rows} = await client.query("SELECT sku_producto.sku, productos.unidades, productos.id FROM productos INNER JOIN sku_producto ON sku_producto.producto_id = productos.id WHERE sku = ANY($1)", [skus]);

        await client.query('COMMIT');
        return rows;
    } catch (e){
        await client.query('ROLLBACK');
        console.log(e);
    } finally {
        client.release();
    }
}

export const obtenerSalidas = async (plataforma) => {
    try {
        console.log(DUCOR_PLATFOMS+plataforma)

        const response = await fetch(DUCOR_PLATFOMS+plataforma);

        const data = await response.json();

        return data;
    } catch (error) {
        throw error
    }
}