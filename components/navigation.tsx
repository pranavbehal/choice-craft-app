/**
 * Navigation Component
 *
 * Main navigation bar with dynamic routing and user status display.
 * Shows different navigation options based on authentication state.
 *
 * @component
 * @requires Authentication
 */

"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getUserDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Award, Settings, Trophy } from "lucide-react";
import { LoginButton } from "./auth/LoginButton";
import { useAuth } from "@/contexts/AuthContext";
import { getAvatarPath } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { ClientWrapper } from "./client-wrapper";

/** Navigation link configuration */
const links = [
  { name: "Home", href: "/", icon: Home },
  { name: "Results", href: "/results", icon: Award, protected: true },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy, protected: false },
  { name: "Settings", href: "/settings", icon: Settings, protected: true },
];

/** Enhanced user data for navigation */
interface NavigationUserData {
  name?: string;
  profile_picture: number;
}

// Global cache for user data to persist across navigation
let userDataCache: {
  userId: string | null;
  data: NavigationUserData | null;
  timestamp: number;
} = { userId: null, data: null, timestamp: 0 };

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Navigation skeleton loader component
 * Provides responsive loading state for navigation bar
 */
function NavigationSkeleton() {
  return (
    <nav className="flex justify-between items-center p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      {/* Logo/Brand skeleton */}
      <Skeleton className="h-6 w-24" />

      <div className="flex items-center space-x-2 sm:space-x-6">
        {/* User welcome section skeleton - only visible on larger screens */}
        <div className="hidden sm:flex items-center space-x-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Navigation buttons skeleton */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Show 4 navigation button skeletons */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-1 sm:gap-2 h-10 px-2 sm:px-3"
            >
              <Skeleton className="h-4 w-4 sm:h-5 sm:w-5" />
              <Skeleton className="hidden xs:block h-4 w-8 sm:w-12" />
            </div>
          ))}
        </div>

        {/* Login button skeleton */}
        <Skeleton className="h-10 w-16" />
      </div>
    </nav>
  );
}

function NavigationContent() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<NavigationUserData | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  /** Filter links based on user authentication status */
  const visibleLinks = links.filter((link) => !link.protected || user);

  /**
   * Fetch user data for navigation (cached approach)
   */
  const fetchUserData = async (userId: string) => {
    // Check cache first
    const now = Date.now();
    if (
      userDataCache.userId === userId &&
      userDataCache.data &&
      now - userDataCache.timestamp < CACHE_DURATION
    ) {
      setUserData(userDataCache.data);
      setLoading(false);
      return;
    }

    // Prevent duplicate requests
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("name, profile_picture")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user data for navigation:", error);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      const navigationData = {
        name: data.name,
        profile_picture: data.profile_picture ?? 1,
      };

      // Update cache
      userDataCache = {
        userId,
        data: navigationData,
        timestamp: now,
      };

      setUserData(navigationData);
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  /**
   * Load user data when user changes (not on every render)
   */
  useEffect(() => {
    if (user?.id) {
      // Check if we have cached data for this user first
      if (userDataCache.userId === user.id && userDataCache.data) {
        const now = Date.now();
        if (now - userDataCache.timestamp < CACHE_DURATION) {
          setUserData(userDataCache.data);
          return;
        }
      }

      // Only fetch if we don't have valid cached data
      fetchUserData(user.id);
    } else {
      // Clear data when user logs out
      setUserData(null);
      userDataCache = { userId: null, data: null, timestamp: 0 };
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object

  /**
   * Invalidate cache when user updates settings (listen for storage events)
   */
  useEffect(() => {
    const handleSettingsUpdate = () => {
      if (user?.id) {
        // Invalidate cache and refetch
        userDataCache = { userId: null, data: null, timestamp: 0 };
        fetchUserData(user.id);
      }
    };

    // Listen for custom events from settings page
    window.addEventListener("userSettingsUpdated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("userSettingsUpdated", handleSettingsUpdate);
    };
  }, [user?.id]);

  if (authLoading) {
    return <NavigationSkeleton />;
  }

  return (
    <ClientWrapper>
      <nav className="flex justify-between items-center p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <Link href="/" className="text-xl font-bold">
          Story Quest
        </Link>

        <div className="flex items-center space-x-2 sm:space-x-6">
          {user && userData && !loading && (
            <div className="hidden sm:flex items-center space-x-2">
              <Image
                src={getAvatarPath(userData.profile_picture)}
                alt="User avatar"
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-sm text-muted-foreground">
                {`Welcome, ${getUserDisplayName(userData.name, user)}`}
              </span>
            </div>
          )}

          {user && loading && (
            <div className="hidden sm:flex items-center space-x-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          )}

          <div className="flex items-center space-x-1 sm:space-x-2">
            {visibleLinks.map((link) => {
              const LinkIcon = link.icon;
              return (
                <Button
                  key={link.name}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center justify-center gap-2 h-10 px-2 sm:px-3 text-sm",
                    "hover:bg-muted transition-colors",
                    pathname === link.href && "bg-muted"
                  )}
                  onClick={() => {
                    // Full page navigation using window.location for a hard refresh
                    window.location.href = link.href;
                  }}
                >
                  <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden xs:inline">{link.name}</span>
                </Button>
              );
            })}
          </div>

          <LoginButton />
        </div>
      </nav>
    </ClientWrapper>
  );
}

export function Navigation() {
  return (
    <Suspense fallback={<NavigationSkeleton />}>
      <NavigationContent />
    </Suspense>
  );
}
