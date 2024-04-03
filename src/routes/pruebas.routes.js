import { Router } from 'express';
import registroSchema from '../models/registro.js'

const router = Router();

router.get('/registrar', (req, res) => {
    registroSchema.find().then((data) => res.json(data)).catch((error) => res.json({ menjase: error}));
});

router.post('/registrar', (req, res) =>{
    const user = registroSchema(req.body);
    user.save().then((data) => res.json(data)).catch((error) => res.json({ mensaje: error}));
});

export default router;