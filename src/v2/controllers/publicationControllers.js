import { deleteQuery, getQuery, postQuery, putQuery } from '../database/queries.js';

export const getAllPublication = async (req, res)=> {
    const data = await getQuery("SELECT * FROM publicaciones");
    res.status(data.status);
    res.send(data.response);
}

export const getPublication = async (req, res) => {
    const {id} = req.params;

    const data = await getQuery("SELECT p.id AS key, p.codigo, p.variante, plataformas.nombre AS plataforma, p.active FROM publicaciones p INNER JOIN plataformas ON p.plataforma_id = plataformas.id WHERE p.producto_id = $1", [id]);

    res.status(data.status);
    res.send(data.response);
}

export const createPublication = async (req, res) => {
    const { codigo, variante, plataforma, producto, nombre, marca, precio, descuento } = req.body;

    if(plataforma === 2){
        let marca_id = "";
        let marca_response = await getQuery("SELECT * FROM marcas WHERE nombre = $1", [marca.toString().toLowerCase()])

        if(!marca_response.response?.data) {
            marca_response = await postQuery("INSERT INTO marcas (nombre) VALUES ($1)", [marca.toString().toLowerCase()])
            marca_id = marca_response.response?.data.id;
        } else {
            marca_id = marca_response.response?.data[0].id;
        }

        const data = await postQuery("INSERT INTO publicaciones (codigo, variante, plataforma_id, producto_id, nombre, precio, descuento, marca_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [codigo, variante, plataforma, producto, nombre, precio, descuento, marca_id]);

        res.status(data.status);
        res.send(data.response);
    } else {
        
        const data = await postQuery("INSERT INTO publicaciones (codigo, variante, plataforma_id, producto_id) VALUES ($1, $2, $3, $4)", [codigo, variante, plataforma, producto])
        
        res.status(data.status);
        res.send(data.response);
    }
}

export const updatePublication = async (req, res) => {
    const { codigo , variante, plataforma, active } = req.body;
    const { id } = req.params;

    const data = await putQuery("UPDATE publicaciones SET codigo = COALESCE($1,codigo), variante = COALESCE($2, variante), plataforma_id = COALESCE($3, plataforma_id), active = COALESCE($4, active) WHERE id = $5", [codigo , variante, plataforma, active, id]);

    res.status(data.status);
    res.send(data.response);
}

export const activePublication = async (req, res) => {
    const { ids } = req.body;
    
    const data = await putQuery("UPDATE publicaciones SET active = true WHERE producto_id = ANY($1)", [ids]);

    res.status(data.status)
    res.send(data.response)
}

export const inactivePublication = async (req, res) => {
    const { ids } = req.body;
    
    const data = await putQuery("UPDATE publicaciones SET active = false WHERE producto_id = ANY($1)", [ids]);

    res.status(data.status)
    res.send(data.response)
}

export const deletePublication = async (req, res) => {
    const { id } = req.params;

    const data = await deleteQuery("DELETE FROM publicaciones WHERE id = $1", [id]);

    res.status(data.status);
    res.send(data.response);
}