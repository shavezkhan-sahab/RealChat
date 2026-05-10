import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

const getCurrentUser = () => {
  const dispatch = useDispatch();
  const url =
    "https://realchat-1-8fm2.onrender.com/" || "http://localhost:8000/";

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${url}api/user/current`, {
          withCredentials: true,
        });
        dispatch(setUserData(res.data));
      } catch {
        dispatch(setUserData(null));
      }
    };
    fetch();
  }, []); // run once on mount — checks cookie session
};

export default getCurrentUser;
