import express from 'express'
import cron from 'node-cron'
import productosRoutes from './routes/productos.routes.js'
import salidasRoutes from './routes/salidas.routes.js'
import entradasRoutes from './routes/entradas.routes.js'
import sku_productosRoutes from './routes/sku_producto.routes.js'
import facturasRoutes from './routes/facturas.routes.js'
import actualizarRoutes from './routes/actualizar.routes.js'
import preciosRoutes from './routes/precios.routes.js'
import { PORT } from '../config.js'
import {actualizarInventario} from './services/api_manager.js'


const app = express()

app.use(express.json())

app.use(productosRoutes)
app.use(salidasRoutes)
app.use(entradasRoutes)
app.use(sku_productosRoutes)
app.use(facturasRoutes)
app.use(actualizarRoutes)
app.use(preciosRoutes)

app.use((req, res, next) => {
    res.status(404).json({
        status: 404,
        message: 'ruta no encontrada'
    })
})

cron.schedule('0 8-20/2 * * *', () => {
    console.log('actualizando')
    //actualizarInventario()
})

app.listen(PORT)