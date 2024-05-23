import { actualizarFactura, crearFactura, eliminarFactura, leerFacturas } from "../database/queriesMongo/facturas.js"


export const getAllBills = async (req, res) => {
    const data = await leerFacturas()

    if(data) return res.status(200).send({data});

    res.status(400).send({error: "Error en la conexion"})
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
    const { codigo, fecha, estado, productos } = req.body;

    try {
        const nuevaFactura = await crearFactura({
            codigo,
            fecha: new Date(fecha),
            estado,
            productos
        });

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
        return res.sttaus(400).send({error})
    }
}