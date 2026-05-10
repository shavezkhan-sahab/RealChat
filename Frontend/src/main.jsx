import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store.js";

// export const serverUrl = "http://localhost:8000";
const serverUrl =
  "https://realchat-1-8fm2.onrender.com/" || "http://localhost:8000/";
// ── Cross-browser mobile viewport height fix ──────────────────────────────
// Chrome on Android and Safari on iOS both have issues with 100vh including
// the browser toolbar. We track the real visible height via visualViewport
// and expose it as --vh so components can use calc(var(--vh) * 100).
const setVh = () => {
  const vh = (window.visualViewport?.height ?? window.innerHeight) * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

setVh();
window.visualViewport?.addEventListener("resize", setVh);
window.addEventListener("resize", setVh);
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>,
);
