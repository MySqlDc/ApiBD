import { Router } from 'express';
import { createBill, deleteBill, getAllBills, getBill, getUnitsOrders, updateBill, updateOrder, updateOrders } from '../controllers/facturaControllers.js';

const router = Router()

router.get('/pedidos', getAllBills);

router.get('/pedidos/:id', getBill);

router.get('/actualizarPedidos', updateOrders);

router.get('/actualizarPedidos/:codigo', updateOrder);

router.get('/registrarUnidades', getUnitsOrders);

router.post('/pedidos', createBill);

router.put('/pedidos/:id', updateBill);

router.delete('/pedidos/:id', deleteBill);

export default router;