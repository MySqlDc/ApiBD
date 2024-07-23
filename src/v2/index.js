import express from 'express'
import cron from 'node-cron'

import productRoutes from './routes/product.routes.js'
import skuRoutes from './routes/sku.routes.js'
import kitRoutes from './routes/kit.routes.js'
import plataformRoutes from './routes/platform.routes.js'
import publicationRoutes from './routes/publication.routes.js'
import actionRoutes from './routes/action.routes.js'
import facturaRoutes from './routes/factura.routes.js'
import brandRoutes from './routes/marca.routes.js'
import { handleError } from './middlewares/errorHandler.js'
import { actualizar } from './services/actualizarPublicaciones.js'
import { actualizarDatosGeneral, actualizarReservados } from './database/queries/productos.js'
import { createOrders } from './services/actualizarStock.js'

const router = express.Router();

router.use(express.json());
router.use(productRoutes);
router.use(skuRoutes);
router.use(kitRoutes);
router.use(plataformRoutes);
router.use(publicationRoutes);
router.use(actionRoutes);
router.use(facturaRoutes);
router.use(brandRoutes);

router.use(handleError);

cron.schedule('15 * * * *', async() => {
    console.log("comenzo")
    await actualizarDatosGeneral();
    console.log("termino")
})

cron.schedule('45 10-22/2 * * *', async () => {
    console.log("comenzo actualizacion publicaciones");
    await actualizar();
    console.log("Fin actualizacion publicaciones");
})

cron.schedule('37 * * * *', async() => {
    console.log("comenzo peticion pedidos");
    await createOrders();
    await actualizarReservados();
    console.log("Fin peticion pedidos")
})

export default router;