import pkg from 'pg';
import mongoose from 'mongoose'

const { Pool } = pkg;
import { 
    DB_HOST, 
    DB_DATABASE, 
    DB_PASSWORD, 
    DB_PORT, 
    DB_USER,
    DB_URI
} from '../../config.js';

//datos para generar la coneccion con mongo
const connectionData = {
    user: DB_USER,
    host: DB_HOST,
    database: DB_DATABASE,
    port: DB_PORT,
    password: DB_PASSWORD
}

//conexion con mongo, (de ser necesaroi, actualmente no se usa)
export const connectionMongo = async () => { 
    try {
        await mongoose.connect(DB_URI);
        console.log('Conectado a MongoDB');
    } catch (err) {
        console.error('Error al conectar a MongoDB:', err);
    }
}

export const pool = new Pool(connectionData);