import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectdb from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import messageRouter from "./routes/message.route.js";
import socketHandler from "./sockets/socketHandler.js";

dotenv.config();

const port = process.env.PORT || 8000;

// ── Express app ────────────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("public/uploads"));

// ── Existing routes (untouched) ────────────────────────────────────────────
app.get("/", (req, res) => res.send("hello"));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/messages", messageRouter);

// ── HTTP server shared by Express + Socket.io ──────────────────────────────
const server = http.createServer(app);

// ── Socket.io server ───────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// Delegate all socket events to the handler module
socketHandler(io);

// ── Start ──────────────────────────────────────────────────────────────────
server.listen(port, () => {
  connectdb();
  console.log(`Server started on port ${port}`);
});

// Export io for use in controllers (e.g. emit on new message saved to DB)
export { io };
