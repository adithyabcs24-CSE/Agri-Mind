'use client';

import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FarmFieldProvider } from '@/context/FarmFieldContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <FarmFieldProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster position="top-right" toastOptions={{
            className: 'dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 text-sm font-medium rounded-xl',
          }} />
        </ThemeProvider>
      </FarmFieldProvider>
    </QueryClientProvider>
  );
}
