import { Router } from 'express';
import { 
    createProduct, 
    deleteProduct, 
    getAllProducts, 
    getProduct, 
    updateProduct, 
    getAllProductsPlatform, 
    getProductPlatform, 
    updateUnidades, 
    updateUnidadesVirtuales, 
    getProductKits, 
    getProductPublication, 
    activeProductPublication, 
    inactiveProductPublication, 
    getProductSkus, 
    updateUnidadesMedellin
} from '../controllers/productControllers.js';

const router = Router();

router.get('/productos', getAllProducts);

router.get('/productos/plataformas', getAllProductsPlatform);

router.get('/productos/:id', getProduct);

router.get('/productos/:id/kits', getProductKits);

router.get('/productos/:id/plataformas', getProductPlatform);

router.get('/productos/:id/publicaciones', getProductPublication);

router.get('/productos/:id/skus', getProductSkus);

router.post('/productos', createProduct);

router.put('/productos/:id', updateProduct);

router.put('/productos/:id/unidades', updateUnidades);

router.put('/productos/:id/unidadesVirtuales', updateUnidadesVirtuales);

router.put('/productos/:id/unidadesMedellin', updateUnidadesMedellin);

router.put('/productos/publicaciones/activar', activeProductPublication);

router.put('/productos/publicaciones/desactivar', inactiveProductPublication);

router.delete('/productos/:id', deleteProduct);

export default router;