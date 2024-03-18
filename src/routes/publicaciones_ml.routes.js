import { Router } from 'express';
import { pool } from '../conection.js';

const router = Router();

router.get('/publicaciones_ml', async(req, res) =>{
    try {
        const {rows} = await pool.query("SELECT publicaciones_ml.*, productos.nombre FROM publicaciones_ml INNER JOIN productos ON publicaciones_ml.id = productos.id");
        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "No se encontro ningun publicaciones"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});  
    }
});

router.get('/publicaciones_ml/:id', async(req, res) =>{
    try {
        const {rows} = await pool.query("SELECT publicaciones_ml.*, productos.nombre FROM publicaciones_ml INNER JOIN productos ON publicaciones_ml.id = productos.id WHERE id = $1", [req.params.id]);
        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "No se encontro ningun publicaciones"})

        res.status(200).json({status: 200, data: rows});
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});  
    }
});

router.post('/publicacion_ml', async(req,res) =>{
    const {id, mco, variante} = req.body;
    try {
        const {rows} = await pool.query("INSERT INTO publicaciones_ml (id, mco, variante) VALUES ($1,$2,$3)", [id, mco, variante]);
        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "No se encontro ningun publicaciones"})

        res.status(200).json({status: 200, data: rows});
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});  
    }
});

router.post('/publicaciones_ml', async(req,res) =>{
    const {publicaciones} = req.body;
    
    if(!publicaciones || publicaciones.length === 0) return res.status(400).json({status: 400, mensaje: "No se envio los datos de los publicaciones"});
    
    let creados = [];
    let errores = [];

    for(var i = 0; i < Math.ceil(publicaciones.length/30); i++){
        let query = "INSERT INTO publicaciones_ml (id,mco,variante) VALUES ";
        var ronda = publicaciones.slice(i*30, ((i*30)+30));

        let coma = false;

        ronda.forEach(publicaciones =>{
            if(coma){
                query += ",";
            } 

            query+= "('"+publicaciones.id+"',"+publicaciones.mco+","+publicaciones.variante+")";
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

router.put('/publicacion_ml/:id', async(req, res) =>{
    const {mco, variante, mco_anterior} = req.body;

    let query = "";
    let params = [req.params.id, mco_anterior];


    if(mco && variante){
        query = "UPDATE productos SET mco = $3, variante = $4 WHERE id = $1 AND mco = $2"
    } else if(mco){
        query = "UPDATE productos SET mco = $3 WHERE id = $1 AND mco = $2";
        params.push(mco);
    } else if(variante){
        query = "UPDATE productos SET variante = $3 WHERE id = $1 AND mco = $2";
        params.push(variante);
    }

    try {
        const {rows} = await pool.query(query+" RETURNING *", params);

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "no se actualizo ninguna fila"});

        res.status(200).json({status: 200, confirmacion: "Se actualizo la publicacion", data: rows[0]})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})
    }
});

export default router;