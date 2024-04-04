import { Router } from 'express';
import registro from '../models/registro.js'

const router = Router();

router.get('/registrar', async (req, res) => {
    registro.find().then((data) => res.json(data)).catch((error) => res.json({ mensaje: error}));
});

router.post('/registrar', async (req, res) =>{
    try {
        const registros = new registro(req.body);
        const data = await registros.save();
        console.log("Registro creado");
        res.status(200).json({ data: data});
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
});

export default router;