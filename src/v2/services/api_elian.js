import { DUCOR_DATA, DUCOR_PLATFOMS } from '../../config.js';

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
        }).filter(cambio => cambio !== undefined);

        const ceros = datos.filter(dato => dato.cantidad <= 0);
        console.log("ceros ", ceros.length);
        if(ceros.length > 4500){
            const cantidades = await getdatos();
            return cantidades;
        } else {
            return datos;
        }
    } catch (error) {
        console.log("Fallo en la obtencion de datos", error);
        return [];
    }
    
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