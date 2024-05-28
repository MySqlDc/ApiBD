import { Router } from "express";
import { pool } from '../conection.js';
import { registrarVarios } from '../services/data_manage.js'

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

router.get('/productosVirtuales', async(req, res) => {
    const client = await pool.connect();
    try { 
        await client.query('BEGIN');
        console.log('consulta',"SELECT sku_producto.sku, productos.unidades_virtuales AS unidades FROM sku_producto INNER JOIN productos ON sku_producto.producto_id = productos.id");
        const { rows } = await client.query("SELECT sku_producto.sku, productos.unidades_virtuales AS unidades FROM sku_producto INNER JOIN productos ON sku_producto.producto_id = productos.id");

        if(rows.length === 0){
            await client.query('COMMIT');
            return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato"})
        } 
        
        console.log('respuesta', rows);
        await client.query('COMMIT');
        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        await client.query('ROLLBACK')
        res.status(400).json({status: 400, mensaje: error})
    } finally {
        client.release();
    }
})

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

    if(nombre.split("'").length > 1){
        nombre = nombre.split("'").join("''");
    }

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
        
        if(error.constraint === "fk_marca") return res.status(400).json({status: 400, mensaje: "La marca no existes"})

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

        let coma = false;

        ronda.forEach(producto =>{
            if(coma){
                query += ",";
            } 

            if(producto.nombre && producto.nombre.split("'").length > 1){
                producto.nombre = producto.nombre.split("'").join("''");
            }

            if(!Number.isInteger(producto.unidades)){
                producto.unidades = 0;
            }

            query+= "('"+producto.nombre+"',"+(producto.unidades>0?producto.unidades:0)+","+producto.marca+")";
            if(!coma) coma = !coma;
        });

        try {
            const {rows} = await pool.query(query+" RETURNING *");

            creados = creados.concat(rows)
        } catch (error) {
            console.log(error);
            errores.push({mensaje: error});
        }
    }

    if(creados.length === 0) return res.status(400).json({status: 400, mensaje:"no se creo ningun producto", error: errores});

    if(errores.length === 0) return res.status(201).json({status: 201, confirmacion: "Se crearon todos los productos", data: creados});

    res.status(200).json({status: 200, mensaje: "se crearon algunos productos", data: creados, error: errores});
});

router.patch('/producto/:id', async(req, res) => {
    const {nombre, marca} = req.body;

    try {
        const {rows} = await pool.query("UPDATE productos SET nombre = COALESCE($1, nombre), marca = COALESCE($2, marca) WHERE id = $3 AND tipo = 'unitario' RETURNING *", [nombre, marca, req.params.id])

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
        const respuesta = await pool.query("SELECT unidades, sku FROM productos INNER JOIN sku_producto ON sku_producto.producto_id = productos.id WHERE id = $1 AND tipo = 'unitario'", [req.params.id]);

        if(respuesta.rows[0].unidades === cantidad) return res.status(200).json({status: 200, mensaje: "valores iguales no se actualizara"});

        const {rows} = await pool.query("UPDATE productos SET unidades = $1 WHERE id = $2 AND tipo = 'unitario' RETURNING *", [cantidad, req.params.id]);

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "no se actualizo ninguna fila"});

        await pool.query("INSERT INTO registro_ajuste(id, nombre_persona, cantidad_ingresada, cantidad_antigua) VALUES ($1, $2, $3, $4)", [req.params.id, usuario, cantidad, respuesta.rows[0].unidades])

        registrarVarios(respuesta.rows);

        res.status(200).json({status: 200, data: rows[0]})
    } catch (error) {

        if(error.constraint === 'fk_producto') return res.status(400).json({status: 400, mensaje: "el producto no existe"});

        res.status(400).json({status: 400, mensaje: error})
    }
});

router.put('/productos', async(req, res) => {
    const {productos, usuario} = req.body;

    if(!usuario) return res.status(400).json({status: 400, mensaje: "Debe dar el nombre de un usuario para registrar"})

    if(!productos || productos.length === 0) return res.status(400).json({status: 400, mensaje: "No se envio los datos de los productos"});
    
    let creados = []
    let errores = []

    for(const producto of productos){
        if(producto.id && producto.cantidad){
            try {
                const respuesta = await pool.query("SELECT unidades, sku FROM productos INNER JOIN sku_producto ON sku_producto.producto_id = productos.id WHERE id = $1 AND tipo = 'unitario'", [producto.id]);
        
                const {rows} = await pool.query("UPDATE productos SET unidades = $1 WHERE id = $2 AND tipo = 'unitario' RETURNING *", [producto.cantidad, producto.id]);
        
                if(rows.length === 0) errores.push({mensaje: "el producto no existe"});
        
                await pool.query("INSERT INTO registro_ajuste(id, nombre_persona, cantidad_ingresada, cantidad_antigua) VALUES ($1, $2, $3, $4)", [producto.id, usuario, producto.cantidad, respuesta.rows[0].unidades])
        
                creados.push(rows[0]);
            } catch (error) {
        
                errores.push({mensaje: error})
            }
        } else {
            errores.push({mensaje: "Falta uno de los datos"});
        }
    }

    if(creados.length === 0) return res.status(400).json({status: 400, mensaje:"no se creo ningun producto", error: errores});

    if(errores.length === 0) return res.status(201).json({status: 201, confirmacion: "Se crearon todos los productos", data: creados});

    res.status(200).json({status: 200, mensaje: "se crearon algunos productos", data: creados, error: errores});
});

router.delete('/producto/:id', async(req,res) => {
    try {
        const {rowCount} = await pool.query("DELETE FROM productos WHERE id = $1 AND tipo = 'unitario'", [req.params.id])

        if(rowCount === 0) return res.status(200).json({status: 204, mensaje: "el producto no existia"})

        res.status(200).json({status: 200, confirmacion: "Se elimino correctamente el producto", data: "productos elminados "+rowCount})
    } catch (error) {

        if(error.constraint === 'fk_producto') return res.status(400).json({status: 400, mensaje: "no se puede eliminar este producto porque tiene alguna salida o entrada registrada"})

        res.status(400).json({status: 400, mensaje: error})
    }
});

export default router;