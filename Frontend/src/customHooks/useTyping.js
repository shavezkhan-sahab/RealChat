import { useCallback, useRef } from "react";
import { getSocket } from "../socket/socket.js";

const TYPING_DEBOUNCE_MS = 500;  // emit "typing" at most once per 500ms
const STOP_TYPING_DELAY_MS = 1500; // emit "stopTyping" 1.5s after last keystroke

/**
 * Returns an `onTyping` handler to attach to an input's onChange.
 *
 * Strategy:
 *  - Leading-edge debounce for "typing"  → fires immediately on first keystroke,
 *    then is suppressed until TYPING_DEBOUNCE_MS passes with no new keystrokes.
 *  - Auto "stopTyping" via a timeout that resets on every keystroke.
 *
 * This means the server receives at most 1 "typing" event per burst,
 * and always receives a "stopTyping" 1.5 s after the user pauses.
 */
const useTyping = (receiverId) => {
  const stopTypingTimer = useRef(null);   // auto-stop after idle
  const debounceTimer = useRef(null);     // suppress rapid "typing" emits
  const isTyping = useRef(false);         // track current emit state

  const onTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket || !receiverId) return;

    // ── Auto-stop timer: reset on every keystroke ──────────────────────────
    clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(() => {
      if (isTyping.current) {
        socket.emit("stopTyping", { receiverId });
        isTyping.current = false;
      }
    }, STOP_TYPING_DELAY_MS);

    // ── Debounced "typing" emit: leading edge ──────────────────────────────
    if (!isTyping.current) {
      // First keystroke in a new burst — emit immediately
      socket.emit("typing", { receiverId });
      isTyping.current = true;
    } else {
      // Already typing — debounce re-emit to avoid spam
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        socket.emit("typing", { receiverId });
      }, TYPING_DEBOUNCE_MS);
    }
  }, [receiverId]);

  // Call this when the input is cleared or message is sent
  const stopTyping = useCallback(() => {
    const socket = getSocket();
    clearTimeout(stopTypingTimer.current);
    clearTimeout(debounceTimer.current);
    if (isTyping.current && socket && receiverId) {
      socket.emit("stopTyping", { receiverId });
      isTyping.current = false;
    }
  }, [receiverId]);

  return { onTyping, stopTyping };
};

export default useTyping;
