const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
    userNumbers: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    roles:{
        type: Array,
        required: true
    },
    nightTime:{
        type: Number,
        required: true
    },
    link:{
        type: String,
        required: true
    },
    users:{
        type: Array,
        required: true
    },
    admin:{
        type: Object,
        required: true
    },
    nightDeads:{
        type: Array,
        required: false
    },
    dayVotes:{
        type: Array,
        required: false
    },
    secondDayVote:{
        type: Array,
        required: false
    },
    goodAlive:{
        type: Number,
        required: true
    },
    badAlive:{
        type: Number,
        required: true
    },
    detectiveLogs:{
        type: Array,
        required: false
    },
});

module.exports = mongoose.model('Room', roomSchema, 'Room')
