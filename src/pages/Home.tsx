// Home.tsx
import usePush from "../hooks/usePush"
import { PostList } from "../components/PostList"

export const Home = () => {
  const { requestPushPermission } = usePush()

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg max-w-md mx-auto p-8 border border-pink-100">
          <div className="flex items-center justify-center mb-4">
            <div className="text-6xl">👀</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Peek your besties!
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            See what your friends are up to right now
          </p>
          <button
            onClick={requestPushPermission}
            className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-xl"
          >
            🔔 Enable Notifications
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <PostList />
      </div>
    </div>
  )
}
