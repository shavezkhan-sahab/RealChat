import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dp from "../assets/img.jpg";
import { FaSearch } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { TbLogout } from "react-icons/tb";
import { setSelectedUser, clearUnread } from "../redux/messageSlice.js";
import { setUserData } from "../redux/userSlice.js";

const formatTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  const diffDays = Math.floor((new Date() - date) / 86400000);
  if (diffDays === 0)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
};

const Ticks = ({ status }) => {
  if (status === "seen")
    return <span className="text-[10px] text-[#20c7ff]">✓✓</span>;
  if (status === "delivered")
    return <span className="text-[10px] text-gray-400">✓✓</span>;
  return <span className="text-[10px] text-gray-400">✓</span>;
};

function SideBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userData, otherUsers } = useSelector((s) => s.user);
  const { chatList, onlineUsers, selectedUser } = useSelector((s) => s.message);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // ── Build the unified list ─────────────────────────────────────────────────
  // Start from ALL other users so everyone is visible (like the screenshot).
  // Merge in chatList data (last message, unread count) where it exists.
  // Sort: users with recent messages first (by lastMessageAt), then the rest.
  const chatMap = new Map(chatList.map((c) => [c.user._id, c]));

  const allUsers = (otherUsers || []).map((u) => {
    const chat = chatMap.get(u._id);
    return {
      user: u,
      lastMessage: chat?.lastMessage ?? null,
      lastMessageAt: chat?.lastMessageAt ?? null,
      lastStatus: chat?.lastStatus ?? null,
      lastSender: chat?.lastSender ?? null,
      unreadCount: chat?.unreadCount ?? 0,
    };
  });

  // Sort: conversations with messages on top (newest first), then alphabetical
  allUsers.sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt)
      return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.user.userName.localeCompare(b.user.userName);
  });

  // Online users for the avatar strip in the header
  const onlineOthers = (otherUsers || []).filter((u) =>
    onlineUsers.includes(u._id),
  );

  // Search filter
  const filtered = allUsers.filter((e) =>
    e.user?.userName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelect = (entry) => {
    dispatch(setSelectedUser(entry.user));
    if (entry.unreadCount > 0) dispatch(clearUnread(entry.user._id));
  };

  const url =
    "https://realchat-1-8fm2.onrender.com/" || "http://localhost:8000/";

  const handleLogout = async () => {
    try {
      await axios.get(`${url}api/auth/logout`, {
        withCredentials: true,
      });
      dispatch(setUserData(null));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#f0f4f8]">
      {/* ══ Curved blue header ══════════════════════════════════════════════ */}
      <div className="bg-[#20c7ff] px-5 pt-5 pb-10 rounded-b-[40px] shadow-lg shrink-0">
        {/* Row 1: logo + logout */}
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-white font-bold text-2xl tracking-wide">
            chatly
          </h1>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center
                       hover:bg-white/30 transition"
            title="Logout"
          >
            <TbLogout className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Row 2: greeting + my avatar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-gray-800 font-bold text-xl leading-tight">
            Hii , {userData?.userName}
          </h2>
          <div
            className="w-[52px] h-[52px] rounded-full overflow-hidden border-[3px] border-white
                       shadow-md cursor-pointer shrink-0"
            onClick={() => navigate("/profile")}
          >
            <img
              src={userData?.image || dp}
              alt="me"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Row 3: search pill + online avatars */}
        <div className="flex items-center gap-3">
          {!searchOpen ? (
            /* Collapsed search button */
            <button
              onClick={() => setSearchOpen(true)}
              className="w-[42px] h-[42px] rounded-full bg-white flex items-center
                         justify-center shadow shrink-0"
            >
              <FaSearch className="w-[15px] h-[15px] text-gray-500" />
            </button>
          ) : (
            /* Expanded search bar — full width, matches screenshot */
            <form
              className="flex-1 h-[42px] bg-white rounded-full flex items-center gap-2 px-4 shadow"
              onSubmit={(e) => e.preventDefault()}
            >
              <FaSearch className="w-[13px] h-[13px] text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none text-sm bg-transparent text-gray-700
                           placeholder-gray-400"
                autoFocus
              />
              <RxCross2
                className="w-[15px] h-[15px] text-gray-400 cursor-pointer shrink-0"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
              />
            </form>
          )}

          {/* Online user avatars — only when search is closed */}
          {!searchOpen &&
            onlineOthers.slice(0, 4).map((u) => (
              <div
                key={u._id}
                className="relative shrink-0 cursor-pointer"
                onClick={() => {
                  const entry = allUsers.find((e) => e.user._id === u._id);
                  if (entry) handleSelect(entry);
                  else dispatch(setSelectedUser(u));
                }}
                title={u.userName}
              >
                <div
                  className="w-[42px] h-[42px] rounded-full overflow-hidden
                              border-[2px] border-white shadow"
                >
                  <img
                    src={u.image || dp}
                    alt={u.userName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className="absolute bottom-0 right-0 w-[11px] h-[11px] bg-green-400
                               border-2 border-white rounded-full"
                />
              </div>
            ))}
        </div>
      </div>

      {/* ══ User / chat list ════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-2">
        {filtered.length > 0 ? (
          filtered.map((entry) => {
            const {
              user,
              lastMessage,
              lastMessageAt,
              lastStatus,
              lastSender,
              unreadCount,
            } = entry;
            const isOnline = onlineUsers.includes(user._id);
            const isSelected = selectedUser?._id === user._id;
            const isMine = lastSender === userData?._id;

            return (
              <div
                key={user._id}
                onClick={() => handleSelect(entry)}
                className={`flex items-center gap-3 px-4 py-3 rounded-full cursor-pointer
                          transition-all select-none
                          ${
                            isSelected
                              ? "bg-[#20c7ff]/20 shadow-inner"
                              : "bg-white hover:bg-[#20c7ff]/10 shadow-sm"
                          }`}
              >
                {/* Avatar + online dot */}
                <div className="relative shrink-0">
                  <div className="w-[46px] h-[46px] rounded-full overflow-hidden">
                    <img
                      src={user.image || dp}
                      alt={user.userName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isOnline && (
                    <span
                      className="absolute bottom-0 right-0 w-[12px] h-[12px] bg-green-400
                                   border-2 border-white rounded-full"
                    />
                  )}
                </div>

                {/* Name + last message preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {user.userName}
                    </span>
                    {lastMessageAt && (
                      <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                        {formatTime(lastMessageAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      {isMine && lastStatus && <Ticks status={lastStatus} />}
                      <span className="text-xs text-gray-400 truncate">
                        {lastMessage ||
                          (lastStatus
                            ? "📷 Photo"
                            : isOnline
                              ? "Online"
                              : "Tap to chat")}
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <span
                        className="ml-2 shrink-0 min-w-[20px] h-[20px] px-1 bg-[#20c7ff]
                                     text-white text-[10px] font-bold rounded-full flex
                                     items-center justify-center"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center mt-16 gap-2">
            <p className="text-gray-400 text-sm">
              {searchQuery ? "No users found" : "No other users yet"}
            </p>
          </div>
        )}
      </div>

      {/* ══ Logout FAB (bottom-left, matches screenshot) ════════════════════ */}
      <div className="p-4 shrink-0">
        <button
          onClick={handleLogout}
          className="w-12 h-12 rounded-full bg-[#20c7ff] text-white flex items-center
                     justify-center shadow-lg hover:bg-[#1ab3e8] active:scale-95 transition-all"
          title="Logout"
        >
          <TbLogout className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default SideBar;
