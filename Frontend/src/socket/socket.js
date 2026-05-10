import { io } from "socket.io-client";

// Singleton — one instance for the entire app lifetime.
// We create it lazily so it only connects when initSocket() is called.
let socket = null;
const url = "https://realchat-1-8fm2.onrender.com" || "http://localhost:8000";
export const initSocket = (userId) => {
  if (socket) return socket; // already connected

  socket = io(`${url}`, {
    query: { userId },
    withCredentials: true,
    autoConnect: true,
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
