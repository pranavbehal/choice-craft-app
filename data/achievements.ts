import { Achievement, MissionProgress } from "@/types";

export const achievements: Achievement[] = [
  // Completion Achievements
  {
    id: "first_mission",
    name: "First Steps",
    description: "Complete your first mission",
    icon: "🌟",
    category: "completion",
    rarity: "common",
  },
  {
    id: "all_missions",
    name: "Adventure Master",
    description: "Complete all four missions",
    icon: "👑",
    category: "completion",
    rarity: "legendary",
  },

  // Decision Achievements
  {
    id: "diplomat",
    name: "Master Diplomat",
    description: "Make 3 diplomatic decisions",
    icon: "🤝",
    category: "decision",
    rarity: "common",
  },
  {
    id: "strategist",
    name: "Grand Strategist",
    description: "Make 3 strategic decisions",
    icon: "♟️",
    category: "decision",
    rarity: "common",
  },
  {
    id: "action_hero",
    name: "Action Hero",
    description: "Make 3 action decisions",
    icon: "⚔️",
    category: "decision",
    rarity: "common",
  },
  {
    id: "detective",
    name: "Master Detective",
    description: "Make 3 investigation decisions",
    icon: "🔍",
    category: "decision",
    rarity: "common",
  },

  // Time Achievements
  {
    id: "speed_runner",
    name: "Speed Runner",
    description: "Complete a mission in under 3 minutes",
    icon: "⚡",
    category: "time",
    rarity: "epic",
  },
  {
    id: "storyteller",
    name: "Master Storyteller",
    description: "Spend over 5 minutes on a single mission",
    icon: "📚",
    category: "time",
    rarity: "rare",
  },

  // Exploration Achievements
  {
    id: "explorer",
    name: "Curious Explorer",
    description: "Make over 10 decisions across all missions",
    icon: "🗺️",
    category: "exploration",
    rarity: "common",
  },

  // Special Achievements
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Make 5 good decisions with no bad decisions in a mission",
    icon: "🔄",
    category: "special",
    rarity: "rare",
  },
  {
    id: "stop_master",
    name: "Stop Command Expert",
    description: "Use the stop command once",
    icon: "🛑",
    category: "special",
    rarity: "common",
  },

  {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Export your results data",
    icon: "📊",
    category: "special",
    rarity: "common",
  },
];

export const checkAchievements = (
  progress: MissionProgress[],
  userStats: Record<string, unknown>
): Achievement[] => {
  const unlockedAchievements: Achievement[] = [];

  // Check completion achievements
  const completedMissions = progress.filter(
    (p) => p.completion_percentage === 100
  );
  if (completedMissions.length >= 1) {
    unlockedAchievements.push(
      achievements.find((a) => a.id === "first_mission")!
    );
  }
  if (completedMissions.length >= 4) {
    unlockedAchievements.push(
      achievements.find((a) => a.id === "all_missions")!
    );
  }

  // Check decision type achievements
  const totalDiplomatic = progress.reduce(
    (sum, p) => sum + (p.diplomatic_decisions || 0),
    0
  );
  const totalStrategic = progress.reduce(
    (sum, p) => sum + (p.strategic_decisions || 0),
    0
  );
  const totalAction = progress.reduce(
    (sum, p) => sum + (p.action_decisions || 0),
    0
  );
  const totalInvestigation = progress.reduce(
    (sum, p) => sum + (p.investigation_decisions || 0),
    0
  );

  if (totalDiplomatic >= 3)
    unlockedAchievements.push(achievements.find((a) => a.id === "diplomat")!);
  if (totalStrategic >= 3)
    unlockedAchievements.push(achievements.find((a) => a.id === "strategist")!);
  if (totalAction >= 3)
    unlockedAchievements.push(
      achievements.find((a) => a.id === "action_hero")!
    );
  if (totalInvestigation >= 3)
    unlockedAchievements.push(achievements.find((a) => a.id === "detective")!);

  // Check exploration achievements
  const totalDecisions = progress.reduce(
    (sum, p) => sum + (p.decisions_made || 0),
    0
  );
  if (totalDecisions >= 10) {
    unlockedAchievements.push(achievements.find((a) => a.id === "explorer")!);
  }

  return unlockedAchievements.filter(Boolean);
};
