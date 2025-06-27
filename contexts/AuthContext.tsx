/**
 * Authentication Context
 *
 * Manages global authentication state and provides auth-related functionality.
 * Handles user sessions, Google OAuth integration, and auth state persistence.
 *
 * @context
 * @requires Supabase
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Suspense } from "react";
import { ensureUserExists } from "@/lib/leaderboardUtils";
import { StateManager } from "@/lib/stateManager";

// Create a separate component for the auth logic that uses useSearchParams
function AuthLogic({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Save user state to session storage whenever it changes
  useEffect(() => {
    if (user) {
      StateManager.saveState({
        user: { id: user.id, email: user.email },
        dataLoaded: true,
      });
    } else {
      StateManager.clearState();
    }
  }, [user]);

  // Handle page visibility changes to prevent unnecessary state resets
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Tab became visible and user is logged in
        console.log("👁️ Tab visible with user, maintaining state");
        // Don't reset loading state
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    // Initialize session
    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth session...");
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          console.log("📱 Initial session:", initialSession ? "Found" : "None");
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          // Ensure user exists in database if they're logged in
          if (initialSession?.user) {
            await ensureUserExists(initialSession.user);
          }

          setLoading(false);
        }
      } catch (error) {
        console.error("Error in auth initialization:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log(
        "🔄 Auth state change:",
        event,
        session ? "User logged in" : "User logged out"
      );

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle sign in events - but prevent infinite redirects
      if (event === "SIGNED_IN" && session?.user) {
        // Ensure user exists in the database with their Google OAuth data
        await ensureUserExists(session.user);

        // Only redirect if not already on a valid page
        const currentPath = window.location.pathname;
        if (currentPath === "/auth/callback" || currentPath.includes("auth")) {
          router.push("/");
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const signInWithGoogle = async () => {
    const returnTo =
      new URLSearchParams(window.location.search).get("return_to") || "/";

    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_SITE_URL
        : window.location.origin; // This will automatically include the correct port

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // redirectTo: `${baseUrl}/auth/callback?return_to=${returnTo}`,
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Error signing in with Google:", error);
      toast.error("Failed to sign in with Google");
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } else {
      setUser(null);
      setSession(null);

      // Always redirect to home page and force refresh to clear cached data
      router.push("/");

      // Force refresh if already on home page to update leaderboard and mission progress
      if (window.location.pathname === "/") {
        window.location.reload();
      }

      toast.success("Signed out successfully");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Auth context definition
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

// Main AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthLogic>{children}</AuthLogic>
    </Suspense>
  );
}

export const useAuth = () => useContext(AuthContext);
