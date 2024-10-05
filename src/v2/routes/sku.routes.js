import { Router } from 'express';
import { createSku, deleteSku, getAllSkus, getSku } from '../controllers/skuControllers.js';

const router = Router();

//endpoint para obtener todos los skus
router.get('/skus', getAllSkus);

//endpoint para obtener un sku
router.get('/skus/:sku', getSku);

//endpoint para crear un sku
router.post('/skus/:id', createSku);

//endpoint para eliminar un sku
router.delete('/skus/:id', deleteSku);

export default router;