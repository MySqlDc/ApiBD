import { pool } from "../conection.js";

//consulta las publicaciones respectivas de los productos
//y regresa la cantidad de unidades que estan en fijas o estan viculadas al inventario
export const contarPublicaciones = async(ids) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {rows} = await client.query('SELECT COUNT(pf.publicacion_id) AS fijas, COUNT(p.id) - COUNT(pf.publicacion_id) AS normales FROM publicaciones p LEFT JOIN publicaciones_fijas pf ON p.id = pf.publicacion_id WHERE p.producto_id = ANY($1)', [ids]);

        if(rows.length === 0) throw new Error('No hubo datos');

        await client.query('COMMIT');
        return rows
    } catch (error) {
        await client.query('ROLLBACK');
        return {fijos: 0, normales: 0};
    } finally {
        client.release();
    }
}