import { PostList } from "../components/PostList";

export const Home = () => {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg max-w-md mx-auto p-8 border border-pink-100">
          <div className="flex items-center justify-center mb-4">
            <div className="text-6xl">👀</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Peek your besties!
          </h1>
          <p className="text-gray-600 text-sm">
            See what your friends are up to right now
          </p>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        <PostList />
      </div>
    </div>
  );
};