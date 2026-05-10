import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { IoArrowBack } from "react-icons/io5";
import { FaCamera } from "react-icons/fa";
import { setUserData } from "../redux/userSlice";
import dp from "../assets/img.jpg";

function Profile() {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [frontendImage, setFrontendImage] = useState(userData?.image || dp);
  const [backendImage, setBackendImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const imageRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontendImage(URL.createObjectURL(file));
      setBackendImage(file);
    }
  };
  const url =
    "https://realchat-1-8fm2.onrender.com/" || "http://localhost:8000/";
  const handleSave = async (e) => {
    e.preventDefault();
    if (!backendImage) return;
    setSaving(true);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("image", backendImage);
      // Do NOT set Content-Type manually — axios must set it with the correct boundary
      const result = await axios.put(`${url}api/user/profile`, formData, {
        withCredentials: true,
      });
      dispatch(setUserData(result.data));
      setSuccess(true);
      setBackendImage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="w-full bg-[#f0f4f8] flex flex-col items-center overflow-y-auto"
      style={{ minHeight: "calc(var(--vh, 1dvh) * 100)" }}
    >
      {/* Header */}
      <div className="w-full bg-[#20c7ff] px-5 pt-5 pb-16 rounded-b-[40px] shadow-lg flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
        >
          <IoArrowBack className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white font-bold text-xl">My Profile</h1>
      </div>

      {/* Avatar — overlaps header */}
      <div className="relative -mt-14 mb-4">
        <div
          className="w-[110px] h-[110px] rounded-full overflow-hidden border-4 border-white shadow-xl cursor-pointer"
          onClick={() => imageRef.current.click()}
        >
          <img
            src={frontendImage}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div
          className="absolute bottom-1 right-1 w-8 h-8 bg-[#20c7ff] rounded-full flex items-center justify-center shadow cursor-pointer border-2 border-white"
          onClick={() => imageRef.current.click()}
        >
          <FaCamera className="w-3.5 h-3.5 text-white" />
        </div>
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImage}
        />
      </div>

      {/* Info card */}
      <form
        onSubmit={handleSave}
        className="w-full max-w-[420px] px-5 flex flex-col gap-4"
      >
        {/* Read-only fields */}
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Username</p>
            <p className="text-sm font-semibold text-gray-700">
              {userData?.userName}
            </p>
          </div>
          <div className="h-px bg-gray-100" />
          <div>
            <p className="text-xs text-gray-400 mb-1">Email</p>
            <p className="text-sm font-semibold text-gray-700">
              {userData?.email}
            </p>
          </div>
        </div>

        {success && (
          <p className="text-green-500 text-sm text-center bg-green-50 py-2 rounded-xl">
            Profile photo updated ✓
          </p>
        )}

        <button
          type="submit"
          disabled={!backendImage || saving}
          className="w-full h-[52px] bg-[#20c7ff] text-white font-semibold rounded-2xl
                     hover:bg-[#1ab3e8] active:scale-[0.98] transition-all disabled:opacity-40 shadow-md"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Photo"
          )}
        </button>
      </form>
    </div>
  );
}

export default Profile;
