import moment from 'moment';
import CryptoJS from 'crypto-js';
import {
    API_KEY_FALABELLA,
    USER_FALABELLA
} from '../../config.js'


export const actualizarStockFalabella = async (publicaciones, precio = false) => {
    let respuesta = '';
    const parametros = setParametros('ProductUpdate');

    parametros.set('Signature', CryptoJS.HmacSHA256(encodeURL(parametros), API_KEY_FALABELLA).toString(CryptoJS.enc.Hex));

    let url = 'https://sellercenter-api.falabella.com/?'+encodeURL(parametros);

    console.log(url)

    let options = {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: await requestBody(publicaciones, precio)
    }

    console.log("options", options)

    try {
        await fetch(url, options)
        .then(res => res.json() )
        .then( response => {
            console.log(response)
            respuesta = response.SuccessResponse.Head
        })
        .catch( error => console.error(error) );    

        if(!respuesta) throw new Error('No se actualizo falabella') ;
            
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

const requestBody = async (publicaciones, price = false) =>{
    let request = '<?xml version="1.0" encoding="UTF-8" ?><Request>';

    for(let i=0; i<publicaciones.length; i++){
        request +="<Product><SellerSku>"+publicaciones[i].codigo+"</SellerSku><BusinessUnits><BusinessUnit><OperatorCode>faco</OperatorCode><Stock>"+publicaciones[i].stock+"</Stock>"
        
        if(price) request += "<Price>"+publicaciones[i].precio+"</Price>";

        if(price && publicaciones[i].descuento) request += "<SpecialPrice>"+publicaciones[i].descuento+"</SpecialPrice>";

        if(publicaciones[i].stock > 0){
            request += "<Status>active</Status>";
        } else {
            request += "<Status>inactive</Status>";
        }
        request +="</BusinessUnit></BusinessUnits></Product>";
    }

    request += "</Request>";
    
    return request
}