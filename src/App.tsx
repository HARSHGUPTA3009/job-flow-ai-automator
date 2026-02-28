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
import Placements from "./pages/Placements";
import Jobs from "./pages/Jobs";
import Coding from "./pages/Coding";
import Leaderboard from "./pages/Leaderboard";
import { Navigation } from "./components/Navigation";

const queryClient = new QueryClient();

interface User { id: string; email: string; name?: string; }

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-white">Loading Service</h2>
          <p className="text-gray-400 animate-pulse">Please wait a moment...</p>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("https://jobflow-backend-ai.onrender.com/auth/status", { credentials: "include" });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser({ id: data.user.id || data.user.email, email: data.user.email, name: data.user.name });
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  // Helper to guard auth routes
  const guard = (el: React.ReactNode) =>
    user ? el : <Navigate to="/signin" replace />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation user={user} onLogout={() => setUser(null)} />
          <Routes>
            <Route path="/"            element={<Index />} />
            <Route path="/signin"      element={user ? <Navigate to="/dashboard" replace /> : <SignIn />} />
            <Route path="/dashboard"   element={guard(<Dashboard   user={user!} />)} />
            <Route path="/placements"  element={guard(<Placements  user={user!} />)} />
            <Route path="/jobs"        element={guard(<Jobs        user={user!} />)} />
            <Route path="/coding"      element={guard(<Coding      user={user!} />)} />
            <Route path="/leaderboard" element={guard(<Leaderboard user={user!} />)} />
            <Route path="*"            element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;