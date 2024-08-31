import { Router } from 'express';
import { agregarFijos, donwloadFile, downloadFile, eliminarFijos, getPedidos, update_ml, updatefijos, updateRappi, updateRappiMed, updateStock, updateStockFile, updateStockPublicacion, updateStockSomes } from '../controllers/actionControllers.js';

const router = Router()

router.get('/archivo', donwloadFile);

router.get('/archivo/descargar/:plataforma', downloadFile);

router.get('/actualizarStock', updateStock);

router.get('/rappi/full', updateRappi);

router.get('/rappi/full/medellin', updateRappiMed);

router.get('/obtenerDatos', getPedidos);

router.get('/forzar/ml', update_ml);

router.post('/actualizar/stock/:sku', updateStockPublicacion);

router.post('/actualizarStock', updateStockSomes);

router.post('/fijos', agregarFijos);

router.put('/publicaciones/fijas/put', updatefijos);

router.put('/actualizarStock', updateStockFile);

router.delete('/fijos', eliminarFijos);

export default router