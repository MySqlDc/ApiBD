import { Router } from 'express';
import { donwloadFile, updateRappi, updateStock, updateStockFile } from '../controllers/actionControllers.js';

const router = Router()

router.get('/archivo', donwloadFile);

router.get('/actualizarStock', updateStock);

router.put('/actualizarStock', updateStockFile);

router.get('/rappi/full', updateRappi);

export default router