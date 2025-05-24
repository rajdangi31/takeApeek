import { PostList } from "../components/PostList";

export const Home = () => {
  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-pink-600 text-center mb-4">Peeks!</h2>
      <div>
        <PostList />
      </div>
    </div>
  );
};
