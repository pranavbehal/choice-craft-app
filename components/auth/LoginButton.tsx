/**
 * Login Button Component
 *
 * Toggleable authentication button that handles both sign-in and sign-out.
 * Integrates with Google OAuth for authentication.
 *
 * @component
 * @requires AuthContext
 */

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function LoginButton() {
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    <Button
      onClick={user ? signOut : signInWithGoogle}
      variant="outline"
      size="lg"
      className="mr-4"
    >
      {user ? "Sign Out" : "Sign In with Google"}
    </Button>
  );
}
