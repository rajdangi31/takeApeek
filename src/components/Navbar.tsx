import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signInWithGoogle, signOut, user } = useAuth();

  const displayName = user?.user_metadata.user_name || user?.email?.split('@')[0];

  return (
    <motion.nav
      className="bg-dark-glass shadow-lg border-b border-neon-pink/30 z-50 sticky top-0 backdrop-blur-md"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <motion.img
            src="/Logo.png"
            alt="takeApeek Logo"
            className="h-10 w-auto drop-shadow-md"
            whileHover={{ scale: 1.1 }}
          />
          <span className="text-neon-pink font-bold text-xl tracking-wide">takeApeek</span>
        </Link>
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-white hover:text-neon-pink transition font-medium">
            Home
          </Link>
          <Link to="/besties" className="text-white hover:text-neon-pink transition font-medium">
            Besties
          </Link>
          <Link
            to="/shareApeek"
            className="bg-gradient-to-r from-neon-pink to-neon-purple text-white px-4 py-1.5 rounded-full hover:from-neon-purple hover:to-neon-pink transition text-sm font-semibold shadow-glow"
          >
            Share a Peek!
          </Link>
          {user ? (
            <div className="flex items-center space-x-3 border-l border-neon-pink/50 pl-4 ml-4">
              {user.user_metadata.avatar_url && (
                <motion.img
                  src={user.user_metadata.avatar_url}
                  alt="User Avatar"
                  className="h-8 w-8 rounded-full object-cover border border-neon-pink/50"
                  whileHover={{ scale: 1.1 }}
                />
              )}
              <span className="text-sm text-white font-medium">{displayName}</span>
              <motion.button
                onClick={signOut}
                className="text-sm text-neon-pink hover:text-neon-pink/80 transition"
                whileHover={{ scale: 1.05 }}
              >
                Sign Out
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={signInWithGoogle}
              className="bg-gradient-to-r from-neon-pink to-neon-purple text-white px-4 py-1.5 rounded-full hover:from-neon-purple hover:to-neon-pink transition text-sm font-semibold shadow-glow"
              whileHover={{ scale: 1.05 }}
            >
              Sign In
            </motion.button>
          )}
        </div>
        <div className="md:hidden">
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-neon-pink hover:text-neon-pink/80 transition"
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </motion.button>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden bg-dark-glass px-4 pb-4 space-y-4 backdrop-blur-md"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {user && (
              <div className="flex items-center space-x-3 py-3 border-b border-neon-pink/50">
                {user.user_metadata.avatar_url && (
                  <motion.img
                    src={user.user_metadata.avatar_url}
                    alt="User Avatar"
                    className="h-8 w-8 rounded-full object-cover border border-neon-pink/50"
                    whileHover={{ scale: 1.1 }}
                  />
                )}
                <span className="text-sm text-white font-medium">{displayName}</span>
              </div>
            )}
            <Link to="/" className="text-white hover:text-neon-pink font-medium block">
              Home
            </Link>
            <Link to="/besties" className="text-white hover:text-neon-pink font-medium block">
              Besties
            </Link>
            <Link
              to="/shareApeek"
              className="block text-center bg-gradient-to-r from-neon-pink to-neon-purple text-white px-4 py-2 rounded-full hover:from-neon-purple hover:to-neon-pink font-semibold shadow-glow"
            >
              Share a Peek!
            </Link>
            <div className="pt-4 border-t border-neon-pink/50">
              {user ? (
                <motion.button
                  onClick={signOut}
                  className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white px-4 py-2 rounded-full hover:from-neon-purple hover:to-neon-pink font-semibold shadow-glow"
                  whileHover={{ scale: 1.05 }}
                >
                  Sign Out
                </motion.button>
              ) : (
                <motion.button
                  onClick={signInWithGoogle}
                  className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white px-4 py-2 rounded-full hover:from-neon-purple hover:to-neon-pink font-semibold shadow-glow"
                  whileHover={{ scale: 1.05 }}
                >
                  Sign In
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};