import { useState, type ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../contexts/AuthContext";

interface PostInput {
  title: string;
  content: string;
  user_email?: string;
  avatar_url: string | null;
}

const sharePeek = async (post: PostInput, imageFile: File) => {
  const filePath = `${post.title}-${Date.now()}-${imageFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from("peeks")
    .upload(filePath, imageFile);
  if (uploadError) throw new Error(uploadError.message);

  const { data: publicURLData } = supabase.storage
    .from("peeks")
    .getPublicUrl(filePath);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error("User not authenticated");

  const userEmail = userData.user.email;

  const { data, error } = await supabase
    .from("Peeks")
    .insert({
      ...post,
      image_url: publicURLData.publicUrl,
      user_email: userEmail,
    });
  if (error) throw new Error(error.message);

  return data;
};

export const SharePeek = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const {user} = useAuth()
  const { mutate, isPending, isError } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return sharePeek(data.post, data.imageFile);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;
    mutate({ post: { title, content, avatar_url: user?.user_metadata.avatar_url || null,
     }, imageFile: selectedFile });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg space-y-6"
    >
      <div>
        <label className="block text-pink-600 font-medium mb-1">Title</label>
        <input
          type="text"
          id="title"
          required
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <div>
        <label className="block text-pink-600 font-medium mb-1">Content</label>
        <textarea
          id="content"
          required
          rows={5}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <div>
        <label className="block text-pink-600 font-medium mb-1">
          Take a Peek
        </label>
        <input
          type="file"
          id="image"
          accept="image/*"
          capture="environment"
          required
          onChange={handleFileChange}
          className="w-full bg-pink-500 text-white font-semibold px-3 py-2 rounded cursor-pointer hover:bg-pink-600 transition"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-full transition"
      >
        {isPending ? "Creating..." : "Share Peek"}
      </button>

      {isError && <p className="text-red-500">Error creating post.</p>}
    </form>
  );
};
