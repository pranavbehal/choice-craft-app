/**
 * Root Providers Component
 *
 * Wraps the application with necessary context providers:
 * - Authentication state management
 * - Theme configuration
 * - Toast notifications
 *
 * @component
 */

"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        forcedTheme="dark"
        disableTransitionOnChange
      >
        <Toaster richColors closeButton position="top-center" />
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
