import { SharePeek } from "../components/SharePeek";

export const ShareAPeekPage = () => {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-pink-600 mb-6 text-center">
          Share a Peek!
        </h2>
        <SharePeek />
      </div>
    </div>
  );
};
