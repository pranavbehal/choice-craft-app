/**
 * Database Hook
 *
 * Manages database operations for user settings and mission progress.
 * Provides optimistic updates, error handling, and retry logic.
 *
 * @hook
 * @requires Supabase
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { type MissionProgress } from "@/types";
import { useAppState } from "./useAppState";

/** Enhanced user data with XP and level */
interface EnhancedUserSettings {
  id: string;
  username?: string;
  name?: string;
  voice_on: boolean;
  profile_picture: number;
  total_xp: number;
  level: number;
  has_seen_tutorial: boolean;
}
import { toast } from "sonner";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function useDatabase(pageId?: string) {
  const { user } = useAuth();
  const [missionProgress, setMissionProgress] = useState<MissionProgress[]>([]);
  const [settings, setSettings] = useState<EnhancedUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true); // Track page visibility
  const loadingRef = useRef(false); // Track if currently loading to prevent duplicate requests
  const mountTimeRef = useRef(Date.now()); // Track when this hook instance was created
  const pageIdRef = useRef(pageId || "default"); // Track which page is using this hook

  /**
   * Retry function with exponential backoff
   */
  const retryOperation = async <T>(
    operation: () => T,
    retries = MAX_RETRIES
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        console.warn(
          `Operation failed, retrying... (${retries} attempts left)`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1))
        );
        return retryOperation(operation, retries - 1);
      }
      throw error;
    }
  };

  /**
   * Fetches user settings from database with retry logic
   */
  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await retryOperation(() =>
        supabase.from("users").select("*").eq("id", user.id).single()
      );

      if (error) {
        console.error("Error fetching settings:", error);
        setError("Failed to load user settings");
        return;
      }

      // Set default values if not present
      const defaultedData = {
        ...data,
        voice_on: data.voice_on ?? true,
        profile_picture: data.profile_picture ?? 1,
        total_xp: data.total_xp ?? 0,
        level: data.level ?? 1,
        has_seen_tutorial: data.has_seen_tutorial ?? false,
      };

      setSettings(defaultedData);
      setError(null);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setError("Failed to load user settings");
      toast.error("Failed to load user settings. Please refresh the page.");
    }
  }, [user]);

  /**
   * Updates user settings with optimistic updates and error recovery
   */
  const updateUserSettings = async (updates: Partial<EnhancedUserSettings>) => {
    if (!user) throw new Error("No user logged in");

    // Store previous state for rollback
    const previousSettings = settings;

    try {
      // Optimistic update
      setSettings((prev) => (prev ? { ...prev, ...updates } : null));

      await retryOperation(() =>
        supabase.from("users").update(updates).eq("id", user.id)
      );

      // Refetch to ensure consistency
      await fetchSettings();
      setError(null);
    } catch (error) {
      // Rollback optimistic update
      setSettings(previousSettings);
      console.error("Error updating settings:", error);
      setError("Failed to update settings");
      throw error;
    }
  };

  /**
   * Fetches mission progress with error handling
   */
  const fetchMissionProgress = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await retryOperation(() =>
        supabase
          .from("user_mission_progress")
          .select("*")
          .eq("user_id", user.id)
          .order("last_updated", { ascending: false })
      );

      if (error) {
        console.error("Error fetching mission progress:", error);
        setError("Failed to load mission progress");
        return;
      }

      setMissionProgress(data || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching mission progress:", error);
      setError("Failed to load mission progress");
      setMissionProgress([]);
      toast.error("Failed to load mission progress. Please refresh the page.");
    }
  }, [user]);

  /**
   * Updates mission progress with upsert logic and error handling
   */
  const updateMissionProgress = async (updates: Partial<MissionProgress>) => {
    if (!user) throw new Error("No user logged in");

    try {
      // Use PostgreSQL UPSERT (INSERT ... ON CONFLICT) for atomic operation
      // This prevents race conditions and handles duplicates gracefully
      const { error } = await retryOperation(() =>
        supabase.from("user_mission_progress").upsert(
          {
            user_id: user.id,
            mission_id: updates.mission_id,
            ...updates,
            last_updated: new Date().toISOString(),
          },
          {
            onConflict: "user_id,mission_id", // Use the unique constraint
            ignoreDuplicates: false, // Update existing records
          }
        )
      );

      if (error) {
        // Handle the specific duplicate key error gracefully
        if (error.code === "23505") {
          console.log("🔄 Mission progress record already exists, updating...");
          // Try an explicit update instead
          const { error: updateError } = await retryOperation(() =>
            supabase
              .from("user_mission_progress")
              .update({
                ...updates,
                last_updated: new Date().toISOString(),
              })
              .eq("user_id", user.id)
              .eq("mission_id", updates.mission_id)
          );

          if (updateError) {
            console.error(
              "Error updating existing mission progress:",
              updateError
            );
            throw updateError;
          }
        } else {
          console.error("Error upserting mission progress:", error);
          throw error;
        }
      }

      await fetchMissionProgress();
      setError(null);
    } catch (error) {
      // Don't throw on duplicate key errors if the record exists - that's expected
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "23505"
      ) {
        console.log(
          "✅ Mission progress record exists (race condition resolved)"
        );
        // Refresh data to get current state
        await fetchMissionProgress();
        return;
      }

      console.error("Error in updateMissionProgress:", error);
      setError("Failed to save mission progress");
      throw error;
    }
  };

  /**
   * Page visibility tracking
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      const newIsVisible = !document.hidden;
      console.log(
        "👁️ Page visibility changed:",
        newIsVisible ? "visible" : "hidden"
      );
      setIsVisible(newIsVisible);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  /**
   * Initial data loading with improved error handling
   */
  useEffect(() => {
    const loadData = async () => {
      // Determine if we have data
      const hasData = settings && user && settings.id === user.id;

      console.log("🔍 useDatabase loadData check:", {
        hasUser: !!user,
        hasData,
        isVisible,
        settingsExist: !!settings,
        progressCount: missionProgress.length,
        isCurrentlyLoading: loadingRef.current,
      });

      // Prevent duplicate loading
      if (loadingRef.current) {
        console.log("⏳ Already loading, skipping...");
        return;
      }

      // Always load data for user when visible - force fresh loads
      if (user && isVisible) {
        console.log(
          `🔄 [${pageIdRef.current}] Force loading fresh data for user:`,
          user.id
        );
        loadingRef.current = true;
        try {
          setLoading(true);
          setError(null);

          // Clear existing data first to ensure fresh load
          setSettings(null);
          setMissionProgress([]);

          await Promise.all([fetchSettings(), fetchMissionProgress()]);
          console.log(
            `✅ [${pageIdRef.current}] Database data loaded successfully`
          );
        } catch (error) {
          console.error(
            `❌ [${pageIdRef.current}] Error loading initial data:`,
            error
          );
          setError("Failed to load user data");
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      } else if (!user) {
        console.log(`👤 [${pageIdRef.current}] No user, resetting data state`);
        setLoading(false);
        setSettings(null);
        setMissionProgress([]);
        setError(null);
        loadingRef.current = false;
      }
    };

    loadData();
  }, [user?.id]); // Only depend on user ID to force fresh loads

  /**
   * Refresh all data manually
   */
  const refreshData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchSettings(), fetchMissionProgress()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchSettings, fetchMissionProgress]);

  return {
    missionProgress,
    settings,
    loading,
    error,
    updateUserSettings,
    fetchMissionProgress,
    updateMissionProgress,
    refreshData,
  };
}
