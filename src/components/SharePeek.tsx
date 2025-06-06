import { useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query"; // Import useQueryClient
import { supabase } from "../supabase-client";
import { useAuth } from "../contexts/AuthContext";

interface PostInput {
  title: string;
  content: string;
  user_email?: string;
  avatar_url: string | null;
}

// ✨ NEW: Define the shape of the returned post object for type safety
interface NewPost {
  id: number;
  title: string;
  content: string;
}

// Helper function to compress/resize image (no changes needed here)
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      const maxWidth = 1200;
      const maxHeight = 1200;
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8
      );
    };
    img.src = URL.createObjectURL(file);
  });
};

const sharePeek = async (post: PostInput, imageFile: File): Promise<NewPost> => {
  try {
    const compressedFile = await compressImage(imageFile);
    const filePath = `${post.title.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}-${compressedFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("peeks")
      .upload(filePath, compressedFile, { cacheControl: '3600', upsert: false });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: publicURLData } = supabase.storage
      .from("peeks")
      .getPublicUrl(filePath);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) throw new Error("User not authenticated");

    const userEmail = userData.user.email;
    
    // ✨ CHANGED: Use .select() and .single() to ensure the new post object is returned
    const { data, error } = await supabase
      .from("Peeks")
      .insert({
        ...post,
        image_url: publicURLData.publicUrl,
        user_email: userEmail,
        // Assuming your table has a user_id column linked to auth.users
        user_id: userData.user.id, 
      })
      .select('id, title, content') // Select the fields needed for the notification
      .single();

    if (error) throw new Error(`Database error: ${error.message}`);
    
    return data;
  } catch (error) {
    console.error('Full error in sharePeek:', error);
    throw error;
  }
};

export const SharePeek = () => {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { user } = useAuth();
  const queryClient = useQueryClient(); // ✨ NEW: Get queryClient instance

  const { mutate, isPending, isError, isSuccess } = useMutation({
    // ✨ CHANGED: Updated mutation type to expect the NewPost object
    mutationFn: (data: { post: PostInput; imageFile: File }): Promise<NewPost> => {
      return sharePeek(data.post, data.imageFile);
    },
    // ✨ CHANGED: onSuccess now receives the new post and triggers the notification
    onSuccess: (newPost) => {
      // Reset form on success
      setTitle("");
      setContent("");
      setSelectedFile(null);
      setErrorMessage("");
      const fileInput = document.getElementById("image") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Invalidate queries to refetch posts list, etc.
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // Adjust 'posts' to your query key

      // ✨ TRIGGER THE PUSH NOTIFICATION FOR THE NEW POST ✨
      if (user && newPost) {
        try {
          console.log("Triggering push notification for a new post...");
          supabase.functions.invoke('trigger-bestie-push', {
            body: {
              actionType: 'NEW_POST',
              actor: {
                id: user.id,
                username: user.user_metadata?.user_name || 'Someone',
              },
              post: {
                id: newPost.id,
                // Use title as preview, fallback to content
                preview: newPost.title || newPost.content.substring(0, 50) + '...',
              }
            }
          });
        } catch (pushError) {
          console.error("Failed to trigger push for new post:", pushError);
        }
      }
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;
    setErrorMessage("");
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
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("File too large. Please choose a smaller image (under 10MB).");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrorMessage("Please select an image file.");
        return;
      }
      setSelectedFile(file);
      setErrorMessage("");
    }
  };

  // The entire JSX render part remains the same.
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
          {/* Form inputs... (no changes here) */}
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
          <div>
            <label className="block text-pink-600 font-semibold mb-2 text-sm">
              📷 Take a Peek
            </label>
            <div className="relative">
              <input type="file" id="image" accept="image/*" capture="environment" required onChange={handleFileChange} className="hidden" />
              <label htmlFor="image" className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold px-6 py-4 rounded-2xl cursor-pointer hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 border-2 border-pink-400">
                <span className="text-xl">📸</span>
                {selectedFile ? selectedFile.name : "Choose Photo"}
              </label>
            </div>
            {selectedFile && (
              <div className="mt-2">
                <p className="text-green-600 text-xs font-medium">✅ Photo selected: {selectedFile.name}</p>
                <p className="text-gray-500 text-xs">Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>
          <button type="submit" disabled={isPending || !selectedFile} className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed text-lg">
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
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-red-600 font-medium text-sm">😞 Error creating post:</p>
              <p className="text-red-500 text-xs mt-1 break-words">{errorMessage}</p>
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