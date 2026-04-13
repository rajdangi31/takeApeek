import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Users, PlusSquare, LogOut, LogIn, User } from "lucide-react";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signInWithGoogle, signOut, user } = useAuth();
  const location = useLocation();

  const displayName = user?.user_metadata.full_name || user?.user_metadata.name || user?.email?.split("@")[0] || "Friend";

  const navLinks = [
    { name: "Home", path: "/", icon: <Home size={18} /> },
    { name: "Friends", path: "/friends", icon: <Users size={18} /> },
    { name: "Share a Post!", path: "/shareApost", icon: <PlusSquare size={18} />, primary: true },
  ];

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 px-4">
      <div className="max-w-5xl mx-auto glass-effect rounded-2xl px-6 py-3 flex items-center justify-between shadow-2xl border-white/40">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95">
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all duration-300 overflow-hidden">
             <img src="/Logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="hidden sm:block font-outfit font-extrabold text-2xl tracking-tight text-slate-800 group-hover:text-pink-600 transition-colors">
            Take<span className="text-pink-500">A</span>Peek
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2
                ${link.primary 
                  ? "bg-pink-500 text-white shadow-lg hover:shadow-pink-500/30 hover:bg-pink-600" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}
                ${location.pathname === link.path && !link.primary ? "text-pink-600 bg-pink-50" : ""}
              `}
            >
              {link.icon}
              {link.name}
              {location.pathname === link.path && !link.primary && (
                <motion.div
                  layoutId="nav-ink"
                  className="absolute bottom-1 left-4 right-4 h-0.5 bg-pink-500 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
          
          <div className="h-6 w-px bg-slate-200 mx-2" />

          {/* Desktop Auth & Profile */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/profile" 
                className={`flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 transition-colors
                    ${location.pathname === "/profile" ? "bg-slate-100" : ""}
                `}
              >
                {user.user_metadata.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User Avatar"
                    className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                    <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold border-2 border-white">
                        {displayName?.charAt(0).toUpperCase()}
                    </div>
                )}
                <span className="text-slate-800 text-sm font-bold">
                  {displayName}
                </span>
              </Link>
              <button
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-shadow shadow-lg flex items-center gap-2"
            >
              <LogIn size={18} />
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-2">
            {!user && (
                 <Link
                 to="/login"
                 className="p-2 rounded-xl bg-slate-900 text-white shadow-lg"
               >
                 <LogIn size={20} />
               </Link>
            )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-4 glass-effect rounded-2xl p-4 shadow-2xl border-white/40 overflow-hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                    ${link.primary 
                      ? "bg-pink-500 text-white shadow-lg" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-pink-600"}
                  `}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              
              {user && (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                        ${location.pathname === "/profile" ? "bg-slate-50 text-pink-600" : "text-slate-600 hover:bg-slate-50 hover:text-pink-600"}
                    `}
                  >
                    <User size={18} />
                    My Profile
                  </Link>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="User Avatar"
                        className="h-10 w-10 rounded-full border-2 border-white shadow-md"
                      />
                      <span className="text-slate-800 font-bold">{displayName}</span>
                    </div>
                    <button
                      onClick={signOut}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 bg-red-50 font-bold text-sm"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};