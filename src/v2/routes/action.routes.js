import { Router } from 'express';
import { donwloadFile, updatePricePublicacion, updateRappi, updateRappiMed, updateStock, updateStockFile, updateStockSomes } from '../controllers/actionControllers.js';

const router = Router()

router.get('/archivo', donwloadFile);

router.get('/actualizarStock', updateStock);

router.get('/rappi/full', updateRappi);

router.get('/rappi/full/medellin', updateRappiMed);

router.post('/actualizar/precio/:id', updatePricePublicacion);

router.post('/actualizarStock', updateStockSomes);

router.put('/actualizarStock', updateStockFile);

export default router