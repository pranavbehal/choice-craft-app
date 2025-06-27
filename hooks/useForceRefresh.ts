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
    (path: string, delay: number = 100) => {
      // Navigate to path and force refresh
      router.push(path);
      setTimeout(() => {
        router.refresh();
      }, delay);
    },
    [router]
  );

  const navigateAndReplace = useCallback(
    (path: string, delay: number = 100) => {
      // Navigate to path with replace and force refresh
      router.replace(path);
      setTimeout(() => {
        router.refresh();
      }, delay);
    },
    [router]
  );

  const navigateWithHardRefresh = useCallback(
    (path: string) => {
      // Hard navigation that guarantees a fresh load
      if (typeof window !== "undefined") {
        window.location.href = path;
      } else {
        router.push(path);
      }
    },
    [router]
  );

  return {
    forceRefresh,
    navigateWithRefresh,
    navigateAndReplace,
    navigateWithHardRefresh,
  };
}
