import { useState, type ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '../supabase-client';
import { useAuth } from '../contexts/AuthContext';

interface PostInput {
  title: string;
  content: string;
  user_email?: string;
  avatar_url: string | null;
}

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      const maxDim = 1200;
      let { width, height } = img;

      if (width > height && width > maxDim) {
        height = (height * maxDim) / width;
        width = maxDim;
      } else if (height > maxDim) {
        width = (width * maxDim) / height;
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else resolve(file);
        },
        'image/jpeg',
        0.8
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

const sharePeek = async (post: PostInput, imageFile: File) => {
  const compressed = await compressImage(imageFile);
  const filePath = `${post.title.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}-${compressed.name}`;

  const { error: uploadError } = await supabase.storage
    .from('peeks')
    .upload(filePath, compressed);

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: publicURLData } = supabase.storage
    .from('peeks')
    .getPublicUrl(filePath);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('User not authenticated');

  const { error } = await supabase.from('Peeks').insert({
    ...post,
    image_url: publicURLData.publicUrl,
    user_email: userData.user.email,
  });

  if (error) throw new Error(`Database error: ${error.message}`);
};

export const SharePeek = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useAuth();

  const { mutate, isPending, isError, isSuccess } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) =>
      sharePeek(data.post, data.imageFile),
    onSuccess: () => {
      setTitle('');
      setContent('');
      setSelectedFile(null);
      setErrorMessage('');
      const input = document.getElementById('image') as HTMLInputElement;
      if (input) input.value = '';
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024)
      return setErrorMessage('File too large. Keep it under 10MB.');

    if (!file.type.startsWith('image/'))
      return setErrorMessage('Only image files are allowed.');

    setSelectedFile(file);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setErrorMessage('');
    mutate({
      post: {
        title,
        content,
        avatar_url: user?.user_metadata.avatar_url || null,
      },
      imageFile: selectedFile,
    });
  };

  return (
    <motion.div
      className="max-w-md mx-auto space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 border border-neon-pink/30 shadow-glow rounded-3xl p-6 text-center text-white backdrop-blur-md"
        whileHover={{ scale: 1.02 }}
      >
        <motion.div
          className="text-5xl mb-3"
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          📸
        </motion.div>
        <h1 className="text-2xl font-bold mb-1">Share a Peek!</h1>
        <p className="text-sm text-neon-pink/80">Let your besties know what you're up to</p>
      </motion.div>
      <form
        onSubmit={handleSubmit}
        className="bg-dark-glass border border-neon-pink/20 backdrop-blur-md rounded-3xl p-6 shadow-neumorphic space-y-6"
      >
        <motion.div initial={{ x: -20 }} animate={{ x: 0 }} transition={{ duration: 0.4 }}>
          <label className="block text-neon-pink font-medium mb-2 text-sm">📝 What's happening?</label>
          <input
            type="text"
            value={title}
            required
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your peek a title..."
            className="w-full px-4 py-3 rounded-xl bg-dark-glass text-white border border-neon-pink/40 placeholder-neon-pink/50 focus:ring-2 focus:ring-neon-pink focus:outline-none"
          />
        </motion.div>
        <motion.div initial={{ x: -20 }} animate={{ x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <label className="block text-neon-pink font-medium mb-2 text-sm">💭 Add more context (optional)</label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share what's on your mind..."
            className="w-full px-4 py-3 rounded-xl bg-dark-glass text-white border border-neon-pink/40 placeholder-neon-pink/50 resize-none focus:ring-2 focus:ring-neon-pink focus:outline-none"
          />
        </motion.div>
        <motion.div initial={{ x: -20 }} animate={{ x: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <label className="block text-neon-pink font-medium mb-2 text-sm">📷 Upload an image</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            capture="environment"
            required
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="image"
            className="w-full cursor-pointer bg-gradient-to-r from-neon-pink to-neon-purple text-white font-semibold text-center py-3 px-6 rounded-xl block shadow-glow transition hover:from-neon-purple hover:to-neon-pink"
          >
            {selectedFile ? `📸 ${selectedFile.name}` : '📸 Choose Photo'}
          </label>
          {selectedFile && (
            <p className="text-green-400 text-sm mt-1">
              ✅ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </motion.div>
        <motion.button
          type="submit"
          disabled={isPending || !selectedFile}
          className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white font-bold py-3 rounded-xl transition shadow-glow hover:from-neon-purple hover:to-neon-pink disabled:from-gray-500 disabled:to-gray-700 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Sharing your peek...
            </span>
          ) : (
            <span>✨ Share Peek!</span>
          )}
        </motion.button>
        {isError && (
          <motion.div
            className="text-red-400 bg-red-900/30 border border-red-400/40 rounded-xl px-4 py-2 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>😞 {errorMessage}</p>
          </motion.div>
        )}
        {isSuccess && (
          <motion.div
            className="text-green-400 bg-green-900/30 border border-green-400/40 rounded-xl px-4 py-2 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            🎉 Peek shared successfully!
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};