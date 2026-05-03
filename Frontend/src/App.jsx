import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import getCurrentUser from "./customHooks/getCurrentUser";
import { useSelector } from "react-redux";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import getOtherUsers from "./customHooks/getOtherUsers";
import useSocket from "./customHooks/useSocket";
import useChatList from "./customHooks/useChatList";

export default function App() {
  getCurrentUser();
  getOtherUsers();
  useSocket();
  useChatList();
  let { userData } = useSelector((state) => state.user);
  return (
    <Routes>
      <Route
        path="/login"
        element={!userData ? <Login /> : <Navigate to="/"></Navigate>}
      />
      <Route
        path="/signup"
        element={!userData ? <SignUp /> : <Navigate to="/profile"></Navigate>}
      />
      <Route
        path="/"
        element={userData ? <Home /> : <Navigate to="/login"></Navigate>}
      />
      <Route
        path="/profile"
        element={userData ? <Profile /> : <Navigate to="/signup"></Navigate>}
      />
    </Routes>
  );
}
