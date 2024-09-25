import { Router } from 'express';
import { 
    createProduct, 
    deleteProduct, 
    getAllProducts, 
    getProduct, 
    updateProduct,
    updateUnidades, 
    updateUnidadesVirtuales, 
    getProductKits, 
    getProductPublication, 
    activeProductPublication, 
    inactiveProductPublication, 
    getProductSkus, 
    updateUnidadesMedellin,
    setUpdateProduct,
    getProductData,
    getAllProductsData,
    createProducts
} from '../controllers/productControllers.js';

const router = Router();

router.get('/productos', getAllProducts);

router.get('/productos/coleccion/datos', getAllProductsData);

router.get('/productos/:id', getProduct);

router.get('/productos/:id/kits', getProductKits);

router.get('/productos/:id/coleccion', getProductData);

router.get('/productos/:id/publicaciones', getProductPublication);

router.get('/productos/:id/skus', getProductSkus);

router.post('/productos', createProduct);

router.post('/productos/archivo', createProducts);

router.post('/status/productos', setUpdateProduct);

router.put('/productos/:id', updateProduct);

router.put('/productos/:id/unidades', updateUnidades);

router.put('/productos/:id/unidadesVirtuales', updateUnidadesVirtuales);

router.put('/productos/:id/unidadesMedellin', updateUnidadesMedellin);

router.put('/productos/publicaciones/activar', activeProductPublication);

router.put('/productos/publicaciones/desactivar', inactiveProductPublication);

router.delete('/productos/:id', deleteProduct);

export default router;