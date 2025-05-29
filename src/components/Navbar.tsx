import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signInWithGoogle, signOut, user } = useAuth();

  const displayName =
    user?.user_metadata.user_name || user?.email?.split("@")[0];

  return (
    <nav className="bg-[#fff0b8] shadow-md border-b border-yellow-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <img
            src="/Logo.png"
            alt="takeApeek Logo"
            className="h-16 w-auto"
          />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-pink-600 font-semibold hover:text-black">
            Home
          </Link>
          
          <Link
            to="/besties"
            className="text-pink-600 font-semibold hover:text-black"
          >
            Besties
          </Link>
          <Link
            to="/shareApeek"
            className="bg-pink-500 text-white px-4 py-1 rounded-full hover:bg-pink-600 text-sm font-medium"
          >
            Share a Peek!
          </Link>

          {/* Desktop Auth */}
          {user ? (
            <div className="flex items-center space-x-3 pl-6 border-l border-pink-200">
              {user.user_metadata.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <span className="text-gray-800 text-sm font-medium">
                {displayName}
              </span>
              <button
                onClick={signOut}
                className="text-sm text-pink-600 hover:text-pink-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="bg-pink-500 text-white px-4 py-1 rounded-full hover:bg-pink-600 text-sm font-medium"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-pink-600"
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
        <div className="md:hidden bg-[#fff0b8] px-4 pb-4">
          {/* Mobile Auth */}
          {user ? (
            <div className="flex items-center space-x-3 py-2 border-b border-pink-200">
              {user.user_metadata.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <span className="text-gray-800 text-sm font-medium">
                {displayName}
              </span>
            </div>
          ) : null}

          <div className="flex flex-col space-y-2 pt-4">
            <Link to="/" className="text-pink-600 font-semibold hover:text-black">
              Home
            </Link>
            <Link
              to="/besties"
              className="text-pink-600 font-semibold hover:text-black"
            >
              Besties
            </Link>
            <Link
              to="/shareApeek"
              className="bg-pink-500 text-white px-4 py-1 rounded-full text-center hover:bg-pink-600 text-sm font-medium"
            >
              Share a Peek!
            </Link>
          </div>

          <div className="pt-4 border-t border-pink-200">
            {user ? (
              <button
                onClick={signOut}
                className="w-full bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-pink-600 text-sm font-medium"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="w-full bg-pink-500 text-white px-4 py-2 rounded-full hover:bg-pink-600 text-sm font-medium"
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