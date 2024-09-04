import moment from 'moment';
import CryptoJS from 'crypto-js';
import APIBase from '../models/api.js';

class APIFalabella extends APIBase{
    constructor(credentials){
        super('https://sellercenter-api.falabella.com/?', credentials)
    }

    async actualizarStock(publicaciones){
        const parametros = this.setParametros('ProductUpdate');

        let respuesta = null;

        parametros.set('Signature', CryptoJS.HmacSHA256(this.encodeURL(parametros), this.credentials.API_KEY).toString(CryptoJS.enc.Hex));

        const url = this.baseURL+this.encodeURL(parametros);

        const options = {
            method: 'POST',
            headers: {
                'accepts': 'application/json',
                'Content-Type': 'application/json'
            },
            body: this.requestBody(publicaciones)
        }

        try {
            await fetch(url, options)
            .then(res => res.json() )
            .then( response => {
                respuesta = response
            })
            .catch( error => console.error(error) );    
    
            if(!respuesta) throw new Error('No se actualizo falabella') ;

            return {status: 'ok'}
        } catch (error) {
            console.log(error)
            return {status: "error"}
        }
    }

    setParametros(action){
        let parametros = new Map();

        parametros.set('Action', action);
        parametros.set('Format', 'JSON');
        parametros.set('UserID', this.credentials.USER);
        parametros.set('Version', '1.0');

        return parametros
    }

    encodeURL(parametros){
        parametros.set('Timestamp',  moment().format().slice(0,-3)+"00");
        parametros = new Map([...parametros].sort());
        var url = '';
    
        parametros.forEach((value, key) => {
            url += key+'='+encodeURIComponent(value)+'&';
        })
    
        url = url.substring(0, url.length-1);
        return url
    }

    requestBody(publicaciones){
        let request = '<Request>';
    
        for(let i=0; i<publicaciones.length; i++){
            request +="<Product><SellerSku>"+publicaciones[i].codigo+"</SellerSku><BusinessUnits><BusinessUnit><OperatorCode>faco</OperatorCode><Stock>"+publicaciones[i].stock+"</Stock>"
            
            if(publicaciones[i].stock > 0){
                request += "<Status>active</Status>";
            } else {
                request += "<Status>inactive</Status>";
            }
            request +="</BusinessUnit></BusinessUnits></Product>";
        }
    
        request += "</Request>";
        
        console.log(request)
        return request
    }
}

export default APIFalabella;