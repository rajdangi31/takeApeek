import { useEffect, useRef } from "react";
import { useFeed } from "../../hooks/useFeed";
import { useAuth } from "../auth/AuthContext";
import { PostCard } from "./PostCard";
import { PostSkeleton } from "../../components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";

export const FeedList = () => {
  const { user } = useAuth();
  const { 
    data, 
    isLoading, 
    isError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useFeed(user?.id);

  const observerRef = useRef<HTMLDivElement>(null);

  // Setup Manual Intersection Observer for Infinite Scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100 p-8">
        <p className="text-red-500 font-bold font-outfit uppercase tracking-widest text-sm">Failed to sync feed</p>
        <p className="text-red-400 text-xs mt-2">Check your connection and try again.</p>
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page) || [];

  if (posts.length === 0) {
    return (
      <div className="text-center py-32 space-y-4 opacity-50 grayscale">
        <div className="text-6xl">🔭</div>
        <h3 className="text-2xl font-black font-outfit text-slate-800">The horizon is empty.</h3>
        <p className="text-slate-500 font-medium">Follow more friends or share your first peek!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnimatePresence initial={false}>
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                duration: 0.4, 
                delay: Math.min(index * 0.05, 0.3),
                ease: [0.23, 1, 0.32, 1] 
            }}
          >
            <PostCard post={post} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Scroll Sentinel */}
      <div 
        ref={observerRef} 
        className="h-20 flex items-center justify-center"
      >
        {isFetchingNextPage && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bridging more peeks...</span>
          </div>
        )}
        {!hasNextPage && posts.length > 0 && (
          <div className="h-px w-full bg-slate-100 flex items-center justify-center">
             <span className="bg-white px-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">End of the horizon</span>
          </div>
        )}
      </div>
    </div>
  );
};