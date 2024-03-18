//Puerto de ejecucion de express
export const PORT = process.env.PORT || 3000;

//Datos de la base de datos
export const DB_HOST = process.env.DB_HOST || 'roundhouse.proxy.rlwy.net'
export const DB_USER = process.env.DB_USER || 'postgres'
export const DB_PORT = process.env.DB_PORT || 27690
export const DB_PASSWORD = process.env.DB_PASSWORD || 'Ec2E-4aBDC1cB2GECecEdCDG5f44g33E'
export const DB_DATABASE = process.env.DB_DATABASE || 'railway'


//Datos API MercadoLIbre
export const API_CLIENT_ML = process.env.API_CLIENT_ML || '8283537373635512';
export const API_SECRET_ML = process.env.API_SECRET_ML || 'LZEQeqdsEIYNUS516MhoT9kW7RQK7oVB';
export const API_REFRESH_ML = process.env.API_REFRESH_ML || 'TG-65b811b17ef956000111e95f-149996738'

//Datos API Rappi
export const API_KEY_RAPPI = process.env.API_KEY_RAPPI || '455fcb8c-135a-4481-86e2-c85801241a2f';
export const STORE_ID_RAPPI = process.env.STORE_ID_RAPPI || '900258178';


//DATOS API falabella
export const API_KEY_FALABELLA = process.env.API_KEY_FALABELLA || 'cfc7d8929f19614468ad0a484ee641193e91668f';
export const USER_FALABELLA = process.env.USER_FALABELLA || 'inducorsas@gmail.com'