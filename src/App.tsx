import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home } from './pages/Home';
import { Navbar } from './components/Navbar';
import { ShareAPeekPage } from './pages/ShareAPeekPage';
import { PeekPage } from './pages/PeekPage';
import { BestiesList } from './components/BestiesList';

function App() {
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950 font-sans text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 pt-8 pb-12">
        <AnimatePresence>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shareApeek" element={<ShareAPeekPage />} />
            <Route path="/post/:id" element={<PeekPage />} />
            <Route path="/besties" element={<BestiesList />} />
          </Routes>
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

export default App;