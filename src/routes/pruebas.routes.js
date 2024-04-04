import { Router } from 'express';
import registro from '../models/registro.js'

const router = Router();

router.get('/registrar', (req, res) => {
    registro.find().then((data) => res.json(data)).catch((error) => res.json({ menjase: error}));
});

router.post('/registrar', (req, res) =>{
    const user = registro(req.body);
    user.save().then((data) => res.json(data)).catch((error) => res.json({ mensaje: error}));
});

export default router;