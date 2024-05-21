import { 
    API_KEY_RAPPI,
    STORE_ID_RAPPI
} from '../../config.js';

export const actualizarStockRappi = async (publicaciones, delta) => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("api_key", API_KEY_RAPPI);

    let respuesta = '';

    let records = publicaciones.map(publicacion => {
        let producto = {
            id: publicacion.codigo,
            store_id: STORE_ID_RAPPI,
            name: publicacion.nombre,
            trademark: publicacion.marca,
            stock: publicacion.stock,
            is_available: null,
            sale_type: "U",
            price: publicacion.precio
        }

        if(publicacion.descuento){
            producto.discount_price = publicacion.descuento
        }
        return producto
    });

    let options = {
        method: "POST",
        headers,
    }

    if(delta){
        options.body = JSON.stringify({type: "delta", records})
    } else {
        options.body = JSON.stringify({records})
    }

    console.log(options);

    await fetch("https://services.grability.rappi.com/api/cpgs-integration/datasets", options).then(res => res.json()).then(response => respuesta = response).catch(error => respuesta = error);

    console.log(respuesta)
    if(respuesta.status === created){
        return {status: "ok"}
    } else {
        return {status: "error"}
    }
}