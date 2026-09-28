import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: "16px",
                  background: "#ffffff",
                  color: "#1f2937",
                  boxShadow: "0 8px 30px rgba(6,78,59,0.15)",
                },
                success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
                error: { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
              }}
            />
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
