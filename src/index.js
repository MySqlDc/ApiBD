import express from 'express'
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
import kitSkuRoutes from './routes/sku_kits.routes.js'

import { 
    PORT,
    KEY,
    DB_URI
 } from './config.js'
import { actualizarInventario } from './services/api_manager.js'
import mongoose from 'mongoose'


const app = express()

app.use(express.json())
app.use(function(req, res, next){
    const {key} = req.headers;
    if(key === KEY){
        next();
    } else {
        res.status(400).json({status: 400, mensaje: "No tienes Permiso para ingresar a estos datos", detail: req.headers.key})
    }
});

app.use(productosRoutes)
app.use(salidasRoutes)
app.use(entradasRoutes)
app.use(sku_productosRoutes)
app.use(facturasRoutes)
//app.use(actualizarRoutes)
app.use(preciosRoutes)
app.use(kitRoutes);
app.use(kitProductoRoutes);
app.use(kitSkuRoutes);
app.use(publicacion_mlRoutes);
app.use(publicacion_rappiRoutes);

app.use((req, res, next) => {
    res.status(404).json({
        status: 404,
        message: 'ruta no encontrada'
    })
})

cron.schedule('0 8-20/2 * * *', () => {
    actualizarInventario();
    console.log('actualizando');
})

mongoose.connect(DB_URI).then(() => console.log("Conectado a Mongo"));

app.listen(PORT)