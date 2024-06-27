import { pool } from '../database/conection.js';
import { actualizarPublicaciones, actualizarRappiFull } from '../services/actualizarPublicaciones.js'
import { actualizarStockFalabella } from '../services/api_falabella.js';
import { actualizarDescuentoML, actualizarPrecioML, eliminarDescuentoML } from '../services/api_ml.js';
import { actualizarStockRappi } from '../services/api_rappi.js';
import { actualizarPrecioVTEX, actualizarStockVTEX } from '../services/api_vtex.js';

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
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const {rows} = await client.query('SELECT * FROM publicaciones_stock_view WHERE plataforma_id = 5 AND producto_id = ANY(SELECT producto_id FROM sku_producto WHERE sku = $1)', [sku]);

        if(rows.length === 0) throw new Error('No existe una publicacion');

        const response = await actualizarStockVTEX(rows[0]);

        if(response.status === 'error') throw new Error('error al actualizar publicacion '+response.mensaje);

        await client.query('COMMIT');
        res.status(200).send({confirmacion: "Actualizado"});
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

export const updatePricePublicacion = async (req, res, next) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        const {rows} = await client.query("SELECT * FROM publicaciones_stock_view WHERE id = $1", [id]);

        if(rows.length === 0) throw new Error('No se encontro la publicacion');

        let response = '';

        switch(rows[0].plataforma_id){
            case 1: 
                response = await actualizarStockFalabella(rows, true);break;
            case 2:
                response = await actualizarStockRappi(rows, true);break;
            case 3:
                response = await actualizarPrecioML(rows[0]);break;
            case 5:
                response = await actualizarPrecioVTEX(rows[0]);break;
        }

        await client.query('COMMIT');
        return res.status(200).send(response);
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

export const updateDiscountPublication = async (req, res, next) => {
    const { id } = req.params;
    const { descuento, eliminar, promocion} = req.body;
    const client = await pool.connect();

    try {
        let response;
        await client.query('BEGIN');

        if(!promocion_id || !promocion_type) throw new Error('Debe ingresar los datos de la promocion');

        const {rows} = await client.query('SELECT * FROM publicaciones WHERE id = $1', [id]);

        if(rows.length === 0) throw new Error('No hay pubicaciones para actualizar');

        if(eliminar) {
            response = eliminarDescuentoML(rows[0], promocion);
        } else if(descuento === rows[0].descuento){
            response = actualizarDescuentoML(rows[0], promocion);
        } else if(descuento > rows[0].descuento){
            eliminarDescuentoML(rows[0], promocion);
            response = actualizarDescuentoML(rows[0], promocion);
        } else if(descuento < rows[0].descuento){
            response = actualizarDescuentoML(rows[0], promocion);
        }

        if(response.error) throw new Error(response.error)

        const actualizacion = await client.query('UPDATE publicaciones SET descuento = $1 WHERE id = $2 RETURNING *', [descuento, id]);

        if(actualizacion.rows.length === 0) throw new Error('No se actualizaron los datos en la base de datos pero si en la publicacion');

        await client.query('COMMIT');
        res.status(200).send(response.status);
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release()
    }

}