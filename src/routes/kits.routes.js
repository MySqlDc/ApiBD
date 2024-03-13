import { Router } from 'express';
import { pool } from '../conection.js';

const router = Router();

router.get('/kits', async(req, res) => {
    const {rows} = await pool.query("SELECT * FROM kits");

    if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato coincidente"})

    res.status(200).json({status: 200, data: rows})
});

router.get('/kit', async(req, res) => {
    const {id, sku} = req.query;

    if(!id && !sku ) return res.status(400).json({status: 400, mensaje: "Para hacer la busqueda se necesita el sku o el id del kit"});

    let query = "SELECT * FROM kits WHERE id = $1";
    let params = [id]

    if(!id && sku){
        query = "SELECT * FROM kits INNER JOIN kit_sku ON kits.id = kit_sku.kit_id WHERE sku = $1"
        params = [sku]
    };

    try {
        const {rows} = await pool.query(query, params);

        if(rows.length == 0) return res.status(200).json({status: 204, mensaje: "no se han encontrado ningun kit"});

        res.status(200).json({status: 200, data: rows[0]});
    } catch (error) {
        res.status(400).json({status:400, mensaje: error});
    }
});

router.post('/kit', async(req, res) => {
    const {kit, marca} = req.body;

    if(!kit || !marca) return res.status(400).json({status: 400, mensaje: "Debe agregarse los datos del kit nombre o marca"});

    try {
        const {rows} = await pool.query("INSERT INTO kits(nombre, marca) VALUES ($1,$2) RETURNING * ", [kit, marca]);

        if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ingreso ningun kit"});

        res.status(200).json({status: 200, data: rows[0]});
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});

router.post('/kits', async(req, res) => {
    const {kits} = req.body;

    if(!kits || kits.length < 1) return res.status(400).json({status: 400, mensaje: "Debe agregar los kits"});

    let creados = []
    let errores = []

    for(let i = 0; i < Math.ceil(kits.length/30); i++){
        let query = "INSERT INTO kits(nombre, marca) VALUES "
        var ronda = kits.slice(i*30, ((i*30)+30));

        ronda.forEach((kit, index) => {
            if(kit.nombre && kit.marca){
                if(index !== 0){
                    query += ",";
                }
                query += "('"+kit.nombre+"',"+kit.marca+")";
            } else {
                if(!kit.nombre) errores.push({mensaje: "kit "+(index+1)+"falta por sku"});

                if(!kit.marca) errores.push({mensaje: "producto "+producto.nombre+" falta por marca"});
            }
        });

        try {
            const {rows} = await pool.query(query+" RETURNING *");

            creados = creados.concat(rows);
        } catch (error) {
            errores.push({mensaje: error})
        }
    }

    if(creados.length === 0) return res.status(400).json({status: 400, mensaje:"no se creo ningun kit", error: errores});

    if(errores.length === 0) return res.status(201).json({status: 201, confirmacion: "Se crearon todos los kits", data: creados});

    res.status(200).json({status: 200, mensaje: "se crearon algunos kits", data: creados, error: errores});
});

router.put('/kit/:kit_id', async(req, res) => {
    const { nombre } = req.body;

    if(!nombre) return res.status(400).json({status: 400, mensaje: "No se agrego el nuevo nombre"});

    try {
        const {rows} = await pool.query("UPDATE kits SET nombre = $1 WHERE id = $2 RETURNING *", [nombre, req.params.kit_id])

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "no se altero ningun kit"});

        res.status(200).json({status: 200, data: rows});
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});

router.delete('/kit/:kit_id', async(req, res) => {
    try {
        const {rowCount} = await pool.query("DELETE FROM kits WHERE id = $1", [req.params.kit_id]);

        if(rowCount === 0) return res.status(200).json({status: 204, mensaje: "el kit no exitia"});

        res.status(200).json({status: 200, confirmacion: "se elimino correctamente el kit", data: "kits eliminados "+rowCount});
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});

export default router;