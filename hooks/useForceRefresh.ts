import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Hook to force page refresh and clear any cached state
 */
export function useForceRefresh() {
  const router = useRouter();

  const forceRefresh = useCallback(() => {
    // Force a hard refresh by reloading the current route
    router.refresh();

    // Also force a full window location reload as fallback
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, [router]);

  const navigateWithRefresh = useCallback(
    (path: string) => {
      // Navigate to path and force refresh
      router.push(path);
      setTimeout(() => {
        router.refresh();
      }, 100);
    },
    [router]
  );

  return {
    forceRefresh,
    navigateWithRefresh,
  };
}
