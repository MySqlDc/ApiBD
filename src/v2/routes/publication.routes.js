import { Router } from 'express';
import { createPublication, deletePublication, getAllPublication, updatePublication, getPublication, activePublication, inactivePublication } from '../controllers/publicationControllers.js';

const router = Router();

router.get('/publicaciones', getAllPublication);

router.get('/publicaciones/:id', getPublication);

router.post('/publicaciones', createPublication);

router.put('/activarPublicaciones', activePublication);

router.put('/desactivarPublicaciones', inactivePublication);

router.put('/publicaciones/:id', updatePublication);

router.delete('/publicaciones/:id', deletePublication);

export default router;