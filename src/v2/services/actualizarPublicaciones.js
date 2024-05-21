import { getQuery, putQuery } from "../database/queries.js"
import { actualizarStockFalabella } from "./api_falabella.js";
import { actualizarStockML } from "./api_ml.js";
import { actualizarStockRappi } from "./api_rappi.js";

export const actualizarPublicaciones = async (data) => {
    if(data.length === 0) return {status: "error", mensaje: "no se enviaron datos"}

    const ids = data.map(dato => {
        if(!isNaN(dato.id)) return dato.id
    }).filter(dato => dato !== undefined)

    const { response } = await getQuery("SELECT publicaciones.*, marcas.nombre AS marca FROM publicaciones LEFT JOIN marcas ON publicaciones.marca_id = marcas.id WHERE producto_id = ANY($1)", [ids]);

    if(response.length === 0) return {status: "error", mensaje: "no hay publicaciones asociadas"};

    const responseML = await actualizarML(response.data.filter(dato => dato.plataforma_id === 3 && dato.active).map(publicacion => {
        const producto = data.filter(datazo => datazo.id === publicacion.producto_id)
        return {...publicacion, stock: producto[0].stock}
    }))

    const responseRappi = await actualizarRappi(response.data.filter(dato => dato.plataforma_id === 2 && dato.active).map(publicacion => {
        const producto = data.filter(dato => dato.id === publicacion.producto_id)
        return {...publicacion, stock: producto[0].stock}
    }))

    const responseFalabella = await actualizarFalabella(response.data.filter(dato => dato.plataforma_id === 1 && dato.active).map(publicacion => {
        const producto = data.filter(dato => dato.id === publicacion.producto_id)
        return {...publicacion, stock: producto[0].stock}  
    }))

    const respuesta = respuestaGeneral(responseML, responseRappi, responseFalabella);

    await putQuery("UPDATE publicaciones SET update_status = false WHERE id = ANY($1)", [response.data.map(dato => dato.id)])

    return respuesta;
}

const actualizarML = async(data) => {
    if(data.length === 0) return {status: "error"}
    const dataOk = [];
    const dataErr = [];

    for(const publicacion of data){
        const response = await actualizarStockML(publicacion, true);

        if(response.status === "ok"){
            dataOk.push(response)
        } else {
            dataErr.push(response)
        }
    }

    console.log("Ok", dataOk);
    console.log("Error", dataErr);

    if(dataErr.length === 0){
        return {status: "ok"}
    } else if(dataOk.length === 0){
        return {status: "error"}
    } else {
        return {status: "warning"}
    }
}

const actualizarRappi = async(data) => {
    if(data.length === 0) return {status: "error"}
    const response = await actualizarStockRappi(data);

    return response
}

const actualizarFalabella = async(data) => {
    if(data.length === 0) return {status: "error"}
    const falabellaData = data.map(datos => {return {sku: datos.codigo, stock: datos.stock}});
    const response = await actualizarStockFalabella(falabellaData);
    return response
}

const respuestaGeneral = (responseML, responseRappi, responseFalabella) => {
    if(responseML.status === "ok" && responseRappi.status === "ok" && responseFalabella.status === "ok"){
        return {status: "ok", mensaje: "se actualizaron todas las plataformas"}
    } else if(responseML.status === "error" && responseRappi.status === "error" && responseFalabella.status === "error"){
        return {status: "error", mensaje: "No se actualizo ninguna plataforma"}
    }else if(responseML.status === "error"){
        if(responseRappi.status === "ok" && responseFalabella.status === "ok"){
            return {status: "warning", mensaje: "Se actualizo Falabella y Rappi"}
        }
        if(responseRappi.status === "error"){
            return {status: "warning", mensaje: "Solo se actualizo Falabella"}
        } else {
            return {status: "warning", mensaje: "Solo se actualizo Rappi"}
        }
    } else {
        if(responseRappi.status === "error" && responseFalabella.status === "error"){
            return {status: "warning", mensaje: "Solo se actulizo Mercado Libre"}
        }
        if(responseRappi.status === "error"){
            return {status: "warning", mensaje: "Se actualizo Mercado Libre y Falabella"}
        } else {
            return {status: "warning", mensaje: "Se actualizo Mercado Libre y Rappi"}
        }
    }
}