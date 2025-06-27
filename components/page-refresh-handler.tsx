"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PageRefreshHandler() {
  const router = useRouter();

  useEffect(() => {
    let wasHidden = false;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHidden = true;
        console.log("🙈 Tab became hidden - marking for refresh");
      } else if (wasHidden) {
        console.log("👁️ Tab became visible - forcing page refresh");
        wasHidden = false;

        // Force a router refresh to ensure fresh data
        router.refresh();

        // Add a small delay and force window reload as backup
        setTimeout(() => {
          if (typeof window !== "undefined") {
            console.log("🔄 Force window reload after tab switch");
            window.location.reload();
          }
        }, 500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null; // This component doesn't render anything
}
