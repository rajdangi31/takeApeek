import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Navbar } from "./components/Navbar";
import { ShareAPeekPage } from "./pages/ShareAPeekPage";
import { PeekPage } from "./pages/PeekPage";
import { BestiesList } from "./components/BestiesList";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-[#0f0f0f] font-sans text-white">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 pt-8 pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shareApeek" element={<ShareAPeekPage />} />
            <Route path="/post/:id" element={<PeekPage />} />
            <Route path="/besties" element={<BestiesList />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
