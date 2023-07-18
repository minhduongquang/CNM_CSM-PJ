const WS = require("ws");
const server = new WS.Server({port: "PORT"});

server.on("connection", async(socket, req) => {
});

const socket = new WS("ws://ip.ip:port");

socket.on("open", () => {

});

socket.on("close", () => {

});

socket.on("message", message => {

});