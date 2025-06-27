/**
 * Achievement Engine
 *
 * Handles real-time achievement evaluation and awarding based on user actions.
 * Integrates with existing achievement definitions and database schema.
 */

import { supabase } from "@/lib/supabase";
import { achievements } from "@/data/achievements";
import { type Achievement, type MissionProgress } from "@/types";
import { toast } from "sonner";

// UUID generation function that works in all environments
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface DecisionAnalysis {
  type: "diplomatic" | "strategic" | "action" | "investigation" | "none";
  quality: "good" | "bad" | "neutral";
  isStoryDecision: boolean;
  progressAdvancement: number;
  reasoning: string;
  difficultyBonus?: number;
}

/**
 * Awards an achievement to a user
 */
export const awardAchievement = async (
  userId: string,
  achievementId: string,
  missionId?: string
): Promise<boolean> => {
  try {
    // Check if user already has this achievement
    const { data: existing, error: checkError } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no row exists

    if (checkError) {
      console.error("Error checking existing achievement:", checkError);
      // Continue anyway - might be RLS issue
    }

    if (existing) {
      return false; // Already has this achievement
    }

    // Award the achievement
    const { error } = await supabase.from("user_achievements").insert({
      id: generateUUID(),
      user_id: userId,
      achievement_id: achievementId,
      mission_context: missionId || null,
      unlocked_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error awarding achievement:", error);
      console.error("Achievement details:", {
        userId,
        achievementId,
        missionId,
      });

      // If it's an RLS error, provide helpful information
      if (error.code === "42501" || error.message?.includes("policy")) {
        console.error(
          "RLS Policy Error: Make sure user_achievements table has proper RLS policies"
        );
        console.error("Run the RLS policies from data/rls-policies.sql");
      }

      return false;
    }

    // Calculate XP for this achievement
    const achievement = achievements.find((a) => a.id === achievementId);
    if (achievement) {
      const xpReward = getAchievementXP(achievement.rarity);
      await addUserXP(userId, xpReward);
    }

    return true;
  } catch (error) {
    console.error("Error awarding achievement:", error);
    return false;
  }
};

/**
 * Gets XP value for achievement rarity
 */
const getAchievementXP = (rarity: string): number => {
  switch (rarity) {
    case "legendary":
      return 500;
    case "epic":
      return 200;
    case "rare":
      return 100;
    case "common":
      return 50;
    default:
      return 25;
  }
};

/**
 * Adds XP to user and updates level
 */
export const addUserXP = async (
  userId: string,
  xpAmount: number
): Promise<void> => {
  try {
    // Get current user data
    const { data: user } = await supabase
      .from("users")
      .select("total_xp, level")
      .eq("id", userId)
      .single();

    if (!user) return;

    const newXP = (user.total_xp || 0) + xpAmount;
    const newLevel = Math.floor(newXP / 200) + 1; // 200 XP per level

    // Update user XP and level
    await supabase
      .from("users")
      .update({
        total_xp: newXP,
        level: newLevel,
      })
      .eq("id", userId);

    // Show level up notification if level increased
    if (newLevel > (user.level || 1)) {
      toast.success(`🎉 Level Up! You're now level ${newLevel}!`);
    }
  } catch (error) {
    console.error("Error adding XP:", error);
  }
};

/**
 * Calculates XP for mission progress
 */
export const calculateMissionXP = (progress: MissionProgress): number => {
  let xp = 0;

  // Base XP for completion percentage
  xp += Math.floor((progress.completion_percentage || 0) * 2); // 2 XP per percentage point

  // Bonus XP for good decisions
  xp += (progress.good_decisions || 0) * 5;

  // Completion bonus
  if (progress.completion_percentage === 100) {
    xp += 200;
  }

  return xp;
};

/**
 * Parses time spent from interval string to minutes
 */
const parseTimeSpent = (timeSpent: string): number => {
  try {
    if (!timeSpent || timeSpent === "00:00:00") return 0;

    // Handle different time formats
    if (timeSpent.includes("seconds")) {
      const seconds = parseInt(timeSpent.replace(" seconds", ""));
      return Math.floor(seconds / 60);
    }

    // Handle interval format like "00:15:30" (HH:MM:SS)
    const parts = timeSpent.split(":");
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;

      // Convert everything to minutes
      return hours * 60 + minutes + Math.floor(seconds / 60);
    }

    return 0;
  } catch (error) {
    console.error("Error parsing time:", timeSpent, error);
    return 0;
  }
};

/**
 * Manually checks all achievements for a user (for debugging)
 */
export const forceCheckAllAchievements = async (
  userId: string
): Promise<Achievement[]> => {
  try {
    console.log("🔧 Force checking all achievements for user:", userId);

    // Get all user progress
    const { data: allProgress, error } = await supabase
      .from("user_mission_progress")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user progress:", error);
      return [];
    }

    if (!allProgress || allProgress.length === 0) {
      console.log("No mission progress found for user");
      return [];
    }

    console.log("User progress data:", allProgress);

    const newAchievements: Achievement[] = [];

    // Check all decision type achievements
    const totalDiplomatic = allProgress.reduce(
      (sum, p) => sum + (p.diplomatic_decisions || 0),
      0
    );
    console.log("🤝 Total diplomatic decisions:", totalDiplomatic);

    if (totalDiplomatic >= 3) {
      const awarded = await awardAchievement(userId, "diplomat");
      if (awarded) {
        const achievement = achievements.find((a) => a.id === "diplomat");
        if (achievement) {
          newAchievements.push(achievement);
          console.log("✅ Awarded Master Diplomat achievement!");
        }
      } else {
        console.log("🔄 Master Diplomat achievement already exists");
      }
    } else {
      console.log("❌ Not enough diplomatic decisions for Master Diplomat");
    }

    return newAchievements;
  } catch (error) {
    console.error("Error in force check achievements:", error);
    return [];
  }
};

/**
 * Comprehensive achievement checking - checks ALL achievements after every action
 */
export const checkAndAwardAchievements = async (
  userId: string,
  currentMissionProgress: MissionProgress,
  allUserProgress: MissionProgress[]
): Promise<Achievement[]> => {
  const newAchievements: Achievement[] = [];

  try {
    console.log("🎯 Running comprehensive achievement check...");

    // 1. COMPLETION ACHIEVEMENTS
    const completedMissions = allUserProgress.filter(
      (p) => p.completion_percentage === 100
    );

    // First Steps - Complete first mission
    if (completedMissions.length >= 1) {
      const awarded = await awardAchievement(userId, "first_mission");
      if (awarded) {
        const achievement = achievements.find((a) => a.id === "first_mission");
        if (achievement) newAchievements.push(achievement);
      }
    }

    // Adventure Master - Complete all missions
    if (completedMissions.length >= 4) {
      const awarded = await awardAchievement(userId, "all_missions");
      if (awarded) {
        const achievement = achievements.find((a) => a.id === "all_missions");
        if (achievement) newAchievements.push(achievement);
      }
    }

    // 2. TIME-BASED ACHIEVEMENTS (check current mission)
    if (currentMissionProgress.time_spent) {
      const timeSpentMinutes = parseTimeSpent(
        currentMissionProgress.time_spent
      );

      // Master Storyteller - Spend over 5 minutes on a mission
      if (timeSpentMinutes > 5) {
        const awarded = await awardAchievement(
          userId,
          "storyteller",
          currentMissionProgress.mission_id
        );
        if (awarded) {
          const achievement = achievements.find((a) => a.id === "storyteller");
          if (achievement) newAchievements.push(achievement);
        }
      }

      // Speed Runner - Complete mission in under 3 minutes
      if (
        currentMissionProgress.completion_percentage === 100 &&
        timeSpentMinutes > 0 &&
        timeSpentMinutes < 3
      ) {
        const awarded = await awardAchievement(
          userId,
          "speed_runner",
          currentMissionProgress.mission_id
        );
        if (awarded) {
          const achievement = achievements.find((a) => a.id === "speed_runner");
          if (achievement) newAchievements.push(achievement);
        }
      }
    }

    // 3. DECISION TYPE ACHIEVEMENTS (across all missions)
    const totalDiplomatic = allUserProgress.reduce(
      (sum, p) => sum + (p.diplomatic_decisions || 0),
      0
    );
    const totalStrategic = allUserProgress.reduce(
      (sum, p) => sum + (p.strategic_decisions || 0),
      0
    );
    const totalAction = allUserProgress.reduce(
      (sum, p) => sum + (p.action_decisions || 0),
      0
    );
    const totalInvestigation = allUserProgress.reduce(
      (sum, p) => sum + (p.investigation_decisions || 0),
      0
    );

    // Total decisions for explorer achievement
    const totalDecisions = allUserProgress.reduce(
      (sum, p) => sum + (p.decisions_made || 0),
      0
    );

    console.log("🎯 Decision totals:", {
      diplomatic: totalDiplomatic,
      strategic: totalStrategic,
      action: totalAction,
      investigation: totalInvestigation,
      total: totalDecisions,
    });

    // Master Diplomat - 3 diplomatic decisions
    if (totalDiplomatic >= 3) {
      const awarded = await awardAchievement(userId, "diplomat");
      if (awarded) {
        const achievement = achievements.find((a) => a.id === "diplomat");
        if (achievement) newAchievements.push(achievement);
      }
    }

    // Grand Strategist - 3 strategic decisions
    if (totalStrategic >= 3) {
      const awarded = await awardAchievement(userId, "strategist");
      if (awarded) {
        const achievement = achievements.find((a) => a.id === "strategist");
        if (achievement) newAchievements.push(achievement);
      }
    }

    // Action Hero - 3 action decisions
    if (totalAction >= 3) {
      const awarded = await awardAchievement(userId, "action_hero");
      if (awarded) {
        const achievement = achievements.find((a) => a.id === "action_hero");
        if (achievement) newAchievements.push(achievement);
      }
    }

    // Master Detective - 3 investigation decisions
    if (totalInvestigation >= 3) {
      const awarded = await awardAchievement(userId, "detective");
      if (awarded) {
        const achievement = achievements.find((a) => a.id === "detective");
        if (achievement) newAchievements.push(achievement);
      }
    }

    // 4. EXPLORATION ACHIEVEMENTS
    // Curious Explorer - 10 total decisions across all missions
    if (totalDecisions >= 10) {
      const awarded = await awardAchievement(userId, "explorer");
      if (awarded) {
        const achievement = achievements.find((a) => a.id === "explorer");
        if (achievement) newAchievements.push(achievement);
      }
    }

    // 5. PERFECTIONIST ACHIEVEMENT
    // Check if any mission has at least 5 good decisions with no bad decisions
    const perfectMission = allUserProgress.find(
      (p) => (p.good_decisions || 0) >= 5 && (p.bad_decisions || 0) === 0
    );
    if (perfectMission) {
      const awarded = await awardAchievement(userId, "perfectionist");
      if (awarded) {
        const achievement = achievements.find((a) => a.id === "perfectionist");
        if (achievement) newAchievements.push(achievement);
      }
    }

    return newAchievements;
  } catch (error) {
    console.error("Error checking achievements:", error);
    return [];
  }
};

/**
 * Gets all achievements for a user
 */
export const getUserAchievements = async (
  userId: string
): Promise<Achievement[]> => {
  try {
    const { data: userAchievements, error } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at, mission_context")
      .eq("user_id", userId);

    if (error) {
      console.error("Error getting user achievements:", error);
      return [];
    }

    if (!userAchievements) return [];

    return userAchievements
      .map((ua) => {
        const achievement = achievements.find(
          (a) => a.id === ua.achievement_id
        );
        return achievement
          ? {
              ...achievement,
              unlocked_at: ua.unlocked_at,
            }
          : null;
      })
      .filter(Boolean) as Achievement[];
  } catch (error) {
    console.error("Error getting user achievements:", error);
    return [];
  }
};

/**
 * Tracks stop command usage for achievement
 */
export const trackStopCommand = async (
  userId: string,
  missionId: string
): Promise<void> => {
  try {
    // Get current stop command count from user achievements or create tracking
    const { data: stopUsage } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_id", "stop_master");

    // Award the achievement on first stop command use
    if (!stopUsage?.length) {
      await awardAchievement(userId, "stop_master", missionId);
    }
  } catch (error) {
    console.error("Error tracking stop command:", error);
  }
};
