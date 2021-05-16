const express = require('express');
const methodOverride = require('method-override')
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken')

const game = require("./socket/game");


const options = {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
};
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, options);

const whitelist = ['http://localhost:3000'];
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}
app.use(cors(corsOptions))

mongoose.connect('mongodb://localhost:27017/mafia', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // "auth": {"authSource": "admin"},
    // "user": "shayan",
    // "pass": "13465278",
});

global.config = require('./config');

app.use(express.json());
app.use(methodOverride('method'));
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended : false}));

const onConnection = (socket) => {
    console.log('hey you connected! '+ socket.id);
    game(io, socket);
}

io.on("connect", onConnection);

app.use(`/`, require('./routes/index'))

httpServer.listen(config.port, ()=>{
    console.log(`we are up now on localhost:${config.port} :D`)
})
