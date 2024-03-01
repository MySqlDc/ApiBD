import { pool } from '../../conection.js';
import { leerDatos, eliminar } from '../services/data_manage.js'

export const actualizarInventario = async () => {
    const datos = await leerDatos();
    
    if(datos){
        Object.keys(datos).forEach(dato => {

            query = "SELECT mco, variante, unidades FROM publicaciones_mc INNER JOIN productos ON productos.id = publicaciones_mc.id WHERE productos.id = (SELECT producto_id FROM sku_producto WHERE sku = $1)";
            console.log(dato);
        });
    }
}

export const actualizarInventarioUrgente = (codigo) => {

}