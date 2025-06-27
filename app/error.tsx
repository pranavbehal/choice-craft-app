"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  const isNetworkError =
    error.message.toLowerCase().includes("network") ||
    error.message.toLowerCase().includes("fetch");
  const isAuthError =
    error.message.toLowerCase().includes("auth") ||
    error.message.toLowerCase().includes("unauthorized");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Something went wrong!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {isNetworkError && (
              <p className="text-muted-foreground">
                Network connection issue detected. Please check your internet
                connection and try again.
              </p>
            )}
            {isAuthError && (
              <p className="text-muted-foreground">
                Authentication error. Please try signing in again.
              </p>
            )}
            {!isNetworkError && !isAuthError && (
              <p className="text-muted-foreground">
                An unexpected error occurred. Don&apos;t worry, your progress is
                saved.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={reset} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Return Home
                </Link>
              </Button>
            </div>

            <details className="text-left mt-6">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-muted rounded text-xs font-mono break-all">
                <p>
                  <strong>Error:</strong> {error.message}
                </p>
                {error.digest && (
                  <p>
                    <strong>ID:</strong> {error.digest}
                  </p>
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
