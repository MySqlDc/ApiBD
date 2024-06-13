import { Router } from 'express';
import { createBrand, deleteBrand, getAllBrands, getBrand, updateBrand } from '../controllers/marcaControllers.js';

const router = Router();

router.get('/marcas', getAllBrands);

router.get('/marcas/:id', getBrand);

router.post('/marcas', createBrand);

router.put('/marcas/:id', updateBrand);

router.delete('/marcas/:id', deleteBrand);

export default router;