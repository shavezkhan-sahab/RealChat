import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { setUserData } from "../redux/userSlice";
import { useDispatch, useSelector } from "react-redux";
function Login() {
  let navigate = useNavigate();
  let [show, setShow] = useState(false);
  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");
  let [loading, setLoading] = useState(false);
  let [err, setErr] = useState("");
  let dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result = await axios.post(
        "http://localhost:8000/api/auth/login",
        {
          email,
          password,
        },
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
      setEmail("");
      setPassword("");
      setLoading(false);
      setErr("");
    } catch (error) {
      console.log(error);
      setLoading(false);
      setErr(error.response.data.message);
    }
  };
  return (
    <div className="w-full h-[100vh] bg-slate-400 flex items-center justify-center">
      <div
        className=" w-full max-w-[500px] h-[600px] bg-white 
    rounded-lg shadow-gray-400 shadow-lg flex flex-col gap-[30px]"
      >
        <div
          className="w-full h-[200px] bg-[#20c7ff] rounded-b-[30%] shadow-gray-400 shadow-lg 
        flex justify-center items-center "
        >
          <h1 className="text-gray-500 font-bold text-[30px] ">
            Login to <span className="text-white"> Chatly</span>
          </h1>
        </div>
        <form
          className=" w-full flex flex-col gap-[20px] items-center"
          onSubmit={handleLogin}
        >
          <input
            type="email"
            placeholder=" email"
            className="w-[90%] h-[60px]
          outline-none border-2 border-[#20c7ff] px-[20px] py-[10px] bg-[white]
          rounded-lg shadow-gray-200 shadow-lg"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          ></input>
          <div
            className="w-[90%] h-[50px]  border-2 border-[#20c7ff] 
           rounded-lg shadow-gray-200 shadow-lg overflow-hidden  relative"
          >
            <input
              type={show ? "text" : "password"}
              placeholder="password"
              className="
          outline-none px-[20px] py-[10px] bg-[white]
          "
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            ></input>
            <span
              className="absolute top-[10px] right-[20px] text-[#20c7ff] text-[19px] font-semibold
              "
              onClick={() => setShow((prev) => !prev)}
            >
              {`${show ? "hidden" : "show"}`}
            </span>
          </div>

          {err && <p className="text-red-500">{err}</p>}
          <button
            className="px-[20px] py-[10px] bg-[#20c7ff] rounded-2xl
           shadow-gray-200px shadow-lg text-[20px] w-[200px] mt-[20px] font-semibold
          hover:shadow-inner"
          >
            {loading ? "Loading..." : "Login"}
          </button>
          <p className="cursor-pointer" onClick={() => navigate("/signup")}>
            {" "}
            Create new account ? <span className="text-[#20c7ff]">SignUp</span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
