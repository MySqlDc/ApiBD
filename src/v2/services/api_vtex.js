import {
    STORE_NAME_VTEX,
    API_KEY_VTEX,
    TOKEN_VTEX
} from '../../config.js';

export const actualizarStockVTEX = async (publicacion) => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("X-VTEX-API-AppKey", API_KEY_VTEX);
    headers.append("X-VTEX-API-AppToken", TOKEN_VTEX);

    let url = "https://"+STORE_NAME_VTEX+".vtexcommercestable.com.br/api/logistics/pvt/inventory/skus/"+publicacion.codigo+"/warehouses/1_1";

    const data = {
        quantity: publicacion.stock,
        unlimitedQuantity: false,
        leadTime: null
    }

    const options = {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    }

    try {
        const response = await fetch(url, options);

        if(response.ok){
            return {status: "ok"}
        }    
        
        return {status: "error", mensaje: JSON.parse(response)}
    } catch (error) {
        return {status: "error", mensaje: error}   
    }
}

export const actualizarPrecioVTEX = async (publicacion) => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("X-VTEX-API-AppKey", API_KEY_VTEX);
    headers.append("X-VTEX-API-AppToken", TOKEN_VTEX);

    let url = "https://api.vtex.com/"+STORE_NAME_VTEX+"/pricing/prices/"+publicacion.codigo;

    const data = {
        "markup": 20,
        "listPrice": publicacion.precio,
        "basePrice": publicacion.descuento?publicacion.descuento:publicacion.precio
    }

    const options = {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    }

    try {
        const response = await fetch(url, options);

        if(response.ok){
            return {status: "ok"}
        }    

        return {status: "error", mensaje: JSON.parse(response)}
    } catch (error) {
        return {status: "error", mensaje: error}   
    }
    
}