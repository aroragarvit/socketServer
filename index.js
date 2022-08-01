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
        .emit("playerJoined", { sockerId: socket.id, roomName: roomName }); // to the person waiting in the room which is creator of that room

      socket.on("toJoiner", (data) => {
        console.log(data);
        socket.broadcast.to(roomName).emit("joinerData", data);
      });

      socket.on("hello", (data) => {
        console.log(data);
      });
      socket.on("disconnect", () => {
        console.log(`${socket.id} joiner disconnected and left  ${roomName}`);
        socket.leave(roomName);
        // availableRooms.push(roomName);
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

        socket.on("hello", (data) => {
          console.log("hello");
        });
        socket.emit("disconnected", {
          socketId: socket.id,
          roomName: roomName,
        });
      });
    }
  }
});

// if user left the room all other in room gets disconnected
//       if (io.sockets.adapter.rooms[roomName]) {
//         io.sockets.adapter.rooms[roomName].sockets.forEach((socketId) => {
//           io.sockets.sockets[socketId].disconnect();
//           console.log(`${socketId} disconnected`);
//         });
//       }

//   let roomName = Math.random().toString(36).substring(2, 15);
//   clientRooms[socket.id] = roomName;
//   console.log("Socket id of creator:", socket.id);
//   socket.emit("gameCode", roomName); // emit game code
//   socket.join(roomName);
//   socket.emit("connectToRoom", { roomName: roomName, socketId: socket.id });
// }
//
// function joinGame(roomName) {
//   console.log("Socket id of joiner:", socket.id);
//   clientSet = io.sockets.adapter.rooms.get(roomName);
//   let allUsers = clientSet.size;
//
//   if (allUsers === 0) {
//     //client.emit('unknownCode');
//     console.log("unknownCode");
//     return;
//   } else if (allUsers > 1) {
//     //client.emit('tooManyPlayers');
//     console.log("tooManyPlayers");
//     return;
//   }
//
//   clientRooms[socket.id] = roomName;
//
//   socket.join(roomName);
//   socket.emit("connectToRoom", { roomName: roomName, socketId: socket.id });
//   a = Array.from(io.sockets.adapter.rooms.get(roomName));
//   console.log(a);
//
//   socket.broadcast.to(roomName).emit("playerJoined", socket.id);
//   setInterval(function () {
//     number = Math.floor(Math.random() * 100 + 1);
//     socket.broadcast.to(roomName).emit("number", number);
//     socket.nsp.to(roomName).emit("number", number + 1);
//   }, 1000);
// }
//});
//
//// run when the client connects
//io.on("connection", (socket) => {
//  console.log(`a user connected: ${socket.id}`);
//  socket.emit("Welcome", "welcome to the chat");
//  socket.on("sendMessage", (message) => {   // message send from client to socket then emit to all clients connected to the socket
//    console.log(message);
//    socket.broadcast.emit("receiveMessage", message);
//  });
//});
