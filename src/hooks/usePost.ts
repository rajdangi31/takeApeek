import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Post, Comment, Profile } from '../types/database';

export const postKeys = {
  all: ['posts'] as const,
  detail: (id: string) => [...postKeys.all, 'detail', id] as const,
  comments: (id: string) => [...postKeys.all, 'comments', id] as const,
  likes: (id: string) => [...postKeys.all, 'likes', id] as const,
};

export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, content, imageFile }: { userId: string, content: string, imageFile: File | null }) => {
      let imageUrl: string | null = null;
      
      if (imageFile) {
        const filePath = `${userId}-${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from("peeks")
          .upload(filePath, imageFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        
        const { data: publicURLData } = supabase.storage.from("peeks").getPublicUrl(filePath);
        imageUrl = publicURLData.publicUrl;
      }

      const { error } = await supabase.from('posts').insert({
        user_id: userId,
        content,
        image_url: imageUrl
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feed'] });
    }
  });
};

export const usePostDetail = (postId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: postKeys.detail(postId),
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(username, display_name, avatar_url)
        `)
        .eq('id', postId)
        .single();
        
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (!postId) return;
    const channel = supabase
      .channel(`post-detail-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: `id=eq.${postId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, queryClient]);

  return query;
};

export const useToggleLike = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, postId, isLiked }: { userId: string, postId: string, isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase.from('likes').delete().match({ user_id: userId, post_id: postId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').insert({ user_id: userId, post_id: postId });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: postKeys.likes(variables.postId) });
      void qc.invalidateQueries({ queryKey: ['feed'] });
      // Also invalidate detail to update like_count
      void qc.invalidateQueries({ queryKey: postKeys.detail(variables.postId) });
    }
  });
};

export type EnrichedComment = Comment & { profiles: Profile | null };

export const useComments = (postId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: postKeys.comments(postId),
    enabled: !!postId,
    queryFn: async (): Promise<EnrichedComment[]> => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles ( * )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as EnrichedComment[];
    }
  });

  useEffect(() => {
    if (!postId) return;
    const channel = supabase
      .channel(`post-comments-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, queryClient]);

  return query;
};

export const useAddComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, postId, content, parentId }: { userId: string, postId: string, content: string, parentId?: string | null }) => {
      const { error } = await supabase.from('comments').insert({
        user_id: userId,
        post_id: postId,
        content,
        parent_id: parentId || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: postKeys.comments(variables.postId) });
    }
  });
};

export const useIsLiked = (postId: string, userId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...postKeys.likes(postId), userId],
    enabled: !!userId && !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId!)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    }
  });

  useEffect(() => {
    if (!postId || !userId) return;
    const channel = supabase
      .channel(`post-likes-${postId}-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes', filter: `post_id=eq.${postId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: [...postKeys.likes(postId), userId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, userId, queryClient]);

  return query;
};

export const useRepeekPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, originalPost }: { userId: string, originalPost: FeedPost }) => {
      const { error } = await supabase.from('posts').insert({
        user_id: userId,
        content: originalPost.content,
        image_url: originalPost.image_url,
        original_post_id: originalPost.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feed'] });
    }
  });
};
