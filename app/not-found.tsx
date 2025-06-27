import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { Home, Search, Map, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto text-6xl mb-4">🗺️</div>
              <CardTitle className="text-2xl">Lost in the Adventure?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                The page you&apos;re looking for doesn&apos;t exist. Let&apos;s
                get you back on track!
              </p>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button asChild className="w-full">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/missions">
                    <Map className="mr-2 h-4 w-4" />
                    Missions
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/leaderboard">
                    <Search className="mr-2 h-4 w-4" />
                    Leaderboard
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/results">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Results
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </Suspense>
  );
}
