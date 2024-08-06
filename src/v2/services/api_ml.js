import axios from 'axios';
import {
    API_CLIENT_ML,
    API_REFRESH_ML,
    API_SECRET_ML
} from '../../config.js'

let TOKEN = '';

export const actualizarStockML = async (publicacion) => {
    console.log("Consulta ml")
    let url = "https://api.mercadolibre.com/items/MCO"+publicacion.codigo;

    if(publicacion.variante) url +="/variations/"+publicacion.variante;

    let options = {
        method: 'put',
        url,
        contentType: 'application/json',
        headers: {
            Authorization: `Bearer ${TOKEN}`
        },
        data:JSON.stringify({ available_quantity: publicacion.stock })
    }

    try {
        const response = await axios(options);

        if(response.status === 200) return {status: "ok", producto: publicacion.codigo+"-"+publicacion.variante}
    } catch (error) {

        if(error.response && (error.response.status === 400 || error.response.status === 404)) return {status: "error", producto: publicacion.codigo+"-"+publicacion.variante, error: error.response.statusText}

        if(error.response && error.response.status === 403){
            await token_ml();

            const response = await actualizarStockML(publicacion);
            
            return response;
        }

        return { status: "error", producto: `${publicacion.codigo}-${publicacion.variante}`, error: error.message };
    }
    
}

export const actualizarPrecioML = async (publicacion) => {
    let url = "https://api.mercadolibre.com/items/MCO"+publicacion.codigo;

    if(publicacion.variante) url +="/variations/"+publicacion.variante;

    let options = {
        method: 'PUT',
        url,
        contentType: 'application/json',
        headers: {
            Authorization: `Bearer ${TOKEN}`
        },
        data: JSON.stringify({ price: publicacion.precio })
    }

    try {
        const response = await axios(options);

        if(response.status === 200) return {status: "ok", producto: publicacion.codigo+"-"+publicacion.variante}
    } catch (error) {

        if(error.response && (error.response.status == 400 || error.response.status == 404)) return {status: "error", producto: publicacion.codigo+"-"+publicacion.variante, error: error.data.message}

        if(error.response && error.response.status == 403){
            await token_ml();

            const response = await actualizarPrecioML(publicacion);
            
            return response;
        }

        return { status: "error", producto: `${publicacion.codigo}-${publicacion.variante}`, error: error.message };
    }
}

export const actualizarDescuentoML = async (publicacion, promocion) => {
    const url = "https://api.mercadolibre.com/seller-promotions/items/MCO"+publicacion.codigo+"?app_version=v2";

    let data = {
        deal_prince: publicacion.descuento,
        promotion_id: promocion.id,
        promotion_type: promocion.type
    }

    const options = {
        method: 'POST',
        url,
        contentType: 'application/json',
        headers: {
            'Authorization': `Bearer ${TOKEN}`
        },
        data: JSON.stringify(data)
    }

    try {
        const response = await axios(options);

        if(response.status === 200) return {status: "Descuento agregado", producto: publicacion.codigo+"-"+publicacion.variante}
    } catch (error) {

        if(error.response && (error.response.status == 400 || error.response.status == 404)) return {status: "error", producto: publicacion.codigo+"-"+publicacion.variante, error: error.data.message}

        if(error.response && error.response.status == 403){
            await token_ml();

            const response = await actualizarPrecioML(publicacion);
            
            return response;
        }

        return { status: "error", producto: `${publicacion.codigo}-${publicacion.variante}`, error: error.message };
    }
}

export const modificarDescuentoML = async (publicacion, promocion) => {
    const url = "https://api.mercadolibre.com/seller-promotions/items/MCO"+publicacion.codigo+"?app_version=v2";

    let data = {
        deal_prince: publicacion.descuento,
        promotion_id: promocion.id,
        promotion_type: promocion.type
    }

    const options = {
        method: 'PUT',
        url,
        contentType: 'application/json',
        headers: {
            'Authorization': `Bearer ${TOKEN}`
        },
        data: JSON.stringify(data)
    }

    try {
        const response = await axios(options);

        if(response.status === 200) return {status: "Descuento actualizado", producto: publicacion.codigo+"-"+publicacion.variante}
    } catch (error) {

        if(error.response && (error.response.status == 400 || error.response.status == 404)) return {status: "error", producto: publicacion.codigo+"-"+publicacion.variante, error: error.data.message}

        if(error.response && error.response.status == 403){
            await token_ml();

            const response = await modificarDescuentoML(publicacion);
            
            return response;
        }

        return { status: "error", producto: `${publicacion.codigo}-${publicacion.variante}`, error: error.message };
    }
}

export const eliminarDescuentoML = async (publicacion, promocion) => {
    const url = "https://api.mercadolibre.com/seller-promotions/items/MCO"+publicacion.codigo+"?promotion_type="+promocion.type+"&promotion_id"+promocion.id+"?app_version=v2";

    const options = {
        method: 'DELETE',
        url,
        contentType: 'application/json',
        headers: {
            'Authorization': `Bearer ${TOKEN}`
        }
    }

    try {
        const response = await axios(options);

        if(response.status === 200) return {status: "Descuento eliminado", producto: publicacion.codigo+"-"+publicacion.variante}
    } catch (error) {

        if(error.response && (error.response.status == 400 || error.response.status == 404)) return {status: "error", producto: publicacion.codigo+"-"+publicacion.variante, error: error.data.message}

        if(error.response && error.response.status == 403){
            await token_ml();

            const response = await eliminarDescuentoML(publicacion);
            
            return response;
        }

        return { status: "error", producto: `${publicacion.codigo}-${publicacion.variante}`, error: error.message };
    }
}

const token_ml = async() => {
    const data = {
        grant_type: 'refresh_token',
        client_id: API_CLIENT_ML,
        client_secret: API_SECRET_ML,
        refresh_token: API_REFRESH_ML
    }

    const options = {
        method: 'POST',
        contentType: 'application/x-www-form-urlencoded',
        headers: {
            accept: 'application/json'
        },
        body: JSON.stringify(data)
    }

    await fetch("https://api.mercadolibre.com/oauth/token", options).then(res => res.json()).then(response => TOKEN = response.access_token);
}