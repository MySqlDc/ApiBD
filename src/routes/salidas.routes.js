import { Router } from 'express';
import { pool } from '../conection.js';
import { registrarVarios } from '../services/data_manage.js'

const router = Router();

router.get('/salidas', async(req, res) => {
    const { fecha, skus } = req.body;
    let query = "SELECT * FROM vista_salidas"
    let params = []

    if(fecha){
        query = "SELECT * FROM vista_salidas WHERE DATE(fecha) = $1";
        params.push(fecha)
    } 

    if(skus){
        query = "SELECT * FROM vista_salidas WHERE sku = ANY($1)";
        params.push(skus);
    }

    if(skus && fecha){
        query = "SELECT * FROM vista_salidas WHERE DATE(fecha) = $1 AND sku = ANY($2)";
    }

    try {
        const {rows} = await pool.query(query, params);
        if(rows.length === 0) return res.status(204).json({status: 204, mensaje: "Ninguna entrada se encontro"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});  
    }
});

router.get('/salida/:codigo', async(req, res) =>{
    try {
        const {rows} = await pool.query("SELECT * FROM vista_salidas WHERE codigo = $1", [req.params.codigo]);

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "Ninguna salida se encontro"})

        res.status(200).json(rows[0])
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})   
    }
});

router.post('/salida', async(req, res) => {
    const { sku, cantidad, factura } = req.body;

    if(!sku) return res.status(400).json({status: 400, mensaje: "debe ingresar un sku en el body para crear la salida"});

    if(!Number.isInteger(factura)) return res.status(400).json({status: 400, mensaje: "el dato de factura es erroneo"});

    if(!Number.isInteger(cantidad) || cantidad <= 0) return res.status(400).json({status: 400, mensaje: "el dato de cantidad es erroneo"});

    try {
        const {rows} = await pool.query("INSERT INTO salidas(sku,cantidad,factura_id) VALUES ($1,$2,$3) RETURNING *", [sku, cantidad, factura]);

        registrarVarios(rows);

        res.status(201).json({status: 201, confirmacion:"se creo la salida exitosamente", data: rows[0]});
    } catch (error) {
        switch(error.constraint){
            case 'sku_producto':
                res.status(400).json({status: 400, mensaje: "el sku ingresado no existe", detalles: error.detail});break;
            case 'salidas_pkey':
                res.status(400).json({status: 400, mensaje: "el producto ya esta asociado a la factura", detalles: error.detail});break;
            case 'salidas_factura':
                res.status(400).json({status: 400, mensaje: "esta intentando hacer una salida en una factura de entrada", detalles: error.detail});break;
            default:
                if(error.code === 'P0001'){
                    res.status(400).json({status: 400, mensaje: "No hay suficientes unidades de un producto"})
                } else {
                    res.status(400).json({status: 400, mensaje: error});
                }
        }
    }
});

router.post('/salidas', async(req, res) => {
    const { productos, id } = req.body;

    if(!id) return res.status(400).json({status: 400, mensaje: "no se ingreso el id de la factura"});

    if(!Number.isInteger(id)) return res.status(400).json({status: 400, mensaje: "el dato id debe ser el numero de identificacion de la factura dentro de la base de datos"});

    if(!productos || productos.length <= 0) return res.status(400).json({status: 400, mensaje: "el dato productos esta erroneo"});

    let creados = []
    let errores = []

    for(var i = 0; i < Math.ceil(productos.length/30); i++){
        let query = "INSERT INTO salidas(sku,cantidad,factura_id) VALUES ";
        var ronda = productos.slice(i*30, ((i*30)+30));

        let coma = false;

        ronda.forEach((producto, index) =>{
            if(producto.sku && producto.cantidad){
                if(coma){
                    query += ",";
                } 
    
                query+= "('"+producto.sku+"',"+producto.cantidad+","+id+")";
                if(!coma) coma = !coma;
            } else {
                if(!producto.sku) errores.push({mensaje: "producto "+(index+1)+" falta por sku"})

                if(!producto.cantidad) errores.push({mensaje: "producto "+producto.sku+" falta por cantidad"})
            }
        });

        try {
            const {rows} = await pool.query(query+" RETURNING *");
            
            registrarVarios(rows);

            creados = creados.concat(rows);
        } catch (error) {

            switch(error.constraint){
                case 'sku_producto':
                    errores.push({mensaje: "el sku ingresado no existe", detalles: error.detail});break;
                case 'salidas_pkey':
                    errores.push({mensaje: "el producto ya esta asociado a la factura", detalles: error.detail});break;
                case 'salidas_factura':
                    errores.push({mensaje: "esta intentando hacer una salida en una factura de entrada", detalles: error.detail});break;
                default:
                    if(error.code === 'P0001'){
                        errores.push({mensaje: "No hay suficientes unidades de un producto"})
                    } else {
                        errores.push(error)
                    }
            }
        }
    }

    if(creados.length === 0) return res.status(400).json({status: 400, mensaje:"no se creo ninguna salida", error: errores});

    if(errores.length === 0) return res.status(201).json({status: 201, confirmacion: "Se crearon todas las salidas", data: creados});

    res.status(200).json({status: 200, mensaje: "se crearon algunas salidas", data: creados, error: errores});
});

router.put('/salida/:codigo', async(req, res) => {
    const {sku, cantidad} = req.body;

    if(!sku) return res.status(400).json({status: 400, mensaje: "debe ingresar un sku en el body para alterar la entrada"});

    if(!Number.isInteger(cantidad) || cantidad <= 0) return res.status(400).json({status: 400, mensaje: "el dato de cantidad es erroneo"});

    try {
        const {rows} = await pool.query("UPDATE salidas SET cantidad = $1 WHERE factura_id = $2 AND sku = $3 RETURNING *", [cantidad, req.params.codigo, sku]);

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "no se altero ningúna salida"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        if(error.constraint === 'unidades_cero') return res.status(400).json({status: 400, mensaje: "La cantidad que se intento introducir es mayor a la cantidad existente"})

        res.status(400).json({status: 400, mensaje: error})
    }
});

router.delete('/salida/:codigo', async(req, res) => {
    const {sku} = req.body;

    if(!sku) return res.status(400).json({status: 400, mensaje: "Debe ingresar un sku por medio del body para eliminar una entrada"});

    try {
        const {rowCount} = await pool.query("DELETE FROM salidas WHERE factura_id = $1 AND sku = $2", [req.params.codigo, sku]);

        if(rowCount === 0) return res.status(200).json({status: 204, mensaje: "la entrada no existia"});

        res.status(200).json({status: 200, confirmacion: "se elimino correctamente la entrada", data: "entradas elimminadas "+rowCount})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})
    }
});

export default router;