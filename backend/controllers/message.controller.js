import mongoose from "mongoose";
import Message from "../models/message.model.js";
import { getAllSocketIds } from "../sockets/socketManager.js";
import { io } from "../index.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const notifySender = (senderId, messageIds, status) => {
  const senderSockets = getAllSocketIds(senderId);
  if (!senderSockets.length) return;
  const payload = { messageIds, status };
  senderSockets.forEach((sid) => io.to(sid).emit("statusUpdate", payload));
};

// Broadcast profile picture update to every connected client
export const broadcastProfileUpdate = (userId, imageUrl) => {
  io.emit("userUpdated", { userId, imageUrl });
};

// ─────────────────────────────────────────────────────────────────────────────
// saveAndDeliverMessage — called by socketHandler on sendMessage
// ─────────────────────────────────────────────────────────────────────────────

export const saveAndDeliverMessage = async (senderId, receiverId, messageText) => {
  const saved = await Message.create({
    sender: senderId,
    receiver: receiverId,
    message: messageText,
    status: "sent",
  });
  // Delivery and status update is handled by socketHandler after this returns
  return saved;
};

// ─────────────────────────────────────────────────────────────────────────────
// flushDeliveredOnConnect — called when user comes online
// ─────────────────────────────────────────────────────────────────────────────

export const flushDeliveredOnConnect = async (userId) => {
  const pending = await Message.find(
    { receiver: userId, status: "sent" },
    { _id: 1, sender: 1 }
  ).lean();

  if (!pending.length) return;

  const ids = pending.map((m) => m._id);
  await Message.updateMany({ _id: { $in: ids } }, { status: "delivered" });

  const bySender = pending.reduce((acc, m) => {
    const key = m.sender.toString();
    (acc[key] = acc[key] || []).push(m._id);
    return acc;
  }, {});

  Object.entries(bySender).forEach(([senderId, messageIds]) => {
    notifySender(senderId, messageIds, "delivered");
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// markMessagesAsSeen — called on "markSeen" socket event
// ─────────────────────────────────────────────────────────────────────────────

export const markMessagesAsSeen = async (userId, senderId) => {
  const updated = await Message.find(
    { sender: senderId, receiver: userId, status: { $ne: "seen" } },
    { _id: 1 }
  ).lean();

  if (!updated.length) return;

  const ids = updated.map((m) => m._id);
  await Message.updateMany({ _id: { $in: ids } }, { status: "seen" });
  notifySender(senderId, ids, "seen");
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/messages/image — upload image, save, deliver via socket
// ─────────────────────────────────────────────────────────────────────────────

export const sendImageMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId } = req.body;

    if (!receiverId || !req.file) {
      return res.status(400).json({ message: "receiverId and image are required" });
    }

    // Build static URL — same pattern as editProfile
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const saved = await Message.create({
      sender: senderId,
      receiver: receiverId,
      message: "",
      imageUrl,
      status: "sent",
    });

    const receiverSockets = getAllSocketIds(receiverId);
    const payload = {
      _id: saved._id,
      sender: senderId,
      receiver: receiverId,
      message: "",
      imageUrl,
      status: receiverSockets.length > 0 ? "delivered" : "sent",
      createdAt: saved.createdAt,
    };

    if (receiverSockets.length > 0) {
      receiverSockets.forEach((sid) => io.to(sid).emit("newMessage", payload));
      Message.findByIdAndUpdate(saved._id, { status: "delivered" }).exec();
      notifySender(senderId, [saved._id], "delivered");
    }

    // Sync to sender's other tabs
    getAllSocketIds(senderId).forEach((sid) => {
      io.to(sid).emit("newMessage", payload);
    });

    return res.status(201).json(payload);
  } catch (error) {
    return res.status(500).json({ message: `sendImageMessage error: ${error}` });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/chats  — chat list with last message + unread count
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregation strategy:
 *  1. Match all messages where the current user is sender OR receiver.
 *  2. Build a stable "conversationKey" by sorting the two participant IDs so
 *     the same pair always maps to the same bucket regardless of direction.
 *  3. $group by that key → grab the last message fields + count unseen.
 *  4. $lookup the other participant's user document.
 *  5. $sort by lastMessageAt descending.
 *
 * Result: one document per conversation, one aggregation pipeline — no N+1.
 */
export const getChatList = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const chatList = await Message.aggregate([
      // 1. Only messages involving this user
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },

      // 2. Derive the "other" participant and a stable conversation key
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          // Sorted pair → same key for both directions
          conversationKey: {
            $cond: [
              { $lt: [{ $toString: "$sender" }, { $toString: "$receiver" }] },
              { $concat: [{ $toString: "$sender" }, "_", { $toString: "$receiver" }] },
              { $concat: [{ $toString: "$receiver" }, "_", { $toString: "$sender" }] },
            ],
          },
        },
      },

      // 3. Group by conversation — keep last message, count unread
      {
        $sort: { createdAt: 1 }, // sort before group so $last is the newest
      },
      {
        $group: {
          _id: "$conversationKey",
          otherUser:      { $last: "$otherUser" },
          lastMessage:    { $last: "$message" },
          lastMessageAt:  { $last: "$createdAt" },
          lastStatus:     { $last: "$status" },
          lastSender:     { $last: "$sender" },
          // Count messages sent TO me that I haven't seen yet
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userId] },
                    { $ne: ["$status", "seen"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      // 4. Join user details for the other participant
      {
        $lookup: {
          from: "users",
          localField: "otherUser",
          foreignField: "_id",
          as: "userDetails",
          pipeline: [{ $project: { password: 0 } }],
        },
      },
      { $unwind: "$userDetails" },

      // 5. Sort conversations by most recent message
      { $sort: { lastMessageAt: -1 } },

      // 6. Clean up output shape
      {
        $project: {
          _id: 0,
          user: "$userDetails",
          lastMessage: 1,
          lastMessageAt: 1,
          lastStatus: 1,
          lastSender: 1,
          unreadCount: 1,
        },
      },
    ]);

    return res.status(200).json(chatList);
  } catch (error) {
    return res.status(500).json({ message: `getChatList error: ${error}` });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/:receiverId — full conversation history
// ─────────────────────────────────────────────────────────────────────────────

export const getMessages = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: `getMessages error: ${error}` });
  }
};
