import { useState, useEffect, useRef } from "react";

interface ComponentState {
  [componentId: string]: {
    isInitialized: boolean;
    lastActivity: number;
  };
}

// Global state that tracks initialization per component
const componentStates: ComponentState = {};
let wasTabHidden = false;

/**
 * Hook to manage component-specific state and prevent reinitialization issues
 */
export function useAppState(componentId: string = "default") {
  const [isInitialized, setIsInitialized] = useState(() => {
    return componentStates[componentId]?.isInitialized || false;
  });
  const initRef = useRef(false);

  // Track page visibility globally
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;

      if (!isVisible) {
        // Tab became hidden
        wasTabHidden = true;
        console.log("🙈 Tab became hidden");
      } else if (wasTabHidden) {
        // Tab became visible after being hidden
        console.log("👁️ Tab became visible after being hidden");
        // Don't reset states, just log
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Initialize component state if it doesn't exist
  useEffect(() => {
    if (!componentStates[componentId]) {
      componentStates[componentId] = {
        isInitialized: false,
        lastActivity: Date.now(),
      };
    }
  }, [componentId]);

  // Mark as initialized
  const markInitialized = () => {
    if (!initRef.current) {
      console.log(`✅ Component "${componentId}" marked as initialized`);
      componentStates[componentId] = {
        isInitialized: true,
        lastActivity: Date.now(),
      };
      setIsInitialized(true);
      initRef.current = true;
    }
  };

  // Reset state for this component
  const resetState = () => {
    console.log(`🔄 Resetting state for component "${componentId}"`);
    componentStates[componentId] = {
      isInitialized: false,
      lastActivity: Date.now(),
    };
    setIsInitialized(false);
    initRef.current = false;
  };

  // Check if this is a fresh navigation after tab was hidden
  const isFreshNavigation = () => {
    return wasTabHidden && !componentStates[componentId]?.isInitialized;
  };

  return {
    isInitialized,
    markInitialized,
    resetState,
    isFreshNavigation: isFreshNavigation(),
    wasTabHidden,
    lastActivity: componentStates[componentId]?.lastActivity || Date.now(),
  };
}
