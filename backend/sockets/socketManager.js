/**
 * userId  →  Set<socketId>
 *
 * One user can have multiple active sockets (multiple tabs/devices).
 * A user is considered "online" as long as they have at least one socket.
 * Only when their last socket disconnects are they removed from the online list.
 */
const userSocketMap = new Map(); // Map<userId, Set<socketId>>

/** Add a socket for a user. Creates the Set on first connection. */
export const registerSocket = (userId, socketId) => {
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId).add(socketId);
};

/**
 * Remove a specific socket for a user.
 * Deletes the user entry entirely when their last socket closes.
 * Returns true if the user is now fully offline.
 */
export const removeSocket = (userId, socketId) => {
  const sockets = userSocketMap.get(userId);
  if (!sockets) return true;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    userSocketMap.delete(userId);
    return true; // user is now offline
  }
  return false; // still has other tabs open
};

/**
 * Get any one active socketId for a user (used for targeted emits).
 * Returns undefined if the user is offline.
 */
export const getSocketId = (userId) => {
  const sockets = userSocketMap.get(userId);
  if (!sockets || sockets.size === 0) return undefined;
  // Return the first socket in the set
  return sockets.values().next().value;
};

/**
 * Get all socketIds for a user (useful for emitting to all their tabs).
 * Returns an empty array if offline.
 */
export const getAllSocketIds = (userId) => {
  const sockets = userSocketMap.get(userId);
  return sockets ? Array.from(sockets) : [];
};

/** Returns array of userIds that currently have at least one active socket. */
export const getOnlineUsers = () => Array.from(userSocketMap.keys());
