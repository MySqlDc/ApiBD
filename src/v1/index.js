import express, { Router } from 'express';
import cron from 'node-cron'
import productosRoutes from './routes/productos.routes.js'
import salidasRoutes from './routes/salidas.routes.js'
import entradasRoutes from './routes/entradas.routes.js'
import sku_productosRoutes from './routes/sku_producto.routes.js'
import facturasRoutes from './routes/facturas.routes.js'
import publicacion_mlRoutes from './routes/publicaciones_ml.routes.js'
import publicacion_rappiRoutes from './routes/publicaciones_rappi.routes.js'
//import actualizarRoutes from './routes/actualizar.routes.js'
import preciosRoutes from './routes/precios.routes.js'
import kitRoutes from './routes/kits.routes.js'
import kitProductoRoutes from './routes/kit_producto.routes.js'
import marcasRoutes from './routes/marcas.routes.js'
import pruebasRoutes from './routes/pruebas.routes.js'
import informesRoutes from './routes/informes.routes.js'

import {
    KEY,
    DB_URI
 } from './../config.js'
import { actualizarInventario } from './services/api_manager.js'
import mongoose from 'mongoose'
import { actualizacion } from './services/api_rappi.js'
import { inventario } from './services/consultas_internas.js'

const router = express.Router();


router.use(pruebasRoutes)
router.use(function(req, res, next){
    const {key} = req.headers;
    if(key === KEY){
        next();
    } else {
        res.status(400).json({status: 400, mensaje: "No tienes Permiso para ingresar a estos datos", detail: req.headers.key})
    }
});
router.use(productosRoutes)
router.use(salidasRoutes)
router.use(entradasRoutes)
router.use(sku_productosRoutes)
router.use(facturasRoutes)
router.use(marcasRoutes)
//router.use(actualizarRoutes)
router.use(preciosRoutes)
router.use(kitRoutes);
router.use(kitProductoRoutes);
router.use(publicacion_mlRoutes);
router.use(publicacion_rappiRoutes);
router.use(informesRoutes)

cron.schedule('0 8-20/2 * * *', () => {
    //actualizarInventario();
    console.log('actualizando');
})

cron.schedule('5/* * * * *', () => {
    
    console.log('activo')
})
//mongoose.connect(DB_URI).then(() => console.log("Conectado a Mongo"));

export default router;