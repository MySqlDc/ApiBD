import { query } from 'express';
import { pool } from '../../conection.js';
import { leerDatos, eliminar } from '../services/data_manage.js'

export const actualizarInventario = async () => {
    const datos = await leerDatos();
    
    if(datos){
        for(const dato in datos){
            if(Object.hasOwnProperty.call(datos, dato)){
                let query = "SELECT mco, variante, unidades FROM publicaciones_mc INNER JOIN productos ON productos.id = publicaciones_mc.id WHERE productos.id = (SELECT producto_id FROM sku_producto WHERE sku = $1)";
                const {rows} = await pool.query(query, [dato]);

                console.log(rows[0])
            }
        }
    }
}

export const actualizarInventarioUrgente = (codigo) => {

}