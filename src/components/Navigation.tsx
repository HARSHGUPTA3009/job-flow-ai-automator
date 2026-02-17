import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, Briefcase, Home, Bot, Search } from "lucide-react";

interface NavigationProps {
  user: { id: string; email: string; name?: string } | null;
  onLogout: () => void;
}

export const Navigation = ({ user, onLogout }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await fetch("https://jobflow-backend-ai.onrender.com/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      onLogout();
      navigate("/");
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-gray-200 hover:text-white transition"
          >
            AutoJob Flow
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    <Home size={16} />
                    Home
                  </Button>
                </Link>

                {/* MOVED: Placements before Dashboard */}
                <Link to="/placements">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    <Briefcase size={16} />
                    Placements
                  </Button>
                </Link>

                {/* RENAMED: Dashboard → ATS / Cold Email */}
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    <Bot size={16} />
                    ATS / Cold Email
                  </Button>
                </Link>

                {/* NEW: Job Monitor */}
                <Link to="/jobs">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    <Search size={16} />
                    Job Monitor
                  </Button>
                </Link>

                <div className="flex items-center space-x-4 pl-4 border-l border-gray-700">
                  <span className="text-gray-400 text-sm">
                    {user.name || user.email}
                  </span>

                  <Button
                    onClick={handleSignOut}
                    className="bg-gray-200 text-black hover:bg-white flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    Sign In
                  </Button>
                </Link>

                <Link to="/signin">
                  <Button className="bg-gray-200 text-black hover:bg-white font-semibold">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-b border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <Link to="/">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <Home size={16} className="mr-2" />
                    Home
                  </Button>
                </Link>

                {/* MOVED: Placements before ATS */}
                <Link to="/placements">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <Briefcase size={16} className="mr-2" />
                    Placements
                  </Button>
                </Link>

                {/* RENAMED: Dashboard → ATS / Cold Email */}
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <Bot size={16} className="mr-2" />
                    ATS / Cold Email
                  </Button>
                </Link>

                {/* NEW: Job Monitor */}
                <Link to="/jobs">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <Search size={16} className="mr-2" />
                    Job Monitor
                  </Button>
                </Link>

                <div className="pt-4 pb-2 space-y-2 border-t border-gray-700">
                  <p className="text-gray-400 text-sm px-3 py-2">
                    {user.name || user.email}
                  </p>

                  <Button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="w-full bg-gray-200 text-black hover:bg-white"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Button>
                </Link>

                <Link to="/signin">
                  <Button className="w-full bg-gray-200 text-black hover:bg-white font-semibold">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};