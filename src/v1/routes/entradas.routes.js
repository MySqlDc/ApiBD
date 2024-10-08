import { Router } from 'express';
import { pool } from '../conection.js';
import { registrarVarios } from '../services/data_manage.js'
import { validarFecha } from '../validation.js';

const router = Router();

router.get('/entradas', async(req, res) => {
    const { fecha, sku } = req.query;

    if(fecha && !validarFecha(fecha)) return res.status(400).json({status: 400, mensaje: "debe ingresar una fecha correcta"})

    let query = "SELECT * FROM vista_entradas"
    let params = []

    if(fecha){
        query = "SELECT * FROM vista_entradas WHERE DATE(fecha) = $1";
        params.push(fecha);
    }

    if(sku){
        query = "SELECT * FROM vista_entradas WHERE sku = $1";
        params.push(sku);
    }

    if(sku && fecha){
        query = "SELECT * FROM vista_entradas WHERE DATE(fecha) = $1 AND sku = $2";
    }

    try {
        const {rows} = await pool.query(query, params);
        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "Ninguna entrada se encontro"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});  
    }
});

router.get('/entrada/:codigo', async(req,res) => {
    try {
        const {rows} = await pool.query("SELECT * FROM vista_entradas WHERE codigo = $1", [req.params.codigo])

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "Ninguna entrada se encontro"})

        res.json({status: 200, data: rows});
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})
    }
});

router.post('/entrada', async(req, res) => {
    const {sku, cantidad, factura } = req.body;

    if(!sku) return res.status(400).json({status: 400, mensaje: "debe ingresar un sku en el body para crear la entrada"});

    if(!Number.isInteger(factura)) return res.status(400).json({status: 400, mensaje: "el dato de factura es erroneo"});

    if(!Number.isInteger(cantidad) || cantidad <= 0) return res.status(400).json({status: 400, mensaje: "el dato de cantidad es erroneo"});

    try {
        const {rows} = await pool.query("INSERT INTO entradas(sku,cantidad,factura_id) VALUES ($1,$2,$3) RETURNING *", [sku, cantidad, factura])
        
        registrarVarios(rows);

        res.status(201).json({status: 201, confirmacion:"se creo el producto", data: rows[0]})
    } catch(error){

        switch(error.constraint){
            case 'sku_producto':
                res.status(400).json({status: 400, mensaje: "el sku ingresado no existe", detalles: error.detail});break;
            case 'entradas_pkey':
                res.status(400).json({status: 400, mensaje: "el producto ya esta asociado a la factura", detalles: error.detail});break;
            case 'entradas_factura':
                res.status(400).json({status: 400, mensaje: "esta intentando hacer una entrada en una factura de salidas", detalles: error.detail});break;
            default:
                if(error.code === 'P0001'){
                    res.status(400).json({status: 400, mensaje: "estas intentando agregar una entrada a una factura que ya fue ingresada"})
                } else {
                    res.status(400).json({status: 400, mensaje: error});
                }
        }
    }
});

router.post('/entradas', async(req, res) => {
    const { productos, id } = req.body;

    if(!id) return res.status(400).json({status: 400, mensaje: "no se ingreso el id de la factura"});

    if(!Number.isInteger(id)) return res.status(400).json({status: 400, mensaje: "el dato id debe ser el numero de identificacion de la factura dentro de la base de datos"})

    if(!productos || productos.length <= 0) return res.status(400).json({status: 400, mensaje: "el dato productos esta erroneo"});

    let creados = []
    let errores = []

    for(var i = 0; i < Math.ceil(productos.length/30); i++){
        let query = "INSERT INTO entradas(sku,cantidad,factura_id) VALUES ";
        var ronda = productos.slice(i*30, ((i*30)+30));

        let coma = false;

        ronda.forEach((producto, index) => {
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

            creados = creados.concat(rows)
        } catch (error) {
            switch(error.constraint){
                case 'sku_producto':
                    errores.push({mensaje: "el sku ingresado no existe", detalles: error.detail});break;
                case 'entradas_pkey':
                    errores.push({mensaje: "el producto ya esta asociado a la factura", detalles: error.detail});break;
                case 'entradas_factura':
                    errores.push({mensaje: "esta intentando hacer una entrada en una factura de salidas", detalles: error.detail});break;
                default:
                    if(error.code === 'P0001'){
                        errores.push({mensaje: "estas intentando agregar una entrada a una factura que ya fue ingresada"})
                    } else {
                        errores.push({mensaje: error});
                    }
            }
        }
    }

    if(creados.length === 0) return res.status(400).json({status: 400, mensaje:"no se creo ninguna entrada", error: errores});

    if(errores.length === 0) return res.status(201).json({status: 201, confirmacion: "Se crearon todas las entradas", data: creados});

    res.status(200).json({status: 200, mensaje: "se crearon algunas entradas", data: creados, error: errores});
})

router.put('/entrada/:codigo', async(req, res) => {
    const {sku, cantidad} = req.body;

    if(!sku) return res.status(400).json({status: 400, mensaje: "debe ingresar un sku en el body para alterar la entrada"});

    if(!Number.isInteger(cantidad) || cantidad <= 0) return res.status(400).json({status: 400, mensaje: "el dato de cantidad es erroneo"});

    try {
        const {rows} = await pool.query("UPDATE entradas SET cantidad = $1 WHERE factura_id = $2 AND sku = $3 RETURNING *", [cantidad, req.params.codigo, sku]);

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "no se altero ningún producto"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})
    }
})

router.delete('/entrada/:codigo', async(req, res) => {
    const {sku} = req.body;

    if(!sku) return res.status(400).json({status: 400, mensaje: "Debe ingresar un sku por medio del body para eliminar una entrada"});

    try {
        const {rowCount} = await pool.query("DELETE FROM entradas WHERE factura_id = $1 AND sku = $2", [req.params.codigo, sku]);

        if(rowCount === 0) return res.status(200).json({status: 204, mensaje: "la entrada no existia"});

        res.status(200).json({status: 200, confirmacion: "se elimino correctamente la entrada", data: "entradas elimminadas "+rowCount})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})
    }
})


export default router;