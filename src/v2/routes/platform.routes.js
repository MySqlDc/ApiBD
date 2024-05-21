import { Router } from 'express';
import { createPlatform, deletePlatform, getAllPlatform, getPlatform, updatePlatform } from '../controllers/platformControllers.js';

const router = Router();

router.get('/plataformas', getAllPlatform);

router.get('/plataformas/:id', getPlatform);

router.post('/plataformas', createPlatform);

router.put('/plataformas/:id', updatePlatform);

router.delete('/plataformas/:id', deletePlatform);

export default router;