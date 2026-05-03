import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { LuEye, LuEyeOff } from "react-icons/lu";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const result = await axios.post(
        "http://localhost:8000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
    } catch (error) {
      setErr(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#f0f4f8] flex items-center justify-center px-4"
      style={{ minHeight: "calc(var(--vh, 1dvh) * 100)" }}>
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl overflow-hidden">

        {/* Blue curved header */}
        <div className="bg-[#20c7ff] px-8 pt-10 pb-14 rounded-b-[50%] flex flex-col items-center gap-1 shadow-md">
          <h1 className="text-white font-bold text-3xl tracking-wide">chatly</h1>
          <p className="text-white/80 text-sm">Login to your account</p>
        </div>

        {/* Form */}
        <form className="px-8 pt-8 pb-8 flex flex-col gap-4 -mt-4" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-[52px] px-5 rounded-2xl border-2 border-[#20c7ff]/30 outline-none
                       text-sm focus:border-[#20c7ff] transition bg-slate-50"
          />

          <div className="relative">
            <input
              type={show ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-[52px] px-5 pr-12 rounded-2xl border-2 border-[#20c7ff]/30 outline-none
                         text-sm focus:border-[#20c7ff] transition bg-slate-50"
            />
            <button
              type="button"
              onClick={() => setShow((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#20c7ff] transition"
            >
              {show ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
            </button>
          </div>

          {err && (
            <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-xl">{err}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-[#20c7ff] text-white font-semibold text-base rounded-2xl
                       hover:bg-[#1ab3e8] active:scale-[0.98] transition-all disabled:opacity-60 mt-2 shadow-md"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </span>
            ) : "Login"}
          </button>

          <p className="text-center text-sm text-gray-500 mt-1">
            Don't have an account?{" "}
            <span
              className="text-[#20c7ff] font-semibold cursor-pointer hover:underline"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
