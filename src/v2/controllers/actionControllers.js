import { getQuery } from '../database/queries.js';
import { actualizarPublicaciones } from '../services/actualizarPublicaciones.js'

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