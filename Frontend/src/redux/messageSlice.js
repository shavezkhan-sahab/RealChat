import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],        // active conversation messages
    chatList: [],        // sidebar: one entry per conversation, sorted by latest
    onlineUsers: [],     // userIds currently online
    selectedUser: null,  // the user whose chat is open
    typingUser: null,    // userId of whoever is currently typing to us
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    // Replace the last optimistic (no _id) message with the real saved doc
    replaceOptimisticMessage: (state, action) => {
      const real = action.payload;
      // Find last message from me that has no real _id (optimistic)
      for (let i = state.messages.length - 1; i >= 0; i--) {
        const m = state.messages[i];
        if (!m._id && m.sender === real.sender && m.message === real.message) {
          state.messages[i] = real;
          return;
        }
      }
      // If not found (e.g. another tab), just append
      state.messages.push(real);
    },
    updateMessageStatus: (state, action) => {
      const { messageIds, status } = action.payload;
      const idSet = new Set(messageIds.map(String));
      state.messages.forEach((msg) => {
        if (idSet.has(String(msg._id))) msg.status = status;
      });
    },
    setChatList: (state, action) => {
      state.chatList = action.payload;
    },
    // Called when a new message arrives — bumps that conversation to the top
    // and updates its preview without a full refetch.
    upsertChatListEntry: (state, action) => {
      const { userId, lastMessage, lastMessageAt, lastStatus, lastSender, incrementUnread, user } = action.payload;
      const idx = state.chatList.findIndex((c) => c.user._id === userId);
      if (idx !== -1) {
        const entry = { ...state.chatList[idx], lastMessage, lastMessageAt, lastStatus, lastSender };
        if (incrementUnread) entry.unreadCount = (entry.unreadCount || 0) + 1;
        state.chatList.splice(idx, 1);
        state.chatList.unshift(entry);
      } else if (user) {
        // First message in a new conversation — add it to the top
        state.chatList.unshift({
          user,
          lastMessage,
          lastMessageAt,
          lastStatus,
          lastSender,
          unreadCount: incrementUnread ? 1 : 0,
        });
      }
    },
    clearUnread: (state, action) => {
      const entry = state.chatList.find((c) => c.user._id === action.payload);
      if (entry) entry.unreadCount = 0;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    // Update selectedUser avatar in real-time when they change their photo
    updateSelectedUserImage: (state, action) => {
      const { userId, imageUrl } = action.payload;
      if (state.selectedUser?._id === userId) {
        state.selectedUser = { ...state.selectedUser, image: imageUrl };
      }
    },
    setTypingUser: (state, action) => {
      state.typingUser = action.payload;
    },
  },
});

export const {
  setMessages, addMessage, replaceOptimisticMessage, updateMessageStatus,
  setChatList, upsertChatListEntry, clearUnread,
  setOnlineUsers, setSelectedUser, updateSelectedUserImage, setTypingUser,
} = messageSlice.actions;
export default messageSlice.reducer;
