import { Router } from 'express';
import registro from '../models/registro.js'
import { actualizarDatosGeneral } from '../services/api_elian.js';
import { esIgual } from '../validation.js';
import { leerDatos} from '../services/data_manage.js';

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

router.get('/iniciarDia', async (req, res) => {
    await actualizarDatosGeneral();

    res.status(200).send({mensaje: "Se actualizo"})
})

router.get('/obtenerFacturas', async(req, res) => {
    const response = [];
    const pedidosData = await leerDatos('facturas')

    const datos = Object.values(pedidosData);
    const claves = Object.keys(pedidosData);

    let hace6dias = new Date();
    hace6dias.setDate(hace6dias.getDate() - 6);

    for(let i = 0; i < datos.length; i++){
        if(esIgual(hace6dias, new Date(datos[i].fecha))){
            response.push({factura: claves[i], ...pedidosData[claves[i]]});
        }
    }

    res.status(200).send({Numero: response.length, facturas: response})
})

export default router;