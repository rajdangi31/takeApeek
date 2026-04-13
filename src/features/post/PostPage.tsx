import { useParams } from "react-router-dom";
import { PostDetail } from "./PostDetail";

export const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) return <div>Invalid post ID</div>;

  return (
    <div className="px-4 py-6">
      <PostDetail postId={id} />
    </div>
  );
};
