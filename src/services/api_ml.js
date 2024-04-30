import { pool } from '../conection.js';
import {
    API_CLIENT_ML,
    API_REFRESH_ML,
    API_SECRET_ML
} from '../config.js'

let TOKEN = "";

export const api_mercadoLibre = async (sku) => {
    let query = "SELECT mco, variante, unidades FROM publicaciones_mc INNER JOIN productos ON productos.id = publicaciones_mc.id WHERE productos.id = (SELECT producto_id FROM sku_producto WHERE sku = $1)";
    const {rows} = await pool.query(query, [sku]);

    if(rows.length === 0) return;

    for(let i = 0; i<rows.length; i++){
        await actualizarStock(rows[i]);
    }
}

const actualizarStock = async (publicacion) => {
    let data = {
        available_quantity: publicacion.unidades
    }

    let options = {
        method: 'PUT',
        contentType: 'application/json',
        headers: {
            Authorization: 'Bearer '+TOKEN
        },
        body:JSON.stringify(data)
    }

    let url = "https://api.mercadolibre.com/items/MCO"+publicacion.codigo;

    if(publicacion.variante) url +="/variations/"+publicacion.variante;

    const response = await fetch(url, options);

    if(response.status === 200) console.log("hecho, publicacion "+publicacion.codigo+"-"+publicacion.variante);

    if(response.status === 400 || response.status === 404) console.log("Hubo un error", response.statusText);

    if(response.status === 403){
        await token_ml();

        await actualizarStock(sku);
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