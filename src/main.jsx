import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ThemeProvider } from "./Components/ThemeProvider.jsx";
import { HelmetProvider } from "react-helmet-async";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider defaultTheme="light" storageKey="rakshak-theme">
        <Router>
          <AuthProvider>
            <App />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
