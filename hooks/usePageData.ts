import { useState, useEffect, useRef } from "react";

/**
 * Hook to manage page-specific data loading state
 * This resets the loading state for each new page navigation
 */
export function usePageData() {
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const initRef = useRef(false);

  // Reset state when component mounts (new page navigation)
  useEffect(() => {
    if (!initRef.current) {
      console.log("🔄 New page mounted, resetting data state");
      setLoading(true);
      setDataLoaded(false);
      initRef.current = true;
    }
  }, []);

  const markDataLoaded = () => {
    console.log("✅ Data loading completed");
    setDataLoaded(true);
    setLoading(false);
  };

  const setLoadingState = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  return {
    loading,
    dataLoaded,
    markDataLoaded,
    setLoadingState,
  };
}
