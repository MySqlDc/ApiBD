import { pool } from '../../conection.js';
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dataFolderPath = path.resolve(__filename, '../..', 'data');
const dataFilePath = path.join(dataFolderPath, 'data.js')


export const registrarVarios = async (registros) => {
    registros.forEach(registro => {
        registrar(registro.sku)
    });
}

export const eliminarVarios = async (registros) => {
    registros.forEach(registro => {
        eliminar(registro)
    });
}

const registrar = async (clave) => {
    if(!(await archivoExiste())) crearArchivo()

    const datos = await leerDatos();
    if(datos) {
        datos[clave] = clave;
        await escribirDatos(datos);
    }
}

export const eliminar = async (clave) => {
    if(!(await archivoExiste())) crearArchivo()

    const datos = await leerDatos();
    if(datos && datos.hasOwnProperty(clave)){
        delete datos[clave];
        await escribirDatos(datos);
    }
}

const archivoExiste = async () => {
    try {
        await fs.promises.access(dataFilePath);
        return true;
    } catch (error) {
        return false;
    }
}

const crearArchivo = async() => {
    try {
        await fs.promises.mkdir(dataFolderPath, { recursive: true});
        await fs.promises.writeFile(dataFilePath, 'export const data = {}')
        console.log(`Archivo ${dataFilePath} creado exitosamente.`)
    } catch (error) {
        console.error(`Error al crear el archivo ${dataFilePath}: ${error}`)
    }
}

const leerDatos = async() => {
    try {

        const contenido = await fs.promises.readFile(dataFilePath, 'urf-8');
        const datos = eval(contenido);
        return datos;

    } catch (error) {
        console.log(`error al leer los datos en el archivo ${dataFilePath}: ${error}`)
        return null;
    }
}

const escribirDatos = async(datos) => {
    try {
        const contenido = `export const data = ${JSON.stringify(datos, null, 2)};\n`;
        await fs.promises.writeFile(dataFilePath, contenido)<
        console.log(`Datos escritos en el archivo ${dataFilePath} exitosamente`)
    } catch (error) {
        console.log(`error al escribir los datos en el archivo ${dataFilePath}: ${error}`)
    }
}