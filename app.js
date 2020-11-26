var express = require('express');
var path = require('path');

var app = express();
var server = app.listen(process.env.PORT || 8000);
var io = require('socket.io').listen(server);

var users = new Array();
var leader = null;
var currentlyLeaderVoting = false;
var editingList = new Array();

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
            currentlyLeaderVoting = true;
        }

        if (users.includes(socket.username)) {
            socket.broadcast.emit("userDisconnected")
            users.splice(users.indexOf(socket.username), 1);
        }

        socket.broadcast.emit("editingListChanged", {userList: users, leaderUsername: leader, editingList: editingList});
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
                currentlyLeaderVoting = true;
                socket.emit("leaderVotingStatus", currentlyLeaderVoting)
            }

            socket.emit("usernameOK", {userList: users, leaderUsername: leader, editingList: editingList})
            socket.broadcast.emit("editingListChanged", {userList: users, leaderUsername: leader, editingList: editingList});
        }
    })

    socket.on("userLoggedOut", () => {
        console.log(socket.username, "logged out")

        if (socket.username == leader) {
            console.log("user", socket.username, " was the leader")
            socket.broadcast.emit("leaderDisconnected");
            currentlyLeaderVoting = true
        }

        if (users.includes(socket.username)) {
            users.splice(users.indexOf(socket.username), 1);
        }

        socket.broadcast.emit("editingListChanged", {userList: users, leaderUsername: leader, editingList: editingList});
        console.log("current logged in users:", users);
    })

    socket.on("leaderVotingStatus", () => {
        socket.emit("leaderVotingStatus", currentlyLeaderVoting)
    })

    socket.on("leaderSelected", (index) => {
        socket.emit("editingListChanged", {userList: users, leaderUsername: leader, editingList: editingList});
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
            editingList = new Array();
            editingList.push(highest.key)

            // reset votes
            for (let socketID in connectedClients) {
                let s = connectedClients[socketID]
                s.vote = "undefined";
            }

            socket.broadcast.emit("votingFinished", {userList: users, leaderUsername: leader, editingList: editingList})
            socket.emit("votingFinished", {userList: users, leaderUsername: leader, editingList: editingList})
            currentlyLeaderVoting = false
        }
    })

    socket.on("editingUserSelected", (index) => {

        // checks to see if user is already in editing list
        if (editingList.indexOf(index) >= 0) {

            if (users[index] != leader) {
                editingList.splice(editingList.indexOf(index), 1)
            }
        } else {
            editingList.push(index);
        }

        socket.emit("editingListChanged", {userList: users, leaderUsername: leader, editingList: editingList})
        socket.broadcast.emit("editingListChanged", {userList: users, leaderUsername: leader, editingList: editingList})

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

    socket.on("requestTempImage", (redirect) => {

        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for ( var i = 0; i < 10; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        var tempPath = "views/" + result + ".png";

        fs.copyFile('views/canvas.png', tempPath, (err) => {
            console.log('views/canvas.png was copied to', tempPath);

            switch (redirect) {
                case "updateCanvas":
                    socket.emit("updateCanvas", tempPath);
                    break;
                case "downloadFile":
                    socket.emit("downloadFile", tempPath);
                    break;
            }
        });
    })

    socket.on("deleteTempImage", (path) => {
        fs.unlink(path, (err => {
            if (err) {
                console.error(err);
                return;
            }
        }))
    })

    socket.on("updateClients", () => {
        socket.broadcast.emit("updateClients");
    })

    socket.on("closeCanvas", () => {
        socket.broadcast.emit("closeCanvas");
        socket.emit("closeCanvas");
    })

    socket.on("saveCanvas", () => {
        socket.emit("saveCanvas")
        socket.broadcast.emit("saveCanvas")
    })

    socket.on("saveVoteSent", (result) => {
        socket.saveVote = result;
        let votes = new Map();

        let numberClients = 0
        let connectedClients = io.sockets.sockets;

        // count votes
        for (var sockets in connectedClients) {
            let s = connectedClients[sockets]
            if (s.authenticated) {
                numberClients++

                if (isNaN(votes[s.saveVote])) {
                    votes[s.saveVote] = 1
                } else {
                    votes[s.saveVote]++
                }
            }
        }

        // calculate result
        if (votes["yes"] >= numberClients/2) {
            socket.emit("majorityVote")
            socket.broadcast.emit("majorityVote")

            var currentdate = new Date();
            let localCopy = "Backups/Whiteboard "
                + currentdate.getFullYear() + "-"
                + (currentdate.getMonth()+1).toString().padStart(2, '0') + "-"
                + currentdate.getDate().toString().padStart(2, '0') + "T"
                + currentdate.getHours().toString().padStart(2, '0') + "-"
                + currentdate.getMinutes().toString().padStart(2, '0') + "-"
                + currentdate.getSeconds().toString().padStart(2, '0') + ".png";

            fs.copyFile('views/canvas.png', localCopy, (err) => {
                console.log('views/canvas.png was copied to', localCopy);

            });

            // reset votes
            for (var sockets in connectedClients) {
                let s = connectedClients[sockets]
                s.saveVote = "undefined"
            }

        } else {
            if (votes["undefined"] > 0) {
                console.log("there are still users left to vote")
            } else {

                for (var sockets in connectedClients) {
                    let s = connectedClients[sockets]
                    s.saveVote = "undefined"
                }

                socket.emit("noMajorityVote")
                socket.broadcast.emit("noMajorityVote")

            }
        }
    })
});