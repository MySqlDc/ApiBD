import moment from 'moment';
import CryptoJS from 'crypto-js';
import { pool } from '../../conection.js'
import {
    API_KEY_FALABELLA,
    USER_FALABELLA
} from '../../config.js'


export const api_falabella = async (skus) => {
    let respuesta = '';
    const parametros = setParametros('ProductUpdate');

    parametros.set('Signature', CryptoJS.HmacSHA256(encodeURL(parametros), API_KEY_FALABELLA).toString(CryptoJS.enc.Hex));

    let url = 'https://sellercenter-api.falabella.com/?'+encodeURL(parametros);

    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    }
    
    options.body = await requestBody(skus);

    await fetch(url, options).then(res => res.json() ). then( response => respuesta = response.SuccessResponse.Head.ResponseType).catch( error => console.error(error) );

    if(respuesta === '') return console.log("Se ha hecho la actualizacion de los productos");

    console.log(respuesta)
}

const setParametros = (action, skus = []) => {
    let parametros = new Map();

    parametros.set('Action', action);
    parametros.set('Format', 'JSON');
    parametros.set('Filter', 'live');
    parametros.set('UserID', USER_FALABELLA);
    parametros.set('Version', '1.0');
    if(action === 'GetProducts') {
        parametros.set('SkuSellerList', JSON.stringify(skus))
    }

    return parametros
}

const encodeURL = (parametros) => {
    parametros.set('Timestamp',  moment().format().slice(0,-3)+"00");
    parametros = new Map([...parametros].sort());
    var url = '';

    parametros.forEach((value, key) => {
        url += key+'='+encodeURIComponent(value)+'&';
    })

    url = url.substring(0, url.length-1);
    return url
}

const requestBody = async (skus) =>{
    console.log(skus)
    let request = "<Request>";
    try {
        const {rows} = await pool.query('SELECT sku, unidades FROM sku_producto INNER JOIN productos ON sku_producto.producto_id = productos.id WHERE sku = ANY($1)', [skus]);

        for(let i=0; i<rows.length; i++){
            request +="<Product><SellerSku>"+rows[i].sku+"</SellerSku><BusinessUnits><BusinessUnit><OperatorCode>faco</OperatorCode><Stock>"+rows[i].unidades+"</Stock></BusinessUnit></BusinessUnits></Product>";
        }

        request += "</Request>";

        return request
    } catch (error) {
        console.error("error: "+error)
    }
}