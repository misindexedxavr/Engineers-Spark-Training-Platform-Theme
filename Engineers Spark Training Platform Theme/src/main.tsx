
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ctfdApi } from "./services/ctfdApi";
import "./styles/index.css";
import "./services/simpleApi"; // Import for testing - adds window.testAPI

// Initialize CSRF token and start background refresher
ctfdApi.initializeCSRF().catch(err => console.warn("[ctfdApi] CSRF init failed:", err));

createRoot(document.getElementById("root")!).render(<App />);
  