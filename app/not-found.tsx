import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { Suspense } from "react";

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh]">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight mb-4 text-primary">
            404 - Page Not Found
          </h1>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl">
            Oops! The page you are looking for does not exist.
          </p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </main>
      </div>
    </Suspense>
  );
}
