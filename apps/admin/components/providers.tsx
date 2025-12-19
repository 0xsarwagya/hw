"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { AdminSession } from "@/lib/auth";
import { queryClient } from "@/lib/react-query";
import { ErrorBoundary } from "@/providers/error-boundary";
import { SessionProvider } from "@/providers/session-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";

interface ProvidersProps {
  children: React.ReactNode;
  initialSession?: AdminSession | null;
}

export function Providers({ children, initialSession }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider initialSession={initialSession}>
            {children}
            <ToastProvider />
            <ReactQueryDevtools initialIsOpen={false} />
          </SessionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
