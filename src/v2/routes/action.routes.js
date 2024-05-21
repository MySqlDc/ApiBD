import { Router } from 'express';
import { donwloadFile, updateStock, updateStockFile } from '../controllers/actionControllers.js';

const router = Router()

router.get('/archivo', donwloadFile);

router.get('/actualizarStock', updateStock);

router.put('/actualizarStock', updateStockFile);

export default router