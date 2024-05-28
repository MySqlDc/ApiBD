import mongoose from 'mongoose';

const productoSchema = mongoose.Schema({
    sku: { type: String, require: true},
    unidades: { type: Number, require: true}
});

const Producto = mongoose.model('Producto', productoSchema);

export default Producto;