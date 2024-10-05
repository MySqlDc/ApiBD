//clase con la que se da una estructura a las distintas API'S que se consultan
class APIBase {
    constructor(baseURL, credentials){
        this.baseURL = baseURL;
        this.credentials = credentials;
    }

    async actualizarStock() {
        throw new Error('actualizarStock() debe ser implementado')
    }
}

export default APIBase;