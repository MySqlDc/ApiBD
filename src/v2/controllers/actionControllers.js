import fs from 'fs';
import csv from 'fast-csv';
import { pool } from '../database/conection.js';
import { actualizarFijo, actualizarPublicaciones, actualizarRappiFull, pausarPublicacion } from '../services/actualizarPublicaciones.js'
import { actualizarReservados } from '../database/queries/productos.js';
import { createOrders } from '../services/actualizarStock.js';
import { contarPublicaciones } from '../database/queries/publicaciones.js';

//actualizar publicaciones ´por medio de un archivo
export const updateStockFile = async(req, res, next) => {
    //data es un arreglo de objetos [{id: int}]
    const {data} = req.body;

    try {
        if(data.length === 0) throw new Error('No se enviaron datos')

        const response = await actualizarPublicaciones(data);

        res.status(200).send(response);    
    } catch (error) {
        next(error);
    }
}

//Actualizar stock en las publicaciones 
//consulta los productos que tuvieron moviento en la base de datos
//y envia los ids a actualizarPublicaciones
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

//actualiza el stock de la publicaciones de algunos productos
//usa ids para consultar las publicaciones y actualizarlas en su debida funcion
export const updateStockSomes = async (req, res, next) => {
    //ids es un arreglo de enteros [int]
    const { ids } = req.body;
    try {
        let fijasResponse = {status: 'error'};
        let response = {status: 'error'};
        const codigos = ids.map(id => {return {id}})

        const consulta = await contarPublicaciones(ids);

        if(consulta[0].fijas > 0) fijasResponse = await actualizarFijo(ids)

        if(consulta[0].normales > 0) response = await actualizarPublicaciones(codigos);

        if(response.status === 'error' && fijasResponse.status === 'error') throw new Error(response.mensaje);

        if(response.status === 'error'){
            res.status(200).send(fijasResponse);
        } else {
            res.status(200).send(response);
        }
        
    } catch (error) {
        next(error);
    }
}

//obtiene los datos de los productos 
//y los coloca en un objeto
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

//funcion para generar un string con la fecha y hora
function formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`;
}

//Selecciona la plataforma 
//y genera un archivo con las publicaciones existentes dentro de la base de datos
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

//Actualiza Rappi full
//que es el envio de todos los productos
//que existe de el
export const updateRappi = async (req, res, next) => {
    try {
        const response = await actualizarRappiFull();

        if(response.status === 'Error') throw new Error('Fallo en actualizar rappi')

        return res.status(200).send({confirmacion: "actualizado"})
    } catch (error) {
        next(error);
    }
}

//actualiza rappi en medellin
export const updateRappiMed = async (req, res, next) => {

    try {
        const response = await actualizarRappiFull(true);

        if(response.status === 'Error') throw new Error('Fallo en actualizar rappi medellin')

        return res.status(200).send({confirmacion: "actualizado medellin"})
    } catch (error) {
        next(error);
    }
}

//obtiene los pedidos y los genera
//ademas actualiza las unidades virtuales
export const getPedidos = async (req, res, next) => {
    await createOrders();
    await actualizarReservados();
    res.send({confirmacion: "Ordenes Actualizadas"});
}

//actualiza las publicaciones fijas
export const update_ml = async (req, res, next) => {
    try {
        console.log('inicio')
        await actualizarFijo();
        res.send({confirmacion: "Actualizar datos"});
    } catch (error) {
        console.log(error);
        next(error);
    }
}

//coloca las publicaciones de los productos en fijos
//y a su vez hace los respectivos cambios en la base de datos
export const agregarFijos = async (req, res, next) => {
    //un arreglo de objetos [{sku: string, cantidad: int}]
    //el sku es para buscar las publicaciones y la cantidad es con la que se actualizara cada dia
    const { datos } = req.body;

    try {
        const errores = [];
        const ok = [];
        for(const dato of datos){
            const client = await pool.connect();
            try{
                await client.query('BEGIN')
                const {rows} = await client.query('SELECT id FROM publicaciones FULL OUTER JOIN publicaciones_fijas ON publicaciones.id = publicaciones_fijas.publicacion_id WHERE publicacion_id IS NULL AND producto_id = ANY(SELECT producto_id FROM sku_producto WHERE sku = $1)', [dato.sku]);

                if(rows.length == 0) continue;

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
                console.log('errores publicaciones fijas', error);
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

//Se ejecuta pausar publicaciones y es la revision de los productos que se vendieron
//y se consulta en ML para verificar si las unidades de la publicacion si ha cambiado de 0
export const pausar = async (req, res, next) => {
    await pausarPublicacion()
    res.send({okey: "Si señore"})
}

//Se obtiene el producto que se vendio y se agrega a la lista de productos a pausar
export const agregarPausar = async (req, res, next) => {
    const { sku } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {rows: id} = await client.query('SELECT producto_id FROM sku_producto WHERE sku = $1', [sku]);

        const {rows} = await client.query('INSERT INTO pausar (producto_id) VALUES ($1) RETURNING *', [id[0].producto_id])

        if(rows.length === 0) throw new Error('No se pudo agregar el id');

        await client.query('COMMIT');
        res.send({confirmacion: "Se agrego correctamente a la lista"});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

//elimina las publicaciones de fijas y las asocia a las unidades del inventario
export const eliminarFijos = async(req, res, next) => {
    //un arreglo de objetos [{sku: string}]
    const { datos } = req.body;

    try {
        const errores = [];
        const ok = [];
        for(const dato of datos){
            const client = await pool.connect();
            try{
                await client.query('BEGIN')
                const {rows} = await client.query('SELECT id FROM publicaciones WHERE producto_id = ANY(SELECT producto_id FROM sku_producto WHERE sku = $1)', [dato.sku]);

                const ids = rows.map(row => row.id);
        
                await client.query('DELETE FROM publicaciones_fijas WHERE publicacion_id = ANY($1)', [ids]);

                await client.query('UPDATE publicaciones SET active = true WHERE active = false AND id = ANY($1)', [ids]);
                ok.push(dato);
                await client.query('COMMIT')
            } catch (error) {
                await client.query('ROLLBACK')
                console.log('errores publicaciones fijas', error);
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

//actauliza las unidades de fijas en caso de que desee cambiarlo
export const updatefijos = async (req, res, next) => {
    const {dato} = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {rows} = await client.query('UPDATE publicaciones_fijas SET cantidad = $1 WHERE publicacion_id = ANY(SELECT publicaciones.id FROM publicaciones INNER JOIN sku_producto ON sku_producto.producto_id = publicaciones.producto_id WHERE sku = $2) RETURNING *', dato)

        console.log(rows)
        if (rows.length == 0) throw new Error('No se actualizo');


        await client.query('COMMIT')
        res.send({confirmacion: 'Update terminado'})
    } catch (error) {
        await client.query('ROLLBACK')
        console.log('Error updatefijos', error);
        next(error)
    } finally {
        client.release()
    }
}