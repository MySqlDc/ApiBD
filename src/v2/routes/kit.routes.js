import { Router } from 'express';
import { createKit, deleteKit, getAllKits, getKit, getKitProducts } from '../controllers/kitControllers.js';

const router = Router();

router.get('/kits', getAllKits);

router.get('/kits/:id', getKit);

router.get('/kits/:id/productos', getKitProducts);

router.post('/kits', createKit);

router.delete('/kits/:id', deleteKit);

export default router;