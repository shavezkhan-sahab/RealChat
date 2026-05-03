import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

const getCurrentUser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/user/current", {
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
