import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Friendship, Profile } from '../types/database';

export type EnrichedFriendship = Friendship & { friend_profile: Profile };

export const friendsKeys = {
  all: (userId?: string) => ['friendships', userId] as const,
};

export const useFriends = (userId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: friendsKeys.all(userId),
    enabled: !!userId,
    queryFn: async (): Promise<EnrichedFriendship[]> => {
      // Query relationships where user is requester OR addressee
      const { data: rels, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (error) throw error;
      if (!rels) return [];

      // Enrich with friend's profile
      const enriched = await Promise.all(
        rels.map(async (row) => {
          const friendId = row.requester_id === userId ? row.addressee_id : row.requester_id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', friendId)
            .single();

          return { ...row, friend_profile: profile };
        })
      );

      return enriched as EnrichedFriendship[];
    },
  });

  useEffect(() => {
    if (!userId) return;

    // Listen for any changes to friendships involving this user
    const channel = supabase
      .channel(`friends-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        (payload) => {
          // Check if the change involves the current user
          const data = payload.new as Friendship || payload.old as Friendship;
          if (data && (data.requester_id === userId || data.addressee_id === userId)) {
            queryClient.invalidateQueries({ queryKey: friendsKeys.all(userId) });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  return query;
};

export const useAddFriend = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, emailToAdd }: { userId: string; emailToAdd: string }) => {
      const normalized = emailToAdd.toLowerCase().trim();
      const { data: found, error: findError } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', normalized)
        .maybeSingle();

      if (findError) throw findError;
      if (!found) throw new Error("No user found with that username.");
      if (found.id === userId) throw new Error("Cannot add yourself.");

      const { data: existing } = await supabase
        .from('friendships')
        .select('status')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${found.id}),and(requester_id.eq.${found.id},addressee_id.eq.${userId})`)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'accepted') throw new Error("Already friends.");
        throw new Error("Request already pending.");
      }

      const { error } = await supabase.from('friendships').insert({
        requester_id: userId,
        addressee_id: found.id,
        status: 'pending'
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: friendsKeys.all(variables.userId) });
    }
  });
};

export const useAcceptFriend = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, friendshipId }: { userId: string; friendshipId: string }) => {
      const { data: req } = await supabase.from('friendships').select('*').eq('id', friendshipId).single();
      if (!req || req.addressee_id !== userId) throw new Error('Invalid request.');

      const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: friendsKeys.all(variables.userId) });
    }
  });
};

export const useRemoveFriend = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, friendshipId }: { userId: string; friendshipId: string }) => {
      const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: friendsKeys.all(variables.userId) });
    }
  });
};
