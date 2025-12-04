import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Placement from "./pages/Placements";
import { Navigation } from "./components/Navigation";
import Placements from "./pages/Placements";

const queryClient = new QueryClient();

interface User {
  id: string;
  email: string;
  name?: string;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNav, setShowNav] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(
        "https://jobflow-backend-ai.onrender.com/auth/status",
        {
          credentials: "include",
        }
      );
      const data = await res.json();

      if (data.authenticated && data.user) {
        setUser({
          id: data.user.id || data.user.email,
          email: data.user.email,
          name: data.user.name,
        });
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation user={user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/signin"
              element={
                user ? <Navigate to="/dashboard" replace /> : <SignIn />
              }
            />
            <Route
              path="/dashboard"
              element={
                user ? (
                  <Dashboard user={user} />
                ) : (
                  <Navigate to="/signin" replace />
                )
              }
            />
            <Route
              path="/placements"
              element={
                user ? (
                  <Placements user={user} />
                ) : (
                  <Navigate to="/signin" replace />
                )
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;