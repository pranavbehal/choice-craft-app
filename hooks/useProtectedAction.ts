/**
 * Protected Action Hook
 *
 * Custom hook for handling authentication-protected actions.
 * Provides user feedback and authentication prompts when needed.
 *
 * @hook
 * @requires Authentication
 */

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useCallback } from "react";

export function useProtectedAction() {
  const { user, signInWithGoogle } = useAuth();

  /**
   * Wraps an action with authentication check
   * @param {() => void} action - The protected action to execute
   */
  const handleProtectedAction = useCallback(
    (action: () => void) => {
      if (!user) {
        toast.warning("Sign in Required", {
          description: "You need to sign in to access this feature.",
          action: {
            label: "Sign In",
            onClick: () => signInWithGoogle(),
          },
        });
        return;
      }

      action();
    },
    [user, signInWithGoogle]
  );

  return handleProtectedAction;
}
