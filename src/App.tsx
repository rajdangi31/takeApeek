import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Navbar } from "./components/Navbar";
import { ShareAPeekPage } from "./pages/ShareAPeekPage";
import { PeekPage } from "./pages/PeekPage";

function App() {
  return (
    <BrowserRouter>
      <div className="bg-yellow-50 min-h-screen font-sans text-gray-800">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 pt-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shareApeek" element={<ShareAPeekPage />} />
            <Route path="/post/:id" element={<PeekPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
