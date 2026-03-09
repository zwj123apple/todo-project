import { AppRouter } from "./router";
import { NotificationToast } from "./components/NotificationToast";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <AppRouter />
      <NotificationToast />
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            color: "#1f2937",
            borderRadius: "16px",
            padding: "16px 20px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow:
              "0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            minWidth: "320px",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
            style: {
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#fff",
              boxShadow:
                "0 10px 40px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(16, 185, 129, 0.2)",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
            style: {
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "#fff",
              boxShadow:
                "0 10px 40px rgba(239, 68, 68, 0.3), 0 2px 8px rgba(239, 68, 68, 0.2)",
            },
          },
          loading: {
            iconTheme: {
              primary: "#6366f1",
              secondary: "#fff",
            },
            style: {
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
              boxShadow:
                "0 10px 40px rgba(99, 102, 241, 0.3), 0 2px 8px rgba(99, 102, 241, 0.2)",
            },
          },
        }}
      />
    </>
  );
}

export default App;
