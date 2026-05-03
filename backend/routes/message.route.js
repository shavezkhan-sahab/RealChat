import express from "express";
import { getChatList, getMessages, sendImageMessage } from "../controllers/message.controller.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

const messageRouter = express.Router();

// GET /api/messages/chats
messageRouter.get("/chats", isAuth, getChatList);

// POST /api/messages/image — upload image message via REST, deliver via socket
messageRouter.post("/image", isAuth, upload.single("image"), sendImageMessage);

// GET /api/messages/:receiverId
messageRouter.get("/:receiverId", isAuth, getMessages);

export default messageRouter;
