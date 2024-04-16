import { pool } from '../conection.js';
import { 
    API_KEY_RAPPI,
    STORE_ID_RAPPI
} from '../config.js';

export const actualizacionDelta = async(skus) => {
    const records = [];
    let data = {};
    try {
        const {rows} = await pool.query("SELECT publicaciones_rappi.*, productos.unidades, marcas.nombre AS marca, precios.precio_venta, precios.precio_rappi FROM publicaciones_rappi INNER JOIN productos ON productos.id = publicaciones_rappi.id INNER JOIN marcas ON marcas.id = productos.marca INNER JOIN precios ON precios.id = productos.id INNER JOIN sku_producto ON sku_producto.producto_id = productos.id WHERE sku = ANY($1)", [skus]);

        if(rows.length === 0) return console.log("error no se encontro ningun dato");

        rows.forEach( datos => {
            let producto = {};
            if(datos.precio_venta > datos.precio_rappi){
                producto = {
                    id: datos.producto_id,
                    store_id: STORE_ID_RAPPI,
                    name: datos.nombre,
                    trademark: datos.marca,
                    price: datos.precio_venta,
                    discount_price: datos.precio_rappi,
                    stock: datos.unidades,
                    is_available: datos.unidades>0?true:false,
                    sale_type: "U"
                }
            } else {
                producto = {
                    id: datos.producto_id,
                    store_id: STORE_ID_RAPPI,
                    name: datos.nombre,
                    trademark: datos.marca,
                    price: datos.precio_rappi,
                    stock: datos.unidades,
                    is_available: datos.unidades>0?true:false,
                    sale_type: "U"
                }
            }

            records.push(producto);
        })
    } catch (error) {
        console.log(error);
    }

    data.type = "delta"

    data.records = records

    let options = {
        method: 'POST',
        headers: {
            contentType: 'application/json',
            api_key: API_KEY_RAPPI
        },
        body: JSON.stringify(data)
    }

    console.log(options);
    await fetch("https://services.grability.rappi.com/api/cpgs-integration/datasets", options).then(res => res.json()).then(response => console.log(response));
}

export const actualizacion = async () => {
    let respuesta = '';
    const records = [];
    let data = {};
    try {
        const {rows} = await pool.query("SELECT publicaciones_rappi.*, productos.unidades, marcas.nombre AS marca, precios.precio_venta, precios.precio_rappi FROM publicaciones_rappi INNER JOIN productos ON productos.id = publicaciones_rappi.id INNER JOIN marcas ON marcas.id = productos.marca INNER JOIN precios ON precios.id = productos.id INNER JOIN sku_producto ON sku_producto.producto_id = productos.id");

        if(rows.length === 0) return console.log("error no se encontro ningun dato");

        rows.forEach( datos => {
            let producto = {
                id: datos.producto_id,
                store_id: STORE_ID_RAPPI,
                name: datos.nombre,
                trademark: datos.marca,
                price: datos.precio_venta,
                discount_price: datos.precio_rappi,
                stock: datos.unidades,
                is_available: datos.unidades>0?true:false,
                sale_type: "U"
            }

            records.push(producto);
        })
    } catch (error) {
        console.log(error);
    }

    data.records = records

    let options = {
        method: 'POST',
        headers: {
            contentType: 'application/json',
            api_key: API_KEY_RAPPI
        },
        body: JSON.stringify(data)
    }

    console.log(options);
    await fetch("https://services.grability.rappi.com/api/cpgs-integration/datasets", options).then(res => res.json()).then(response => respuesta = response).catch(error => respuesta = error);

    return respuesta;
}