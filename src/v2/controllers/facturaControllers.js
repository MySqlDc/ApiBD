import { pool } from "../database/conection.js";
import { actualizarFactura, crearFactura, eliminarFactura, leerFactura, leerFacturaCodigo, leerFacturas, leerFacturasAntesDe, leerFacturasDia } from "../database/queriesMongo/facturas.js"
import { actualizarItems, actualizarPedidos } from "../services/actualizarStock.js";

export const getAllBills = async (req, res, next) => {
    const { antesDe, fecha, codigo } = req.query;

    try {
        let facturas;
        let pedidos;
        if(fecha){
            let dia = new Date(fecha);
            facturas = await leerFacturasDia(dia);
        } else if(antesDe){
            let anteriorA = new Date(antesDe);
            anteriorA.setDate(anteriorA.getDate())
    
            facturas = await leerFacturasAntesDe(anteriorA);
        } else if(codigo) {
            facturas = await leerFacturaCodigo(codigo);
        } else {
            facturas = await leerFacturas();
        }
        
        if(facturas.length){
            pedidos = facturas.map(factura => {return {codigo: factura.codigo, fecha: factura.fecha, estado: factura.estado, productos: factura.productos}})
        } else {
            pedidos = facturas
        }
        
        return res.status(200).send({Cantidad: facturas.length, Pedidos: pedidos});
    } catch (error) {
        next(error);
    }
}

export const getBill = async (req, res, next) => {
    const { id } = req.params;

    try {
        const factura = await leerFactura(id);

        return res.status(200).send({data: factura});
    } catch (error) {
        next(error);
    }
}

export const createBill = async (req, res, next) => {
    const { factura } = req.body;

    try {
        const nuevaFactura = await crearFactura(factura);

        return res.status(200).send({data: nuevaFactura})
    } catch (error) {
        next(error);
    }
}

export const updateBill = async (req, res, next) => {
    const { estado } = req.body;
    const { id } = req.params;

    try {
        const facturaActualizada = await actualizarFactura(id, {estado});

        return res.status(200).send({data: facturaActualizada})
    } catch (error) {
        next(error);
    }
}

export const deleteBill = async (req, res, next) => {
    const { id } = req.params;

    try {
        const facturaEliminada = await eliminarFactura(id);
        return res.status(200).send({confirmacion: "Factura eliminada", data: facturaEliminada})
    } catch (error) {
        next(error);
    }
}

export const updateOrders = async (req, res, next) => {
    try{
        const response = await actualizarPedidos();

        res.status(response.status).send(response.response);    
    } catch (error){
        next(error)
    }
}

export const updateOrder = async (req, res, next) => {
    const { codigo } = req.params;

    try {
        const pedido = await leerFacturaCodigo(codigo);

        const items = pedido.productos.map( item => ({sku: item.sku, unidades: item.unidades, status: "Salio"}));

        await actualizarItems(items)

        await eliminarFactura(pedido._id)

        console.log("se elimino el pedido", codigo)

        res.status(200).send({confirmacion: "pedido eliminado correctamente", pedido})
    } catch (error) {
        next(error)
    }
}

export const getUnitsOrders = async(req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log("inicio")
        await client.query("UPDATE productos SET unidades_virtuales = 0 WHERE unidades_virtuales < 0");

        console.log('traer pedidos')
        const pedidos = await leerFacturas();

        console.log('filtrar datos')
        const items = pedidos.flatMap(pedido => { 
            return pedido.productos.map( item => ({sku: item.sku, unidades: item.unidades, status: pedido.estado}))
        })
        console.log("items", items);

        await client.query('COMMIT');

        await actualizarItems(items);
        res.status(200).send({confirmacion: "unidades virtuales actualizadas"})
    } catch (error){
        await client.query('ROLLBACK');
        next(error)
    } finally {
        client.release();
    }
}