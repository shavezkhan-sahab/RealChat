import img from "../assets/img.jpg";
import { FaCamera } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { IoArrowBackSharp } from "react-icons/io5";

function Profile() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();

  return (
    <div className="w-full h-[100vh] bg-slate-400 justify-center gap-[20px] items-center flex flex-col relative">
      {/* Back button */}
      <div className="fixed top-[20px] left-[20px] cursor-pointer">
        <IoArrowBackSharp
          className="w-[30px] h-[30px] text-white hover:text-[#20c7ff] transition-colors"
          onClick={() => navigate("/")}
        />
      </div>

      {/* Profile picture */}
      <div className="bg-white border-2 rounded-full relative border-[#20c7ff] shadow-gray-400 shadow-lg">
        <div className="w-[200px] h-[200px] rounded-full overflow-hidden">
          <img src={img} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <FaCamera className="absolute bottom-8 right-5 w-[28px] h-[28px] cursor-pointer text-[#20c7ff]" />
      </div>

      {/* Profile form */}
      <form className="w-[95%] max-w-[500px] flex flex-col gap-[20px] items-center justify-center">
        <input
          type="text"
          placeholder="Enter your name"
          className="w-[90%] h-[60px] outline-none border-2 border-[#20c7ff] px-[20px] py-[10px] bg-[white] rounded-lg shadow-gray-200 shadow-lg"
        />
        <input
          type="text"
          readOnly
          className="w-[90%] h-[60px] outline-none border-2 border-[#20c7ff] px-[20px] py-[10px] bg-gray-100 rounded-lg shadow-gray-200 shadow-lg"
          value={userData?.userName || ""}
        />
        <input
          type="email" // Fixed: eamil -> email
          readOnly
          className="w-[90%] h-[60px] outline-none border-2 border-[#20c7ff] px-[20px] py-[10px] bg-gray-100 rounded-lg shadow-gray-200 shadow-lg text-gray-600"
          value={userData?.email || ""}
        />
        <button
          type="submit"
          className="px-[20px] py-[10px] bg-[#20c7ff] rounded-2xl shadow-gray-200 shadow-lg text-[20px] w-[200px] mt-[20px] font-semibold hover:shadow-inner text-white"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}

export default Profile;
