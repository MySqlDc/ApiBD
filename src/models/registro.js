import mongoose from 'mongoose';

const registroSchema = mongoose.Schema({
    registro:{
        type: String,
        required: true
    }
});

const registro = mongoose.model('Registro', registroSchema)

export default registro;