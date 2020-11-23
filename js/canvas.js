var authenticated = false;
var focus = "login";
var leader = null;

var login = document.getElementById("login");
var whiteboard = document.getElementById("whiteboard");
var chooseLeader = document.getElementById("chooseLeader")

var logoutButton = document.getElementById("logoutButton");
var loginButton = document.getElementById("loginButton")
var usernameTextbox = document.getElementById("usernameTextbox")
var usernameError = document.getElementById("usernameError")

var chooseLeadersList = document.getElementById("chooseLeadersList")

var clearCanvasButton = document.getElementById("clearCanvas");
var eraseButton = document.getElementById("eraseButton");
var blackButton = document.getElementById("blackButton");
var blueButton = document.getElementById("blueButton");
var pinkButton = document.getElementById("pinkButton");
var redButton = document.getElementById("redButton");
var yellowButton = document.getElementById("yellowButton");
var greenButton = document.getElementById("greenButton");
var weightSelector = document.getElementById('weightSelector');
var connectedUserList = document.getElementById("connectedUsersList")
var canvas = document.getElementById("myCanvas");
var rect = canvas.getBoundingClientRect();
var canvasContext = canvas.getContext("2d");

var ink = false;
var erase = false;
var lineWidth = weightSelector.value;

var socket = io();

socket.emit("votingStatus");

socket.on("votingStatus", function(status) {
    if (authenticated) {
        if (status == true) {
            focus = "chooseLeader"
            focusChanged();
        }
    }
})

loginButton.onclick = function () {
    if (usernameTextbox.value != "") {
        socket.emit("usernameEntered", usernameTextbox.value)
    }
}

socket.on("usernameExists", function() {
    usernameError.style.display = "inline";
})

socket.on("usernameOK", function (data) {

    focus = "whiteboard"
    authenticated = true;
    focusChanged()

    updateUserList(data)

    socket.emit("votingStatus");

})

socket.on("userChanged", function(data) {

    updateUserList(data)

})


function updateUserList(data) {
    users = data.userList;
    leader = data.leaderUsername;

    connectedUserList.innerHTML = "";
    chooseLeadersList.innerHTML = "";

    for (let i = 0; i < users.length; i++) {

        let li = document.createElement("li");
        li.setAttribute("id", ("listElement"+i))
        let additionalText = ""
        if (users[i] == leader) {
            additionalText += " (Leader)"
        }
        if (users[i] == usernameTextbox.value) {
            additionalText += " (You)"
        }
        li.appendChild(document.createTextNode(users[i] + additionalText))
        connectedUserList.appendChild(li)

        let leaderLi = document.createElement("li");
        leaderLi.setAttribute("id", ("leaderListElement") + i)
        if (users[i] == usernameTextbox.value) {
            leaderLi.appendChild(document.createTextNode(users[i] + " (You)"));
        } else {
            leaderLi.appendChild(document.createTextNode(users[i]));
        }

        if (i == selectedLeader) {
            leaderLi.style.color = "#FF0000"
        }
        chooseLeadersList.appendChild(leaderLi)

    }
}

var selectedLeader = null;
chooseLeadersList.addEventListener("click", function (e) {
    if (e.target.tagName == "LI") {
        let li = document.getElementById(e.target.id)

        selectedLeader = e.target.id.slice(-1);

        socket.emit("leaderSelected", selectedLeader);

    }
})

socket.on("leaderDisconnected", function() {

    if (focus == "whiteboard") {
        focus = "chooseLeader";
        focusChanged();
    }
})

socket.on("notVoted", function () {
    document.getElementById("notVoted").style.display = "inline"
})

socket.on("votingTie", function () {
    document.getElementById("notVoted").style.display = "none"
    document.getElementById("votingTie").style.display = "inline"
})

socket.on("votingFinished", function(data) {
    leader = data.leaderUsername
    document.getElementById("notVoted").style.display = "none"
    document.getElementById("votingTie").style.display = "none"
    selectedLeader = null;
    updateUserList(data);

    if (authenticated){
        focus = "whiteboard";
        focusChanged()
    }

})


// load canvas from storage
var img = new Image();
img.src = 'views/canvas.png';
img.onload = function () {
    canvasContext.drawImage(img, 0, 0);
}

var start = function(event) {
    ink = true;
    rect = canvas.getBoundingClientRect();
    drawing(event);
}

var stop = function(event) {
    socket.emit("stoppedDrawing");
    ink = false;
    canvasContext.beginPath();

    // send canvas data to be saved
    var image = canvas.toDataURL();
    socket.emit("drawing", image);
}

var drawing = function(event) {

    mouseX = (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
    mouseY = (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;

    if (ink) {
        if (erase) {

            canvasContext.globalCompositeOperation = "destination-out";

            canvasContext.lineTo(mouseX, mouseY);
            canvasContext.lineWidth = lineWidth;
            canvasContext.stroke();

            socket.emit("someoneErasing", {x: mouseX, y: mouseY, strokeStyle: canvasContext.strokeStyle, lineWidth: canvasContext.lineWidth});

            canvasContext.globalCompositeOperation = "source-over";

        } else {

            canvasContext.lineTo(mouseX, mouseY);
            canvasContext.lineWidth = lineWidth;
            canvasContext.stroke();

            socket.emit("someoneDrawing", {x: mouseX, y: mouseY, strokeStyle: canvasContext.strokeStyle, lineWidth: canvasContext.lineWidth});

        }
    }
}

socket.on("someoneDrawing", function(data) {

    canvasContext.lineTo(data.x, data.y);
    canvasContext.strokeStyle = data.strokeStyle;
    canvasContext.lineWidth = data.lineWidth;
    canvasContext.stroke();

})

socket.on("stoppedDrawing", function() {
    canvasContext.beginPath();
    })

socket.on("someoneErasing", function(data) {

    canvasContext.globalCompositeOperation = "destination-out";

    canvasContext.lineTo(data.x, data.y);
    canvasContext.strokeStyle = data.strokeStyle;
    canvasContext.lineWidth = data.lineWidth;
    canvasContext.stroke();

    canvasContext.globalCompositeOperation = "source-over";

})

socket.on("clearCanvas", function() {
    canvasContext.clearRect(0,0, canvas.width, canvas.height);
})

clearCanvasButton.onclick = function () {
    socket.emit("clearCanvas");
    canvasContext.clearRect(0,0, canvas.width, canvas.height);
}
eraseButton.onclick = function () {
    erase = true;
}
blackButton.onclick = function () {
    erase = false;
    canvasContext.strokeStyle = "#000000";
}
blueButton.onclick = function () {
    erase = false;
    canvasContext.strokeStyle = "#0000FF";
}
pinkButton.onclick = function () {
    erase = false;
    canvasContext.strokeStyle = "#FF1493";
}
redButton.onclick = function () {
    erase = false;
    canvasContext.strokeStyle = "#FF0000";
}
yellowButton.onclick = function () {
    erase = false;
    canvasContext.strokeStyle = "#FFFF00";
}
greenButton.onclick = function () {
    erase = false;
    canvasContext.strokeStyle = "#008000";
}
weightSelector.onchange = function () {
    lineWidth = weightSelector.value;
}

socket.on('disconnect', function () {
    alert("connection lost");
})

logoutButton.onclick = function () {
    focus = "login";
    authenticated = false;
    focusChanged();

    socket.emit("userLoggedOut");
}

function focusChanged() {

    switch (focus) {
        case "login":
            whiteboard.style.display = "none";
            login.style.display = "block";
            chooseLeader.style.display = "none";
            break;
        case "whiteboard":
            whiteboard.style.display = "block";
            login.style.display = "none";
            chooseLeader.style.display = "none";
            break;
        case "chooseLeader":
            whiteboard.style.display = "none";
            login.style.display = "none";
            chooseLeader.style.display = "block";
            break;
        default:
            whiteboard.style.display = "none";
            login.style.display = "block";
            chooseLeader.style.display = "none";
            break;
    }
}

canvas.addEventListener("mousedown", start);
canvas.addEventListener("mouseup", stop);
canvas.addEventListener("mousemove", drawing)