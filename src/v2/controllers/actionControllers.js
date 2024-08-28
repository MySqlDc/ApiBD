import fs from 'fs';
import csv from 'fast-csv';
import { pool } from '../database/conection.js';
import { actualizarMLFijo, actualizarPublicaciones, actualizarRappiFull } from '../services/actualizarPublicaciones.js'
import { actualizarStockVTEX } from '../services/api_vtex.js';
import { actualizarReservados } from '../database/queries/productos.js';
import { createOrders } from '../services/actualizarStock.js';
import { finished } from 'stream';

export const updateStockFile = async(req, res, next) => {
    const {data} = req.body;
    const regex = /[a-zA-z]/

    try {
        if(data.length === 0) throw new Error('No se enviaron datos')

        const arrayObjectData = data.map(arr => {
            if(!regex.test(arr[0])){
                return {
                    id:  parseInt(arr[0]),
                    nombre: arr[1],
                    stock: arr[2]?isNaN(parseInt(arr[2]))?0:parseInt(arr[2]):0
                }
            } else {
                console.log("error en la entrada", arr);
            }
        }).filter(dato => dato !== undefined)

        if(arrayObjectData.length === 0) throw new Error('No hubo datos correctos');

        const response = await actualizarPublicaciones(arrayObjectData);

        res.status(200).send(response);    
    } catch (error) {
        next(error);
    } finally {
        client.release();
    }
}

export const updateStock = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {rows} = await client.query('SELECT id FROM productos WHERE update_status = true');

        if(rows.length === 0) throw new Error('No hay publicaciones que actualizar');

        await client.query('COMMIT');

        const response = await actualizarPublicaciones(rows);

        await client.query('BEGIN');
        
        if(response.status === 'error') throw new Error(response.mensaje);

        await client.query('UPDATE productos SET update_status = false WHERE id = ANY($1)', [rows.map(row => row.id)])

        await client.query('COMMIT');
        res.status(200).send(response);
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const updateStockPublicacion = async(req, res, next) => {
    const { sku } = req.params;
    const { cantidad } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const {rows} = await client.query('SELECT * FROM publicaciones_stock_view WHERE plataforma_id = 5 AND producto_id = ANY(SELECT producto_id FROM sku_producto WHERE sku = $1)', [sku]);

        if(rows.length === 0) throw new Error('No existe una publicacion');

        if(rows[0].stock === cantidad) throw new Error('El valor es el mismo');

        const response = await actualizarStockVTEX(rows[0]);

        if(response.status === 'error') throw new Error('error al actualizar publicacion '+response.mensaje);

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Actualizado", data: rows[0]});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const updateStockSomes = async (req, res, next) => {
    const { ids } = req.body;
    try {
        const codigos = ids.map(id => {return {id}})

        console.log(codigos)

        const response = await actualizarPublicaciones(codigos);

        if(response.status === 'error') throw new Error(response.mensaje);

        res.status(200).send(response);
    } catch (error) {
        next(error);
    }
}

export const donwloadFile = async (req, res, next) =>{
    const client = await pool.connect();
    try{
        await client.query('BEGIN');
        const {rows} = await client.query("SELECT id, nombre FROM productos");

        if(rows.length === 0) throw new Error('No se obtuvo ningun dato')

        const head = [["id", "nombre", "Stock"]];
        const arrayData = rows.map(dato => Object.values(dato));

        await client.query('COMMIT');
        res.status(200).send({data: [].concat(head, arrayData)});
    } catch (error){
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

function formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`;
}

export const downloadFile = async(req, res, next) => {
    const { plataforma } = req.params;

    console.log(plataforma)
    const client = await pool.connect();
    const date = new Date();

    let query = '';
    try {
        switch(plataforma){
            case 'Mercado Libre':
                query = 'SELECT codigo AS MCO, variante, nombre ';break;
            default:
                query = 'SELECT codigo AS sku, nombre ';break;
        }
        query += 'FROM publicaciones WHERE plataforma_id = ANY(SELECT id FROM plataformas WHERE nombre = $1)';
        const {rows} = await pool.query(query, [plataforma]);

        if(rows.length == 0) throw new Error("No se encontraron publicaciones de esa plataforma")

        const fileName = `${plataforma}_data-${formatDateForFilename(date)}.csv`;
        const writableStream = fs.createWriteStream(fileName);

        csv.write(rows, {headers: true}).pipe(writableStream);

        writableStream.on('finish', () => {
            res.download(fileName, (err) => {
                if(err) {
                    console.error('Error al enviar el archivo', err);
                    next(err);
                } else {
                    console.log('Archivo CSV enviado exitosamente');
                    fs.unlinkSync(fileName);
                }
            })
        })
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const updateRappi = async (req, res, next) => {
    try {
        const response = await actualizarRappiFull();

        if(response.status === 'Error') throw new Error('Fallo en actualizar rappi')

        return res.status(200).send({confirmacion: "actualizado"})
    } catch (error) {
        next(error);
    }
}

export const updateRappiMed = async (req, res, next) => {

    try {
        const response = await actualizarRappiFull(true);

        if(response.status === 'Error') throw new Error('Fallo en actualizar rappi medellin')

        return res.status(200).send({confirmacion: "actualizado medellin"})
    } catch (error) {
        next(error);
    }
}

export const getPedidos = async (req, res, next) => {
    await createOrders();
    await actualizarReservados();
    res.send({confirmacion: "Ordenes Actualizadas"});
}

export const update_ml = async (req, res, next) => {
    try {
        console.log('inicio')
        await actualizarMLFijo();
        res.send({confirmacion: "Actualizar datos"});
    } catch (error) {
        console.log(error);
        next(error);
    }
}

export const agregarFijos = async (req, res, next) => {
    const { datos } = req.body;

    try {
        const errores = [];
        const ok = [];
        for(const dato of datos){
            const client = await pool.connect();
            try{
                await client.query('BEGIN')
                const {rows} = await client.query('SELECT id FROM publicaciones WHERE plataforma_id = 3 AND producto_id = ANY(SELECT producto_id FROM sku_producto WHERE sku = $1)', [dato.sku]);

                let query = 'INSERT INTO publicaciones_fijas (publicacion_id, cantidad) VALUES';
                let coma = false

                for(const row of rows){
                    if(coma){
                        query += ','
                    } else {
                        coma = !coma
                    }
                    query += '('+row.id+','+dato.cantidad+')';
                }

                await client.query(query);

                const ids = rows.map(row => row.id);

                await client.query('UPDATE publicaciones SET active = false WHERE active = true AND id = ANY($1)', [ids]);
                ok.push(dato);
                await client.query('COMMIT')
            } catch (error) {
                await client.query('ROLLBACK')
                console.log(error);
                errores.push(dato);
            } finally {
                client.release()
            }
        }

        res.send({confirmacion: 'Proceso terminados', ok, errores})
    } catch (error) {
        console.log(error);
        next(error);
    } 
}