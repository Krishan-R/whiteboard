var express = require('express');
var path = require('path');

var app = express();
var server = app.listen(process.env.PORT || 8000);
var io = require('socket.io').listen(server);

fs = require('fs');
sys = require('sys');

fs.unlink('views/canvas.png', (err => {
    if (err) {
        console.error(error);
        return;
    }
}))
console.log("Deleting previous sessions canvas");

console.log("listening on *:8000");

app.use(express.static(path.join(__dirname)));

app.get('/', function(req, res) {
    res.sendFile('views/index.html', {root:__dirname});
})

io.on('connection', (socket) => {
    console.log("a user connected");

    socket.on('disconnect', () => {
        console.log("a user has disconnected");
    })
})

io.on('connection', (socket) => {
    socket.on("drawing", (image) => {

        var data = image.replace(/^data:image\/\w+;base64,/, "");
        var buf = Buffer.from(data, 'base64')

        fs.writeFile("views/canvas.png", buf, function(err, result) {
            if (err) console.log("error", err);
        } )

    });
});




// var app = require('express')();
// var http = require('http').createServer(app);
// var io = require('socket.io')(http);
//
// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/views/index.html');
// });
//
// io.on('connection', (socket) => {
//    console.log("a user has connected");
// });
//
// http.listen(8000, () => {
//     console.log("listening on *:8000");
// })



