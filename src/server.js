// import { createServer } from "https";
// import { readFileSync } from "fs";
// import { Server } from "socket.io";
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" }
})

app.set('view engine', 'ejs');

server.listen(3000);

app.get('/', (req, res) => {
    res.render('index');
})

io.on('connection', (socket) => {
    
    socket.on('initialize', ( ) => {
        // initialize shit
        setInterval( updatePage, 1000 );
    })

    
    function updatePage(  ){
        socket.emit( 'update', {asdf:"3"});
    }

})


// HTTPS crap

// const httpServer = createServer({
//     // cert locations
//     key: readFileSync( '/Users/emreadabag/Desktop/test/src/cert/key.pem'),
//     cert: readFileSync( '/Users/emreadabag/Desktop/test/src/cert/cert.pem'),
//     requestCert: true
// });

// const io = new Server(httpServer);

// io.engine.on("connection", (rawSocket) => {
//     console.log("something")
//   });

// io.on( "connection", ( socket ) => {
//     console.log("worked");
// })

// httpServer.listen(3000);