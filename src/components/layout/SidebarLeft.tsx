import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { motion } from "framer-motion";
import { Home, Users, PlusSquare, User, LogOut, Bell, Compass } from "lucide-react";

export const SidebarLeft = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const displayName = user?.user_metadata.full_name || user?.user_metadata.name || user?.email?.split("@")[0] || "Friend";

  const navLinks = [
    { name: "Home", path: "/", icon: <Home size={22} /> },
    { name: "Explore", path: "/explore", icon: <Compass size={22} /> },
    { name: "Notifications", path: "/notifications", icon: <Bell size={22} /> },
    { name: "Friends", path: "/friends", icon: <Users size={22} /> },
    { name: "My Profile", path: `/profile/${user?.id}`, icon: <User size={22} /> },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-72 h-screen px-6 py-10 flex flex-col justify-between border-r border-white/20 hidden lg:flex">
      <div className="space-y-10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-4 px-3 group">
          <div className="w-12 h-12 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all duration-300 overflow-hidden">
             <img src="/Logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-outfit font-black text-3xl tracking-tighter text-slate-800">
            Take<span className="text-pink-500">APeek</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 group
                ${location.pathname === link.path 
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
              `}
            >
              <span className={`${location.pathname === link.path ? "text-pink-500" : "group-hover:text-pink-500"} transition-colors`}>
                {link.icon}
              </span>
              <span className="text-sm uppercase tracking-widest">{link.name}</span>
            </Link>
          ))}
          
          <Link
            to="/shareApost"
            className="flex items-center gap-4 px-4 py-5 mt-6 rounded-[2rem] bg-pink-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-pink-200 hover:bg-pink-600 hover:scale-[1.02] transition-all active:scale-95 text-center justify-center"
          >
            <PlusSquare size={18} />
            Create Peek
          </Link>
        </nav>
      </div>

      {/* User Quick Switcher / Logout */}
      <div className="space-y-4">
        <Link 
            to="/profile" 
            className="flex items-center gap-4 p-3 rounded-3xl bg-white/50 backdrop-blur-sm border border-white hover:border-pink-200 transition-all group"
        >
            <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                {user?.user_metadata.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-pink-600 font-black text-lg font-outfit">{displayName?.charAt(0).toUpperCase()}</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate font-outfit">{displayName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">View Profile</p>
            </div>
        </Link>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold text-[10px] uppercase tracking-widest transition-all"
        >
          <LogOut size={16} />
          Sign Out of Peek
        </button>
      </div>
    </aside>
  );
};
