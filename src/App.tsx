import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Navbar } from "./components/Navbar";
import { ShareAPeekPage } from "./pages/ShareAPeekPage";
import { PeekPage } from "./pages/PeekPage";
import { BestiesList } from "./components/BestiesList";
import usePush from "./hooks/usePush";

function App() {
  usePush()
  return (
    <BrowserRouter>
      <div className="bg-gradient-to-br from-[#fff0b8] via-[#fdf5c3] to-[#fcf2b3] min-h-screen font-sans text-gray-800">
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