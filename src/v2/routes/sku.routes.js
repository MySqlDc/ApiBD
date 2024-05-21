import { Router } from 'express';
import { createSku, deleteSku, getAllSkus, getSku } from '../controllers/skuControllers.js';

const router = Router();

router.get('/skus', getAllSkus);

router.get('/skus/:id', getSku);

router.post('/skus/:id', createSku);

router.delete('/skus/:id', deleteSku);

export default router;