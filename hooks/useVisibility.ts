import { useEffect, useState } from "react";

/**
 * Custom hook to track page visibility
 * Helps prevent unnecessary API calls when tab regains focus
 */
export function useVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Add event listener for visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set initial state
    setIsVisible(!document.hidden);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
