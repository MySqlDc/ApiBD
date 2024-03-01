import { Router } from 'express';
import { pool } from '../../conection.js';
import { actualizarInventario } from '../services/api_manager.js'

const router = Router();

router.get('/actualizar', async(req, res) => {
    await actualizarInventario();

    res.json({status: "terminado"})
});

export default router;