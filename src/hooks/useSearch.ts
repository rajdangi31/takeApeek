import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export const useSearch = (searchTerm: string) => {
  const [debouncedValue, setDebouncedValue] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchTerm);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  return useQuery({
    queryKey: ['profiles', 'search', debouncedValue],
    enabled: debouncedValue.length > 1,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${debouncedValue}%,display_name.ilike.%${debouncedValue}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });
};

export const useSuggestions = (limit = 5) => {
  return useQuery({
    queryKey: ['profiles', 'suggestions'],
    queryFn: async (): Promise<Profile[]> => {
      // Logic for suggestions: random accounts or based on friendships
      // For now, let's just get the newest accounts that aren't the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });
};
