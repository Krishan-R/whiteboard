
var currentCanvas

var canvas = document.getElementById("myCanvas");
var rect = canvas.getBoundingClientRect();
var canvasContext = canvas.getContext("2d");

var ink = false;

var socket = io();


var img = new Image();
img.src = 'views/canvas.png';

img.onload = function () {
    canvasContext.drawImage(img, 0, 0);
};


var start = function(event) {
    // console.log("starting");
    ink = true
    rect = canvas.getBoundingClientRect();
    drawing(event);
}

var stop = function(event) {
    // console.log("stopped");
    ink = false;
    canvasContext.beginPath();

    currentCanvas = canvasContext.getImageData(0, 0, canvas.width, canvas.height);

    console.log(currentCanvas.data);

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    canvasContext.putImageData(currentCanvas, 0, 0);






    var image = canvas.toDataURL();



    socket.emit("drawing", image);


}

var drawing = function(event) {
    // console.log("drawing");

    mouseX = (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
    mouseY = (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;

    if (ink) {
        canvasContext.lineTo(mouseX, mouseY);
        canvasContext.strokeStyle = "#ffdf06";
        canvasContext.lineWidth = 5;
        canvasContext.stroke();

    }

}

canvas.addEventListener("mousedown", start);
canvas.addEventListener("mouseup", stop);
canvas.addEventListener("mousemove", drawing)