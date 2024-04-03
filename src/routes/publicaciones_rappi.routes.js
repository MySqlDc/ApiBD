import { Router } from 'express';
import { pool } from '../conection.js';

const router = Router();

router.get('/publicaciones_rappi', async(req, res) => {
    try {
        const {rows} = await pool.query("SELECT * FROM publicaciones_rappi");
        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "No se encontro ningun publicaciones"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});  
    }
});

router.get('/publicacion_rappi/:id', async (req, res) =>{
    try {
        const {rows} = await pool.query("SELECT * FROM publicaciones_rappi WHERE id = $1", [req.params.id]);
        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "No se encontro ningun publicaciones"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});  
    }
})

router.post('/publicacion_rappi', async(req, res) => {
    let {id, producto_id, nombre } = req.body;

    if(nombre.split("'").length > 1){
        nombre = nombre.split("'").join("''");
    }
    try {
        const {rows} = await pool.query("INSERT INTO publicaciones_rappi(id,producto_id,nombre) VALUES ($1,$2,$3) RETURNING *", [id, producto_id, nombre]);
        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "No se encontro ningun publicaciones"})

        res.status(200).json({status: 200, data: rows});
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});  
    }
});

router.post('/publicaciones_rappi', async(req,res) => {
    const {publicaciones} = req.body;
    
    if(!publicaciones || publicaciones.length === 0) return res.status(400).json({status: 400, mensaje: "No se envio los datos de los publicaciones"});
    
    let creados = [];
    let errores = [];

    for(var i = 0; i < Math.ceil(publicaciones.length/30); i++){
        let query = "INSERT INTO publicaciones_rappi (id,producto_id,nombre) VALUES ";
        var ronda = publicaciones.slice(i*30, ((i*30)+30));

        let coma = false;

        ronda.forEach((publicaciones, index) =>{
            if(coma){
                query += ",";
            }
             
            if(producto.nombre.split("'").length > 1){
                producto.nombre = producto.nombre.split("'").join("''");
            }

            query+= "('"+publicaciones.id+"',"+publicaciones.producto_id+","+publicaciones.nombre+")";
            if(!coma) coma = !coma;
        });

        try {
            const {rows} = await pool.query(query+" RETURNING *");

            creados = creados.concat(rows)
        } catch (error) {
            errores.push({mensaje: error});
        }
    }

    if(creados.length === 0) return res.status(400).json({status: 400, mensaje:"no se creo ninguna publicacion", error: errores});

    if(errores.length === 0) return res.status(201).json({status: 201, confirmacion: "Se crearon todos las publicaciones", data: creados});

    res.status(200).json({status: 200, mensaje: "se crearon algunas publicaciones", data: creados, error: errores});
});

export default router;