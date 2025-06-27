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

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Suspense } from "react";
import { ensureUserExists } from "@/lib/leaderboardUtils";
import { StateManager } from "@/lib/stateManager";

// Global flag to prevent multiple initializations
let authInitialized = false;
let authSubscription: { unsubscribe: () => void } | null = null;

// Create a separate component for the auth logic that uses useSearchParams
function AuthLogic({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  // Use refs to track state and prevent re-initialization
  const mountedRef = useRef(true);
  const initStartedRef = useRef(false);

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

  useEffect(() => {
    // Prevent multiple initialization attempts
    if (authInitialized || initStartedRef.current) {
      console.log("🔐 Auth already initialized or in progress, skipping...");

      // If auth is already initialized, we need to get the current session
      if (authInitialized && !initialized) {
        getCurrentSession();
      }
      return;
    }

    initStartedRef.current = true;
    console.log("🔐 Starting auth initialization...");

    const initializeAuth = async () => {
      try {
        console.log("🔐 Getting initial session...");
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          if (mountedRef.current) {
            setLoading(false);
            setInitialized(true);
            authInitialized = true;
          }
          return;
        }

        if (mountedRef.current) {
          console.log("📱 Initial session:", initialSession ? "Found" : "None");
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          // Ensure user exists in database if they're logged in
          if (initialSession?.user) {
            await ensureUserExists(initialSession.user);
          }

          setLoading(false);
          setInitialized(true);
          authInitialized = true;
        }
      } catch (error) {
        console.error("Error in auth initialization:", error);
        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
          authInitialized = true;
        }
      }
    };

    // Set up auth state listener (only if not already set up)
    const setupAuthListener = () => {
      if (authSubscription) {
        console.log("🔗 Auth listener already exists, skipping setup");
        return;
      }

      console.log("🔗 Setting up auth state listener...");

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(
          "🔄 Auth state change:",
          event,
          session ? "User logged in" : "User logged out"
        );

        // Update state for all mounted instances
        if (mountedRef.current) {
          setSession(session);
          setUser(session?.user ?? null);

          // Handle different auth events
          if (event === "SIGNED_IN" && session?.user) {
            await ensureUserExists(session.user);

            const currentPath = window.location.pathname;
            if (
              currentPath === "/auth/callback" ||
              currentPath.includes("auth")
            ) {
              router.push("/");
            }

            setLoading(false);
            setInitialized(true);
          } else if (event === "SIGNED_OUT") {
            setLoading(false);
            setInitialized(true);
          } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
            console.log(
              "🔄 Token refreshed or user updated - maintaining state"
            );
            // Don't change loading state for maintenance events
          } else {
            // For any other events, ensure loading is false
            setLoading(false);
            setInitialized(true);
          }
        }
      });

      authSubscription = subscription;
    };

    // Initialize auth and set up listener
    initializeAuth().then(() => {
      setupAuthListener();
    });

    // Emergency fallback - if loading takes too long, force completion
    const emergencyTimeout = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn("🚨 Emergency: Auth loading timeout, forcing completion");
        setLoading(false);
        setInitialized(true);
        authInitialized = true;
      }
    }, 3000); // 3 second emergency timeout (reduced from 5 to 3)

    // Cleanup function
    return () => {
      mountedRef.current = false;
      clearTimeout(emergencyTimeout);
    };
  }, []);

  // Function to get current session if auth is already initialized
  const getCurrentSession = async () => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (mountedRef.current) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        setInitialized(true);
      }
    } catch (error) {
      console.error("Error getting current session:", error);
      if (mountedRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
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

      // Reset global state
      authInitialized = false;
      initStartedRef.current = false;
      setInitialized(false);

      // Clean up subscription
      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }

      router.push("/");
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
