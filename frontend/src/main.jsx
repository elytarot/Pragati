// src/main.jsx — PRAGATI Frontend Entry Point
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./PRAGATI_Portal.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
