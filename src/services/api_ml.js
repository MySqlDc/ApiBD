import { pool } from '../conection.js';
import {
    API_CLIENT_ML,
    API_REFRESH_ML,
    API_SECRET_ML
} from '../config.js'

let TOKEN = "";

export const api_mercadoLibre = async (sku) => {
    let flag = true;
    let query = "SELECT mco, variante, unidades_virtuales FROM publicaciones_ml INNER JOIN productos ON productos.id = publicaciones_ml.id WHERE productos.id = (SELECT producto_id FROM sku_producto WHERE sku = $1)";
    const {rows} = await pool.query(query, [sku]);

    if(rows.length === 0) return;

    for(let i = 0; i<rows.length; i++){
        flag = await actualizarStock(rows[i]);
    }

    return flag;
}

const actualizarStock = async (publicacion) => {
    let data = {
        available_quantity: publicacion.unidades_virtuales
    }

    let options = {
        method: 'PUT',
        contentType: 'application/json',
        headers: {
            Authorization: 'Bearer '+TOKEN
        },
        body:JSON.stringify(data)
    }

    let url = "https://api.mercadolibre.com/items/MCO"+publicacion.mco;

    if(publicacion.variante) url +="/variations/"+publicacion.variante;

    const response = await fetch(url, options);

    if(response.status === 200) {
        console.log("hecho, publicacion "+publicacion.mco+"-"+publicacion.variante);
        return true;
    }

    if(response.status === 400 || response.status === 404) {
        console.log("Hubo un error", response.statusText);
        return false;
    }

    if(response.status === 403){
        await token_ml();

        const response = await actualizarStock(publicacion);
        return response;
    }
}


const token_ml = async() =>{
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