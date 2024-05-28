import { putQuery } from "../database/queries.js";
import { actualizarFactura, crearFactura, eliminarFactura, leerFactura, leerFacturaCodigo, leerFacturas, leerFacturasAntesDe, leerFacturasDia } from "../database/queriesMongo/facturas.js"
import { actualizarItems, actualizarPedidos } from "../services/actualizarStock.js";

export const getAllBills = async (req, res) => {
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
        return res.status(400).send({error});
    }
}

export const getBill = async (req, res) => {
    const { id } = req.params;

    try {
        const factura = await leerFactura(id);

        return res.status(200).send({data: factura});
    } catch (error) {
        console.error("Error en la busqueda de factura", error);
        return res.status(400).send({error})
    }
}

export const createBill = async (req, res) => {
    const { factura } = req.body;

    try {
        const nuevaFactura = await crearFactura(factura);

        console.log("Creado", nuevaFactura);
        return res.status(200).send({data: nuevaFactura})
    } catch (error) {
        console.error("Error en la creacion factura", error);
        return res.status(400).send({error})
    }
}

export const updateBill = async (req, res) => {
    const { estado } = req.body;
    const { id } = req.params;

    try {
        const facturaActualizada = await actualizarFactura(id, {estado});

        return res.status(200).send({data: facturaActualizada})
    } catch (error) {
        console.error("Error en la creacion actualizacion", error);
        return res.status(400).send({error})
    }
}

export const deleteBill = async (req, res) => {
    const { id } = req.params;

    try {
        const facturaEliminada = await eliminarFactura(id);
        return res.status(200).send({confirmacion: "Factura eliminada", data: facturaEliminada})
    } catch (error) {
        console.error("Error en la eliminacion factura", error);
        return res.status(400).send({error})
    }
}

export const updateOrders = async (req, res) => {
    const response = await actualizarPedidos();

    res.status(response.status).send(response.response);    
}

export const updateOrder = async (req, res) => {
    const { codigo } = req.params;

    try {
        const pedido = await leerFacturaCodigo(codigo);

        const items = pedido.productos.map( item => ({sku: item.sku, unidades: item.unidades, status: "Salio"}));

        await actualizarItems(items)

        await eliminarFactura(pedido._id)

        console.log("se elimino el pedido", codigo)

        res.status(200).send({confirmacion: "pedido eliminado correctamente", pedido})
    } catch (error) {
        console.log("error", error);
        res.status(400).send({error})
    }
}

export const getUnitsOrders = async(req, res) => {
    try {
        const {response} = await putQuery("UPDATE productos SET unidades_virtuales WHERE unidades_virtuales < 0");

        if(!response.data) res.status(400).send(response.error);

        const pedidos = await leerFacturas();

        const items = pedidos.flatMap(pedido => { 
            return pedido.productos.map( item => ({sku: item.sku, unidades: item.unidades, status: pedido.estado}))
        })

        await actualizarItems(items);

        res.status(200).send({confirmacion: "unidades virtuales actualizadas"})

    } catch (error){
        console.log("error", error);
        res.status(400).send({error});
    }
}