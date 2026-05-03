import {
  registerSocket,
  removeSocket,
  getOnlineUsers,
  getSocketId,
  getAllSocketIds,
} from "./socketManager.js";
import {
  saveAndDeliverMessage,
  flushDeliveredOnConnect,
  markMessagesAsSeen,
  notifySender,
} from "../controllers/message.controller.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const socketHandler = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      registerSocket(userId, socket.id);
      io.emit("onlineUsers", getOnlineUsers());
      console.log(`[+] ${userId} connected (socket: ${socket.id}) | tabs: ${getAllSocketIds(userId).length}`);

      if (getAllSocketIds(userId).length === 1) {
        flushDeliveredOnConnect(userId).catch(console.error);
      }
    }

    // ── Send message ───────────────────────────────────────────────────────
    socket.on("sendMessage", async ({ receiverId, message }) => {
      if (!userId || !receiverId || !message) return;

      try {
        const saved = await saveAndDeliverMessage(userId, receiverId, message);

        // Fetch both user objects once — needed for new chat list entries
        const [senderUser, receiverUser] = await Promise.all([
          User.findById(userId).select("-password").lean(),
          User.findById(receiverId).select("-password").lean(),
        ]);

        const basePayload = {
          _id: saved._id,
          sender: userId,
          receiver: receiverId,
          message: saved.message,
          status: saved.status,
          createdAt: saved.createdAt,
          senderUser,
          receiverUser,
        };

        // Ack to sender's current tab
        socket.emit("messageSent", { ...basePayload, status: saved.status });

        // Deliver to receiver's tabs
        const receiverSockets = getAllSocketIds(receiverId);
        if (receiverSockets.length > 0) {
          receiverSockets.forEach((sid) => {
            io.to(sid).emit("newMessage", { ...basePayload, status: "delivered" });
          });
          // Update DB status + notify sender
          Message.findByIdAndUpdate(saved._id, { status: "delivered" }).exec();
          notifySender(userId, [saved._id], "delivered");
        }

        // Sync to sender's other open tabs
        getAllSocketIds(userId)
          .filter((id) => id !== socket.id)
          .forEach((id) => {
            io.to(id).emit("newMessage", basePayload);
          });
      } catch (err) {
        console.error("sendMessage error:", err);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    // ── Mark seen ──────────────────────────────────────────────────────────
    // Client emits this when they open a conversation.
    // { senderId } = the person whose messages we are now reading
    socket.on("markSeen", async ({ senderId }) => {
      if (!userId || !senderId) return;
      try {
        await markMessagesAsSeen(userId, senderId);
      } catch (err) {
        console.error("markSeen error:", err);
      }
    });

    // ── Typing indicators ──────────────────────────────────────────────────
    socket.on("typing", ({ receiverId }) => {
      const receiverSocketId = getSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { senderId: userId });
      }
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocketId = getSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stopTyping", { senderId: userId });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      if (!userId) return;
      const wentOffline = removeSocket(userId, socket.id);
      if (wentOffline) {
        io.emit("onlineUsers", getOnlineUsers());
        console.log(`[-] ${userId} fully offline`);
      } else {
        console.log(`[-] ${userId} closed a tab | remaining: ${getAllSocketIds(userId).length}`);
      }
    });
  });
};

export default socketHandler;
