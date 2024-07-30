import { Router } from 'express';
import { donwloadFile, downloadFile, getPedidos, updatePricePublicacion, updateRappi, updateRappiMed, updateStock, updateStockFile, updateStockPublicacion, updateStockSomes } from '../controllers/actionControllers.js';

const router = Router()

router.get('/archivo', donwloadFile);

router.get('/archivo/descargar/:plataforma', downloadFile);

router.get('/actualizarStock', updateStock);

router.get('/rappi/full', updateRappi);

router.get('/rappi/full/medellin', updateRappiMed);

router.post('/actualizar/stock/:sku', updateStockPublicacion);

router.post('/actualizar/precio/:id', updatePricePublicacion);

router.post('/actualizarStock', updateStockSomes);

router.put('/actualizarStock', updateStockFile);

router.get('/obtenerDatos', getPedidos);

export default router