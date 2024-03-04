import { leerDatos, eliminar } from '../services/data_manage.js'
import {api_mercadoLibre} from './api_ml.js'

export const actualizarInventario = async () => {
    const datos = await leerDatos();
    
    if(datos){
        for(const dato in datos){
            if(Object.hasOwnProperty.call(datos, dato)){
                await api_mercadoLibre(dato);
            }
        }
    }
}

export const actualizarInventarioUrgente = (codigo) => {

}
