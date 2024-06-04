import moment from 'moment';
import CryptoJS from 'crypto-js';
import {
    API_KEY_FALABELLA,
    USER_FALABELLA
} from '../../config.js'


export const actualizarStockFalabella = async (publicaciones) => {
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
    
    options.body = await requestBody(publicaciones);

    try {
        await fetch(url, options).then(res => res.json() ).then( response => respuesta = response.SuccessResponse.Head).catch( error => console.error(error) );    

        if(respuesta === '') throw new Error('No se actualizo falabella') ;
            
        return {status: "ok"}
    } catch (error) {
        console.log(error)
        return {status: "error"}
    }
}

const setParametros = (action) => {
    let parametros = new Map();

    parametros.set('Action', action);
    parametros.set('Format', 'JSON');
    parametros.set('UserID', USER_FALABELLA);
    parametros.set('Version', '1.0');

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

    for(let i=0; i<skus.length; i++){
        request +="<Product><SellerSku>"+skus[i].sku+"</SellerSku><BusinessUnits><BusinessUnit><OperatorCode>faco</OperatorCode><Stock>"+skus[i].stock+"</Stock>"
        if(skus[i].stock > 0){
            request += "<Status>active</Status>";
        } else {
            request += "<Status>inactive</Status>";
        }
        request +="</BusinessUnit></BusinessUnits></Product>";
    }

    request += "</Request>";
    
    return request
}