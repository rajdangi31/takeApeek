import { useParams } from "react-router-dom";
import { PostDetail } from "../components/PostDetail";

export const PeekPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen px-4 py-6 bg-black text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent drop-shadow-md">
          Peek Details
        </h1>
        <PostDetail postId={Number(id)} />
      </div>
    </div>
  );
};
