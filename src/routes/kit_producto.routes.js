import { Router } from 'express';
import { pool } from '../conection.js';

const router = Router();

router.get('/productosKit', async(req, res) => {
    try {
        const {rows} = await pool.query('SELECT kit_producto.*, productos.nombre, productos.unidades FROM kit_producto INNER JOIN productos ON kit_producto.producto_id = productos.id ORDER BY kit_id')

        if(rows.length === 0) return res.status(200).json({status: 204, data: "no se encontraron datos"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})
    }
});

router.get('/productoKit', async(req, res) => {
    const { id, sku } = req.query;

    if(!sku && !id) return res.status(400).json({status: 400, mensaje: "No se ingreso un dato para la busqueda"});

    if(id && !Number.isInteger(id)) return res.status(400).json({status: 400, mensaje: "error el identificador del kit no es valido"});
    
    let query = 'SELECT kit_producto.*, productos.nombre, productos.unidades FROM kit_producto INNER JOIN productos ON kit_producto.kit_id = productos.id WHERE kit_id = $1';
    let params = [id];

    if(sku){
        query = 'SELECT kit_producto.*, productos.nombre, productos.unidades FROM kit_producto INNER JOIN productos ON kit_producto.kit_id = productos.id INNER JOIN sku_producto ON productos.id = sku_producto.producto_id WHERE sku = $1'
        params = [sku];
    }

    try {
        const {rows} = await pool.query(query, params);

        if(rows.length === 0) return res.status(200).json({status: 200, mensaje: "No existen datos asociados"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})
    }
});

router.post('/productoKit', async(req, res) => {
    const { id, producto_id } = req.body;

    if(!id && !producto_id) return res.status(400).json({status: 400, mensaje: "error debes ingresar el sku y el identificador del kit"});

    if(!Number.isInteger(id)) return res.status(400).json({status: 400, mensaje: "error el identificador del kit no es valido"});

    if(!Number.isInteger(producto_id)) return res.status(400).json({status: 400, mensaje: "error el identificador del producto no es valido"});

    try {
        const {rows} = await pool.query("INSERT INTO kit_producto (kit_id, producto_id) VALUES ($1, $2) RETURNING *", [id, producto_id]);

        await pool.query("SELECT inventario_kit_especifico($1)", [id]);

        res.status(201).json({status: 201, confirmacion: "se ha agregado correctamente el producto al kit", data: rows})
    } catch (error) {
        switch(error.constraint){
            case "fk_kit": 
                res.status(400).json({status: 400, mensaje: "el kit no existe"});break;
            case "fk_producto":
                res.status(400).json({status: 400, mensaje: "el producto no existe"});break;
            default:
                res.status(400).json({status: 400, mensaje: error})
        }
    }
});

router.post('/productosKit', async(req, res) => {
    const {productos} = req.body;

    if(!productos || productos.length <= 0) return res.status(400).json({status: 400, mensaje: "no se enviaron skus para agregar"});

    let creados = []
    let errores = []

    for(let i = 0; i < Math.ceil(productos.length/30); i++){
        let query = "INSERT INTO kit_producto (kit_id, producto_id) VALUES ";
        var ronda = productos.slice(i*30, (i*30)+30);

        let coma = false;

        ronda.forEach((vinculo, index) =>{
            if(coma) {
                query += ",";
            }

            if(Number.isInteger(vinculo.kit) && Number.isInteger(vinculo.producto)){
                query+= "("+vinculo.kit+","+vinculo.producto+")";
                if(!coma) coma = !coma;
            } else {
                errores.push({mensaje: "el kit "+vinculo.kit+" o el producto "+vinculo.producto+" esta mal"})
            }
        });

        try {
            const {rows} = await pool.query(query+" RETURNING *");

            await pool.query("SELECT inventario_kit_general()");

            creados = creados.concat(rows);
        } catch(error){
            switch(error.constraint){
                case "fk_kit": 
                    errores.push({mensaje: "el kit no existe", detalles: error.detail});break;
                case "fk_producto":
                    errores.push({mensaje: "el producto no existe", detalles: error.detail});break;
                default:
                    errores.push({mensaje: error})
            }
        }
    }

    if(creados.length === 0) return res.status(400).json({status: 400, mensaje:"no se vinculo ningun sku", error: errores})

    if(errores.length === 0) return res.status(201).json({status: 201, confirmacion: "Se crearon todos los skus", data: creados})

    res.status(200).json({status: 200, mensaje: "se vincularon algunos skus", data: creados, error: errores})
});

router.delete('/productoKit/:kit_id', async(req, res) => {
    const {producto_id} = req.body;

    if(!producto_id) return res.status(400).json({status: 400, mensaje: "debe ingresar el id del producto"});

    if(isNaN(parseInt(req.params.kit_id))) return res.status(400).json({status: 400, mensaje: "el id debe ser un numero"})
    
    try {
        const {rowCount} = await pool.query("DELETE FROM kit_producto WHERE kit_id = $1 AND producto_id = $2", [req.params.kit_id, producto_id]);

        if(rowCount === 0) return res.status(200).json({status: 200, mensaje: "la asociacion no existia"})

        await pool.query("SELECT inventario_kit_especifico($1)", [req.params.kit_id]);

        res.status(200).json({status: 200, confirmacion: "Se elimino correctamente el producto del kit", data: "productos elminados "+rowCount})
    } catch(error){
        res.status(400).json({status: 400, mensaje: error})
    }
});

export default router