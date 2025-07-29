/**
 * Providers for SynkBoard frontend
 * Wraps the app with necessary context providers
 */

'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { AppLayout } from '@/components/layout/app-layout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Prevent excessive refetching
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors or rate limit errors
        if (error?.status === 401 || error?.status === 403 || error?.status === 429) {
          return false;
        }
        return failureCount < 2; // Reduced from 3 to 2 retries
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 1; // Only retry once for mutations
      },
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            expand={false}
            richColors
            closeButton
          />
          
          {/* React Query DevTools */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
