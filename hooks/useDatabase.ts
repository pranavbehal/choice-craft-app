/**
 * Database Hook
 *
 * Custom hook for managing database operations and state.
 * Handles mission progress tracking and user settings persistence.
 *
 * @hook
 * @requires Supabase
 * @requires Authentication
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { useEffect, useState } from "react";

/** Type definitions for database tables */
type MissionProgress =
  Database["public"]["Tables"]["user_mission_progress"]["Row"];
type UserSettings = Database["public"]["Tables"]["users"]["Row"];

export function useDatabase() {
  const { user } = useAuth();
  const [missionProgress, setMissionProgress] = useState<MissionProgress[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches user settings from database
   * Sets default values if not present
   */
  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching settings:", error);
        return;
      }

      // Set default values if not present
      const defaultedData = {
        ...data,
        voice_on: data.voice_on ?? true,
        profile_picture: data.profile_picture ?? 1,
      };

      setSettings(defaultedData);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  /**
   * Updates user settings in database
   * @param {Partial<UserSettings>} updates - Settings to update
   */
  const updateUserSettings = async (updates: Partial<UserSettings>) => {
    if (!user) throw new Error("No user logged in");

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (error) throw error;

    // Update local state immediately
    setSettings((prev) => (prev ? { ...prev, ...updates } : null));

    // Refetch to ensure consistency
    await fetchSettings();
  };

  // Fetch mission progress
  const fetchMissionProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_mission_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setMissionProgress(data || []);
    } catch (error) {
      console.error("Error fetching mission progress:", error);
      setMissionProgress([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await Promise.all([fetchSettings(), fetchMissionProgress()]);
      }
      setLoading(false);
    };

    loadData();
  }, [user]);

  return {
    missionProgress,
    settings,
    loading,
    updateUserSettings,
    fetchMissionProgress,
    updateMissionProgress: async (updates: Partial<MissionProgress>) => {
      if (!user) throw new Error("No user logged in");

      const { error } = await supabase
        .from("user_mission_progress")
        .upsert({
          user_id: user.id,
          ...updates,
          last_updated: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("mission_id", updates.mission_id);

      if (error) throw error;
      await fetchMissionProgress();
    },
  };
}
