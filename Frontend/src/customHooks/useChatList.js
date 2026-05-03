import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setChatList } from "../redux/messageSlice.js";

/**
 * Fetches the chat list once on mount (and whenever userData changes).
 * The list is kept fresh in real-time via upsertChatListEntry dispatched
 * from useSocket when a new message arrives.
 */
const useChatList = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData?._id) return;

    const fetch = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/messages/chats", {
          withCredentials: true,
        });
        dispatch(setChatList(res.data));
      } catch (err) {
        console.error("useChatList error:", err);
      }
    };

    fetch();
  }, [userData?._id]); // only re-run when the user ID actually changes
};

export default useChatList;
