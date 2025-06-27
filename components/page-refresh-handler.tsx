"use client";

import { useEffect, useRef } from "react";

/**
 * PageRefreshHandler
 *
 * Forces a **hard page reload** (window.location.reload) whenever the browser
 * tab becomes visible again after being hidden. This guarantees that all state
 * is reset and avoids any stale data / auth issues.
 */
export function PageRefreshHandler() {
  const mountedRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!mountedRef.current) {
          mountedRef.current = true; // Skip first visibility event
          return;
        }
        console.log("🔄 Tab became visible – performing full reload");
        window.location.reload(); // Hard reload ensures fresh state
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return null;
}
