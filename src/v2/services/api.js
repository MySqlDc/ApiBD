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