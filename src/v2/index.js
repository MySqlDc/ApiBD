import express from 'express'
import cron from 'node-cron'

import { connectionMongo } from './database/conection.js'

import productRoutes from './routes/product.routes.js'
import skuRoutes from './routes/sku.routes.js'
import kitRoutes from './routes/kit.routes.js'
import plataformRoutes from './routes/platform.routes.js'
import publicationRoutes from './routes/publication.routes.js'
import actionRoutes from './routes/action.routes.js'
import facturaRoutes from './routes/factura.routes.js'
import { actualizarPedidos } from './services/actualizarStock.js'

const router = express.Router();

await connectionMongo();

router.use(express.json());
router.use(productRoutes);
router.use(skuRoutes);
router.use(kitRoutes);
router.use(plataformRoutes);
router.use(publicationRoutes);
router.use(actionRoutes);
router.use(facturaRoutes);

cron.schedule('*/15 * * * *', async() => {
    await actualizarPedidos()
    console.log('activo2')
})

export default router;