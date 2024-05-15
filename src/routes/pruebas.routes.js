import { Router } from 'express';
import registro from '../models/registro.js'
import { actualizarDatosGeneral, obtenerSalidas } from '../services/api_elian.js';
import { esDespues } from '../validation.js';
import { eliminar, leerDatos, registrar } from '../services/data_manage.js';
import { pool } from '../conection.js';
import { actualizarInventario } from '../services/api_manager.js';

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

router.get('/actualizarStockVirtual', async(req, res) => {
    let updateKit = false;
    let hace5dias = new Date();
    hace5dias.setDate(hace5dias.getDate() - 5);

    let data = [];

    let datosShopi = await obtenerSalidas("SHOPIFY");
    data = data.concat(datosShopi);
    
    let datosFala = await obtenerSalidas("FALABELLA");
    data = data.concat(datosFala);
    
    let datosML = await obtenerSalidas("MERCADOLIBRE");
    data = data.concat(datosML);

    

    //se filtran los datos obtenidos para obtener solo los del dia de hoy
    let datosFiltrados = data.filter(pedido => esDespues(hace5dias, new Date(pedido.date_generate))).map(pedido => {return {...pedido.order, fecha: pedido.date_generate}})

    const registros = await leerDatos('facturas');

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
        await pool.query("SELECT inventario_kit_general()")
    }
    
    const productosData = await leerDatos()
    console.log("productos", productosData);

    for(const elemento of datosFiltrados){
        if(elemento.status !== 'SIN SALIDA'){
            await eliminar(elemento.id, 'facturas');
        } else {
            await registrar({id: elemento.id, fecha: elemento.fecha}, 'facturas');
        }
    };

    //await actualizarInventario()
    const pedidosData = await leerDatos('facturas')

    const longitud = Object.values(pedidosData);

    res.status(200).send({mensaje: "oki doki", cantidad: longitud.length, facturas: pedidosData})
})

export default router;