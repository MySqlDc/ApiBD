import APIBase from '../models/api.js'
import axios from 'axios';

class APIMl extends APIBase{
    constructor(credentials){
        super('https://api.mercadolibre.com', credentials)
    }

    async actualizarStock(publicacion, flex){
        let url = this.baseURL+'/items/MCO'+publicacion.codigo;

        if(publicacion.variante) url += '/variations/'+publicacion.variante;

        const options = {
            method:'PUT',
            url,
            contentType: 'application/json',
            headers: {
                Authorization: `Bearer ${this.credentials.TOKEN}`
            },
            data: JSON.stringify({ available_quantity: publicacion.stock})
        }

        try {
            const response = await axios(options);

            if(publicacion.stock > 0) await this.flex(publicacion, flex);

            console.log({status: "ok", producto: publicacion.codigo+"-"+publicacion.variante})
            if(response.status == 200) return {status: "ok", producto: publicacion.codigo+"-"+publicacion.variante}
        } catch (error) {
            if(error.response && (error.response.status == 400 || error.response.status == 404)) return {status: "error", producto: publicacion.codigo+"-"+publicacion.variante, error: error.response.statusText}
            
            if(error.response && error.response.status == 403){
                await this.token_ml();

                const response = await this.actualizarStock(publicacion, flex);

                return response;
            }

            console.error({status: "error", producto: `${publicacion.codigo}-${publicacion.variante}`, error: error.message})
            return {status: "error", producto: `${publicacion.codigo}-${publicacion.variante}`, error: error.message};
        }
    }

    async flex(publicacion, flex = true){
        let method = 'POST';

        if(!flex || publicacion.stock == 0) method = 'DELETE'

        let options = {
            method,
            url: this.baseURL+'/sites/MCO/shipping/selfservice/items/MCO'+publicacion.codigo,
            contentType: 'application/json',
            headers: {
                Authorization: `Bearer ${this.credentials.TOKEN}`
            }
        }

        try{
            const response = await axios(options);

            if(response.status == 204) return {status: 'ok', producto: publicacion.codigo+"-"+publicacion.variante}
        } catch (error){
            if(error.response && (error.response.status == 400 || error.response.status == 404)) return {status: "error", producto: publicacion.codigo+"-"+publicacion.variante, error: error}
    
            return { status: "error", producto: `${publicacion.codigo}-${publicacion.variante}`, error: error.message };
        }
    }

    async actualizar(publicacion, flex = true){
        let response = undefined;
        if(publicacion.full_bolean){
            response = await this.flex(publicacion, flex)
        } else{
            response = await this.actualizarStock(publicacion, flex)
        }

        return response;
    }

    async token_ml(){
        const data = {
            grant_type: 'refresh_token',
            client_id: this.credentials.API_CLIENT,
            client_secret: this.credentials.API_SECRET,
            refresh_token: this.credentials.API_REFRESH
        }

        const options = {
            method: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            headers:{
                accept: 'application/json'
            },
            body: JSON.stringify(data)
        }

        await fetch(this.baseURL+'/oauth/token', options).then(res => res.json()).then(response => this.credentials.TOKEN = response.access_token).catch(error => console.log('Fallo crear token', error))
    }
}

export default APIMl;