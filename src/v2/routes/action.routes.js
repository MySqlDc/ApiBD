import { Router } from 'express';
import { agregarFijos, agregarPausar, donwloadFile, downloadFile, eliminarFijos, getPedidos, pausar, update_ml, updatefijos, updateRappi, updateRappiMed, updateStock, updateStockFile, updateStockSomes } from '../controllers/actionControllers.js';

const router = Router()

router.get('/archivo', donwloadFile);

router.get('/archivo/descargar/:plataforma', downloadFile);

router.get('/actualizarStock', updateStock);

router.get('/rappi/full', updateRappi);

router.get('/rappi/full/medellin', updateRappiMed);

router.get('/obtenerDatos', getPedidos);

router.get('/forzar/ml', update_ml);

router.get('/pausar', pausar);

router.post('/pausar', agregarPausar);

router.post('/actualizarStock', updateStockSomes);

router.post('/fijos', agregarFijos);

router.put('/publicaciones/fijas/put', updatefijos);

router.put('/actualizarStock', updateStockFile);

router.delete('/fijos', eliminarFijos);

export default router