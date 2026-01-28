import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const getCurrentUser = () => {
  let dispatch = useDispatch();
  let { userData } = useSelector((state) => state.user);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        let result = await axios.get("http://localhost:8000/api/user/current", {
          withCredentials: true,
        });
      } catch (error) {
        console.log(error);
      }
    };
  }, [userData]);
};

export default getCurrentUser;
