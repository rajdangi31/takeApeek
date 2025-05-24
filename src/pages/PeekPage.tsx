import { useParams } from "react-router-dom";
import { PostDetail } from "../components/PostDetail";

export const PeekPage = () => {
    const{ id } = useParams<{id: string}>()
  return (
    <div className="px-4 py-6">
        <PostDetail postId={Number(id)}/>
    </div>
  );
};
