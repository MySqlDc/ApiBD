import { Router } from 'express';
import { createKit, deleteKit, getAllKits, getKit, getKitProducts } from '../controllers/kitControllers.js';

const router = Router();

//endpoint para obtener los kits
router.get('/kits', getAllKits);

//endpoint para obtener un kit
router.get('/kits/:id', getKit);

//endpoint para obtener los productos del kit
router.get('/kits/:id/productos', getKitProducts);

//endpoint para crear un kit
router.post('/kits', createKit);

//endpoint para eliminar un kit
router.delete('/kits/:id', deleteKit);

export default router;