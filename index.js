const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Store rooms
let rooms = {};

// Routes
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About This Project" });
});

app.get("/editor/:roomId", (req, res) => {
  res.render("editor", { roomId: req.params.roomId });
});

// Socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Create or join room
  socket.on("joinRoom", (roomCode) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { users: [], code: { html: "", css: "", js: "" } };
    }
    
    rooms[roomCode].users.push(socket.id);
    socket.join(roomCode);
    socket.emit("roomJoined", roomCode);
    
    // Send existing code to new user
    socket.emit("updateCode", rooms[roomCode].code);
  });

  // Handle code changes
  socket.on("codeChange", (data) => {
    if (rooms[data.room]) {
      rooms[data.room].code = data;
      socket.to(data.room).emit("updateCode", data);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    for (let roomCode in rooms) {
      rooms[roomCode].users = rooms[roomCode].users.filter(id => id !== socket.id);
      if (rooms[roomCode].users.length === 0) {
        delete rooms[roomCode];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
