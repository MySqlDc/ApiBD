import { Router } from 'express';
import registro from '../models/registro.js'

const router = Router();

router.get('/registrar', async (req, res) => {
    registro.find().then((data) => res.json(data)).catch((error) => res.json({ mensaje: error}));
});

router.post('/registrar', async (req, res) =>{
    const registros = new registro(req.body);
    await registros.save().then((data) => res.json(data)).catch((error) => res.json({ mensaje: error}));
});

export default router;