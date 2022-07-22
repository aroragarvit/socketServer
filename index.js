const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io"); 
const server = http.createServer(app);
const cors = require("cors");
app.use(cors());
const io = new Server(server, {
  cors: { origins: "http:://localhost:3000", methods: ["Get", "Post"] },
});

server.listen(3001, () => {
  console.log("server is running on port 3001");
});


const clientRooms = {}; // socket id as key and room name as value
const state = {};



io.on("connection", (socket) => {
  console.log(`a user connected: ${socket.id}`);
  socket.on("newGame", createNewGame);
  socket.on("joinGame", joinGame);

  function createNewGame() {
    let roomName = Math.random().toString(36).substring(2, 15);
    clientRooms[socket.id] = roomName;
    console.log("Socket id of creator:", socket.id);
    socket.emit("gameCode", roomName); // emit game code 
    socket.join(roomName);
    socket.emit("connectToRoom", { "roomName": roomName , "socketId": socket.id});

  }

  function joinGame(roomName) {
    console.log("Socket id of joiner:", socket.id);
    clientSet=io.sockets.adapter.rooms.get(roomName);
    let allUsers = clientSet.size
    
    
    //
    //  if (allUsers === 0) {
    //   //client.emit('unknownCode');
    //   console.log("unknownCode");
    //   return;
    // } else if (allUsers > 1) {
    //   //client.emit('tooManyPlayers');
    //   console.log("tooManyPlayers");
    //   return;
    // }
    
    clientRooms[socket.id] = roomName;

    socket.join(roomName);
    socket.emit("connectToRoom", { "roomName": roomName , "socketId": socket.id});
    console.log(io.of("/").adapter);

    // console.log("numClients", numClients);

    // client.number = 2;
    // client.emit('init', 2);
  }
});

// run when the client connects
//io.on("connection", (socket) => {
//  console.log(`a user connected: ${socket.id}`);
//  socket.emit("Welcome", "welcome to the chat");
//  socket.on("sendMessage", (message) => {   // message send from client to socket then emit to all clients connected to the socket
//    console.log(message);
//    socket.broadcast.emit("receiveMessage", message);
//  });
//});
