import { leerDatos, eliminar } from '../services/data_manage.js'
import { api_mercadoLibre } from './api_ml.js';
import { actualizar_stockF } from './api_falabella.js'
import { inventario } from './consultas_internas.js';


export const actualizarInventario = async () => {
    const datos = await leerDatos();
    let skus = [];
    
    if(datos){
        for(const dato in datos){
            if(Object.hasOwnProperty.call(datos, dato)){
                const response = await api_mercadoLibre(dato);
                console.log("dato", dato)
                skus.push(dato);
                await eliminar(dato);
            
            }
        }

        skus = await inventario(skus)
        //await api_rappi(skus, true);
        await actualizar_stockF(skus)
    }
}

export const actualizarInventarioUrgente = async (codigo) => {
    const skus = [codigo];
    console.log("ActualizacionPrioritaria")
    await api_mercadoLibre(codigo);
    //await api_rappi(skus, true);
    await api_falabella(skus);
}
