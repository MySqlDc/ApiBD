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

import { PORT } from './config.js'
import {actualizarInventario} from './services/api_manager.js'


const app = express()

app.use(express.json())

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

app.listen(PORT)