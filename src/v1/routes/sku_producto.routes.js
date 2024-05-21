import { Router } from 'express';
import { pool } from '../conection.js';

const router = Router();

router.get('/skus', async(req, res) => {
    try {
        const {rows} = await pool.query('SELECT * FROM sku_producto ORDER BY producto_id')

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})
    }
});

router.get('/sku', async(req, res) => {
    const { id, sku } = req.query;

    if(!sku && !id) return res.status(400).json({status: 400, mensaje: "No se ingreso un dato para la busqueda"});

    if(id && isNaN(parseInt(id))) return res.status(400).json({status: 400, mensaje: "error el identificador del producto no es valido"});

    let query = 'SELECT id, sku, nombre FROM sku_producto INNER JOIN productos ON sku_producto.producto_id = productos.id WHERE id = $1';
    let params = [id];

    if(sku){
        query = 'SELECT id, sku, nombre FROM sku_producto INNER JOIN productos ON sku_producto.producto_id = productos.id WHERE sku = $1'
        params = [sku];
    }

    try {
        const {rows} = await pool.query(query, params);

        if(rows.length === 0) return res.status(200).json({status: 200, mensaje: "No existen datos asociados"})

        res.status(200).json({status: 200, data: rows})
    } catch (error) {
        res.status(400).json({status: 400, mensaje: error})
    }
});

router.post('/sku', async(req, res) => {
    const { id, sku } = req.body;

    if(!id && !sku) return res.status(400).json({status: 400, mensaje: "error debes ingresar el sku y el identificador del producto"});

    if(!Number.isInteger(id)) return res.status(400).json({status: 400, mensaje: "error el identificador del producto no es valido"});

    try {
        const {rows} = await pool.query("INSERT INTO sku_producto (sku, producto_id) VALUES ($1, $2) RETURNING *", [sku, id])

        res.status(201).json({status: 201, confirmacion: "se ha agregado correctamente el sku",data: rows})

    } catch (error) {

        switch (error.constraint){
            case 'sku_producto_pkey': 
                res.status(400).json({status: 400, mensaje: "el sku ya esta asociado con el producto"});break;
            case 'sku_producto_sku_key':
                res.status(400).json({status: 400, mensaje: "el sku ya esta asociado a algun producto"});break;
            case 'fk_producto':
                res.status(404).json({status: 404, mensaje: "el producto no existe, verificar si esta creado o tiene un identificador distinto"});break;
            default:
                res.status(400).json({status: 400, mensaje: error})
        }
    }
});

router.post('/skus', async(req, res) => {
    const {skus} = req.body;

    if(!skus || skus.length <= 0) return res.status(400).json({status: 400, mensaje: "no se enviaron skus para agregar"});

    let creados = []
    let errores = []

    for(let i = 0; i < Math.ceil(skus.length/30); i++){
        let query = "INSERT INTO sku_producto (sku, producto_id) VALUES";
        var ronda = skus.slice(i*30, (i*30)+30);

        ronda.forEach((vinculo, index) =>{
            if(index !== 0) {
                query += ",";
            }

            if(vinculo.sku !== '' && Number.isInteger(vinculo.id)){
                query+= "('"+vinculo.sku+"',"+vinculo.id+")";
            } else {
                errores.push({status: 400, mensaje: "el sku "+vinculo.sku+" o el id "+vinculo.id+" esta mal"})
            }
        });

        try {
            const {rows} = await pool.query(query+" RETURNING *");

            creados = creados.concat(rows);
        } catch(error){
            switch (error.constraint){
                case 'sku_producto_pkey':
                    errores.push({status: 400, mensaje: "el sku ya esta asociado con el producto", error: error.detail});break;
                case 'sku_producto_sku_key':
                    errores.push({status: 400, mensaje: "el sku ya esta asociado a algun producto", error: error.detail});break;
                case 'fk_producto':
                    errores.push({status: 404, mensaje: "el producto no existe, verificar si esta creado o tiene un identificador distinto", error: error.detail});break;
                default:
                    errores.push({status: 400, mensaje: error})
            }
            console.log(error)
        }
    }

    if(creados.length === 0) return res.status(400).json({status: 400, mensaje:"no se vinculo ningun sku", error: errores})

    if(errores.length === 0) return res.status(201).json({status: 201, confirmacion: "Se crearon todos los skus", data: creados})

    res.status(200).json({status: 200, mensaje: "se vincularon algunos skus", data: creados, error: errores})
});

router.delete('/sku/:sku', async(req, res) => {
    try {
        const {rowCount} = await pool.query("DELETE FROM sku_producto WHERE sku = $1", [req.params.sku])

        if(rowCount === 0) return res.status(200).json({status: 200, mensaje: "el sku no existia"})

        res.status(200).json({status: 200, confirmacion: "Se elimino correctamente el sku", data: "skus elminados "+rowCount})
    } catch(error){

        if(error.constraint === "sku_producto") return res.status(400).json({status: 400, mensaje:"El sku no se puede eliminar porque existe una salida o entrada con este sku"})

        res.status(400).json({status: 400, mensaje: error})
    }
});

router.put('/sku/:sku', async(req, res) => {
    const {new_sku} = req.body;

    if(!new_sku) return res.status(400).json({status: 400, mensaje: "Debe ingresarse un sku para su alteracion"})

    try {
        const {rows} = await pool.query("UPDATE sku_producto set sku = $1 WHERE sku = $2 RETURNING * ", [new_sku, req.params.sku])

        if(rows.length === 0) return res.status(200).json({status: 200, mensaje: "no se actualizo ningun registro"})
    
        res.status(200).json({status: 200, confirmacion: "se actualizo exitosamente el sku",data: rows[0]})
    } catch (error) {
        if(error.constraint === "sku_producto") return res.status(400).json({status: 400, mensaje:"El sku no se puede cambiar porque existe una salida o entrada con este sku"})

        res.status(400).json({status: 400, mensaje: error})
    }
})

export default router