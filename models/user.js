const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required : true
    },
    room:{
        type: mongoose.ObjectId,
        required: false
    }
});

module.exports = mongoose.model('User', userSchema, 'User')
