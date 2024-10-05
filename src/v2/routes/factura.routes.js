import { Router } from 'express';
import { createBill, deleteBill, getAllBills, getBill, getBillEstados, getBillPlatform, updateBill } from '../controllers/facturaControllers.js';

const router = Router()

//endpoint para obtener los pedidos
router.get('/pedidos', getAllBills);

//endpoint para obtener un pedido
router.get('/pedidos/:id', getBill);

//endpoint para obtener los pedidos de una plataforma en especifico
router.get('/pedidos/plataforma/:plataforma', getBillPlatform);

//endpoint para obtener los pedidos de un estado en especifico
router.get('/pedidos/estado/:estado', getBillEstados);

//endpoint para crear pedidos
router.post('/pedidos', createBill);

//enpoind para actualizar un pedido
router.put('/pedidos/:id', updateBill);

//endpoint para eliminar un pedido
router.delete('/pedidos/:id', deleteBill);

export default router;