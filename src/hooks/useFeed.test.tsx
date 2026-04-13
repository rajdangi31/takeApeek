import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFeed } from '../hooks/useFeed';
import { supabase } from '../lib/supabase';
import React from 'react';

// Helper to provide QueryClient to hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useFeed Hook', () => {
  it('identifies successful data fetching', async () => {
    const mockData = [{ id: '1', content: 'Test Peek' }];
    (supabase.rpc as any).mockResolvedValueOnce({ data: mockData, error: null });

    const { result } = renderHook(() => useFeed('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Since useFeed implementation changed to infinite query, data is nested
    expect(result.current.data?.pages[0]).toEqual(mockData);
  });

  it('handles error states', async () => {
    (supabase.rpc as any).mockResolvedValueOnce({ data: null, error: new Error('Network Error') });

    const { result } = renderHook(() => useFeed('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
