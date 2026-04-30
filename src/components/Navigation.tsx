import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, Briefcase, Home, Bot, Search, Code2, Trophy } from "lucide-react";

interface NavigationProps {
  user: { id: string; email: string; name?: string } | null;
  onLogout: () => void;
}

const NAV_LINKS = [
  { to: "/",            label: "Home",         icon: Home      },
  { to: "/placements",  label: "Placements",   icon: Briefcase },
  { to: "/dashboard",   label: "ATS / Email",  icon: Bot       },
  { to: "/jobs",        label: "Job Monitor",  icon: Search    },
  { to: "/coding",      label: "Coding",       icon: Code2     },
  { to: "/leaderboard", label: "Leaderboard",  icon: Trophy    },
];

const GitHubIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

export const Navigation = ({ user, onLogout }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await fetch("https://job-flow-ai-automator.onrender.com/auth/logout", { method: "POST", credentials: "include" });
      onLogout(); navigate("/"); setIsOpen(false);
    } catch (e) { console.error(e); }
  };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          <Link to="/" className="text-xl font-bold text-gray-200 hover:text-white transition">
            AutoJob Flow
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-0.5">
            {user ? (
              <>
                {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to}>
                    <button className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(to) ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}>
                      <Icon size={14} />{label}
                    </button>
                  </Link>
                ))}
                <div className="flex items-center gap-3 ml-3 pl-3 border-l border-gray-800">
                  {/* GitHub Icon */}
                  <a
                    href="https://github.com/HARSHGUPTA3009/job-flow-ai-automator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="GitHub Repository"
                  >
                    <GitHubIcon size={18} />
                  </a>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {(user.name || user.email)?.[0]?.toUpperCase()}
                  </div>
                  <button onClick={handleSignOut} className="flex items-center gap-1.5 bg-gray-200 hover:bg-white text-black text-sm font-semibold px-3 py-1.5 rounded-lg transition">
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* GitHub Icon (logged out state) */}
                <a
                  href="https://github.com/HARSHGUPTA3009/job-flow-ai-automator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                  aria-label="GitHub Repository"
                >
                  <GitHubIcon size={18} />
                </a>
                <Link to="/signin"><button className="text-gray-300 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/5 transition">Sign In</button></Link>
                <Link to="/signin"><button className="bg-gray-200 hover:bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg transition">Get Started</button></Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {/* GitHub Icon (mobile) */}
            <a
              href="https://github.com/HARSHGUPTA3009/job-flow-ai-automator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              aria-label="GitHub Repository"
            >
              <GitHubIcon size={18} />
            </a>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/5 transition">
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile */}
      {isOpen && (
        <div className="md:hidden bg-black/98 backdrop-blur-xl border-b border-gray-800">
          <div className="px-4 pt-3 pb-5 space-y-1">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-gray-900/50 rounded-xl border border-gray-800">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {(user.name || user.email)?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{user.name || user.email}</p>
                    {user.name && <p className="text-gray-500 text-xs truncate">{user.email}</p>}
                  </div>
                </div>

                {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} onClick={() => setIsOpen(false)}>
                    <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      isActive(to) ? "bg-blue-600/20 text-blue-400 border border-blue-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}>
                      <Icon size={15} />{label}
                    </button>
                  </Link>
                ))}

                <div className="pt-3 mt-2 border-t border-gray-800">
                  <button onClick={() => { handleSignOut(); setIsOpen(false); }} className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-xl transition">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Link to="/signin" onClick={() => setIsOpen(false)}><button className="w-full text-gray-300 text-sm py-2.5 px-3 rounded-xl hover:bg-white/5 transition text-left">Sign In</button></Link>
                <Link to="/signin" onClick={() => setIsOpen(false)}><button className="w-full bg-gray-200 hover:bg-white text-black text-sm font-semibold py-2.5 px-3 rounded-xl transition">Get Started</button></Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};