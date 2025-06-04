import { PostList } from "../components/PostList";
import { NotificationSettings } from "../components/NotificationSettings";

export const Home = () => {
  return (
    <div className="space-y-10 bg-black min-h-screen text-white pb-10">
      {/* Header Section */}
      <div className="text-center py-12">
        <div className="bg-gradient-to-br from-fuchsia-600 to-pink-600 rounded-3xl shadow-[0_20px_60px_rgba(236,72,153,0.6)] max-w-md mx-auto p-10 border border-fuchsia-500 animate-fade-in">
          <div className="flex items-center justify-center mb-5">
            <div className="text-6xl animate-pulse">👀</div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-wide drop-shadow-md">
            Peek your besties!
          </h1>
          <p className="text-fuchsia-100 text-sm">
            See what your friends are up to right now
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="max-w-md mx-auto px-4">
        <NotificationSettings />
      </div>

      {/* Posts Feed */}
      <div className="space-y-6 px-4">
        <PostList />
      </div>
    </div>
  );
};
