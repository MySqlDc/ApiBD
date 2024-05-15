import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { actualizarInventarioUrgente } from '../services/api_manager.js'

const __filename = fileURLToPath(import.meta.url)
const dataFolderPath = path.resolve(__filename, '../../..', 'data');
const dataFilePath = path.join(dataFolderPath, 'data.js');
const facturaFilesPath  = path.join(dataFolderPath, 'facturas.js');

const getPath = (ruta) => {
    switch(ruta){
        case 'data':
            return dataFilePath;
        case 'facturas':
            return facturaFilesPath;
        default:
            console.log("Error ruta no definida")
    }
}

export const registrarVarios = async (registros) => {
    registros.forEach(registro => {
        registrar(registro.sku, dataFilePath)
    });
}

export const registrar = async (clave, ruta = 'data') => {
    const path = getPath(ruta);
    if(!(await archivoExiste(path))) await crearArchivo(path)

    const datos = await leerDatos(ruta);
    if(datos && ruta === 'data') {
        if(datos.hasOwnProperty(clave)){
            datos[clave]++;
            if(datos[clave]===10){
                await actualizarInventarioUrgente(clave);
                delete datos[clave]
            } 
        } else {
            datos[clave] = 1;
        }
        await escribirDatos(datos, path);
    } else {
        if(!datos.hasOwnProperty(clave.id)){
            datos[clave.id] = {estado: 'SIN SALIDA', fecha: clave.fecha};
        }
        await escribirDatos(datos, path);
    }
}

export const eliminar = async (clave, ruta = 'data') => {
    const path = getPath(ruta);
    if(!(await archivoExiste(path))) await crearArchivo(path)

    const datos = await leerDatos(ruta);
    if(datos && datos.hasOwnProperty(clave)){
        delete datos[clave];
        await escribirDatos(datos, path);
    }
}

const archivoExiste = async (path) => {
    try {
        await fs.promises.access(path);
        return true;
    } catch (error) {
        return false;
    }
}

const crearArchivo = async (filePath) => {
    try {
        // Crear el directorio si no existe
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        
        // Escribir en el archivo
        await fs.promises.writeFile(filePath, '{}');

        console.log(`Archivo ${filePath} creado exitosamente.`);
    } catch (error) {
        console.error(`Error al crear el archivo ${filePath}: ${error}`);
    } 
};

export const leerDatos = async(ruta = 'data') => {
    const path = getPath(ruta);
    try {
        const contenido = await fs.promises.readFile(path, 'utf8');
        const datos = JSON.parse(contenido);
        return datos;
    } catch (error) {
        await crearArchivo(path);
        console.log(`error al leer los datos en el archivo ${path}: ${error}`)
        const datos = await leerDatos(ruta);
        return datos;
    }
}

const escribirDatos = async(datos, path) => {
    try {
        const contenido = `${JSON.stringify(datos, null, 2)}\n`;
        await fs.promises.writeFile(path, contenido);
        console.log(`Datos escritos en el archivo ${path} exitosamente`);
    } catch (error) {
        console.log(`error al escribir los datos en el archivo ${path}: ${error}`)
    }
}