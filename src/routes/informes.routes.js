import { Router } from 'express';
import { pool } from '../conection.js';
import { validarFecha } from '../validation.js';

const router = Router();

router.get('/ventas', async (req, res) => {
    const { fechas, fecha } = req.query;

    let query = "SELECT productos.nombre, COUNT(*) AS cantidad FROM salidas JOIN sku_producto ON salidas.sku = sku_producto.sku JOIN productos ON sku_producto.producto_id = productos.id JOIN facturas ON salidas.factura_id = facturas.id "

    if(fechas){
        let rango = fechas.split("/");
        query += "WHERE facturas.fecha BETWEEN ";
        if(!validarFecha(rango[0])) return res.status(400).json({status: 400, mensaje: "la fecha 1 esta en un formato erroneo"});
        query += "'"+rango[0]+"'";
        if(!validarFecha(rango[1])) return res.status(400).json({status: 400, mensaje: "la fecha 2 esta en un formato erroneo"});
        query += " AND '"+rango[1]+"'";
    } else if(fecha) {
        if(!validarFecha(fecha)) return res.status(400).json({status: 400, mensaje: "la fecha esta en un formato erroneo"});
        query += "WHERE facturas.fecha = '"+fecha+"' ";
    }

    query += "GROUP BY productos.nombre ORDER BY cantidad DESC"
    try {
        const {rows} = await pool.query(query);

        if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato coincidente"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});

router.get('/ventasMarcas', async (req, res) => {
    const { fechas, fecha } = req.query;

    let query = "SELECT marcas.nombre, COUNT(*) AS cantidad FROM salidas JOIN sku_producto ON salidas.sku = sku_producto.sku JOIN productos ON sku_producto.producto_id = productos.id JOIN facturas ON salidas.factura_id = facturas.id JOIN marcas ON marcas.id = productos.marca "

    if(fechas){
        let rango = fechas.split("/");
        query += "WHERE facturas.fecha BETWEEN ";
        if(!validarFecha(rango[0])) return res.status(400).json({status: 400, mensaje: "la fecha 1 esta en un formato erroneo"});
        query += "'"+rango[0]+"'";
        if(!validarFecha(rango[1])) return res.status(400).json({status: 400, mensaje: "la fecha 2 esta en un formato erroneo"});
        query += " AND '"+rango[1]+"'";
    } else if(fecha) {
        if(!validarFecha(fecha)) return res.status(400).json({status: 400, mensaje: "la fecha esta en un formato erroneo"});
        query += "WHERE facturas.fecha = '"+fecha+"' ";
    }

    query += "GROUP BY marcas.nombre ORDER BY cantidad DESC"
    try {
        const {rows} = await pool.query(query);

        if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato coincidente"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});

router.get('/compras', async (req, res) => {
    const { fechas, fecha } = req.query;

    let query = "SELECT productos.nombre, COUNT(*) AS cantidad FROM entradas JOIN sku_producto ON entradas.sku = sku_producto.sku JOIN productos ON sku_producto.producto_id = productos.id JOIN facturas ON entradas.factura_id = facturas.id "

    if(fechas){
        let rango = fechas.split("/");
        query += "WHERE facturas.fecha BETWEEN ";
        if(!validarFecha(rango[0])) return res.status(400).json({status: 400, mensaje: "la fecha 1 esta en un formato erroneo"});
        query += "'"+rango[0]+"'";
        if(!validarFecha(rango[1])) return res.status(400).json({status: 400, mensaje: "la fecha 2 esta en un formato erroneo"});
        query += " AND '"+rango[1]+"'";
    } else if(fecha) {
        if(!validarFecha(fecha)) return res.status(400).json({status: 400, mensaje: "la fecha esta en un formato erroneo"});
        query += "WHERE facturas.fecha = '"+fecha+"' ";
    }

    query += "GROUP BY productos.nombre ORDER BY cantidad DESC"
    try {
        const {rows} = await pool.query(query);

        if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato coincidente"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});

router.get('/comprasMarcas', async (req, res) => {
    const { fechas, fecha } = req.query;

    let query = "SELECT marcas.nombre, COUNT(*) AS cantidad FROM entradas JOIN sku_producto ON entradas.sku = sku_producto.sku JOIN productos ON sku_producto.producto_id = productos.id JOIN facturas ON entradas.factura_id = facturas.id JOIN marcas ON marcas.id = productos.marca "

    if(fechas){
        let rango = fechas.split("/");
        query += "WHERE facturas.fecha BETWEEN ";
        if(!validarFecha(rango[0])) return res.status(400).json({status: 400, mensaje: "la fecha 1 esta en un formato erroneo"});
        query += "'"+rango[0]+"'";
        if(!validarFecha(rango[1])) return res.status(400).json({status: 400, mensaje: "la fecha 2 esta en un formato erroneo"});
        query += " AND '"+rango[1]+"'";
    } else if(fecha) {
        if(!validarFecha(fecha)) return res.status(400).json({status: 400, mensaje: "la fecha esta en un formato erroneo"});
        query += "WHERE facturas.fecha = '"+fecha+"' ";
    }

    query += "GROUP BY marcas.nombre ORDER BY cantidad DESC"
    try {
        const {rows} = await pool.query(query);

        if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato coincidente"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});

router.get('/empaque', async (req, res) => {
    const { fechas, fecha } = req.query;

    let query = "SELECT p.nombre, COALESCE(packing_count, 0) AS packing_cantidad, COALESCE(picking_count, 0) AS picking_cantidad FROM personas p LEFT JOIN (SELECT usuario_picking, COUNT(*) AS picking_count FROM facturas_salidas WHERE picking IS NOT NULL ";

    if(fechas){
        let rango = fechas.split("/");
        if(!validarFecha(rango[0])) return res.status(400).json({status: 400, mensaje: "la fecha 1 esta en un formato erroneo"});
        if(!validarFecha(rango[1])) return res.status(400).json({status: 400, mensaje: "la fecha 2 esta en un formato erroneo"});

        query += "AND fecha BETWEEN '"+rango[0]+"' AND '"+rango[1]+"' ";
    } else if(fecha){
        if(!validarFecha(fecha)) return res.status(400).json({status: 400, mensaje: "la fecha esta en un formato erroneo"});
        query += "AND fecha = '"+fecha+"' ";
    }

    query += "GROUP BY usuario_picking) AS picking_counts ON p.id = picking_counts.usuario_picking LEFT JOIN (SELECT usuario_packing, COUNT(*) AS packing_count FROM facturas_salidas WHERE packing IS NOT NULL ";

    if(fechas){
        let rango = fechas.split("/");
        if(!validarFecha(rango[0])) return res.status(400).json({status: 400, mensaje: "la fecha 1 esta en un formato erroneo"});
        if(!validarFecha(rango[1])) return res.status(400).json({status: 400, mensaje: "la fecha 2 esta en un formato erroneo"});

        query += "AND fecha BETWEEN '"+rango[0]+"' AND '"+rango[1]+"' ";
    } else if(fecha){
        if(!validarFecha(fecha)) return res.status(400).json({status: 400, mensaje: "la fecha esta en un formato erroneo"});
        query += "AND fecha = '"+fecha+"' ";
    }

    query += "GROUP BY usuario_packing) AS packing_counts ON p.id = packing_counts.usuario_packing";

    try {
        const {rows} = await pool.query(query);

        if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato coincidente"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});
export default router;