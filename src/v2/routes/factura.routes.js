import { Router } from 'express';
import { createBill, deleteBill, getAllBills, getBill, updateBill } from '../controllers/facturaControllers.js';

const router = Router()

router.get('/pedidos', getAllBills);

router.get('/pedidos/:id', getBill);

router.post('/pedidos', createBill);

router.put('/pedidos/:id', updateBill);

router.delete('/pedidos/:id', deleteBill);

export default router;