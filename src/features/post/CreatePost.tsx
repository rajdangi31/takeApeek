import { useState, type ChangeEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { useCreatePost } from "../../hooks/usePost";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Send, AlertCircle, CheckCircle2, X } from "lucide-react";

// Helper function to compress/resize image locally
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      const maxWidth = 1200;
      const maxHeight = 1200;
      let { width, height } = img;
      if (width > height && width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      } else if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }) : file),
        'image/jpeg',
        0.8
      );
    };
    img.src = URL.createObjectURL(file);
  });
};

export const CreatePost = () => {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useAuth();

  const { mutate, isPending, isError, isSuccess, error } = useCreatePost();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setErrorMessage("You must be logged in to post.");
      return;
    }
    
    setErrorMessage(""); 
    let finalFile = null;
    
    if (selectedFile) {
      try {
        finalFile = await compressImage(selectedFile);
      } catch (e) {
        console.error("Compression warning:", e);
        finalFile = selectedFile;
      }
    }

    mutate({ userId: user.id, content, imageFile: finalFile }, {
      onSuccess: () => {
        setContent("");
        setSelectedFile(null);
        setPreviewUrl(null);
        setErrorMessage("");
      }
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("File is too large (must be under 10MB).");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrorMessage("Please select a valid image file.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage(""); 
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  if (!user) {
    return (
        <div className="glass-effect rounded-3xl p-8 text-center max-w-md mx-auto">
             <div className="text-4xl mb-4">🔐</div>
             <p className="text-slate-600 font-bold font-outfit">Please log in to share a Post.</p>
        </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex glass-effect rounded-[2.5rem] p-6 border-white/50 shadow-xl mb-6 items-center justify-center">
          <div className="text-5xl animate-float">📸</div>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 font-outfit tracking-tight">Share a <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">Peek</span></h1>
        <p className="text-slate-500 font-medium">Capture the moment for your friends.</p>
      </motion.div>

      {/* Form Card */}
      <div className="glass-effect rounded-[2.5rem] p-8 border-white/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
             <ImageIcon size={120} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div>
            <label className="flex items-center gap-2 text-slate-800 font-bold mb-3 text-sm font-outfit px-1">
              <span>✍️</span> What's happening?
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what's on your mind..."
              className="w-full bg-slate-50/50 focus:bg-white border-2 border-slate-100 focus:border-pink-300 rounded-[1.5rem] px-5 py-4 focus:outline-none transition-all duration-300 placeholder-slate-300 font-medium resize-none text-[15px]"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-slate-800 font-bold mb-3 text-sm font-outfit px-1">
              <span>📸</span> Add a Photo (Optional)
            </label>
            
            <AnimatePresence mode="wait">
              {previewUrl ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group rounded-3xl overflow-hidden shadow-lg border-2 border-slate-100"
                >
                  <img src={previewUrl} className="w-full h-48 object-cover" alt="Preview"/>
                  <button 
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-xl text-slate-600 hover:text-red-500 shadow-md transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-white/70 backdrop-blur-md text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center truncate px-10">
                     {selectedFile?.name}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                >
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="image"
                    className="w-full border-2 border-dashed border-slate-200 rounded-[1.5rem] py-10 cursor-pointer hover:border-pink-400 hover:bg-pink-50/30 transition-all duration-300 flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">
                        <ImageIcon size={24} className="text-slate-400 group-hover:text-pink-500" />
                    </div>
                    <span className="font-bold text-slate-400 group-hover:text-pink-600 text-sm">Choose Photo</span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={isPending || (!content && !selectedFile)}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold py-5 rounded-[1.5rem] transition-all duration-300 shadow-xl hover:shadow-2xl disabled:shadow-none disabled:cursor-not-allowed group flex items-center justify-center gap-3 overflow-hidden relative"
          >
            {isPending ? (
              <>
                <div className="animate-spin w-5 h-5 border-3 border-white/30 border-t-white rounded-full"></div>
                <span className="font-outfit uppercase tracking-widest text-sm">Sending Peek...</span>
              </>
            ) : (
              <>
                <span className="font-outfit uppercase tracking-widest text-sm">Post Peek</span>
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
          </button>

          {/* Messages */}
          <AnimatePresence>
            {(isError || errorMessage) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-100 text-red-600"
              >
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm font-bold truncate">{errorMessage || error?.message}</p>
              </motion.div>
            )}
            
            {isSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-4 bg-green-50/50 rounded-2xl border border-green-100 text-green-600"
              >
                <CheckCircle2 size={20} className="shrink-0" />
                <p className="text-sm font-bold">Your peek is live! ✨</p>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
};