import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "./components/layout/Navbar";
import { SidebarLeft } from "./components/layout/SidebarLeft";
import { SidebarRight } from "./components/layout/SidebarRight";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LoginPage } from "./features/auth/LoginPage";

// Lazy loading components for performance optimization
const Home = lazy(() => import("./features/feed/FeedPage").then(module => ({ default: module.Home })));
const ShareAPeekPage = lazy(() => import("./features/post/CreatePostPage").then(module => ({ default: module.ShareAPeekPage })));
const PostPage = lazy(() => import("./features/post/PostPage").then(module => ({ default: module.PostPage })));
const FriendList = lazy(() => import("./features/friends/FriendList").then(module => ({ default: module.FriendList })));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage").then(module => ({ default: module.ProfilePage })));

function FallbackError({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-900 px-4 font-sans">
      <h1 className="text-3xl font-bold mb-4 font-outfit">Something went wrong</h1>
      <p className="mb-6 font-mono text-sm break-all max-w-full bg-red-100 p-4 rounded">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 shadow-lg transition-transform active:scale-95"
      >
        Try again
      </button>
    </div>
  );
}

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
    <span className="font-outfit font-bold text-slate-400 uppercase tracking-widest text-[10px]">Syncing Peek-verse...</span>
  </div>
);

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <ErrorBoundary FallbackComponent={FallbackError}>
      <div className="bg-mesh-gradient min-h-screen font-inter text-slate-900 selection:bg-pink-100 selection:text-pink-600">
        
        {/* Mobile Navigation (Persistent) */}
        {!isLoginPage && <Navbar />}

        <div className="flex justify-center max-w-[1600px] mx-auto min-h-screen relative">
          
          {/* Left Sidebar (Desktop Only) */}
          {!isLoginPage && <SidebarLeft />}

          {/* Main Feed Column */}
          <main className={`flex-1 w-full max-w-[650px] min-h-screen pb-12 transition-all duration-500
            ${isLoginPage ? 'pt-0' : 'pt-32 lg:pt-12 px-4 lg:mx-[300px] xl:mx-0'}
          `}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="page-transition-wrapper h-full"
              >
                <Suspense fallback={<PageLoader />}>
                  <Routes location={location} key={location.pathname}>
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/" element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    } />
                    <Route path="/shareApost" element={
                      <ProtectedRoute>
                        <ShareAPeekPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/post/:id" element={
                      <ProtectedRoute>
                        <PostPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/friends" element={
                      <ProtectedRoute>
                        <FriendList />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile/:id" element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Right Sidebar (XL Desktop Only) */}
          {!isLoginPage && <SidebarRight />}

        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;