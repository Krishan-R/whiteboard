
var inputUsername = document.getElementById("inputUsername");
var inputUsernameButton = document.getElementById("inputUsernameButton")

var socket = io();

inputUsernameButton.onclick = function () {
    console.log(inputUsername.value)
    socket.emit("login", inputUsername.value);
    window.location.href="/canvas";
}