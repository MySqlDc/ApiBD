import { Router, query } from 'express';
import { pool } from '../../conection.js';

const router = Router();

router.get('/facturas', async(req, res) => {
    const {rows} = await pool.query("SELECT * FROM facturas");

    if(rows.length == 0) return res.json({status: 200, message: "no se ha encontrado ningun dato coincidente"})

    res.status(200).json({status: 200, data: rows})
});

router.get('/facturasFecha', async(req, res) => {
    const { fecha, entre, antes, despues } = req.query;
    
    let query = "";
    let params = []

    if(fecha) { 
        query = "SELECT * FROM facturas WHERE fecha = ($1)";
        params.push(fecha);
    } else if(entre){
        let fechas = entre.split("/");
        query = "SELECT * FROM facturas WHERE DATE(fecha) BETWEEN ($1) AND ($2)";
        params.push(fechas[0]);
        params.push(fechas[1]);
    } else if(antes){
        query = "SELECT * FROM facturas WHERE DATE(fecha) < $1";
        params.push(antes);
    } else if(despues){
        query = "SELECT * FROM facturas WHERE DATE(fecha) > $1";
        params.push(despues)
    }
    
    try {
        const {rows} = await pool.query(query, params);

        if(rows.length == 0) return res.status(200).json({status: 204, mensaje: "no se han encontrado ningun dato coincidente"});

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status:400, mensaje: error})
    }
});

router.get('/factura/:factura_id', async(req, res) =>{
    try {
        const {rows} = await pool.query("SELECT * FROM facturas WHERE id = $1", [req.params.factura_id]);

        res.status(200).json({status: 200, data: rows[0]});
    } catch (error) {
        res.status(400).json(error);
    }
});

router.post('/factura', async(req, res) => {
    const { codigo, tipo } = req.body;

    if(!codigo) return res.status(400).json({status: 400, mensaje: "Hace falta el codigo de la factura"});

    if(!tipo) return res.status(400).json({status: 400, mensaje: "Hace falta el tipo de factura"});

    let query = "INSERT INTO facturas_entradas(codigo) VALUES ($1) RETURNING *";

    if(tipo === "salida") query = "INSERT INTO facturas_salidas(codigo) VALUES ($1) RETURNING *";

    try {
        const {rows} = await pool.query(query, [codigo])

        res.status(200).json({status: 200, confirmacion:"se ha creado la factura", data: rows[0]});
    } catch (error) {
        res.status(400).json(error);
    }
});

router.delete('/factura/:codigo', async(req, res) => {
    try {
        await pool.query("DELETE FROM factura_entradas WHERE codigo = $1", [req.params.codigo])
        await pool.query("DELETE FROM factura_salidas WHERE codigo = $1", [req.params.codigo])
        const {rowCount}  = await pool.query("DELETE FROM facturas WHERE codigo = $1", [req.params.codigo])

        if(rowCount === 0) return res.status(200).json({status: 204, mensaje: "la factura no existia"})

        res.status(200).json({status: 200, confirmacion: "se elimino correctamenta la entrada", data: "facturas elimadas "+rowCount})

    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})
    }
});

export default router;