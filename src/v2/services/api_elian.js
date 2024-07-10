import { DUCOR_DATA, DUCOR_PLATFOMS } from '../../config.js';
import { pool } from '../database/conection.js';

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
        }).filter(cambio => cambio !== undefined);;

        const ceros = datos.filter(dato => dato.cantidad == 0);
        if(ceros.length > 6000){
            return getdatos();
        }

        return datos    
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