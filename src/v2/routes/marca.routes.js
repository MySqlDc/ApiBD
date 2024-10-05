import { Router } from 'express';
import { createBrand, deleteBrand, getAllBrands, getBrand, updateBrand } from '../controllers/marcaControllers.js';

const router = Router();

//endpoint para aobtener las marcas
router.get('/marcas', getAllBrands);

//endpoint para aobtener una marca
router.get('/marcas/:id', getBrand);

//endpoint para crear una marca
router.post('/marcas', createBrand);

//endpoint para actualizar una marca
router.put('/marcas/:id', updateBrand);

//endpoint para eliminar una marca
router.delete('/marcas/:id', deleteBrand);

export default router;