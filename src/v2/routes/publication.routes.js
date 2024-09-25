import { Router } from 'express';
import { createPublication, deletePublication, getAllPublication, updatePublication, getPublication, activePublication, inactivePublication, getPublicationPlatform, getPublicationFijas, createPublications } from '../controllers/publicationControllers.js';

const router = Router();

router.get('/publicaciones', getAllPublication);

router.get('/publicaciones/:id', getPublication);

router.get('/publicaciones/plataforma/:plataforma', getPublicationPlatform);

router.get('/publicaciones/fijas/get', getPublicationFijas);

router.post('/publicaciones', createPublication);

router.post('/publicaciones/archivo', createPublications);

router.put('/publicaciones/activar', activePublication);

router.put('/publicaciones/desactivar', inactivePublication);

router.put('/publicaciones/:id', updatePublication);

router.delete('/publicaciones/:id', deletePublication);

export default router;