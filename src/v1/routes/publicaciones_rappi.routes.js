import { Router } from 'express';
import { pool } from '../conection.js';
import { actualizacion, actualizacionDelta } from '../services/api_rappi.js';
import { getdatos, actualizarDatos} from '../services/api_elian.js'

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
    let {id, publicacion_id, producto_id, nombre } = req.body;

    if(nombre.split("'").length > 1){
        nombre = nombre.split("'").join("'");
    }
    try {
        const {rows} = await pool.query("INSERT INTO publicaciones_rappi(id,publicacion_id,producto_id,nombre) VALUES ($1,$2,$3,$4) RETURNING *", [id, publicacion_id, producto_id, nombre]);
        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "No se encontro ningun publicaciones"})

        res.status(200).json({status: 200, data: rows});
    } catch (error) {
        if(error.detail === "")
        res.status(400).json({status: 400, mensaje: error});  
    }
});

router.post('/publicaciones_rappi', async(req,res) => {
    const {publicaciones} = req.body;
    
    if(!publicaciones || publicaciones.length === 0) return res.status(400).json({status: 400, mensaje: "No se envio los datos de los publicaciones"});
    
    let creados = [];
    let errores = [];

    for(var i = 0; i < Math.ceil(publicaciones.length/30); i++){
        let query = "INSERT INTO publicaciones_rappi (id,publicacion_id,producto_id,nombre) VALUES ";
        var ronda = publicaciones.slice(i*30, ((i*30)+30));

        let coma = false;

        ronda.forEach((publicacion, index) =>{
            if(coma){
                query += ",";
            }
             
            if(publicacion.nombre.split("'").length > 1){
                publicacion.nombre = publicacion.nombre.split("'").join("''");
            }

            query+= "("+publicacion.id+",'"+publicacion.publicacion_id+"','"+publicacion.producto_id+"','"+publicacion.nombre+"')";
            if(!coma) coma = !coma;
        });

        try {
            console.log("query", query)
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

router.get('/Rappifull', async(req, res) => {
    const datos = await getdatos();
    await actualizarDatos(datos);
    const response = await actualizacion();

    if(response) {
        res.status(200).json({mensaje: "respuesta", data: response});
    } else {
        res.status(200).json({mensaje: "No habia productos para actualizar"});
    }
})

router.post('/RappiDelta', async(req, res) =>{
    const { ids } = req.body;
    const actualizacion = await actualizacionDelta(ids);

    if(actualizacion.respuesta) {
        res.status(200).json({mensaje: actualizacion.respuesta, data: actualizacion.data});
    } else {
        res.status(200).json({mensaje: "No habia productos para actualizar"});
    }
});

export default router;