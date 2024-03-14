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

    if(id && isNaN(parseInt(id))) return res.status(400).json({status: 400, mensaje: "error el identificador del kit no es valido"});

    let query = "SELECT * FROM kits WHERE id = $1";
    let params = [id]

    if(!id && sku){
        query = "SELECT kits.* FROM kits INNER JOIN kit_sku ON kits.id = kit_sku.kit_id WHERE sku = $1"
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
    const {nombre, marca} = req.body;

    if(!nombre || !marca) return res.status(400).json({status: 400, mensaje: "Debe agregarse el nombre del kit nombre o marca"});

    if(!Number.isInteger(marca)) return res.status(400).json({status: 400, mensaje: "Debe hacer envio del id de la marca"});

    try {
        const {rows} = await pool.query("INSERT INTO kits(nombre, marca) VALUES ($1,$2) RETURNING * ", [nombre, marca]);

        if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ingreso ningun kit"});

        res.status(200).json({status: 200, data: rows[0]});
    } catch (error) {
        if(error.constraint === "fk_marca") return res.status(400).json({status: 400, mensaje: "La marca no existes"})

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

        let coma = false;

        ronda.forEach((kit, index) => {
            if(kit.nombre && kit.marca && Number.isInteger(kit.marca)){
                if(coma){
                    query += ",";
                }

                query += "('"+kit.nombre+"',"+kit.marca+")";
                if(!coma) coma = !coma;
            } else {
                if(!kit.nombre) errores.push({mensaje: "kit "+(index+1)+" falta por sku"});

                if(!kit.marca) errores.push({mensaje: "el kit "+kit.nombre+" falta por marca"});

                if(!Number.isInteger(kit.marca)) errores.push({mensaje: "la marca del kit "+kit.nombre+", no es valida"})
            }
        });

        try {
            const {rows} = await pool.query(query+" RETURNING *");

            creados = creados.concat(rows);
        } catch (error) {
            switch(error.constraint){
                case "kits_nombre_key":
                    errores.push({mensaje: "el nombre del kit ya existe", detalles: error.detail}); break;
                case "fk_marca":
                    errores.push({mensaje: "la marca introducida no existe", detalles: error.detail});break;
                default: 
                    errores.push({mensaje: error});break;
            }
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