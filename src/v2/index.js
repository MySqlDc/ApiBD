import express from 'express'

import { connectionMongo } from './database/conection.js'
import productRoutes from './routes/product.routes.js'
import skuRoutes from './routes/sku.routes.js'
import kitRoutes from './routes/kit.routes.js'
import plataformRoutes from './routes/platform.routes.js'
import publicationRoutes from './routes/publication.routes.js'
import actionRoutes from './routes/action.routes.js'
import facturaRoutes from './routes/factura.routes.js'

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

export default router;