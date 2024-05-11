import moment from 'moment';
import CryptoJS from 'crypto-js';
import {
    API_KEY_FALABELLA,
    USER_FALABELLA
} from '../config.js'
import { inventario } from './consultas_internas.js';


export const actualizar_stockF = async (skus) => {
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

    await fetch(url, options).then(res => res.json() ).then( response => respuesta = response).catch( error => console.error(error) );

    if(respuesta === ''){
        return console.log("error");
    } else{
        console.log(respuesta)
        return respuesta
    }

    
};

export const getProductos = async (skus, offset) => {
    let respuesta = '';
    const parametros = setParametros('GetProducts', skus, offset);

    parametros.set('Signature', CryptoJS.HmacSHA256(encodeURL(parametros), API_KEY_FALABELLA).toString(CryptoJS.enc.Hex));

    let url = 'https://sellercenter-api.falabella.com/?'+encodeURL(parametros);

    let options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    }

    await fetch (url, options).then(res => res.json()).then(response => respuesta = response.SuccessResponse.Body.Products).catch(error => console.error(error));

    return respuesta;
};

const setParametros = (action, skus = [], offset) => {
    let parametros = new Map();

    parametros.set('Action', action);
    parametros.set('Format', 'JSON');
    parametros.set('UserID', USER_FALABELLA);
    parametros.set('Version', '1.0');
    if(action === 'GetProducts' && skus.length > 1) {
        parametros.set('SkuSellerList', skus);
    } else if(action ==='GetProducts'){
        parametros.set('Limit', 100);
    }
    if(offset){
        parametros.set('Offset', offset);
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

    let request = "<Request>";
    try {

        for(let i=0; i<skus.length; i++){
            request +="<Product><SellerSku>"+skus[i].sku+"</SellerSku><BusinessUnits><BusinessUnit><OperatorCode>faco</OperatorCode><Stock>"+skus[i].unidades+"</Stock>"
            if(skus[i].unidades > 0){
                request += "<Status>active</Status>";
            } else {
                request += "<Status>inactive</Status>";
            }
            request +="</BusinessUnit></BusinessUnits></Product>";
        }

        request += "</Request>";
        
        console.log(request);
        return request
    } catch (error) {
        console.error("error: "+error)
    }
}