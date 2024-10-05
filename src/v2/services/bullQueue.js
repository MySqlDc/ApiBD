import Queue from "bull";
import { actualizarML } from "./actualizarPublicaciones.js";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "../../config.js";

//crea la conexion con la base de datos
const publicacionesQueue = new Queue('publicacionesCola', {
    redis:{
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD
    }
});

//tarea que se ejecutara
publicacionesQueue.process(async(job) => {
    const publicacion = job.data;
    await actualizarML(publicacion)
    console.log('Hecho')
})

//agrega todas las publicaciones que se desean agregar a la cola de ejecucion
export const addPublicacionesToQueue = (publicaciones) => {
    publicaciones.forEach(publicacion => {
        console.log('agregado', publicacion)
        publicacionesQueue.add(publicacion, {
            removeOnComplete: 500,
            removeOnFail: 500
        })
    });
}