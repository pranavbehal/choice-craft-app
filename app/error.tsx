"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh]">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight mb-4 text-primary">
          Something went wrong!
        </h1>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        <Button onClick={reset}>Try again</Button>
      </main>
    </div>
  );
}
