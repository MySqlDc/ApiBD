import { Router } from 'express';
import { pool } from '../conection.js';
import { validarFecha } from '../validation.js';

const router = Router();

router.get('/facturas', async(req, res) => {
    const {rows} = await pool.query("SELECT * FROM facturas");

    if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato coincidente"})

    res.status(200).json({status: 200, data: rows})
});

router.get('/facturaSalidas', async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM facturas_salidas");

    if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato coincidente"})

    res.status(200).json({status: 200, data: rows});
});

router.get('/facturaEntradas', async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM facturas_entradas");

    if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato coincidente"})

    res.status(200).json({status: 200, data: rows});
});

router.get('/facturasFecha', async(req, res) => {
    const { fecha, entre, antes, despues } = req.query;
    
    let query = "";
    let params = []

    if(fecha) { 
        if(!validarFecha(fecha)) return res.status(400).json({status: 400, mensaje: "la fecha esta en un formato erroneo"});
        query = "SELECT * FROM facturas WHERE fecha = ($1)";
        params.push(fecha);
    } else if(entre){
        let fechas = entre.split("/");
        query = "SELECT * FROM facturas WHERE DATE(fecha) BETWEEN ($1) AND ($2)";
        if(!validarFecha(fechas[0])) return res.status(400).json({status: 400, mensaje: "la fecha 1 esta en un formato erroneo"});
        params.push(fechas[0]);
        if(!validarFecha(fechas[1])) return res.status(400).json({status: 400, mensaje: "la fecha 2 esta en un formato erroneo"});
        params.push(fechas[1]);
    } else if(antes){
        if(!validarFecha(antes)) return res.status(400).json({status: 400, mensaje: "la fecha esta en un formato erroneo"});
        query = "SELECT * FROM facturas WHERE DATE(fecha) < $1";
        params.push(antes);
    } else if(despues){
        if(!validarFecha(despues)) return res.status(400).json({status: 400, mensaje: "la fecha esta en un formato erroneo"});
        query = "SELECT * FROM facturas WHERE DATE(fecha) > $1";
        params.push(despues)
    } else {
        return res.status(400).json({status: 400, mensaje: "Debe ingresar un dato query con fecha para ejecutar la busqueda"})
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

router.post('/facturaFecha', async(req, res) => {
    const { codigo, tipo, fecha } = req.body;

    if(!validarFecha(fecha)) return res.status(400).json({status: 400, mensaje: "la fecha esta en un formato erroneo"});

    if(!codigo) return res.status(400).json({status: 400, mensaje: "Hace falta el codigo de la factura"});

    if(!tipo) return res.status(400).json({status: 400, mensaje: "Hace falta el tipo de factura"});

    let query = "INSERT INTO facturas_entradas(codigo, fecha) VALUES ($1, $2) RETURNING *";

    if(tipo === "salida") query = "INSERT INTO facturas_salidas(codigo, fecha) VALUES ($1, $2) RETURNING *";

    try {
        const {rows} = await pool.query(query, [codigo, fecha])

        res.status(200).json({status: 200, confirmacion:"se ha creado la factura", data: rows[0]});
    } catch (error) {
        res.status(400).json(error);
    }
});

router.put('/picking', async(req,res) => {
    const { id, codigo, usuario } = req.body;

    if(!usuario) return res.json(400).json({status: 400, mensaje: "Se debe enviar el usuario del cliente"})

    let query = "UPDATE facturas_salidas SET status = 2, picking = CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima', usuario_picking = $1 WHERE id = $2 RETURNING *";
    let params = [usuario, id]

    if(codigo) {
        query = "UPDATE facturas_salidas SET status = 2, picking = CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima', usuario_picking = $1 WHERE codigo = $2 RETURNING *";
        params = [usuario, codigo]
    }

    try {
        const {rows} = await pool.query(query, params);

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "no se pudo colocar la hora de picking no coincide con ningun DATO"})

        res.status(200).json({status: 200, confirmacion: "se ha colocado la hora de picking", data: rows[0]})
    } catch (error) {
        res.status(400).json(error);
    }
});

router.put('/packing', async(req,res) => {
    const { id, codigo, usuario } = req.body;

    if(!usuario) return res.json(400).json({status: 400, mensaje: "Se debe enviar el usuario del cliente"});

    let query = "UPDATE facturas_salidas SET status = 3, packing = CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima', usuario_packing = $1 WHERE id = $2 RETURNING *";
    let params = [usuario, id]

    if(codigo) {
        query = "UPDATE facturas_salidas SET status = 3, packing = CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima', usuario_packing = $1 WHERE codigo = $2 RETURNING *";
        params = [usuario, codigo]
    }

    try {
        const {rows} = await pool.query(query, params);

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "no se pudo colocar la hora de packing no coincide con ningun DATO"})

        res.status(200).json({status: 200, confirmacion: "se ha colocado la hora de packing", data: rows[0]})
    } catch (error) {
        res.status(400).json(error);
    }
});

router.put('/status', async(req, res) => {
    const {id, codigo, status } = req.body;

    if(!status || !Number.isInteger(status)) return res.json(400).json({status: 400, mensaje: "Se debe enviar el status que adquirira la factura"})

    if(status <= 3) return res.json(400).json({status: 400, mensaje: "Este estatus esta reservado y no se puede colocar"})

    let query = "UPDATE facturas SET status = $1 WHERE id = $2 RETURNING *";
    let params = [status, id]

    if(codigo) {
        query = "UPDATE facturas SET status = $1 WHERE codigo = $2 RETURNING *";
        params = [status, codigo]
    }

    try {
        const {rows} = await pool.query(query, params);

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "no se pudo colocar el status no coincide con ningun DATO"})

        res.status(200).json({status: 200, confirmacion: "se ha colocado el status", data: rows[0]})
    } catch (error) {
        res.status(400).json(error);
    }
});

router.put('/plataforma', async(req, res) => {
    const {id, codigo, plataforma } = req.body;

    if(!plataforma || !Number.isInteger(plataforma)) return res.json(400).json({status: 400, mensaje: "Se debe enviar el status que adquirira la factura"})
    
    let query = "UPDATE facturas_salidas SET plataforma = $1 WHERE id = $2 RETURNING *";
    let params = [plataforma, id]

    if(codigo) {
        query = "UPDATE facturas_salidas SET plataforma = $1 WHERE codigo = $2 RETURNING *";
        params = [plataforma, codigo]
    }

    try {
        const {rows} = await pool.query(query, params);

        if(rows.length === 0) return res.status(200).json({status: 204, mensaje: "no se pudo colocar el status no coincide con ningun DATO"})

        res.status(200).json({status: 200, confirmacion: "se ha colocado el status", data: rows[0]})
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