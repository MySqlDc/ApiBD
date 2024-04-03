import mongoose from 'mongoose';

const registroSchema = mongoose.Schema({
    registro:{
        type: String,
        required: true
    }
});

export default registroSchema;