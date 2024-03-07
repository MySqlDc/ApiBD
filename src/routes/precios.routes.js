import { Router } from 'express';
import { pool } from '../../conection.js';

const router = Router();

router.get('/precios', async(req, res) => {
    try {
        const {rows} = await pool.query("SELECT * FROM vista_productos_master");
        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "No se encontro ningun producto"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});  
    }
});

router.get('/precio', async(req, res) => {
    const { id, sku } = req.params;

    let query = "SELECT * FROM vista_productos_master WHERE id = $1"
    let params = [id];

    if(sku){
        query = "SELECT * FROM vista_productos_master INNER JOIN sku_producto ON sku_producto.producto_id = vista_prodcutos_master.id WHERE sku = $1";
        params = [sku];
    }

    try {
        const {rows} = await pool.query(query, params);

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "No se encontro el producto"});

        res.status(200).json({status: 200, data: rows[0]})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});  
    }
});

router.post('/precio/:id', async(req, res) => {
    const {costo, precio, precio_ml, precio_shopify, precio_rappi, precio_mayorista} = req.body;

    let params = [req.params.id, costo, precio, precio_ml, precio_shopify, precio_rappi, precio_mayorista];
    let query = "INSERT INTO precios(id, costo, precio_venta, precio_mc, precio_shopify, precio_rappi, precio_mayorista) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *"

    try {
        const {rows} = await pool.query(query, params)

        if(rows.length === 0) return res.status(200).json({"status": 204, "message": "no se actualizo ningúna fila"})

        res.json({status:200, data: rows})
    } catch (error) {

        res.status(400).json({status: 400, mensaje: error})
    }
});

router.post('/precios', async (req, res) => {
    const { productos } = req.body;
    if(!productos || productos.length === 0) return res.status(400).json({status: 400, mensaje: "No se envio los datos de los productos"});
    
    let creados = []
    let errores = []

    for(var i = 0; i < Math.ceil(productos.length/30); i++){
        let query = "INSERT INTO precios(id,costo,precio_venta,precio_mc,precio_shopify,precio_rappi,precio_mayoritsta) VALUES ";
        var ronda = productos.slice(i*30, ((i*30)+30));

        ronda.forEach((producto, index) =>{
            if(index !== 0){
                query += ",";
            } 

            query+= "('"+producto.id+"',"+producto.costo+","+producto.precio_venta+","+producto.precio_ml+","+producto.precio_shopify+","+producto.precio_rappi+","+producto.precio_mayorista+")";
        });

        try {
            const {rows} = await pool.query(query+" RETURNING *");

            creados = creados.concat(rows)
        } catch (error) {
            errores.push(error);
        }
    }

    if(creados.length === 0) return res.status(400).json({status: 400, mensaje:"no se creo ningun precio", error: errores});

    if(errores.length === 0) return res.status(201).json({status: 201, confirmacion: "Se crearon todos los precios", data: creados});

    res.status(200).json({status: 200, mensaje: "se crearon algunos precios", data: creados, error: errores});
});

router.patch('/precio/:id', async(req,res) => {
    const {costo, precio, precio_ml, precio_shopify, precio_rappi, precio_mayorista} = req.body;

    let params = [req.params.id, costo, precio, precio_ml, precio_shopify, precio_rappi, precio_mayorista];
    let query = "UPDATE precios SET costo = COALESCE($2,costo), precio_venta = COALESCE($3,precio_venta), precio_shopify = COALESCE($4,precio_shopify), precio_mc COALESCE($5,precio_mc), precio_rappi COALESCE($6,precio_rappi), precio_mayorista COALESCE($7,precio_mayorista) WHERE id = $1 RETURNING *";

    try {
        const {rows} = await pool.query(query, params)

        if(rows.length === 0) return res.status(200).json({"status": 204, "message": "no se actualizo ningúna fila"})

        res.json({status:200, data: rows})
    } catch (error) {

        res.status(400).json({status: 400, mensaje: error})
    }
});

export default router;