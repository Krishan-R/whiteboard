
var login = true;

var clearCanvasButton = document.getElementById("clearCanvas");
var eraseButton = document.getElementById("eraseButton");
var blackButton = document.getElementById("blackButton");
var blueButton = document.getElementById("blueButton");
var pinkButton = document.getElementById("pinkButton");
var redButton = document.getElementById("redButton");
var yellowButton = document.getElementById("yellowButton");
var greenButton = document.getElementById("greenButton");
var weightSelector = document.getElementById('weightSelector');

var canvas = document.getElementById("myCanvas");
var rect = canvas.getBoundingClientRect();
var canvasContext = canvas.getContext("2d");

var ink = false;
var erase = false;

var lineWidth = weightSelector.value;

var socket = io();

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
    console.log("help");
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

var whiteboard = document.getElementById("whiteboard");
var testButton = document.getElementById("testButton");

testButton.onclick = function () {
    console.log("button pressed")
    login = !login;

    if (login) {
        whiteboard.style.display = "none";
    } else {
        whiteboard.style.display = "block";
    }

}


canvas.addEventListener("mousedown", start);
canvas.addEventListener("mouseup", stop);
canvas.addEventListener("mousemove", drawing)