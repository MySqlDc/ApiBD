import { Router } from 'express';
import { createPublication, deletePublication, getAllPublication, updatePublication, getPublication, activePublication, inactivePublication, getPublicationPlatform, getPublicationFijas, createPublications } from '../controllers/publicationControllers.js';

const router = Router();

//endpoint para obtener todos las publicaciones
router.get('/publicaciones', getAllPublication);

//endpoint para obtener una publicacion
router.get('/publicaciones/:id', getPublication);

//endpoint para obtener las publicaciones de una plataforma
router.get('/publicaciones/plataforma/:plataforma', getPublicationPlatform);

//endpoint para obtener las publicaciones que estan en fijas
router.get('/publicaciones/fijas/get', getPublicationFijas);

//endpoint para crear una publicacion
router.post('/publicaciones', createPublication);

//endpoint para crear las publicaciones por medio de archivo
router.post('/publicaciones/archivo', createPublications);

//endpoint para vincular las publicaciones
router.put('/publicaciones/activar', activePublication);

//endpoint para desvincular las publicaciones
router.put('/publicaciones/desactivar', inactivePublication);

//endpoint para actualizar una publicacion
router.put('/publicaciones/:id', updatePublication);

//endpoint para eliminar una publicacion
router.delete('/publicaciones/:id', deletePublication);

export default router;