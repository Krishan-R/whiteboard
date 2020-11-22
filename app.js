var express = require('express');
var path = require('path');

var app = express();
var server = app.listen(process.env.PORT || 8000);
var io = require('socket.io').listen(server);

var users = new Array();
var votes = new Array();

fs = require('fs');
sys = require('sys');

//// remove previous canvas on startup
// fs.unlink('views/canvas.png', (err => {
//     if (err) {
//         console.error(err);
//         return;
//     }
// }))
// console.log("Deleting previous sessions canvas");

console.log("listening on *:8000");

app.use(express.static(path.join(__dirname)));

app.get('/', function (req, res) {
    res.sendFile('views/canvas.html', {root: __dirname});
})

io.on('connection', (socket) => {
    console.log("a user connected");

    socket.on('disconnect', () => {

        console.log(socket.username, "has disconnected");

        if (socket.username == users[0]) {
            console.log("user", socket.username, " was the leader")
            socket.broadcast.emit("leaderDisconnected");
        }

        if (users.includes(socket.username)) {
            users.splice(users.indexOf(socket.username), 1);
        }

        socket.broadcast.emit("userChanged", users);
        console.log("current logged in users:", users);

    })
})

io.on('connection', (socket) => {

    socket.on("usernameEntered", (username) => {

        if (users.includes(username)) {
            console.log(username, "already exists");
            socket.emit("usernameExists")
        } else {
            users.push(username);
            socket.username = username;
            console.log("current user is", username);
            console.log("current logged in users:", users);
            socket.emit("usernameOK", users)
            socket.broadcast.emit("userChanged", users);
        }
    })

    socket.on("userLoggedOut", () => {
        console.log(socket.username, "logged out")

        if (socket.username == users[0]) {
            console.log("user", socket.username, " was the leader")
            socket.broadcast.emit("leaderDisconnected");
        }

        if (users.includes(socket.username)) {
            users.splice(users.indexOf(socket.username), 1);
        }

        socket.broadcast.emit("userChanged", users);

        console.log("current logged in users:", users);

    })

    socket.on("leaderSelected", (index) => {
        socket.emit("userChanged", users);
    })

    socket.on("drawing", (image) => {

        var data = image.replace(/^data:image\/\w+;base64,/, "");
        var buf = Buffer.from(data, 'base64')

        fs.writeFile("views/canvas.png", buf, function (err, result) {
            if (err) console.log("error", err);
        })
    });

    socket.on("someoneDrawing", (data) => {
        socket.broadcast.emit("someoneDrawing", data);
    })

    socket.on("stoppedDrawing", (data) => {
        socket.broadcast.emit("stoppedDrawing", data);
    })

    socket.on("someoneErasing", (data) => {
        socket.broadcast.emit("someoneErasing", data);
    })

    socket.on("clearCanvas", () => {

        fs.unlink('views/canvas.png', (err => {
            if (err) {
                console.error(err);
                return;
            }
        }))

        console.log("Deleting previous sessions canvas", "clear");
        socket.broadcast.emit("clearCanvas");
    })


});


