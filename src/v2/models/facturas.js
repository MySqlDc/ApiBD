import producto from './producto.js'
import mongoose from 'mongoose';

const facturaSchema = mongoose.Schema({
    codigo: { type: String, require: true},
    fecha: { type: Date, required: true },
    estado: { type: String, required: true },
    productos: [producto.schema]
});

const Factura = mongoose.model('Factura', facturaSchema);

export default Factura;