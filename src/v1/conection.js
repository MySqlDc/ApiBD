import pkg from 'pg';
import { 
    DB_HOST, 
    DB_DATABASE, 
    DB_PASSWORD, 
    DB_PORT, 
    DB_USER 
} from '../config.js';


const { Pool } = pkg;

const connectionData = {
    user: DB_USER,
    host: DB_HOST,
    database: DB_DATABASE,
    port: DB_PORT,
    password: DB_PASSWORD
}

export const pool = new Pool(connectionData)
