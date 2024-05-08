import { Router } from 'express';
import registro from '../models/registro.js'
import { actualizarDatosVirtuales, obtenerSalidas } from '../services/api_elian.js';
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
    await actualizarDatosVirtuales();

    res.status(200).send({mensaje: "Se actualizo"})
})

router.get('/actualizarStockVirtual', async(req, res) => {
    let ayer = new Date();
    ayer.setDate(ayer.getDate() - 5);

    let data = [];

    let datosShopi = await obtenerSalidas("SHOPIFY");
    data = data.concat(datosShopi);
    
    let datosFala = await obtenerSalidas("FALABELLA");
    data = data.concat(datosFala);
    
    let datosML = await obtenerSalidas("MERCADOLIBRE");
    data = data.concat(datosML);

    

    //se filtran los datos obtenidos para obtener solo los del dia de hoy
    let datosFiltrados = data.filter(pedido => esDespues(ayer, new Date(pedido.date_generate))).map(pedido => {return {...pedido.order, fecha: pedido.date_generate}})

    const registros = await leerDatos('facturas');

    console.log(registros)

    datosFiltrados = datosFiltrados.filter(dato => {
        let flag = false;
        if(registros.hasOwnProperty(dato.id) && dato.status !== 'SIN SALIDA' || !registros.hasOwnProperty(dato.id) && dato.status === 'SIN SALIDA'){
            flag = true;
        }
        return flag;
    })  

    //obtiene un listado de todos los items de los pedidos sin salida
    const itemsApartados = datosFiltrados.filter(dato => dato.status === 'SIN SALIDA')
                            .flatMap(pedido => pedido.items)
                            .map(item => {return {sku: item.item.sku, unidades: item.item.quantity}})
                            .filter(item => item.sku !== null);

    //obtiene un listado de todos los items de los pedidos anulados pero fueron apartados
    const itemsDesapartados = datosFiltrados.filter(dato => dato.status !== 'SIN SALIDA')
                            .flatMap(pedido => pedido.items)
                            .map(item => {return {sku: item.item.sku, unidades: item.item.quantity}})
                            .filter(item => item.sku !== null);

    for(const item of itemsDesapartados){
        try{
            if(!item.sku.startsWith('KIT')){
                const { rows } = await pool.query("UPDATE productos SET unidades_virtuales = unidades_virtuales + $1 WHERE id = (SELECT producto_id FROM sku_producto WHERE sku = $2) RETURNING *", [item.unidades, item.sku])
                await registrar(item.sku)
            } else {
                const response = await pool.query("SELECT producto_id FROM sku_producto WHERE sku = $1", [item.sku])
                const { rows } = await pool.query("UPDATE productos SET unidades_virtuales = unidades_virtuales + $1 WHERE id = ANY(SELECT producto_id FROM kit_producto WHERE id = $2)", [item.unidades, response.rows[0].producto_id])

                if(rows.length > 0){
                    await pool.query("SELECT inventario_kit_especifico($1)", [response.rows[0].producto_id])
                    await registrar(item.sku)
                }
            }
        } catch(e){
            console.log(e)
        }
        
    }

    for(const item of itemsApartados){
        try {
            if(!item.sku.startsWith('KIT')){
                const { rows } = await pool.query("UPDATE productos SET unidades_virtuales = unidades_virtuales - $1 WHERE id = (SELECT producto_id FROM sku_producto WHERE sku = $2) RETURNING *", [item.unidades, item.sku])
                if(rows.length > 0) await registrar(item.sku)
            } else {
                const response = await pool.query("SELECT producto_id FROM sku_producto WHERE sku = $1", [item.sku])
                const { rows } = await pool.query("UPDATE productos SET unidades_virtuales = unidades_virtuales - $1 WHERE id = ANY(SELECT producto_id FROM kit_producto WHERE id = $2)", [item.unidades, response.rows[0].producto_id])

                if(rows.length > 0){
                    await pool.query("SELECT inventario_kit_especifico($1)", [response.rows[0].producto_id])
                    await registrar(item.sku)
                }
            }
        } catch (error) {
            console.log(error);
        }
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

    await actualizarInventario()

    res.status(200).send({mensaje: "oki doki", productos: productosData})
})

export default router;