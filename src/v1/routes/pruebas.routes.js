import { Router } from 'express';
import registro from '../models/registro.js'
import { actualizarDatosGeneral, obtenerSalidas } from '../services/api_elian.js';
import { esDespues, esIgual } from '../validation.js';
import { eliminar, leerDatos, registrar } from '../services/data_manage.js';
import { pool } from '../conection.js';
import { actualizarInventario } from '../services/api_manager.js';
import { crearFactura, eliminarFactura, leerFacturaCodigo } from '../../v2/database/queriesMongo/facturas.js';

const router = Router();

router.get('/registrar', async (req, res) => {
    registro.find().then((data) => res.json(data)).catch((error) => res.json({ mensaje: error}));
});

router.post('/registrar', async (req, res) =>{
    try {
        const registros = new registro(req.body);
        const data = await registros.save();
        console.log("Registro creado");
        res.status(200).json({ data: data});
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});

router.get('/iniciarDia', async (req, res) => {
    await actualizarDatosGeneral();

    res.status(200).send({mensaje: "Se actualizo"})
})

router.get('/obtenerFacturas', async(req, res) => {
    const response = [];
    const pedidosData = await leerDatos('facturas')

    const datos = Object.values(pedidosData);
    const claves = Object.keys(pedidosData);

    let hace6dias = new Date();
    hace6dias.setDate(hace6dias.getDate() - 6);

    for(let i = 0; i < datos.length; i++){
        if(esIgual(hace6dias, new Date(datos[i].fecha))){
            response.push({factura: claves[i], ...pedidosData[claves[i]]});
        }
    }

    res.status(200).send({Numero: response.length, facturas: response})
})

router.get('/actualizarStockVirtual', async(req, res) => {
    let updateKit = false;
    let hace5dias = new Date();
    hace5dias.setDate(hace5dias.getDate() - 5);

    let data = [];

    try{
        let datosShopi = await obtenerSalidas("SHOPIFY");
        data = data.concat(datosShopi);
        
        let datosFala = await obtenerSalidas("FALABELLA");
        data = data.concat(datosFala);
        
        let datosML = await obtenerSalidas("MERCADOLIBRE");
        data = data.concat(datosML);
        
    } catch(error){
        return res.status(400).send({error})
    }

    const registros = await leerDatos('facturas');
    

    //se filtran los datos obtenidos para obtener solo los gerados desde hace 5 dias y los que esten registrados
    let datosFiltrados = data.filter(pedido => esDespues(hace5dias, new Date(pedido.date_generate)) || registros.hasOwnProperty(pedido.id)).map(pedido => {return {...pedido.order, fecha: pedido.date_generate}})

    console.log(registros)

    datosFiltrados = datosFiltrados.filter(dato => {
        return registros.hasOwnProperty(dato.id) && dato.status !== 'SIN SALIDA' || !registros.hasOwnProperty(dato.id) && dato.status === 'SIN SALIDA';
    })  

    //obtiene un listado de todos los items de los pedidos sin salida
    const items = datosFiltrados.flatMap(pedido => {
        return pedido.items.map(item => ({
            sku: item.item.sku,
            unidades: item.item.quantity,
            status: pedido.status,
            codigo: pedido.id,
            plataforma: pedido.platform
        }))
        }).filter(item => item.sku !== null);


    for(const item of items){
        try {
            const response = await pool.query("SELECT producto_id FROM sku_producto WHERE sku = $1", [item.sku])
            if(response.rows.length > 0){
                if(!item.sku.startsWith('KIT')){
                    const { rows } = await pool.query("UPDATE productos SET unidades_virtuales = unidades_virtuales "+(item.status==="SIN SALIDA"?"-":"+")+" $1 WHERE id = $2 RETURNING *", [item.unidades, response.rows[0].producto_id])
                    if(rows.length > 0){ 
                        await registrar(item.sku)
                        const responseKit = await pool.query("SELECT kit_id FROM kit_producto WHERE producto_id = $1", [response.rows[0].producto_id])
                        if(responseKit.rows.length > 0){
                            for(const row of response.rows){
                                const responseSku = await pool.query("SELECT sku FROM sku_producto WHERE producto_id = $1", [row.kit_id])
                                if(responseSku.rows.length > 0){
                                    for(const sku of responseSku.rows){
                                        await registrar(sku.sku)
                                    }
                                }
                            }
                            updateKit = true;
                        }
                    }
    
                } else {
                    updateKit = true;
                    const { rows } = await pool.query("UPDATE productos SET unidades_virtuales = unidades_virtuales "+(item.status==="SIN SALIDA"?"-":"+")+" $1 WHERE id = ANY(SELECT producto_id FROM kit_producto WHERE id = $2) RETURNING *", [item.unidades, response.rows[0].producto_id])
    
                    if(rows.length > 0){
                        await registrar(item.sku)
                        
                        for(const product of rows){
                            const responseSku = await pool.query("SELECT sku FROM sku_producto WHERE producto_id = $1", [product.id])
                            if(responseSku.rows.length > 0){
                                for(const sku of responseSku.rows){
                                    await registrar(sku.sku)
                                }
                            }
                        }
                    }
                }
            } else {
                console.log("el sku del producto no esta registrado", item);
            }
        } catch (error) {
            console.log(error);
        }
    }

    await actualizarDatosGeneral();

    if(updateKit){
        await pool.query("SELECT inventario_kit_general()");
    }

    for(const elemento of datosFiltrados){
        if(elemento.status !== 'SIN SALIDA'){
            await eliminar(elemento.id, 'facturas');
            const factura = await leerFacturaCodigo(elemento.id);
            if(factura) {
                await eliminarFactura(factura._id)
            } else {
                console.log("No se encontro la factura ", elemento.id)
            }
        } else {
            await registrar({id: elemento.id, fecha: elemento.fecha}, 'facturas');
            const productos = elemento.items.map(item => ({sku: item.item.sku, "unidades": item.item.quantity}))
            await crearFactura({codigo: elemento.id, fecha: elemento.fecha, estado: elemento.status, productos});
        }
    };

    //await actualizarInventario()
    const pedidosData = await leerDatos('facturas')

    const longitud = Object.values(pedidosData);

    res.status(200).send({mensaje: "oki doki", cantidad: longitud.length, facturas: pedidosData})
})

export default router;