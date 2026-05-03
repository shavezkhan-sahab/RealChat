import { useSelector } from "react-redux";
import SideBar from "../Component/SideBar";
import MessageArea from "../Component/MessageArea";

function Home() {
  const { selectedUser } = useSelector((state) => state.message);

  return (
    <div
      className="flex w-full overflow-hidden"
      style={{ height: "calc(var(--vh, 1dvh) * 100)" }}
    >
      {/* Sidebar — full screen on mobile when no chat open */}
      <div className={`
        ${selectedUser ? "hidden lg:flex" : "flex"}
        lg:w-[30%] w-full h-full flex-col overflow-hidden
      `}>
        <SideBar />
      </div>

      {/* Chat area — full screen on mobile when chat is open */}
      <div className={`
        ${selectedUser ? "flex" : "hidden lg:flex"}
        lg:w-[70%] w-full h-full flex-col overflow-hidden
      `}>
        <MessageArea />
      </div>
    </div>
  );
}

export default Home;
