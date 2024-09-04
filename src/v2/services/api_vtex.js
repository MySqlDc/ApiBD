import APIBase from '../models/api.js'

class APIVTEX extends APIBase {
    constructor(credentials){
        super('https://'+credentials.STORE_NAME+'.vtexcommercestable.com.br', credentials)
    }

    async actualizarStock(publicacion){
        let url = this.baseURL+'/api/logistics/pvt/inventory/skus/'+publicacion.codigo+'/warehouses/1_1';

        const data = {
            quantity: publicacion.stock,
            unlimitedQuantity: false,
            leadTime: null
        }

        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-VTEX-API-AppKey': this.credentials.API_KEY,
                'X-VTEX-API-AppToken': this.credentials.TOKEN
            },
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

    async actualizarPrecio(publicacion){
    
        let url = "https://api.vtex.com/"+this.credentials.STORE_NAME+"/pricing/prices/"+publicacion.codigo;
    
        const data = {
            "markup": 20,
            "listPrice": publicacion.precio,
            "basePrice": publicacion.descuento?publicacion.descuento:publicacion.precio
        }
    
        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-VTEX-API-AppKey': this.credentials.API_KEY,
                'X-VTEX-API-AppToken': this.credentials.TOKEN
            },
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
}

export default APIVTEX;