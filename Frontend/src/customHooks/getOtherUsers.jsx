import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setOtherUsers } from "../redux/userSlice";

const getOtherUsers = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const url =
    "https://realchat-1-8fm2.onrender.com/" || "http://localhost:8000/";
  useEffect(() => {
    if (!userData?._id) return;
    const fetch = async () => {
      try {
        const res = await axios.get(`${url}api/user/others`, {
          withCredentials: true,
        });
        dispatch(setOtherUsers(res.data));
      } catch (err) {
        console.error("getOtherUsers:", err);
      }
    };
    fetch();
  }, [userData?._id]);
};

export default getOtherUsers;
