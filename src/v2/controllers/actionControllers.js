import { pool } from '../database/conection.js';
import { actualizarPublicaciones, actualizarRappiFull } from '../services/actualizarPublicaciones.js'

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

        const response = await actualizarPublicaciones(rows);

        await client.query('UPDATE publicaciones SET update_status = false WHERE id = ANY($1)', [rows.map(row => row.id)])

        await client.query('COMMIT');
        res.status(200).send(response);
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
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

export const updateRappi = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {rows} = await client.query('SELECT publicaciones.*, marcas.nombre AS marca FROM publicaciones LEFT JOIN marcas ON pubicaciones.marca_id = marcas.id WHERE plataforma_id = 2 AND producto_id = ANY(SELECT id FROM productos WHERE update = true)');

        if(rows.length === 0) throw new Error('No hubo publicaciones que actualizar');
        
        await actualizarRappiFull(rows);

        await client.query('COMMIT');
        return res.status(200).send({confirmacion: "actualizado"})
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}