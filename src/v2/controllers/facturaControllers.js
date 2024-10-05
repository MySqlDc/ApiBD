import { pool } from "../database/conection.js";
import { crearFactura } from "../database/queries/facturas.js"

//se consultan las facturas
export const getAllBills = async (req, res, next) => {
    const { despuesDe, antesDe, fecha, codigo } = req.query;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        let query = "SELECT * FROM vista_pedidos";
        let params = [];
        if(fecha){
            query += " WHERE fecha = $1"
            params.push(fecha);
        } else if(antesDe){
            query += " WHERE fecha < $1"
            params.push(antesDe);
        } else if(despuesDe){
            query += " WHERE fecha > $1"
            params.push(despuesDe);
        } else if(codigo) {
            query += " WHERE codigo = $1"
            params.push(codigo);
        }

        const {rows} = await client.query(query, params);
        
        if(rows.length === 0) throw new Error("No se encontraron productos");
        
        await client.query("COMMIT");
        return res.status(200).send({Cantidad: rows.length, Pedidos: rows});
    } catch (error) {
        await client.query("ROLLBACK");
        next(error);
    } finally {
        client.release()
    }
}

//consulta una factura
export const getBill = async (req, res, next) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const {rows} = await client.query("SELECT * FROM vista_pedidos WHERE id = $1", [id]);

        if(rows.length == 0) throw new Error("No hay pedidos asociados a ese id")

        await client.query("COMMIT")
        return res.status(200).send({data: rows[0]});
    } catch (error) {
        await client.query("ROLLBACK");
        next(error);
    } finally {
        client.release();
    }
}

//obtiene las salidas de una plataforma en especifico
export const getBillPlatform = async(req, res, next) => {
    const { plataforma } = req.params;
    const { despuesDe, estado } = req.query;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let query = 'SELECT * FROM vista_pedidos WHERE tipo = 2 AND plataforma_id = ANY(SELECT id FROM plataformas WHERE nombre = $1)';
        let params = [plataforma];

        if(despuesDe){
            query += ' AND fecha > $2';
            params.push(despuesDe);
        }

        if(estado){
            query += ' AND estado_id = 1'
        }

        const {rows} = await client.query(query, params);

        if(rows.length == 0) throw new Error("No hay pedidos asociados a esa plataforma");

        await client.query("COMMIT");
        return res.status(200).send({cantidad: rows.length, data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

//obtiene los pedidos segun el estado que se envie
export const getBillEstados = async(req, res, next) => {
    //estado: strig el nombre del estado 
    //los estados puede consultarlo en la base de datos
    const {estado} = req.params;
    const { despuesDe } = req.query;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let query = 'SELECT * FROM vista_pedidos WHERE tipo = 2 AND estado_id = ANY(SELECT id FROM estados WHERE nombre = $1)';
        let params = [estado];

        if(despuesDe){
            query += ' AND fecha > $2';
            params.push(despuesDe);
        }

        const {rows} = await client.query(query, params);

        if(rows.length == 0) throw new Error("No hay pedidos con ese estado");

        await client.query("COMMIT");
        return res.status(200).send({cantidad: rows.length, data: rows});
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

//crea un pedido, los datos que recibe estan en la funcion crearFactura
export const createBill = async (req, res, next) => {
    const { factura } = req.body;
    
    try {
        const nuevaFactura = await crearFactura(factura);

        return res.status(200).send({data: nuevaFactura})
    } catch (error) {
        next(error);
    }
}

//actualiza el estado de un pedido
export const updateBill = async (req, res, next) => {
    const { estado } = req.body;
    const { id } = req.params;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const {rows} = await client.query("UPDATE vista_pedidos SET estado_id = $1 WHERE id = $1", [estado, id]);

        if(rows.length == 0) throw new Error("No hay pedidos asociados a ese id")

        await client.query("COMMIT")
        return res.status(200).send({data: rows[0]});
    } catch (error) {
        await client.query("ROLLBACK");
        next(error);
    } finally {
        client.release();
    }
}

//elimina un pedido
export const deleteBill = async (req, res, next) => {
    const { id } = req.params;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const {rows} = await client.query("DELETE FROM vista_pedidos WHERE id = $1 RETURNING *", [id]);

        if(rows.length == 0) throw new Error("No hay pedidos asociados a ese id")

        await client.query("COMMIT")
        return res.status(200).send({confirmacion: "Se elimino correctamente", data: rows[0]});
    } catch (error) {
        await client.query("ROLLBACK");
        next(error);
    } finally {
        client.release();
    }
}