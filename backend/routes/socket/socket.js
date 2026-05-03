import express from "express";
import { server } from "socket.io";

let app = express();
let server = http.createServer(app);
let io = new Server({
  cors: {
    origin: "http://localhost:5173",
  },
});
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

export default io;
