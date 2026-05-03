import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initSocket, disconnectSocket, getSocket } from "../socket/socket.js";
import { addMessage, replaceOptimisticMessage, setOnlineUsers, setTypingUser, updateMessageStatus, upsertChatListEntry, clearUnread, updateSelectedUserImage } from "../redux/messageSlice.js";
import { updateUserImage } from "../redux/userSlice.js";

/**
 * Manages the socket connection lifecycle.
 * - Connects when userData is available (after login)
 * - Registers all event listeners
 * - Cleans up on logout or unmount to prevent memory leaks
 */
const useSocket = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const { selectedUser } = useSelector((state) => state.message);

  useEffect(() => {
    if (!userData?._id) {
      // User logged out — disconnect and clean up
      disconnectSocket();
      return;
    }

    const socket = initSocket(userData._id);

    // ── Incoming message ───────────────────────────────────────────────────
    const handleNewMessage = (msg) => {
      const otherUserId =
        msg.sender === userData._id ? msg.receiver : msg.sender;

      const isActiveChat = selectedUser && selectedUser._id === otherUserId;

      if (isActiveChat) {
        dispatch(addMessage(msg));
      }

      dispatch(upsertChatListEntry({
        userId: otherUserId,
        lastMessage: msg.message,
        lastMessageAt: msg.createdAt,
        lastStatus: msg.status,
        lastSender: msg.sender,
        incrementUnread: !isActiveChat && msg.sender !== userData._id,
        // Pass the user object so new conversations appear without a refetch
        user: msg.senderUser || null,
      }));
    };

    const handleMessageSent = (msg) => {
      dispatch(replaceOptimisticMessage(msg));
      dispatch(upsertChatListEntry({
        userId: msg.receiver,
        lastMessage: msg.message,
        lastMessageAt: msg.createdAt,
        lastStatus: msg.status,
        lastSender: msg.sender,
        incrementUnread: false,
        user: msg.receiverUser || null,
      }));
    };

    // ── Online presence ────────────────────────────────────────────────────
    const handleOnlineUsers = (users) => {
      dispatch(setOnlineUsers(users));
    };

    // ── Typing indicators ──────────────────────────────────────────────────
    // Only show indicator when the typing user is the one we have open
    const handleTyping = ({ senderId }) => {
      if (selectedUser?._id === senderId) {
        dispatch(setTypingUser(senderId));
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (selectedUser?._id === senderId) {
        dispatch(setTypingUser(null));
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    // ── Profile picture update ─────────────────────────────────────────────
    const handleUserUpdated = ({ userId, imageUrl }) => {
      dispatch(updateUserImage({ userId, imageUrl }));          // sidebar + otherUsers
      dispatch(updateSelectedUserImage({ userId, imageUrl }));  // chat header
    };
    socket.on("userUpdated", handleUserUpdated);

    // ── Status updates (delivered / seen) ──────────────────────────────────
    // Server sends this to the original sender when status changes
    const handleStatusUpdate = ({ messageIds, status }) => {
      dispatch(updateMessageStatus({ messageIds, status }));
    };
    socket.on("statusUpdate", handleStatusUpdate);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("statusUpdate", handleStatusUpdate);
      socket.off("userUpdated", handleUserUpdated);
    };
  }, [userData, selectedUser, dispatch]);
};

export default useSocket;
