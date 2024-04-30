import { pool } from '../conection.js';
import { 
    API_KEY_RAPPI,
    STORE_ID_RAPPI
} from '../config.js';

export const actualizacionDelta = async(ids) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("api_key", API_KEY_RAPPI);
    console.log(ids);
    let respuesta = '';
    let records;
    try {
        const {rows} = await pool.query("SELECT publicaciones_rappi.*, productos.unidades, marcas.nombre AS marca, precios.precio_venta, precios.precio_rappi FROM publicaciones_rappi INNER JOIN productos ON productos.id = publicaciones_rappi.id INNER JOIN marcas ON marcas.id = productos.marca INNER JOIN precios ON precios.id = productos.id INNER JOIN sku_producto ON sku_producto.producto_id = productos.id WHERE productos.id = ANY($1)", [ids]);

        if(rows.length === 0) return console.log("error no se encontro ningun dato");

        records = rows.map( datos => {
            let producto = {};
            if(datos.precio_venta > datos.precio_rappi){
                producto = {
                    id: datos.producto_id.toString(),
                    store_id: STORE_ID_RAPPI,
                    name: datos.nombre,
                    trademark: datos.marca,
                    price: datos.precio_venta,
                    discount_price: datos.precio_rappi,
                    stock: datos.unidades,
                    is_available: null,
                    sale_type: "U"
                }
            } else {
                producto = {
                    id: datos.producto_id.toString(),
                    store_id: STORE_ID_RAPPI,
                    name: datos.nombre,
                    trademark: datos.marca,
                    price: datos.precio_rappi,
                    stock: datos.unidades,
                    is_available: null,
                    sale_type: "U"
                }
            }

            return producto
        })
    } catch (error) {
        console.log(error);
    }

    let options = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({type: "delta", records: records})
    }

    console.log(options);
    await fetch("https://services.grability.rappi.com/api/cpgs-integration/datasets", options).then(res => res.json()).then(response => respuesta = response).catch(error => respuesta = error);

    return  respuesta;
}

export const actualizacion = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("api_key", API_KEY_RAPPI);

    let respuesta = '';
    let records
    try {
        const {rows} = await pool.query("SELECT publicaciones_rappi.*, productos.unidades, marcas.nombre AS marca, precios.precio_venta, precios.precio_rappi FROM publicaciones_rappi INNER JOIN productos ON productos.id = publicaciones_rappi.id INNER JOIN marcas ON marcas.id = productos.marca INNER JOIN precios ON precios.id = productos.id INNER JOIN sku_producto ON sku_producto.producto_id = productos.id");

        if(rows.length === 0) return console.log("error no se encontro ningun dato");

        records = rows.map( datos => {
            let producto = {};
            if(datos.precio_venta > datos.precio_rappi){
                producto = {
                    id: datos.producto_id.toString(),
                    store_id: STORE_ID_RAPPI,
                    name: datos.nombre,
                    trademark: datos.marca,
                    price: datos.precio_venta,
                    discount_price: datos.precio_rappi,
                    stock: datos.unidades,
                    is_available: null,
                    sale_type: "U"
                }
            } else {
                producto = {
                    id: datos.producto_id.toString(),
                    store_id: STORE_ID_RAPPI,
                    name: datos.nombre,
                    trademark: datos.marca,
                    price: datos.precio_rappi,
                    stock: datos.unidades,
                    is_available: null,
                    sale_type: "U"
                }
            }

            return producto
        })
    } catch (error) {
        console.log(error);
    }

    let options = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({records: records})
    }

    console.log(options);
    await fetch("https://services.grability.rappi.com/api/cpgs-integration/datasets", options).then(res => res.json()).then(response => respuesta = response).catch(error => respuesta = error);

    return respuesta;
}