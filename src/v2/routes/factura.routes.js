import { Router } from 'express';
import { createBill, deleteBill, getAllBills, getBill, getBillEstados, getBillPlatform, updateBill } from '../controllers/facturaControllers.js';

const router = Router()

router.get('/pedidos', getAllBills);

router.get('/pedidos/:id', getBill);

router.get('/pedidos/plataforma/:plataforma', getBillPlatform);

router.get('/pedidos/estado/:estado', getBillEstados);

router.post('/pedidos', createBill);

router.put('/pedidos/:id', updateBill);

router.delete('/pedidos/:id', deleteBill);

export default router;