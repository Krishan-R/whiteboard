
var canvas = document.getElementById("myCanvas");
var rect = canvas.getBoundingClientRect();
var canvasContext = canvas.getContext("2d");

var ink = false;
var erase = false;

var lineWidth = 5

var socket = io();

// load canvas from storage
var img = new Image();
img.src = 'views/canvas.png';
img.onload = function () {
    canvasContext.drawImage(img, 0, 0);
};

var start = function(event) {
    ink = false;
    erase = true
    rect = canvas.getBoundingClientRect();
    drawing(event);
}

var stop = function(event) {
    socket.emit("stoppedDrawing");
    ink = false;
    erase = false
    canvasContext.beginPath();

    // send canvas data to be saved
    var image = canvas.toDataURL();
    socket.emit("drawing", image);
}

var drawing = function(event) {
    mouseX = (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
    mouseY = (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;


    if (ink) {

        canvasContext.lineTo(mouseX, mouseY);
        canvasContext.strokeStyle = "#ffdf06";
        canvasContext.lineWidth = lineWidth;
        canvasContext.stroke();

        socket.emit("someoneDrawing", {x: mouseX, y: mouseY, strokeStyle: canvasContext.strokeStyle, lineWidth: canvasContext.lineWidth});

    } else if (erase) {

        canvasContext.globalCompositeOperation = "destination-out";
        // canvasContext.arc(mouseX, mouseY, 2, 0, Math.PI*2, false);
        // canvasContext.fill();

        canvasContext.lineTo(mouseX, mouseY);
        canvasContext.lineWidth = lineWidth;
        canvasContext.stroke();

        socket.emit("someoneErasing", {x: mouseX, y: mouseY, strokeStyle: canvasContext.strokeStyle, lineWidth: canvasContext.lineWidth});

        canvasContext.globalCompositeOperation = "source-over";

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

canvas.addEventListener("mousedown", start);
canvas.addEventListener("mouseup", stop);
canvas.addEventListener("mousemove", drawing)