import { Router } from 'express';
import { agregarFijos, agregarPausar, donwloadFile, downloadFile, eliminarFijos, getPedidos, pausar, update_ml, updatefijos, updateRappi, updateRappiMed, updateStock, updateStockFile, updateStockSomes } from '../controllers/actionControllers.js';

const router = Router()

//endpoint para descargar un archivo con todos los productos dentro de la base de datos
router.get('/archivo', donwloadFile);

//endpoint para descargar un archivo de la plataforma consultada
router.get('/archivo/descargar/:plataforma', downloadFile);

//endpoint para actualiza el inventario en las publicaciones
router.get('/actualizarStock', updateStock);

//endpoint para actualizar rappiFull, (actualmente no se usa)
router.get('/rappi/full', updateRappi);

//endpoint para actualizar rappiFull Medellin, (actualmente no se usa)
router.get('/rappi/full/medellin', updateRappiMed);

//endpoint para gestionar el inventario
router.get('/obtenerDatos', getPedidos);

//endpoint para ejecutar la actualizacion de los pedidos fijos
router.get('/forzar/ml', update_ml);

//endpoint para ejecutar la ejecucion de pausar
router.get('/pausar', pausar);

//endpoint para agregar una producto a pausar
router.post('/pausar', agregarPausar);

//endpoint para actualizar el inventario de algunos productos
router.post('/actualizarStock', updateStockSomes);

//endpoint para agregar publicaciones a fijas
router.post('/fijos', agregarFijos);

//endpoint para actualizar las publicaciones fijas
router.put('/publicaciones/fijas/put', updatefijos);

//endpoint para actualizar el stock por medio de un archivo
router.put('/actualizarStock', updateStockFile);

//eliminar publicaciones de fijas
router.delete('/fijos', eliminarFijos);

export default router