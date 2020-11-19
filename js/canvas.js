
var canvas = document.getElementById("myCanvas");
var rect = canvas.getBoundingClientRect();
var canvasContext = canvas.getContext("2d");
var ink = false;

var socket = io();

// load canvas from storage
var img = new Image();
img.src = 'views/canvas.png';
img.onload = function () {
    canvasContext.drawImage(img, 0, 0);
};

var start = function(event) {
    ink = true
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

        canvasContext.lineTo(mouseX, mouseY);
        canvasContext.strokeStyle = "#ffdf06";
        canvasContext.lineWidth = 5;
        canvasContext.stroke();

        socket.emit("someoneDrawing", {x: mouseX, y: mouseY, strokeStyle: canvasContext.strokeStyle, lineWidth: canvasContext.lineWidth});

    }
}

socket.on("someoneDrawing", function(data) {
    canvasContext.lineTo(data.x, data.y);
    canvasContext.strokeStyle = data.strokeStyle;
    canvasContext.lineWidth = data.lineW;
    canvasContext.stroke();

})

socket.on("stoppedDrawing", function() {
    canvasContext.beginPath();
    })

canvas.addEventListener("mousedown", start);
canvas.addEventListener("mouseup", stop);
canvas.addEventListener("mousemove", drawing)