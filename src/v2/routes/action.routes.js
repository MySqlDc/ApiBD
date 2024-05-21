import { Router } from 'express';
import { donwloadFile, updateStock } from '../controllers/actionControllers.js';

const router = Router()

router.get('/archivo', donwloadFile);

router.put('/actualizarStock', updateStock);

export default router