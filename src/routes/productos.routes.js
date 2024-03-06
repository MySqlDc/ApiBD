import { Router } from "express";
import { pool } from '../../conection.js';

const router = Router()

router.get('/productos', async(req, res) => {
    try {
        const {rows} = await pool.query("SELECT * FROM productos ORDER BY id");

        if(rows.length === 0) return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato coincidente"})
        
        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})
    }
});

router.get('/producto/:id', async(req, res) => {
    try {
        const {rows} = await pool.query("SELECT * FROM productos WHERE id = $1", [req.params.id]);

        if(rows.length === 0) return res.status(200).json({status: 200, mensaje: "no se encontro el producto"})

        res.status(200).json({status: 200, data: rows[0]})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})   
    }
});

router.post('/producto', async(req, res) => {
    const { nombre, unidades, marca } = req.body;

    if(!nombre) return res.status(400).json({status: 400, mensaje: "Debe ingresar un nombre para el producto"});

    if(!marca) return res.status(400).json({status: 400, mensaje: "Debe ingresar una marca para el producto"});

    let query = "INSERT INTO productos(nombre,marca) VALUES ($1,$2,$3) RETURNING *";
    let values = [nombre, marca]

    if(unidades){
        query = "INSERT INTO productos(nombre,unidades,marca) VALUES ($1,$2,$3,$4) RETURNING *";
        values = [nombre, unidades, marca];
    }

    try {
        const {rows} = await pool.query(query, values);
        res.status(201).json({status: 201, datos: rows});
    } catch (error) {
        if(error.constraint === 'productos_nombre_key') return res.status(400).json({status: 400, mensaje: "el nombre del producto ya existe"})

        res.status(400).json({status: 400, mensaje: error});
    }
});

router.post('/productos', async(req, res) => {
    const { productos } = req.body;

    if(!productos || productos.length === 0) return res.status(400).json({status: 400, mensaje: "No se envio los datos de los productos"});
    
    let creados = []
    let errores = []

    for(var i = 0; i < Math.ceil(productos.length/30); i++){
        let query = "INSERT INTO productos(nombre,unidades,marca) VALUES ";
        var ronda = productos.slice(i*30, ((i*30)+30));

        ronda.forEach((producto, index) =>{
            if(index !== 0){
                query += ",";
            } 

            query+= "('"+producto.nombre+"',"+(producto.unidades>0?producto.unidades:0)+","+producto.marca+")";
        });

        try {
            const {rows} = await pool.query(query+" RETURNING *");

            creados = creados.concat(rows)
        } catch (error) {
            errores.push(error);
        }
    }

    if(creados.length === 0) return res.status(400).json({status: 400, mensaje:"no se creo ningun producto", error: errores});

    if(errores.length === 0) return res.status(201).json({status: 201, confirmacion: "Se crearon todos los productos", data: creados});

    res.status(200).json({status: 200, mensaje: "se vincularon algunos skus", data: creados, error: errores});
});

router.patch('/producto/:id', async(req, res) => {
    const {nombre, precio, marca} = req.body;

    try {
        const {rows} = await pool.query("UPDATE productos SET nombre = COALESCE($1, nombre), precio = COALESCE($2, precio), marca = COALESCE($3, marca) WHERE id = $4 RETURNING *", [nombre, precio, marca, req.params.id])

        if(rows.length === 0) return res.status(200).json({"status": 204, "message": "no se actualizo ningúna fila"})

        res.json({status:200, data: rows})
    } catch (error) {
        if(error.constraint === 'productos_nombre_key') return res.status(400).json({status: 400, mensaje: "el nombre del producto ya existe"});

        res.status(400).json({status: 400, mensaje: error})
    }
});

router.put('/producto/:id', async(req, res) => {
    const {cantidad, usuario} = req.body;

    if(!cantidad || !Number.isInteger(cantidad)) return res.status(400).json({status: 400, mensaje: "el dato cantidad no es correcto"});

    if(!usuario) return res.status(400).json({status: 400, mensaje: "Debe dar el nombre de un usuario para registrar"})

    try {
        const respuesta = await pool.query("SELECT unidades, sku FROM productos INNER JOIN sku_producto ON sku_producto.producto_id = productos.id WHERE id = $1", [req.params.id]);

        const {rows} = await pool.query("UPDATE productos SET unidades = $1 WHERE id = $2 RETURNING *", [cantidad, req.params.id]);

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "no se actualizo ninguna fila"});

        await pool.query("INSERT INTO registro_ajuste(id, nombre_persona, cantidad_ingresada, cantidad_antigua) VALUES ($1, $2, $3, $4)", [req.params.id, usuario, cantidad, respuesta.rows[0].unidades])

        registrarVarios(respuesta.rows);

        res.status(200).json({status: 200, data: rows[0]})
    } catch (error) {

        if(error.constraint === 'fk_producto') return res.status(400).json({status: 400, mensaje: "el producto no existe"});

        res.status(400).json({status: 400, mensaje: error})
    }
})

router.delete('/producto/:id', async(req,res) => {
    try {
        const {rowCount} = await pool.query("DELETE FROM productos WHERE id = $1", [req.params.id])

        if(rowCount === 0) return res.status(200).json({status: 204, mensaje: "el producto no existia"})

        res.status(200).json({status: 200, confirmacion: "Se elimino correctamente el producto", data: "productos elminados "+rowCount})
    } catch (error) {

        if(error.constraint === 'fk_producto') return res.status(400).json({status: 400, mensaje: "no se puede eliminar este producto porque tiene alguna salida o entrada registrada"})

        res.status(400).json({status: 400, mensaje: error})
    }
});

export default router;