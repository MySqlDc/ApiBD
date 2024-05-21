import { deleteQuery, getQuery, postQuery, putQuery } from '../database/queries.js';

export const getAllPlatform = async (req, res) => {
    const data = await getQuery("SELECT * FROM plataformas");
    res.status(data.status);
    res.send(data.response);
}

export const getPlatform = async (req, res) => {
    const {id} = req.params;

    const data = await getQuery("SELECT * FROM plataformas WHERE id = $1", [id]);

    res.status(data.status);
    res.send(data.response);
}

export const createPlatform = async (req, res) => {
    const { nombre } = req.body;

    const data = await postQuery("INSERT INTO plataformas (nombre) VALUES ($1)", [nombre])
    res.status(data.status);
    res.send(data.response);
}

export const updatePlatform = async (req, res) => {
    const { nombre } = req.body;
    const { id } = req.params;

    const data = await putQuery("UPDATE plataformas SET nombre = COALESCE($1,nombre) WHERE id = $2", [nombre, id]);

    res.status(data.status);
    res.send(data.response);
}

export const deletePlatform = async (req, res) => {
    const { id } = req.params;

    const data = await deleteQuery("DELETE FROM plataformas WHERE id = $1", [id]);

    res.status(data.status);
    res.send(data.response);
}