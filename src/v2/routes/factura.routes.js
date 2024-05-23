import { Router } from 'express';
import { createBill, deleteBill, getAllBills, getBill, updateBill } from '../controllers/facturaControllers.js';

const router = Router()

router.get('/facturas', getAllBills);

router.get('/facturas/:id', getBill);

router.post('/facturas', createBill);

router.put('/facturas/:id', updateBill);

router.delete('/facturas/:id', deleteBill);

export default router;