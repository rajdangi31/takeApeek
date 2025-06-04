import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signInWithGoogle, signOut, user } = useAuth();

  const displayName =
    user?.user_metadata.user_name || user?.email?.split("@")[0];

  return (
    <nav className="bg-[#0f0f1a] shadow-lg border-b border-pink-600 z-50 sticky top-0">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/Logo.png"
            alt="takeApeek Logo"
            className="h-10 w-auto drop-shadow-md"
          />
          <span className="text-pink-500 font-bold text-xl tracking-wide">takeApeek</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-white hover:text-pink-500 transition font-medium">
            Home
          </Link>
          <Link to="/besties" className="text-white hover:text-pink-500 transition font-medium">
            Besties
          </Link>
          <Link
            to="/shareApeek"
            className="bg-pink-500 text-white px-4 py-1.5 rounded-full hover:bg-pink-600 transition text-sm font-semibold"
          >
            Share a Peek!
          </Link>

          {/* Auth */}
          {user ? (
            <div className="flex items-center space-x-3 border-l border-pink-700 pl-4 ml-4">
              {user.user_metadata.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User Avatar"
                  className="h-8 w-8 rounded-full object-cover border border-pink-400"
                />
              )}
              <span className="text-sm text-white font-medium">
                {displayName}
              </span>
              <button
                onClick={signOut}
                className="text-sm text-pink-400 hover:text-pink-300 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="bg-pink-500 text-white px-4 py-1.5 rounded-full hover:bg-pink-600 transition text-sm font-semibold"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-pink-500 hover:text-pink-400 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#1a1a2e] px-4 pb-4 space-y-4">
          {user && (
            <div className="flex items-center space-x-3 py-3 border-b border-pink-600">
              {user.user_metadata.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User Avatar"
                  className="h-8 w-8 rounded-full object-cover border border-pink-400"
                />
              )}
              <span className="text-sm text-white font-medium">
                {displayName}
              </span>
            </div>
          )}

          <Link to="/" className="text-white hover:text-pink-500 font-medium">
            Home
          </Link>
          <Link to="/besties" className="text-white hover:text-pink-500 font-medium">
            Besties
          </Link>
          <Link
            to="/shareApeek"
            className="block text-center bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-pink-600 font-semibold"
          >
            Share a Peek!
          </Link>

          <div className="pt-4 border-t border-pink-600">
            {user ? (
              <button
                onClick={signOut}
                className="w-full bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-pink-600 font-semibold"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="w-full bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-pink-600 font-semibold"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
