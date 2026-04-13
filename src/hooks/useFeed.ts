import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { FeedPost } from '../types/database';

export const feedKeys = {
  all: (userId?: string) => ['feed', userId] as const,
};

const PAGE_SIZE = 10;

export const useFeed = (userId?: string) => {
  const queryClient = useQueryClient();

  // 1. Setup Infinite Query
  const query = useInfiniteQuery({
    queryKey: feedKeys.all(userId),
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<FeedPost[]> => {
      const { data, error } = await supabase.rpc('get_friend_feed', { 
        requesting_user_id: userId,
        page_limit: PAGE_SIZE,
        page_offset: pageParam * PAGE_SIZE
      });
      
      if (error) throw error;
      return (data || []) as FeedPost[];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    // Keep a periodic refetch as background sync
    refetchInterval: 60000, 
  });

  // 2. Setup Real-time Subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('public:posts:feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          queryClient.invalidateQueries({ queryKey: feedKeys.all(userId) });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => {
          queryClient.invalidateQueries({ queryKey: feedKeys.all(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
};
