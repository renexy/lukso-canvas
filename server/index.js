const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let sessions = {};

app.get("/", (req, res) => {
  res.send("Server is running");
});

io.on("connection", (socket) => {
  const { sessionCode, walletAddress } = socket.handshake.query;

  if (!sessionCode) {
    console.warn("Missing session code, disconnecting socket.");
    socket.disconnect(true);
    return;
  }

  console.log(`New connection: ${socket.id} to session ${sessionCode} with walletAddress: ${walletAddress}`);

  if (!sessions[sessionCode]) {
    sessions[sessionCode] = {};
  }

  sessions[sessionCode][socket.id] = { walletAddress };

  if (!sessions[sessionCode].users) {
    sessions[sessionCode].users = [];
  }
  sessions[sessionCode].users.push(socket.id);
  socket.join(sessionCode);

  console.log(`Session ${sessionCode} now has ${sessions[sessionCode].users.length} users: ${sessions[sessionCode].users.join(", ")}`);

  io.to(sessionCode).emit("userJoined", { id: socket.id, walletAddress });

  socket.on("draw", (data) => {
    console.log(`Draw event received from ${socket.id} in session ${sessionCode}:`, data);
    console.log(`Broadcasting draw event to session ${sessionCode} (excluding ${socket.id})`);
    socket.broadcast.to(sessionCode).emit("draw", data);
  });

  socket.on("clear", () => {
    console.log(`Clear event received from ${socket.id} in session ${sessionCode}`);
    console.log(`Broadcasting clear event to session ${sessionCode}`);
    io.to(sessionCode).emit("clear");
  });

  socket.on("mint", (data, callback) => {
    console.log(`Mint event received from ${socket.id} in session ${sessionCode}:`, data);
    
    // Collect wallet addresses of all users in the session
    const walletAddresses = sessions[sessionCode].users
      .map(userId => sessions[sessionCode][userId]?.walletAddress)
      .filter(walletAddress => walletAddress); // Filter out undefined/null wallet addresses

    if (walletAddresses.length > 0) {
      console.log(`Returning wallet addresses for session ${sessionCode}:`, walletAddresses);
      callback({
        success: true,
        walletAddresses: walletAddresses,
      });
    } else {
      callback({
        success: false,
        message: "No wallet addresses found in the session",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected from session ${sessionCode}`);

    if (sessions[sessionCode] && sessions[sessionCode][socket.id]) {
      delete sessions[sessionCode][socket.id];
    }
    sessions[sessionCode].users = sessions[sessionCode].users.filter((id) => id !== socket.id);
    io.to(sessionCode).emit("userLeft", socket.id);

    if (sessions[sessionCode].users.length === 0) {
      delete sessions[sessionCode];
      console.log(`Session ${sessionCode} deleted.`);
    } else {
      console.log(`Session ${sessionCode} now has ${sessions[sessionCode].users.length} users: ${sessions[sessionCode].users.join(", ")}`);
    }
  });
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});