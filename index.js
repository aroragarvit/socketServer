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
let availableRooms = [];

io.on("connection", (socket) => {
  console.log(`a user connected: ${socket.id}`);
  socket.on("playGame", createNewGame);

  socket.on("hello", async (data) => {
    console.log(data.data + " from outside");
    await socket.broadcast.to(data.roomName).emit("handleByJoiner", data.data);
  });

  function createNewGame() {
    if (availableRooms.length > 0) {
      console.log("Available Rooms", availableRooms);
      const roomName = availableRooms.pop();
      socket.join(roomName);
      console.log(`${socket.id} joined room ${roomName}`);
      const a = Array.from(io.sockets.adapter.rooms.get(roomName));
      console.log(`All ids in room ${roomName} are ${a}`);
      clientRooms[socket.id] = roomName;

      socket.emit("secondConnectedToRoom", {
        roomName: roomName,
        socketId: socket.id,
      }); // see for self

      socket.broadcast
        .to(roomName)
        .emit("playerJoined", { socketId: socket.id, roomName: roomName }); // to the person waiting in the room which is creator of that room

      socket.on("disconnect", () => {
        console.log(`${socket.id} joiner disconnected and left  ${roomName}`);
        socket.leave(roomName);

        socket.emit("disconnected", {
          // not showing anything
          roomName: roomName,
          socketId: socket.id,
        });
        socket.broadcast
          .to(roomName)
          .emit("playerLeft", { socketId: socket.id, roomName: roomName }); // to the person in the room
        //console.log(Array.from(io.sockets.adapter.rooms.get(roomName))[0]);
      });
    } else {
      let roomName = Math.random().toString(36).substring(2, 15);
      availableRooms.push(roomName);
      socket.join(roomName);
      clientRooms[socket.id] = roomName;
      console.log(`${socket.id} created and joined room ${roomName}`);
      socket.emit("connectToRoom", { roomName: roomName, socketId: socket.id }); // see for self

      // when client left the room
      socket.on("disconnect", () => {
        console.log(`${socket.id} creator disconnected and left ${roomName} `);
        socket.leave(roomName);
        availableRooms = availableRooms.filter((room) => room !== roomName);
        socket.broadcast
          .to(roomName)
          .emit("playerLeft", { socketId: socket.id, roomName: roomName });

        socket.emit("disconnected", {
          socketId: socket.id,
          roomName: roomName,
        });
      });
    }
  }
});
