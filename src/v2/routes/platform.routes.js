import { Router } from 'express';
import { createPlatform, deletePlatform, getAllPlatform, getPlatform, updatePlatform } from '../controllers/platformControllers.js';

const router = Router();

//endpoint para obtener las plataformas
router.get('/plataformas', getAllPlatform);

//endpoint para obtener una plataforma
router.get('/plataformas/:id', getPlatform);

//endpoint para crear una plataforma
router.post('/plataformas', createPlatform);

//endpoint para alterar una plataforma
router.put('/plataformas/:id', updatePlatform);

//endpoint para eliminar una plataforma
router.delete('/plataformas/:id', deletePlatform);

export default router;