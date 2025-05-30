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
  const { user } = useAuth();

  const { mutate, isPending, isError, isSuccess } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return sharePeek(data.post, data.imageFile);
    },
    onSuccess: () => {
      // Reset form on success
      setTitle("");
      setContent("");
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById("image") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;
    
    mutate({
      post: { 
        title, 
        content, 
        avatar_url: user?.user_metadata.avatar_url || null,
      }, 
      imageFile: selectedFile 
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-pink-100">
          <div className="text-5xl mb-3">📸</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Share a Peek!</h1>
          <p className="text-gray-600 text-sm">Let your besties know what you're up to</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-pink-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-pink-600 font-semibold mb-2 text-sm">
              📝 What's happening?
            </label>
            <input
              type="text"
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your peek a title..."
              className="w-full border-2 border-pink-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all duration-200 bg-white/80 placeholder-gray-400"
            />
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-pink-600 font-semibold mb-2 text-sm">
              💭 Tell us more (optional)
            </label>
            <textarea
              id="content"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what's on your mind..."
              className="w-full border-2 border-pink-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all duration-200 bg-white/80 placeholder-gray-400 resize-none"
            />
          </div>

          {/* File Input */}
          <div>
            <label className="block text-pink-600 font-semibold mb-2 text-sm">
              📷 Take a Peek
            </label>
            <div className="relative">
              <input
                type="file"
                id="image"
                accept="image/*"
                capture="environment"
                required
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="image"
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold px-6 py-4 rounded-2xl cursor-pointer hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border-2 border-pink-400"
              >
                <span className="text-xl">📸</span>
                {selectedFile ? selectedFile.name : "Choose Photo"}
              </label>
            </div>
            {selectedFile && (
              <p className="text-green-600 text-xs mt-2 font-medium">
                ✅ Photo selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || !selectedFile}
            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed text-lg"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Sharing your peek...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="text-xl">✨</span>
                Share Peek!
              </span>
            )}
          </button>

          {/* Status Messages */}
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
              <p className="text-red-600 font-medium">😞 Error creating post. Please try again!</p>
            </div>
          )}
          
          {isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <p className="text-green-600 font-medium">🎉 Peek shared successfully!</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};