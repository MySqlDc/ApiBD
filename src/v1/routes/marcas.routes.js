import { Router } from 'express';
import { pool } from '../conection.js';

const router = Router();

router.get('/marcas', async (req, res) => {
    const { marca } = req.query;

    try {
        const {rows} = await pool.query("SELECT * FROM marcas WHERE nombre = $1", [marca]);

        if(rows.length == 0) return res.status(200).json({status: 200, mensaje: "no se ha encontrado ningun dato coincidente"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error});
    }
})

export default router;