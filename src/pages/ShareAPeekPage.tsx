import { SharePeek } from "../components/SharePeek";

export const ShareAPeekPage = () => {
  return (
    <div className="min-h-screen py-10 px-4 bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl shadow-xl">
            <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              Share a Peek!
            </h2>
          </div>
          <p className="text-gray-400 mt-3 text-sm">
            Snap a moment and let your besties in on it
          </p>
        </div>
        <SharePeek />
      </div>
    </div>
  );
};
