import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { IoArrowBack } from "react-icons/io5";
import { LuSend } from "react-icons/lu";
import { MdOutlineAddPhotoAlternate } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { getSocket } from "../socket/socket.js";
import {
  setMessages,
  addMessage,
  clearUnread,
  setSelectedUser,
} from "../redux/messageSlice.js";
import useTyping from "../customHooks/useTyping.js";
import dp from "../assets/img.jpg";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatMsgTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateLabel = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  const diffDays = Math.floor((new Date() - date) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const dayKey = (iso) => (iso ? new Date(iso).toDateString() : "");

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusIcon = ({ status, isMine }) => {
  if (!isMine) return null;
  if (status === "seen")
    return <span className="text-[10px] text-blue-400 ml-1">✓✓</span>;
  if (status === "delivered")
    return <span className="text-[10px] text-gray-400 ml-1">✓✓</span>;
  return <span className="text-[10px] text-gray-300 ml-1">✓</span>;
};

const DateSeparator = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-[11px] text-gray-400 font-medium px-2 bg-transparent whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

// Welcome screen shown on desktop when no chat is selected
const WelcomeScreen = () => (
  <div
    className="hidden lg:flex w-full h-full flex-col items-center justify-center gap-3"
    style={{ background: "#f0f4f8" }}
  >
    <h2 className="text-gray-700 font-bold text-4xl">Welcome to Chatly</h2>
    <p className="text-gray-400 text-lg">Chat Friendly !</p>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

function MessageArea() {
  const dispatch = useDispatch();
  const { selectedUser, messages, typingUser, onlineUsers } = useSelector(
    (state) => state.message,
  );
  const { userData } = useSelector((state) => state.user);

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null); // local preview URL
  const [imageFile, setImageFile] = useState(null); // File object
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const { onTyping, stopTyping } = useTyping(selectedUser?._id);

  const url =
    "https://realchat-1-8fm2.onrender.com/" || "http://localhost:8000/";
  // ── Fetch history ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedUser?._id) return;
    const fetch = async () => {
      try {
        const res = await axios.get(`${url}api/messages/${selectedUser._id}`, {
          withCredentials: true,
        });
        dispatch(setMessages(res.data));
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
    const socket = getSocket();
    if (socket) socket.emit("markSeen", { senderId: selectedUser._id });
    dispatch(clearUnread(selectedUser._id));
    return () => dispatch(setMessages([]));
  }, [selectedUser, dispatch]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  useEffect(() => {
    if (selectedUser) inputRef.current?.focus();
  }, [selectedUser]);

  // ── Image pick ─────────────────────────────────────────────────────────────
  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !imageFile) || !selectedUser?._id || sending) return;

    const socket = getSocket();
    if (!socket && !imageFile) return;

    stopTyping();
    setSending(true);

    try {
      if (imageFile) {
        // Image — REST upload, server saves + delivers via socket
        const form = new FormData();
        form.append("image", imageFile);
        form.append("receiverId", selectedUser._id);
        const res = await axios.post(
          "http://localhost:8000/api/messages/image",
          form,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        // Server returns the saved doc — add directly (no optimistic needed)
        dispatch(addMessage(res.data));
        clearImage();
      }

      if (trimmed && socket) {
        // Add optimistic message immediately (no _id yet)
        dispatch(
          addMessage({
            sender: userData._id,
            receiver: selectedUser._id,
            message: trimmed,
            status: "sent",
            createdAt: new Date().toISOString(),
            // no _id — replaceOptimisticMessage will swap this when ack arrives
          }),
        );
        // Emit to server — server saves, acks back via "messageSent"
        socket.emit("sendMessage", {
          receiverId: selectedUser._id,
          message: trimmed,
        });
        setText("");
      }
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!selectedUser) return <WelcomeScreen />;

  const isOnline = onlineUsers.includes(selectedUser._id);
  let lastDayKeyVal = null;

  return (
    <div className="flex flex-col w-full h-full bg-[#f0f4f8]">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#20c7ff] shadow-md shrink-0">
        <button
          className="lg:hidden text-white p-1 rounded-full hover:bg-white/20 transition"
          onClick={() => dispatch(setSelectedUser(null))}
        >
          <IoArrowBack className="w-5 h-5" />
        </button>

        <div className="relative shrink-0">
          <div className="w-[42px] h-[42px] rounded-full overflow-hidden border-2 border-white/60">
            <img
              src={selectedUser.image || dp}
              alt={selectedUser.userName}
              className="w-full h-full object-cover"
            />
          </div>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-[11px] h-[11px] bg-green-400 border-2 border-[#20c7ff] rounded-full" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-white font-semibold text-base leading-tight truncate">
            {selectedUser.userName}
          </span>
          {typingUser ? (
            <span className="text-white/80 text-xs animate-pulse">
              typing...
            </span>
          ) : (
            <span
              className={`text-xs ${isOnline ? "text-green-100" : "text-white/60"}`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col bg-[#f0f4f8]">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 text-sm">No messages yet. Say hi 👋</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine =
            msg.sender === userData._id || msg.sender?._id === userData._id;
          const curDayKey = dayKey(msg.createdAt);
          const showSep = curDayKey !== lastDayKeyVal;
          if (showSep) lastDayKeyVal = curDayKey;

          // Show avatar only on first message in a consecutive block from same sender
          const nextMsg = messages[i + 1];
          const isLastInBlock =
            !nextMsg ||
            (nextMsg.sender === userData._id) !== (msg.sender === userData._id);

          return (
            <div key={msg._id || i}>
              {showSep && (
                <DateSeparator label={formatDateLabel(msg.createdAt)} />
              )}

              <div
                className={`flex items-end gap-2 mb-1 ${isMine ? "justify-end" : "justify-start"}`}
              >
                {/* Receiver avatar — left side, only on last bubble in block */}
                {!isMine && (
                  <div className="w-7 h-7 shrink-0 mb-0.5">
                    {isLastInBlock && (
                      <div className="w-7 h-7 rounded-full overflow-hidden">
                        <img
                          src={selectedUser?.image || dp}
                          alt={selectedUser?.userName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`
                  relative shadow-sm overflow-hidden
                  max-w-[72%] sm:max-w-[58%]
                  ${
                    isMine
                      ? "bg-white text-gray-800 rounded-2xl rounded-br-sm"
                      : "bg-[#20c7ff] text-white rounded-2xl rounded-bl-sm"
                  }
                  ${msg.imageUrl ? "p-1" : "px-3 py-2"}
                `}
                >
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="sent"
                      className="rounded-xl max-w-[220px] w-full object-cover cursor-pointer"
                      onClick={() => window.open(msg.imageUrl, "_blank")}
                    />
                  )}

                  {msg.message && (
                    <p
                      className={`text-sm leading-relaxed break-words whitespace-pre-wrap
                      ${msg.imageUrl ? "px-2 pb-1 pt-1" : "pr-14"}`}
                    >
                      {msg.message}
                    </p>
                  )}

                  {/* Time + ticks pinned bottom-right */}
                  <div
                    className={`flex items-center gap-0.5 justify-end
                    ${msg.imageUrl ? "px-2 pb-1 mt-1" : "absolute bottom-1.5 right-2"}`}
                  >
                    <span
                      className={`text-[10px] leading-none
                      ${isMine ? "text-gray-400" : "text-white/70"}`}
                    >
                      {formatMsgTime(msg.createdAt)}
                    </span>
                    <StatusIcon status={msg.status} isMine={isMine} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing dots */}
        {typingUser && (
          <div className="flex justify-start mb-1">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Image preview strip ── */}
      {imagePreview && (
        <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
          <div className="relative">
            <img
              src={imagePreview}
              alt="preview"
              className="h-16 w-16 object-cover rounded-xl border border-gray-200"
            />
            <button
              onClick={clearImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center"
            >
              <RxCross2 className="w-3 h-3" />
            </button>
          </div>
          <span className="text-xs text-gray-400">Ready to send</span>
        </div>
      )}

      {/* ── Input bar ── */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 px-3 py-2 bg-white border-t border-gray-200 shrink-0"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      >
        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImagePick}
        />

        {/* Photo button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400
                     hover:text-[#20c7ff] hover:bg-[#20c7ff]/10 transition shrink-0 self-end mb-1"
          title="Send photo"
        >
          <MdOutlineAddPhotoAlternate className="w-5 h-5" />
        </button>

        {/* Input pill */}
        <div className="flex-1 flex items-end bg-[#f0f2f5] rounded-3xl px-4 py-2 min-h-[44px]">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            style={{ fontSize: "16px" }}
            className="flex-1 resize-none bg-transparent outline-none text-gray-800
                       placeholder-gray-400 leading-relaxed max-h-28 overflow-y-auto self-center"
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`;
            }}
          />
        </div>

        {/* Send / Mic — always visible, always colored */}
        <button
          type={text.trim() || imageFile ? "submit" : "button"}
          disabled={sending}
          className="w-11 h-11 rounded-full bg-[#20c7ff] text-white flex items-center
                     justify-center shrink-0 self-end mb-0.5 shadow-md
                     hover:bg-[#1ab3e8] active:scale-95 transition-all disabled:opacity-60"
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : text.trim() || imageFile ? (
            <LuSend className="w-4 h-4 translate-x-[1px]" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1.5 14.93A7.001 7.001 0 0 1 5 9H3a9 9 0 0 0 8 8.94V21h2v-3.06A9 9 0 0 0 21 9h-2a7 7 0 0 1-5.5 6.93z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

export default MessageArea;
