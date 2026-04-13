import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Profile, Post } from '../types/database';

export const profileKeys = {
  all: ['profiles'] as const,
  detail: (id: string) => [...profileKeys.all, id] as const,
  posts: (id: string) => [...profileKeys.all, id, 'posts'] as const,
};

export const useProfile = (id?: string) => {
  return useQuery({
    queryKey: profileKeys.detail(id!),
    enabled: !!id,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data;
    },
  });
};

export const useUserPosts = (userId?: string) => {
  return useQuery({
    queryKey: profileKeys.posts(userId!),
    enabled: !!userId,
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Profile> }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.id) });
    },
  });
};
