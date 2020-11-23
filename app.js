var express = require('express');
var path = require('path');

var app = express();
var server = app.listen(process.env.PORT || 8000);
var io = require('socket.io').listen(server);

var users = new Array();
var leader = null;
var currentlyVoting = false;

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

        if (socket.username == leader) {
            console.log("user", socket.username, " was the leader")
            socket.broadcast.emit("leaderDisconnected");
            currentlyVoting = true;
        }

        if (users.includes(socket.username)) {
            socket.broadcast.emit("userDisconnected")
            users.splice(users.indexOf(socket.username), 1);
        }

        socket.broadcast.emit("userChanged", {userList: users, leaderUsername: leader});
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
            socket.authenticated = true;
            console.log("current user is", username);
            console.log("current logged in users:", users);

            if (users.length == 1) {
                leader = username;
                currentlyVoting = false;
            }

            socket.emit("usernameOK", {userList: users, leaderUsername: leader})
            socket.broadcast.emit("userChanged", {userList: users, leaderUsername: leader});
        }
    })

    socket.on("userLoggedOut", () => {
        console.log(socket.username, "logged out")

        if (socket.username == leader) {
            console.log("user", socket.username, " was the leader")
            socket.broadcast.emit("leaderDisconnected");
            currentlyVoting = true
        }

        if (users.includes(socket.username)) {
            users.splice(users.indexOf(socket.username), 1);
        }

        socket.broadcast.emit("userChanged", {userList: users, leaderUsername: leader});
        console.log("current logged in users:", users);
    })

    socket.on("votingStatus", () => {
        socket.emit("votingStatus", currentlyVoting)
    })

    socket.on("leaderSelected", (index) => {
        socket.emit("userChanged", {userList: users, leaderUsername: leader});
        socket.vote = index;

        var votes = new Map();
        let connectedClients = io.sockets.sockets;

        // add votes to map
        for (let socketID in connectedClients) {
            let s = connectedClients[socketID]

            if (s.authenticated) {
                if (isNaN(votes[s.vote])) {
                    votes[s.vote] = 1
                } else {
                    votes[s.vote] += 1
                }
            }
        }

        var highest = { key: null,
                        value: 0,
                        tie: false}
        var notVoted = 0;

        // count votes to see highest
        for (var key in votes) {
            if (key == "undefined") {
                notVoted += votes[key];
            } else {

                if (votes[key] > highest.value) {
                    highest.key = key
                    highest.value = votes[key]
                    highest.tie = false
                } else if (votes[key] == highest.value) {
                    highest.tie = true;
                }
            }
        }

        // update clients with results
        if (notVoted != 0) {
            socket.emit("notVoted");
            socket.broadcast.emit("notVoted");
        } else if (highest.tie) {
            socket.emit("votingTie")
            socket.broadcast.emit("votingTie")
        } else {
            leader = users[highest.key]

            // reset votes
            for (let socketID in connectedClients) {
                let s = connectedClients[socketID]
                s.vote = "undefined";
            }

            socket.broadcast.emit("votingFinished", {userList: users, leaderUsername: leader})
            socket.emit("votingFinished", {userList: users, leaderUsername: leader})
            currentlyVoting = false
        }
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

        console.log("Deleting previous sessions canvas");
        socket.broadcast.emit("clearCanvas");
    })


});


