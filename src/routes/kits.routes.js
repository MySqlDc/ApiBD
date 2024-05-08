import { Router } from 'express';
import { pool } from '../conection.js';

const router = Router();

router.get('/kits', async(req, res) => {
    const {rows} = await pool.query("SELECT * FROM productos WHERE tipo = 'kit'");

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
        query = "SELECT productos.* FROM productos INNER JOIN sku_producto ON productos.id = sku_producto.producto_id WHERE sku = $1"
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

router.post('/kits', async(req, res) => {
    const { nombre, marca } = req.body;

    if(!nombre) return res.status(400).json({status: 400, mensaje: "Debe ingresar un nombre para el kit"});

    if(!marca) return res.status(400).json({status: 400, mensaje: "Debe ingresar una marca para el kit"});

    if(nombre.split("'").length > 1){
        nombre = nombre.split("'").join("''");
    }

    let query = "INSERT INTO productos(nombre,marca,tipo) VALUES ($1,$2,$3) RETURNING *";
    let values = [nombre, marca, "kit"]

    try {
        const {rows} = await pool.query(query, values);
        res.status(201).json({status: 201, datos: rows});
    } catch (error) {
        if(error.constraint === 'productos_nombre_key') return res.status(400).json({status: 400, mensaje: "el nombre del producto ya existe"})

        if(error.constraint === "fk_marca") return res.status(400).json({status: 400, mensaje: "La marca no existes"})

        res.status(400).json({status: 400, mensaje: error});
    }
});

router.post('/kitsMasivo', async(req, res) => {
    const {kits} = req.body;

    if(!kits || kits.length < 1) return res.status(400).json({status: 400, mensaje: "Debe agregar los kits"});

    let creados = []
    let errores = []

    for(let i = 0; i < Math.ceil(kits.length/30); i++){
        let query = "INSERT INTO productos(nombre, marca, tipo) VALUES "
        var ronda = kits.slice(i*30, ((i*30)+30));

        let coma = false;

        ronda.forEach((kit, index) => {
            if(kit.nombre && kit.marca && Number.isInteger(kit.marca)){
                if(coma){
                    query += ",";
                }

                query += "('"+kit.nombre+"',"+kit.marca+",'kit')";
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
        const {rows} = await pool.query("UPDATE productos SET nombre = $1 WHERE id = $2 AND tipo = 'kit' RETURNING *", [nombre, req.params.kit_id])

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "no se altero ningun kit"});

        res.status(200).json({status: 200, data: rows});
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});

router.delete('/kit/:kit_id', async(req, res) => {
    try {
        const {rowCount} = await pool.query("DELETE FROM productos WHERE id = $1 AND tipo = 'kit'", [req.params.kit_id]);

        if(rowCount === 0) return res.status(200).json({status: 204, mensaje: "el kit no exitia"});

        res.status(200).json({status: 200, confirmacion: "se elimino correctamente el kit", data: "kits eliminados "+rowCount});
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});

export default router;