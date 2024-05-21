import { Router } from 'express';
import { createProduct, deleteProduct, getAllProducts, getProduct, updateProduct, getAllProductsPlatform, getProductPlatform, updateUnidades, updateUnidadesVirtuales, getProductKits } from '../controllers/productControllers.js';

const router = Router();

router.get('/productos', getAllProducts);

router.get('/productos/plataformas', getAllProductsPlatform);

router.get('/productos/:id', getProduct);

router.get('/productos/:id/kits', getProductKits);

router.get('/productos/:id/plataformas', getProductPlatform);

router.post('/productos', createProduct);

router.put('/productos/:id', updateProduct);

router.put('productos/:id/unidades', updateUnidades);

router.put('productos/:id/unidadesVirtuales', updateUnidadesVirtuales);

router.delete('/productos/:id', deleteProduct);

export default router;