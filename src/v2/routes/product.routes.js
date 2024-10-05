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

//endpoint para obtener los productos
router.get('/productos', getAllProducts);

//endpoint para obtener todos los datos de los productos
router.get('/productos/coleccion/datos', getAllProductsData);

//endpoint para obtener el producto
router.get('/productos/:id', getProduct);

//endpoint para obtener los kits de un producto
router.get('/productos/:id/kits', getProductKits);

//endpoint para obtener todas los datos del producto
router.get('/productos/:id/coleccion', getProductData);

//endpoint para obtener las publicaciones del producto
router.get('/productos/:id/publicaciones', getProductPublication);

//endpoint para obtener los skus del producto
router.get('/productos/:id/skus', getProductSkus);

//endpoint para crear un producto
router.post('/productos', createProduct);

//endpoint para crear varios productos
router.post('/productos/archivo', createProducts);

//endpoint para cambiar el estado de un producto, si se actualiza o no
router.post('/status/productos', setUpdateProduct);

//endpoint para actualizar un producto
router.put('/productos/:id', updateProduct);

//endpoint para actualizar las unidades de un producto
router.put('/productos/:id/unidades', updateUnidades);

//endpoint para actualizar las unidades virtuales de un producto
router.put('/productos/:id/unidadesVirtuales', updateUnidadesVirtuales);

//endpoint para actualizar las unidades de medellin de un producto
router.put('/productos/:id/unidadesMedellin', updateUnidadesMedellin);

//endpoint para vincular las publicaciones con el producto
router.put('/productos/publicaciones/activar', activeProductPublication);

//endpoint para desvincular las publicaciones con el producto
router.put('/productos/publicaciones/desactivar', inactiveProductPublication);

//endpoint para eliminar un producto
router.delete('/productos/:id', deleteProduct);

export default router;