/**
 * Leaderboard Utilities
 *
 * Functions for calculating leaderboard statistics and fetching real user data.
 */

import { supabase } from "@/lib/supabase";
import { missions } from "@/data/missions";
import { User } from "@supabase/supabase-js";

interface ProgressData {
  mission_id: string;
  completion_percentage: number;
  good_decisions?: number;
  bad_decisions?: number;
  diplomatic_decisions?: number;
  strategic_decisions?: number;
  action_decisions?: number;
  investigation_decisions?: number;
  time_spent: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  totalScore: number;
  totalXP: number;
  level: number;
  completedMissions: number;
  avgCompletionTime: string;
  successRate: number;
  favoriteCompanion: string;
  achievements: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  totalDecisions: number;
  goodDecisions: number;
  badDecisions: number;
  diplomaticDecisions: number;
  strategicDecisions: number;
  actionDecisions: number;
  investigationDecisions: number;
  playtimeHours: number;
  averageSessionTime: number;
  missionCompletionRate: number;
}

// New interface for the updated leaderboard component
export interface NewLeaderboardEntry {
  user_id: string;
  user_name: string;
  profile_picture: number;
  total_xp: number;
  level: number;
  missions_completed: number;
  success_rate: number;
  achievements_unlocked: number;
  total_decisions: number;
  total_playtime_seconds: number;
}

export interface SpecialLeaderboard {
  mostAchievements: LeaderboardEntry[];
  mostActive: LeaderboardEntry[];
  decisionExperts: {
    diplomatic: LeaderboardEntry[];
    strategic: LeaderboardEntry[];
    action: LeaderboardEntry[];
    investigation: LeaderboardEntry[];
  };
}

/**
 * Calculates success rate from mission progress
 */
const calculateSuccessRate = (progressData: ProgressData[]): number => {
  if (!progressData.length) return 0;

  const totalGoodDecisions = progressData.reduce(
    (sum, p) => sum + (p.good_decisions || 0),
    0
  );
  const totalBadDecisions = progressData.reduce(
    (sum, p) => sum + (p.bad_decisions || 0),
    0
  );
  const totalDecisions = totalGoodDecisions + totalBadDecisions;

  if (totalDecisions === 0) return 0;
  return Math.round((totalGoodDecisions / totalDecisions) * 100);
};

/**
 * Calculates average completion time
 */
const calculateAvgTime = (progressData: ProgressData[]): string => {
  const completedMissions = progressData.filter(
    (p) => p.completion_percentage === 100
  );
  if (!completedMissions.length) return "N/A";

  let totalMinutes = 0;
  let validTimes = 0;

  completedMissions.forEach((mission) => {
    const timeSpent = mission.time_spent;
    if (typeof timeSpent === "string") {
      try {
        if (timeSpent.includes("seconds")) {
          const seconds = parseInt(timeSpent.replace(" seconds", ""));
          totalMinutes += Math.floor(seconds / 60);
          validTimes++;
        } else {
          // Handle interval format like "00:15:30"
          const parts = timeSpent.split(":");
          if (parts.length === 3) {
            const hours = parseInt(parts[0]);
            const minutes = parseInt(parts[1]);
            totalMinutes += hours * 60 + minutes;
            validTimes++;
          }
        }
      } catch (error) {
        console.error("Error parsing time:", timeSpent);
      }
    }
  });

  if (validTimes === 0) return "N/A";
  const avgMinutes = Math.round(totalMinutes / validTimes);
  return `${avgMinutes} min`;
};

/**
 * Determines favorite companion based on mission completion
 */
const getFavoriteCompanion = (progressData: ProgressData[]): string => {
  const completedMissions = progressData.filter(
    (p) => p.completion_percentage === 100
  );
  if (!completedMissions.length) return "None";

  const companionCounts: { [key: string]: number } = {};

  completedMissions.forEach((progress) => {
    const mission = missions.find((m) => m.id === progress.mission_id);
    if (mission) {
      companionCounts[mission.companion] =
        (companionCounts[mission.companion] || 0) + 1;
    }
  });

  const mostUsed = Object.entries(companionCounts).reduce((a, b) =>
    companionCounts[a[0]] > companionCounts[b[0]] ? a : b
  );

  return mostUsed ? mostUsed[0] : "None";
};

/**
 * Determines user rarity based on total XP
 */
const getUserRarity = (
  totalXP: number
): "common" | "rare" | "epic" | "legendary" => {
  if (totalXP >= 5000) return "legendary";
  if (totalXP >= 2000) return "epic";
  if (totalXP >= 500) return "rare";
  return "common";
};

/**
 * Fetches real leaderboard data from database
 */
export const fetchLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select(
        `
        id,
        username,
        total_xp,
        level,
        user_mission_progress (
          mission_id,
          completion_percentage,
          good_decisions,
          bad_decisions,
          diplomatic_decisions,
          strategic_decisions,
          action_decisions,
          investigation_decisions,
          time_spent
        ),
        user_achievements (
          achievement_id
        )
      `
      )
      .not("total_xp", "is", null)
      .order("total_xp", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching leaderboard data:", error);
      return [];
    }

    if (!users) return [];

    const leaderboardData: LeaderboardEntry[] = users.map((user, index) => {
      const progressData = user.user_mission_progress || [];
      const achievementData = user.user_achievements || [];

      return {
        rank: index + 1,
        username: user.username || `Player ${user.id.slice(-4)}`,
        totalScore: user.total_xp || 0,
        totalXP: user.total_xp || 0,
        level: user.level || 1,
        completedMissions: progressData.filter(
          (p) => p.completion_percentage === 100
        ).length,
        avgCompletionTime: calculateAvgTime(progressData),
        successRate: calculateSuccessRate(progressData),
        favoriteCompanion: getFavoriteCompanion(progressData),
        achievements: achievementData.length,
        rarity: getUserRarity(user.total_xp || 0),
        totalDecisions: progressData.reduce(
          (sum, p) => sum + (p.good_decisions || 0) + (p.bad_decisions || 0),
          0
        ),
        goodDecisions: progressData.reduce(
          (sum, p) => sum + (p.good_decisions || 0),
          0
        ),
        badDecisions: progressData.reduce(
          (sum, p) => sum + (p.bad_decisions || 0),
          0
        ),
        diplomaticDecisions: progressData.reduce(
          (sum, p) => sum + (p.diplomatic_decisions || 0),
          0
        ),
        strategicDecisions: progressData.reduce(
          (sum, p) => sum + (p.strategic_decisions || 0),
          0
        ),
        actionDecisions: progressData.reduce(
          (sum, p) => sum + (p.action_decisions || 0),
          0
        ),
        investigationDecisions: progressData.reduce(
          (sum, p) => sum + (p.investigation_decisions || 0),
          0
        ),
        playtimeHours: progressData.reduce((sum, p) => {
          const timeSpent = p.time_spent;
          if (typeof timeSpent === "string") {
            try {
              if (timeSpent.includes("seconds")) {
                const seconds = parseInt(timeSpent.replace(" seconds", ""));
                return sum + Math.floor(seconds / 3600);
              } else {
                // Handle interval format like "00:15:30"
                const parts = timeSpent.split(":");
                if (parts.length === 3) {
                  const hours = parseInt(parts[0]);
                  return sum + hours;
                }
              }
            } catch (error) {
              console.error("Error parsing time:", timeSpent);
            }
          }
          return sum;
        }, 0),
        averageSessionTime: progressData.reduce((sum, p) => {
          const timeSpent = p.time_spent;
          if (typeof timeSpent === "string") {
            try {
              if (timeSpent.includes("seconds")) {
                const seconds = parseInt(timeSpent.replace(" seconds", ""));
                return sum + seconds;
              } else {
                // Handle interval format like "00:15:30"
                const parts = timeSpent.split(":");
                if (parts.length === 3) {
                  const hours = parseInt(parts[0]);
                  const minutes = parseInt(parts[1]);
                  return sum + (hours * 60 + minutes);
                }
              }
            } catch (error) {
              console.error("Error parsing time:", timeSpent);
            }
          }
          return sum;
        }, 0),
        missionCompletionRate:
          progressData.length > 0
            ? progressData.filter((p) => p.completion_percentage === 100)
                .length / progressData.length
            : 0,
      };
    });

    return leaderboardData;
  } catch (error) {
    console.error("Error in fetchLeaderboardData:", error);
    return [];
  }
};

/**
 * Gets user's current leaderboard position
 */
export const getUserRank = async (userId: string): Promise<number> => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("total_xp")
      .eq("id", userId)
      .single();

    if (!user) return 0;

    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .gt("total_xp", user.total_xp || 0);

    return (count || 0) + 1;
  } catch (error) {
    console.error("Error getting user rank:", error);
    return 0;
  }
};

/**
 * Sorts leaderboard data by specified criteria
 */
export const sortLeaderboardData = (
  data: LeaderboardEntry[],
  sortBy: string,
  ascending = false
): LeaderboardEntry[] => {
  const sorted = [...data].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortBy) {
      case "xp":
        aValue = a.totalXP;
        bValue = b.totalXP;
        break;
      case "level":
        aValue = a.level;
        bValue = b.level;
        break;
      case "missions":
        aValue = a.completedMissions;
        bValue = b.completedMissions;
        break;
      case "successRate":
        aValue = a.successRate;
        bValue = b.successRate;
        break;
      case "achievements":
        aValue = a.achievements;
        bValue = b.achievements;
        break;
      case "totalDecisions":
        aValue = a.totalDecisions;
        bValue = b.totalDecisions;
        break;
      case "playtime":
        aValue = a.playtimeHours;
        bValue = b.playtimeHours;
        break;
      case "diplomatic":
        aValue = a.diplomaticDecisions;
        bValue = b.diplomaticDecisions;
        break;
      case "strategic":
        aValue = a.strategicDecisions;
        bValue = b.strategicDecisions;
        break;
      case "action":
        aValue = a.actionDecisions;
        bValue = b.actionDecisions;
        break;
      case "investigation":
        aValue = a.investigationDecisions;
        bValue = b.investigationDecisions;
        break;
      case "username":
        aValue = a.username.toLowerCase();
        bValue = b.username.toLowerCase();
        break;
      default:
        aValue = a.totalXP;
        bValue = b.totalXP;
    }

    if (typeof aValue === "string") {
      return ascending
        ? aValue.localeCompare(bValue as string)
        : (bValue as string).localeCompare(aValue);
    }

    return ascending
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  // Update ranks based on new sort order
  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

/**
 * Fetches special leaderboard categories
 */
export const fetchSpecialLeaderboards =
  async (): Promise<SpecialLeaderboard> => {
    const allData = await fetchLeaderboardData();

    return {
      mostAchievements: allData
        .sort((a, b) => b.achievements - a.achievements)
        .slice(0, 10),
      mostActive: allData
        .sort((a, b) => b.totalDecisions - a.totalDecisions)
        .slice(0, 10),
      decisionExperts: {
        diplomatic: allData
          .filter((user) => user.diplomaticDecisions > 0)
          .sort((a, b) => b.diplomaticDecisions - a.diplomaticDecisions)
          .slice(0, 5),
        strategic: allData
          .filter((user) => user.strategicDecisions > 0)
          .sort((a, b) => b.strategicDecisions - a.strategicDecisions)
          .slice(0, 5),
        action: allData
          .filter((user) => user.actionDecisions > 0)
          .sort((a, b) => b.actionDecisions - a.actionDecisions)
          .slice(0, 5),
        investigation: allData
          .filter((user) => user.investigationDecisions > 0)
          .sort((a, b) => b.investigationDecisions - a.investigationDecisions)
          .slice(0, 5),
      },
    };
  };

/**
 * Parses time string to seconds
 */
const parseTimeToSeconds = (timeSpent: string): number => {
  if (!timeSpent || typeof timeSpent !== "string") return 0;

  try {
    // Handle different time formats
    if (timeSpent.includes("seconds")) {
      return parseInt(timeSpent.replace(" seconds", ""));
    } else if (timeSpent.includes(":")) {
      // Handle interval format like "00:15:30" or "1:30:45"
      const parts = timeSpent.split(":");
      if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
      } else if (parts.length === 2) {
        // Handle MM:SS format
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return minutes * 60 + seconds;
      }
    } else if (timeSpent.includes("hour")) {
      // Handle PostgreSQL interval format like "1 hour 30 minutes"
      const hourMatch = timeSpent.match(/(\d+)\s*hour/);
      const minuteMatch = timeSpent.match(/(\d+)\s*minute/);
      const secondMatch = timeSpent.match(/(\d+)\s*second/);

      const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
      const seconds = secondMatch ? parseInt(secondMatch[1]) : 0;

      return hours * 3600 + minutes * 60 + seconds;
    } else {
      // Try to parse as number (seconds)
      const num = parseInt(timeSpent);
      return isNaN(num) ? 0 : num;
    }
  } catch (error) {
    console.error("Error parsing time:", timeSpent, error);
  }
  return 0;
};

/**
 * Fetches leaderboard data in the new format for the updated component
 * @param publicAccess - If true, bypasses user authentication requirements
 */
export const getLeaderboardData = async (
  publicAccess: boolean = false
): Promise<NewLeaderboardEntry[]> => {
  try {
    console.log("Starting leaderboard data fetch...");

    // Test basic connection first
    const { data: testData, error: testError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("Basic connection test failed:", testError);
      return [];
    }

    console.log(
      "Basic connection successful, found users:",
      testData?.length || 0
    );

    // Fetch users with XP data
    // For public access, we'll try the query and if it fails due to RLS, return a helpful message
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(
        `
        id,
        name,
        username,
        email,
        total_xp,
        level,
        profile_picture
      `
      )
      .gte("total_xp", 0)
      .order("total_xp", { ascending: false })
      .limit(50);

    if (usersError) {
      console.error("Error fetching users with XP:", usersError);
      return [];
    }

    console.log("Found users with XP data:", users?.length || 0);

    if (!users || users.length === 0) {
      console.log("No users found with XP data, returning empty array");
      return [];
    }

    // Fetch mission progress data
    const userIds = users.map((u) => u.id);
    console.log("Fetching mission progress for", userIds.length, "users");

    const { data: progressData, error: progressError } = await supabase
      .from("user_mission_progress")
      .select(
        `
        user_id,
        mission_id,
        completion_percentage,
        good_decisions,
        bad_decisions,
        diplomatic_decisions,
        strategic_decisions,
        action_decisions,
        investigation_decisions,
        time_spent
      `
      )
      .in("user_id", userIds);

    if (progressError) {
      console.error("Error fetching mission progress:", progressError);
      // Continue without progress data
    }

    console.log("Found mission progress records:", progressData?.length || 0);

    // Fetch achievements data
    const { data: achievementsData, error: achievementsError } = await supabase
      .from("user_achievements")
      .select(
        `
        user_id,
        achievement_id
      `
      )
      .in("user_id", userIds);

    if (achievementsError) {
      console.error("Error fetching achievements:", achievementsError);
      // Continue without achievements data
    }

    console.log("Found achievement records:", achievementsData?.length || 0);

    // Process the data
    const leaderboardData: NewLeaderboardEntry[] = users.map((user) => {
      const userProgress = (progressData || []).filter(
        (p) => p.user_id === user.id
      );
      const userAchievements = (achievementsData || []).filter(
        (a) => a.user_id === user.id
      );

      // Calculate total decisions
      const totalDecisions = userProgress.reduce(
        (sum, p) => sum + (p.good_decisions || 0) + (p.bad_decisions || 0),
        0
      );

      // Calculate success rate
      const goodDecisions = userProgress.reduce(
        (sum, p) => sum + (p.good_decisions || 0),
        0
      );
      const successRate =
        totalDecisions > 0 ? (goodDecisions / totalDecisions) * 100 : 0;

      // Calculate total playtime in seconds
      const totalPlaytimeSeconds = userProgress.reduce((sum, p) => {
        return sum + parseTimeToSeconds(p.time_spent || "0");
      }, 0);

      // Get user name with fallbacks (will be overridden in component for current user)
      const userName =
        user.name ||
        user.username ||
        (user.email ? user.email.split("@")[0] : null) ||
        `Player ${user.id.slice(-4)}`;

      return {
        user_id: user.id,
        user_name: userName,
        profile_picture: user.profile_picture || 1,
        total_xp: user.total_xp || 0,
        level: user.level || 1,
        missions_completed: userProgress.filter(
          (p) => p.completion_percentage === 100
        ).length,
        success_rate: successRate,
        achievements_unlocked: userAchievements.length,
        total_decisions: totalDecisions,
        total_playtime_seconds: totalPlaytimeSeconds,
      };
    });

    console.log(
      "Processed leaderboard data for",
      leaderboardData.length,
      "users"
    );
    return leaderboardData;
  } catch (error) {
    console.error("Error in getLeaderboardData:", error);
    return [];
  }
};

/**
 * Ensures a user exists in the custom users table
 * Creates the user record if it doesn't exist, or updates name if missing
 */
export const ensureUserExists = async (authUser: User): Promise<void> => {
  try {
    console.log("🔍 Ensuring user exists for:", authUser.id);
    console.log("📝 User metadata:", authUser.user_metadata);

    // Check if user already exists and get their current data
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", authUser.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking user existence:", checkError);
      return;
    }

    // Extract name from OAuth metadata with fallbacks
    const displayName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      `Player ${authUser.id.slice(-4)}`;

    console.log("📛 Extracted display name:", displayName);

    // If user doesn't exist, create them
    if (!existingUser) {
      console.log("➕ Creating new user record");

      const userData = {
        id: authUser.id,
        email: authUser.email || "",
        name: displayName,
        username:
          authUser.user_metadata?.preferred_username ||
          authUser.user_metadata?.user_name ||
          null,
        voice_on: true,
        profile_picture: 1,
        total_xp: 0,
        level: 1,
        has_seen_tutorial: false,
      };

      console.log("📤 Inserting user data:", userData);

      const { error: insertError } = await supabase
        .from("users")
        .insert([userData]);

      if (insertError) {
        console.error("❌ Error creating user record:", insertError);
      } else {
        console.log("✅ Successfully created user record");
      }
    } else {
      // User exists, but check if we need to update their name
      if (!existingUser.name && displayName) {
        console.log("🔄 Updating existing user's name:", displayName);

        const { error: updateError } = await supabase
          .from("users")
          .update({ name: displayName })
          .eq("id", authUser.id);

        if (updateError) {
          console.error("❌ Error updating user name:", updateError);
        } else {
          console.log("✅ Successfully updated user name");
        }
      } else {
        console.log("✅ User exists with name:", existingUser.name);
      }
    }
  } catch (error) {
    console.error("❌ Error in ensureUserExists:", error);
  }
};
