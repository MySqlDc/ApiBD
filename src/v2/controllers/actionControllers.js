import { getQuery, putQuery } from '../database/queries.js';
import { actualizarPublicaciones, actualizarRappiFull } from '../services/actualizarPublicaciones.js'

export const updateStockFile = async(req, res) => {
    const {data} = req.body;
    const regex = /[a-zA-z]/

    if(data.length === 0) return res.status(400).send({mensaje: "No se enviaron datos"});

    const arrayObjectData = data.map(arr => {
        if(!regex.test(arr[0])){
            return {
                id:  parseInt(arr[0]),
                nombre: arr[1],
                stock: arr[2]?isNaN(parseInt(arr[2]))?0:parseInt(arr[2]):0
            }
        } else {
            console.log("No se actualizo el dato, error en la entrada", arr);
        }
    }).filter(dato => dato !== undefined)

    if(arrayObjectData.length === 0) return res.status(400).send({mensaje: "No hubo datos correctos en el archivo"});

    const response = await actualizarPublicaciones(arrayObjectData);

    res.status(200);
    res.send(response);
}

export const updateStock = async (req, res) => {
    const data = await getQuery("SELECT id, unidades AS stock FROM productos WHERE update_status = true");

    const response = await actualizarPublicaciones(data);

    await putQuery("UPDATE publicaciones SET update_status = false WHERE id = ANY($1)", [data.map(dato => dato.id)])

    res.status(200);
    res.send(response);
}

export const donwloadFile = async (req, res) =>{
    const data = await getQuery("SELECT id, nombre FROM productos");

    res.status(data.status);

    if(data.status === 200){
        const head = [["id", "nombre", "Stock"]];
        const arrayData = data.response.data.map(dato => Object.values(dato));

        res.send({data: [].concat(head, arrayData)});
    } else {
        console.log(data.response.mensaje)
        res.send({mensaje: data.response.mensaje})
    }
    
}

export const updateRappi = async (req, res) => {
    const data = await getQuery("SELECT publicaciones.*, marcas.nombre AS marca FROM publicaciones LEFT JOIN marcas ON publicaciones.marca_id = marcas.id WHERE plataforma_id = 2 AND producto_id = ANY(SELECT id FROM productos WHERE update = true)")

    const response = await actualizarRappiFull(data);

    if(response.status === "error") return res.status(400).send({mensaje: "Erro en la actualizacion"});

    if(response.status === "ok") return res.status(200).send({mensaje: "actualizado"})
}

export const guardarFacturas =  async (req, res) => {
    
}