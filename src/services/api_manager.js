import { leerDatos, eliminar } from '../services/data_manage.js'


export const actualizarInventario = async () => {
    const datos = await leerDatos();
    const skus = [];
    
    if(datos){
        
        for(const dato in datos){
            if(Object.hasOwnProperty.call(datos, dato)){
                //await api_mercadoLibre(dato);
                skus.push(dato);
                await eliminar(dato);
            }
        }

        //await api_rappi(skus, true);
        //await api_falabella(skus)
    }
}

export const actualizarInventarioUrgente = async (codigo) => {
    const skus = [codigo];
    console.log("ActualizacionPrioritaria")
    //await api_mercadoLibre(codigo);
    //await api_rappi(skus, true);
    //await api_falabella(skus)
    await eliminar(codigo);
}
