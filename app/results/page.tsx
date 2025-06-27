/**
 * Results Page Component
 *
 * Displays comprehensive mission statistics and achievements.
 * Features interactive charts and data visualization for user progress.
 *
 * @component
 * @requires Authentication
 */

"use client";

import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  Label,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Share2,
  Download,
  Filter,
  Trophy,
  Target,
  Clock,
  Star,
  TrendingUp,
  Award,
  BarChart3,
  Calendar,
  Users,
  Zap,
  Brain,
  Shield,
  Sword,
  Search,
} from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { missions } from "@/data/missions";
import { type Mission, type Achievement } from "@/types";
import { QuestionButton } from "@/components/help/question-button";
import { getUserAchievements } from "@/lib/achievementEngine";
import { achievements } from "@/data/achievements";
import { toast } from "sonner";
import { MetricCard } from "@/components/ui/metric-card";
import { AchievementCard } from "@/components/ui/achievement-card";
import { MissionRadarChart } from "@/components/ui/mission-radar-chart";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

/**
 * Maps mission IDs to their display names
 */
const getMissionName = (missionId: string) => {
  const mission = missions.find((m) => m.id === missionId);
  return mission?.title || `Mission ${missionId}`;
};

/**
 * Gets mission difficulty
 */
const getMissionDifficulty = (missionId: string) => {
  const mission = missions.find((m) => m.id === missionId);
  return mission?.difficulty || "Unknown";
};

/**
 * Formats time from seconds to readable format
 */
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Results page skeleton loader component
 * Provides responsive loading state for analytics page that matches the actual UI
 */
function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {/* Header skeleton - matches "Mission Analytics" title and description */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="mb-4 sm:mb-0">
            <Skeleton className="h-8 w-48 sm:h-10 sm:w-56 mb-2" />
            <Skeleton className="h-4 w-64 sm:w-80" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>

        {/* Metrics grid skeleton - 6 cards in grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="space-y-6">
          <div className="flex space-x-1 border-b border-border">
            <Skeleton className="h-10 w-20 border-b-2 border-primary" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-28" />
          </div>

          {/* Overview tab content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mission Progress Overview - Left side */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress bars for missions */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-5 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Playing Style Analysis - Right side */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-44" />
                </div>
                <Skeleton className="h-4 w-52" />
              </CardHeader>
              <CardContent>
                {/* Dominant style display */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-44" />
                  </div>
                  <Skeleton className="h-4 w-64" />
                </div>

                {/* Decision type bars */}
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom row - Time Records, Personal Records, Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-4 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  const { user } = useAuth();
  const {
    missionProgress,
    settings,
    loading: dbLoading,
  } = useDatabase("results");
  const [selectedMission, setSelectedMission] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [achievementFilter, setAchievementFilter] = useState<string>("all");
  const [achievementSort, setAchievementSort] = useState<string>("status");

  // Load user achievements
  useEffect(() => {
    const loadAchievements = async () => {
      if (user) {
        try {
          const achievements = await getUserAchievements(user.id);
          setUserAchievements(achievements);
        } catch (error) {
          console.error("Error loading achievements:", error);
        }
      }
    };

    loadAchievements();
  }, [user?.id]); // Only depend on user ID to prevent infinite loops

  // Enhanced data processing with memoization
  const processedData = useMemo(() => {
    if (!missionProgress) return null;

    // Remove duplicates by keeping the latest record for each mission
    const filteredProgress = missionProgress
      .filter((progress) => {
        if (selectedMission === "all") return true;
        return progress.mission_id === selectedMission;
      })
      .reduce((acc, current) => {
        const existingIndex = acc.findIndex(
          (item) => item.mission_id === current.mission_id
        );
        if (existingIndex > -1) {
          if (
            new Date(current.last_updated) >
            new Date(acc[existingIndex].last_updated)
          ) {
            acc[existingIndex] = current;
          }
        } else {
          acc.push(current);
        }
        return acc;
      }, [] as typeof missionProgress);

    // Calculate comprehensive metrics
    const totalGoodDecisions = filteredProgress.reduce(
      (sum, p) => sum + (p.good_decisions || 0),
      0
    );

    const totalBadDecisions = filteredProgress.reduce(
      (sum, p) => sum + (p.bad_decisions || 0),
      0
    );

    // Use consistent calculation method with leaderboard
    const totalDecisions = totalGoodDecisions + totalBadDecisions;

    const successRate =
      totalDecisions > 0 ? (totalGoodDecisions / totalDecisions) * 100 : 0;

    const completedMissions = filteredProgress.filter(
      (p) => p.completion_percentage === 100
    ).length;

    const averageCompletion =
      filteredProgress.length > 0
        ? filteredProgress.reduce(
            (sum, p) => sum + (p.completion_percentage || 0),
            0
          ) / filteredProgress.length
        : 0;

    // Time calculations
    const parseTimeString = (timeStr: string | number) => {
      if (typeof timeStr === "number") return timeStr;
      if (!timeStr || timeStr === "00:00:00") return 0;

      const parts = timeStr.toString().split(":");
      if (parts.length === 3) {
        return (
          parseInt(parts[0]) * 3600 +
          parseInt(parts[1]) * 60 +
          parseInt(parts[2])
        );
      }
      return 0;
    };

    const totalTimeSeconds = filteredProgress.reduce(
      (sum, p) => sum + parseTimeString(p.time_spent || 0),
      0
    );

    // Calculate average time per mission, excluding missions with zero playtime
    const missionsWithTime = filteredProgress.filter(
      (p) => parseTimeString(p.time_spent || 0) > 0
    );
    const averageTimePerMission =
      missionsWithTime.length > 0
        ? totalTimeSeconds / missionsWithTime.length
        : 0;

    // Find missions with most and least play time (all missions, not just completed)
    // Always use all mission progress, not filtered by selected mission
    const allMissionTimes = missionProgress
      ? missionProgress
          .map((p) => ({
            mission: getMissionName(p.mission_id),
            time: parseTimeString(p.time_spent || 0),
            isCompleted: p.completion_percentage === 100,
          }))
          .filter((m) => m.time > 0)
      : [];

    const missionTimes = allMissionTimes;

    const mostPlayedMission =
      missionTimes.length > 0
        ? missionTimes.reduce((max, current) =>
            current.time > max.time ? current : max
          )
        : null;

    const leastPlayedMission =
      missionTimes.length > 0
        ? missionTimes.reduce((min, current) =>
            current.time < min.time ? current : min
          )
        : null;

    // XP and level calculations
    const totalXP = settings?.total_xp || 0;
    const currentLevel = Math.floor(totalXP / 200) + 1;
    const xpToNextLevel = 200 - (totalXP % 200);

    // Decision type distribution
    const decisionTypes = [
      {
        name: "Diplomatic",
        value: filteredProgress.reduce(
          (sum, p) => sum + (p.diplomatic_decisions || 0),
          0
        ),
        icon: "🤝",
        color: "#3b82f6",
      },
      {
        name: "Strategic",
        value: filteredProgress.reduce(
          (sum, p) => sum + (p.strategic_decisions || 0),
          0
        ),
        icon: "🧠",
        color: "#10b981",
      },
      {
        name: "Action",
        value: filteredProgress.reduce(
          (sum, p) => sum + (p.action_decisions || 0),
          0
        ),
        icon: "⚔️",
        color: "#f59e0b",
      },
      {
        name: "Investigation",
        value: filteredProgress.reduce(
          (sum, p) => sum + (p.investigation_decisions || 0),
          0
        ),
        icon: "🔍",
        color: "#ef4444",
      },
    ].filter((d) => d.value > 0);

    // Mission performance data
    const missionPerformance = filteredProgress.map((progress) => ({
      mission: getMissionName(progress.mission_id),
      difficulty: getMissionDifficulty(progress.mission_id),
      completion: progress.completion_percentage || 0,
      decisions: progress.decisions_made || 0,
      goodDecisions: progress.good_decisions || 0,
      badDecisions: progress.bad_decisions || 0,
      successRate:
        progress.decisions_made > 0
          ? ((progress.good_decisions || 0) / progress.decisions_made) * 100
          : 0,
      timeSpent: progress.time_spent || "00:00:00",
      timeInSeconds: parseTimeString(progress.time_spent || 0),
      lastUpdated: progress.last_updated,
      completedDate:
        progress.completion_percentage === 100
          ? new Date(progress.last_updated)
          : null,
    }));

    // Sort missions by completion date for timeline
    const completedMissionsTimeline = missionPerformance
      .filter((m) => m.completedDate)
      .sort((a, b) => a.completedDate!.getTime() - b.completedDate!.getTime());

    const firstMissionCompleted =
      completedMissionsTimeline.length > 0
        ? completedMissionsTimeline[0]
        : null;

    // Calculate playing style data
    const dominantDecisionType =
      decisionTypes.length > 0
        ? decisionTypes.reduce((max, current) =>
            current.value > max.value ? current : max
          )
        : null;

    const isBalancedStyle =
      decisionTypes.length >= 3 &&
      Math.max(...decisionTypes.map((d) => d.value)) -
        Math.min(...decisionTypes.map((d) => d.value)) <=
        2;

    // Determine playing style summary
    const getPlayingStyleSummary = () => {
      if (!dominantDecisionType) return "Explorer";

      const dominant = dominantDecisionType.name;

      if (isBalancedStyle) {
        return "Versatile Strategist";
      } else if (dominant === "Diplomatic") {
        return "Peaceful Negotiator";
      } else if (dominant === "Strategic") {
        return "Master Tactician";
      } else if (dominant === "Action") {
        return "Bold Adventurer";
      } else if (dominant === "Investigation") {
        return "Curious Detective";
      }

      return "Unique Explorer";
    };

    // Playing style analysis
    const playingStyle = {
      dominant: dominantDecisionType,
      balanced: isBalancedStyle,
      summary: getPlayingStyleSummary(),
    };

    return {
      filteredProgress,
      totalDecisions,
      totalGoodDecisions,
      totalBadDecisions,
      successRate,
      completedMissions,
      averageCompletion,
      totalTimeSeconds,
      averageTimePerMission,
      mostPlayedMission,
      leastPlayedMission,
      totalXP,
      currentLevel,
      xpToNextLevel,
      firstMissionCompleted,
      decisionTypes,
      missionPerformance,
      playingStyle,
    };
  }, [missionProgress, selectedMission, settings]);

  // Filter and sort achievements
  const filteredAndSortedAchievements = useMemo(() => {
    const filtered = achievements.filter((achievement) => {
      if (achievementFilter === "all") return true;
      if (achievementFilter === "unlocked") {
        return userAchievements.some((ua) => ua.id === achievement.id);
      }
      if (achievementFilter === "locked") {
        return !userAchievements.some((ua) => ua.id === achievement.id);
      }
      return achievement.rarity === achievementFilter;
    });

    // Sort achievements
    filtered.sort((a, b) => {
      const aUnlocked = userAchievements.some((ua) => ua.id === a.id);
      const bUnlocked = userAchievements.some((ua) => ua.id === b.id);
      const aUnlockedAchievement = userAchievements.find(
        (ua) => ua.id === a.id
      );
      const bUnlockedAchievement = userAchievements.find(
        (ua) => ua.id === b.id
      );

      switch (achievementSort) {
        case "status":
          // Unlocked first, then by most recently unlocked
          if (aUnlocked && !bUnlocked) return -1;
          if (!aUnlocked && bUnlocked) return 1;
          if (aUnlocked && bUnlocked) {
            const aDate = new Date(aUnlockedAchievement?.unlocked_at || 0);
            const bDate = new Date(bUnlockedAchievement?.unlocked_at || 0);
            return bDate.getTime() - aDate.getTime(); // Most recent first
          }
          return 0;

        case "rarity":
          const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
          return rarityOrder[a.rarity] - rarityOrder[b.rarity];

        case "alphabetical":
          return a.name.localeCompare(b.name);

        case "progress":
          // Calculate progress for sorting
          const getProgress = (achievement: Achievement) => {
            if (userAchievements.some((ua) => ua.id === achievement.id))
              return 100;

            if (!processedData) return 0;

            const { completedMissions, filteredProgress, totalDecisions } =
              processedData;

            switch (achievement.id) {
              case "first_mission":
                return Math.min(100, (completedMissions / 1) * 100);
              case "all_missions":
                return Math.min(100, (completedMissions / 4) * 100);
              case "diplomat":
                const totalDiplomatic = filteredProgress.reduce(
                  (sum, p) => sum + (p.diplomatic_decisions || 0),
                  0
                );
                return Math.min(100, (totalDiplomatic / 3) * 100);
              case "strategist":
                const totalStrategic = filteredProgress.reduce(
                  (sum, p) => sum + (p.strategic_decisions || 0),
                  0
                );
                return Math.min(100, (totalStrategic / 3) * 100);
              case "action_hero":
                const totalAction = filteredProgress.reduce(
                  (sum, p) => sum + (p.action_decisions || 0),
                  0
                );
                return Math.min(100, (totalAction / 3) * 100);
              case "detective":
                const totalInvestigation = filteredProgress.reduce(
                  (sum, p) => sum + (p.investigation_decisions || 0),
                  0
                );
                return Math.min(100, (totalInvestigation / 3) * 100);
              case "explorer":
                return Math.min(100, (totalDecisions / 10) * 100);
              default:
                return 0;
            }
          };

          return getProgress(b) - getProgress(a); // Highest progress first

        default:
          return 0;
      }
    });

    return filtered;
  }, [
    achievements,
    userAchievements,
    achievementFilter,
    achievementSort,
    processedData,
  ]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground">
              Please sign in to view your mission results and analytics.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (dbLoading || !processedData) {
    return <ResultsSkeleton />;
  }

  const {
    filteredProgress,
    totalDecisions,
    totalGoodDecisions,
    totalBadDecisions,
    successRate,
    completedMissions,
    averageCompletion,
    totalTimeSeconds,
    averageTimePerMission,
    mostPlayedMission,
    leastPlayedMission,
    totalXP,
    currentLevel,
    xpToNextLevel,
    firstMissionCompleted,
    decisionTypes,
    missionPerformance,
    playingStyle,
  } = processedData;

  // Helper function to get context text based on filter
  const getContextText = (baseText: string, filteredText?: string) => {
    if (selectedMission === "all") {
      return baseText;
    }
    const missionName = getMissionName(selectedMission);
    return filteredText
      ? filteredText.replace("{mission}", missionName)
      : `${missionName} - ${baseText}`;
  };

  /**
   * Exports comprehensive mission data to CSV format
   */
  const exportData = async () => {
    if (!processedData) return;

    const {
      totalDecisions,
      totalGoodDecisions,
      totalBadDecisions,
      successRate,
      completedMissions,
      averageCompletion,
      totalTimeSeconds,
      averageTimePerMission,
      mostPlayedMission,
      leastPlayedMission,
      totalXP,
      currentLevel,
      xpToNextLevel,
      decisionTypes,
      playingStyle,
    } = processedData;

    // Create comprehensive export data
    const exportSheets = [];

    // 1. Mission Performance Data
    const missionData = missionPerformance.map((mission) => ({
      mission_name: mission.mission,
      difficulty: mission.difficulty,
      completion_percentage: mission.completion,
      total_decisions: mission.decisions,
      good_decisions: mission.goodDecisions,
      bad_decisions: mission.badDecisions,
      success_rate: mission.successRate.toFixed(1) + "%",
      diplomatic_decisions:
        filteredProgress.find(
          (p) => getMissionName(p.mission_id) === mission.mission
        )?.diplomatic_decisions || 0,
      strategic_decisions:
        filteredProgress.find(
          (p) => getMissionName(p.mission_id) === mission.mission
        )?.strategic_decisions || 0,
      action_decisions:
        filteredProgress.find(
          (p) => getMissionName(p.mission_id) === mission.mission
        )?.action_decisions || 0,
      investigation_decisions:
        filteredProgress.find(
          (p) => getMissionName(p.mission_id) === mission.mission
        )?.investigation_decisions || 0,
      time_spent: mission.timeSpent,
      time_in_seconds: mission.timeInSeconds,
      last_updated: new Date(mission.lastUpdated).toLocaleDateString(),
    }));

    // 2. Overall Summary
    const summaryData = [
      {
        metric: "Missions Completed",
        value: completedMissions,
        unit: "missions",
      },
      {
        metric: "Total Decisions Made",
        value: totalDecisions,
        unit: "decisions",
      },
      {
        metric: "Good Decisions",
        value: totalGoodDecisions,
        unit: "decisions",
      },
      {
        metric: "Bad Decisions",
        value: totalBadDecisions,
        unit: "decisions",
      },
      {
        metric: "Success Rate",
        value: successRate.toFixed(1),
        unit: "%",
      },
      {
        metric: "Average Completion",
        value: averageCompletion.toFixed(1),
        unit: "%",
      },
      {
        metric: "Total Time Played",
        value: formatTime(totalTimeSeconds),
        unit: "time",
      },
      {
        metric: "Average Time per Mission",
        value: formatTime(Math.round(averageTimePerMission)),
        unit: "time",
      },
      {
        metric: "Total XP Earned",
        value: totalXP,
        unit: "XP",
      },
      {
        metric: "Current Level",
        value: currentLevel,
        unit: "level",
      },
      {
        metric: "XP to Next Level",
        value: xpToNextLevel,
        unit: "XP",
      },

      {
        metric: "Playing Style",
        value: playingStyle.summary,
        unit: "style",
      },
    ];

    // 3. Decision Type Distribution
    const decisionTypeData = decisionTypes.map((type) => ({
      decision_type: type.name,
      count: type.value,
      percentage: ((type.value / totalDecisions) * 100).toFixed(1) + "%",
      icon: type.icon,
    }));

    // 4. Time Records
    const timeRecordsData = [
      {
        record_type: "Most Played Mission",
        mission: mostPlayedMission?.mission || "N/A",
        time: mostPlayedMission ? formatTime(mostPlayedMission.time) : "N/A",
      },
      {
        record_type: "Least Played Mission",
        mission: leastPlayedMission?.mission || "N/A",
        time: leastPlayedMission ? formatTime(leastPlayedMission.time) : "N/A",
      },
    ];

    // 5. Achievement Data
    const achievementData = achievements.map((achievement) => {
      const isUnlocked = userAchievements.some(
        (ua) => ua.id === achievement.id
      );
      const unlockedAchievement = userAchievements.find(
        (ua) => ua.id === achievement.id
      );

      let progress = 0;
      if (!isUnlocked) {
        // Calculate progress
        switch (achievement.id) {
          case "first_mission":
            progress = Math.min(100, (completedMissions / 1) * 100);
            break;
          case "all_missions":
            progress = Math.min(100, (completedMissions / 4) * 100);
            break;
          case "diplomat":
            const totalDiplomatic = filteredProgress.reduce(
              (sum, p) => sum + (p.diplomatic_decisions || 0),
              0
            );
            progress = Math.min(100, (totalDiplomatic / 3) * 100);
            break;
          case "strategist":
            const totalStrategic = filteredProgress.reduce(
              (sum, p) => sum + (p.strategic_decisions || 0),
              0
            );
            progress = Math.min(100, (totalStrategic / 3) * 100);
            break;
          case "action_hero":
            const totalAction = filteredProgress.reduce(
              (sum, p) => sum + (p.action_decisions || 0),
              0
            );
            progress = Math.min(100, (totalAction / 3) * 100);
            break;
          case "detective":
            const totalInvestigation = filteredProgress.reduce(
              (sum, p) => sum + (p.investigation_decisions || 0),
              0
            );
            progress = Math.min(100, (totalInvestigation / 3) * 100);
            break;
          case "explorer":
            progress = Math.min(100, (totalDecisions / 10) * 100);
            break;
        }
      }

      return {
        achievement_name: achievement.name,
        description: achievement.description,
        rarity: achievement.rarity,
        xp_reward:
          achievement.rarity === "legendary"
            ? 500
            : achievement.rarity === "epic"
            ? 200
            : achievement.rarity === "rare"
            ? 100
            : 50,
        status: isUnlocked ? "Unlocked" : "Locked",
        progress_percentage: isUnlocked ? 100 : Math.round(progress),
        unlocked_date: unlockedAchievement?.unlocked_at
          ? new Date(unlockedAchievement.unlocked_at).toLocaleDateString()
          : "N/A",
      };
    });

    // Combine all data into a comprehensive CSV
    const csvSections = [
      "=== MISSION PERFORMANCE ===",
      Object.keys(missionData[0]).join(","),
      ...missionData.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
          .join(",")
      ),
      "",
      "=== OVERALL SUMMARY ===",
      "metric,value,unit",
      ...summaryData.map(
        (row) => `"${row.metric}","${row.value}","${row.unit}"`
      ),
      "",
      "=== DECISION TYPE DISTRIBUTION ===",
      Object.keys(decisionTypeData[0]).join(","),
      ...decisionTypeData.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
          .join(",")
      ),
      "",
      "=== TIME RECORDS ===",
      Object.keys(timeRecordsData[0]).join(","),
      ...timeRecordsData.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
          .join(",")
      ),
      "",
      "=== ACHIEVEMENTS ===",
      Object.keys(achievementData[0]).join(","),
      ...achievementData.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
          .join(",")
      ),
      "",
      `=== EXPORT INFO ===`,
      `"Export Date","${new Date().toLocaleDateString()}"`,
      `"Export Time","${new Date().toLocaleTimeString()}"`,
      `"Player Level","${currentLevel}"`,
      `"Total XP","${totalXP}"`,
      `"Achievements Unlocked","${userAchievements.length}/${achievements.length}"`,
    ];

    const csv = csvSections.join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `story-quest-complete-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Award social butterfly achievement for exporting data
    if (user) {
      try {
        const { awardAchievement } = await import("@/lib/achievementEngine");
        const awarded = await awardAchievement(user.id, "social_butterfly");
        if (awarded) {
          toast.success("🏆 Achievement Unlocked: Social Butterfly!", {
            description: "You exported your comprehensive analytics data!",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error awarding export achievement:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="scroll-m-20 text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2">
              {getContextText("Mission Analytics", "{mission} Analytics")}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {getContextText(
                "A comprehensive analysis of your journey on Story Quest",
                "Analysis of your progress in {mission}"
              )}
            </p>
          </div>
          <div className="flex flex-row items-center gap-3">
            <Select value={selectedMission} onValueChange={setSelectedMission}>
              <SelectTrigger className="w-[140px] sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter Mission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Missions</SelectItem>
                {missions.map((mission) => (
                  <SelectItem key={mission.id} value={mission.id}>
                    {mission.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={exportData}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <MetricCard
            icon={Trophy}
            value={completedMissions}
            label="Missions Complete"
          />
          <MetricCard
            icon={BarChart3}
            value={totalDecisions}
            label="Total Decisions"
          />
          <MetricCard
            icon={Target}
            value={`${successRate.toFixed(1)}%`}
            label="Success Rate"
          />
          <MetricCard
            icon={Clock}
            value={formatTime(totalTimeSeconds)}
            label="Total Time"
          />
          <MetricCard
            icon={Zap}
            value={totalXP.toLocaleString()}
            label="Total XP"
          />
          <MetricCard
            icon={Star}
            value={userAchievements.length}
            label="Achievements"
          />
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-[600px] h-auto p-1">
            <TabsTrigger
              value="overview"
              className="text-xs sm:text-sm px-2 sm:px-4 py-2"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="text-xs sm:text-sm px-2 sm:px-4 py-2"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="decisions"
              className="text-xs sm:text-sm px-1 sm:px-4 py-2"
            >
              Decisions
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="text-xs sm:text-sm px-1 sm:px-4 py-2"
            >
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {getContextText(
                      "Mission Progress Overview",
                      "{mission} Progress"
                    )}
                  </CardTitle>
                  <CardDescription>
                    {getContextText(
                      "Your completion status across all missions",
                      "Your progress in {mission}"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {missions.map((mission) => {
                      const progress = missionPerformance.find(
                        (p) => p.mission === mission.title
                      );
                      const completion = progress?.completion || 0;
                      const status =
                        completion === 0
                          ? "not-started"
                          : completion === 100
                          ? "completed"
                          : "in-progress";

                      // If filtering by a specific mission, only show that mission
                      if (
                        selectedMission !== "all" &&
                        mission.id !== selectedMission
                      ) {
                        return null;
                      }

                      return (
                        <div key={mission.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {mission.title}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {mission.difficulty}
                              </Badge>
                              <Badge
                                variant={
                                  status === "completed"
                                    ? "default"
                                    : status === "in-progress"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {status === "completed"
                                  ? "Complete"
                                  : status === "in-progress"
                                  ? "In Progress"
                                  : "Not Started"}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {completion}%
                            </span>
                          </div>
                          <Progress value={completion} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    {getContextText(
                      "Playing Style Analysis",
                      "{mission} Decision Style"
                    )}
                  </CardTitle>
                  <CardDescription>
                    {getContextText(
                      "Your decision-making preferences",
                      "Your decision patterns in {mission}"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {playingStyle.dominant && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">
                            {playingStyle.dominant.icon}
                          </span>
                          <span className="font-semibold">
                            Dominant Style: {playingStyle.dominant.name}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {playingStyle.balanced
                            ? "You show a balanced approach across different decision types."
                            : `You prefer ${playingStyle.dominant.name.toLowerCase()} solutions to challenges.`}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {decisionTypes.map((type) => (
                        <div
                          key={type.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span className="text-sm">{type.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${
                                    (type.value / totalDecisions) * 100
                                  }%`,
                                  backgroundColor: type.color,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">
                              {type.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fun Personal Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Records
                  </CardTitle>
                  <CardDescription>
                    Your personal time achievements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Average per Mission
                    </span>
                    <span className="font-medium">
                      {formatTime(Math.round(averageTimePerMission))}
                    </span>
                  </div>
                  {leastPlayedMission && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Least Played
                      </span>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatTime(leastPlayedMission.time)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {leastPlayedMission.mission}
                        </div>
                      </div>
                    </div>
                  )}
                  {mostPlayedMission && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Most Played
                      </span>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatTime(mostPlayedMission.time)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mostPlayedMission.mission}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Personal Records
                  </CardTitle>
                  <CardDescription>Your gameplay milestones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Current Level
                    </span>
                    <span className="font-medium">Level {currentLevel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      XP to Next Level
                    </span>
                    <span className="font-medium">
                      {xpToNextLevel.toLocaleString()}
                    </span>
                  </div>

                  {firstMissionCompleted && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        First Victory
                      </span>
                      <div className="text-right">
                        <div className="font-medium">
                          {firstMissionCompleted.mission}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {firstMissionCompleted.completedDate?.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Your latest accomplishments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Latest Achievements */}
                  {userAchievements.length > 0 ? (
                    <div className="space-y-3">
                      {userAchievements
                        .slice(-2)
                        .reverse()
                        .map((achievement, index) => (
                          <div
                            key={achievement.id}
                            className="p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">
                                {achievement.icon}
                              </span>
                              <span className="font-semibold">
                                {achievement.name}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {achievement.description}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No achievements unlocked yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {getContextText(
                    "Decision Quality Trends",
                    "{mission} Decision Quality"
                  )}
                </CardTitle>
                <CardDescription>
                  {getContextText(
                    "Good vs. bad decisions by mission",
                    "Good vs. bad decisions in {mission}"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ChartContainer
                  config={{
                    goodDecisions: {
                      label: "Good Decisions",
                      color: "#10b981",
                    },
                    badDecisions: {
                      label: "Bad Decisions",
                      color: "#ef4444",
                    },
                  }}
                  className="h-[300px] sm:h-[400px] w-full max-w-4xl"
                >
                  <BarChart data={missionPerformance} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="mission"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Bar dataKey="goodDecisions" fill="#10b981" radius={4} />
                    <Bar dataKey="badDecisions" fill="#ef4444" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Decision Analysis Tab */}
          <TabsContent value="decisions" className="space-y-4 sm:space-y-6">
            {/* Decision Analysis Charts - All in one row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle>
                    {getContextText(
                      "Decision Type Distribution",
                      "{mission} Decision Types"
                    )}
                  </CardTitle>
                  <CardDescription>
                    {getContextText(
                      "How you approach different challenges across all missions",
                      "How you approach challenges in {mission}"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={{
                      diplomatic: {
                        label: "Diplomatic",
                        color: "#3b82f6",
                      },
                      strategic: {
                        label: "Strategic",
                        color: "#10b981",
                      },
                      action: {
                        label: "Action",
                        color: "#f59e0b",
                      },
                      investigation: {
                        label: "Investigation",
                        color: "#ef4444",
                      },
                    }}
                    className="mx-auto aspect-square max-h-[200px] sm:max-h-[250px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={decisionTypes.map((type) => ({
                          name: type.name.toLowerCase(),
                          value: type.value,
                          fill: type.color,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    {totalDecisions.toLocaleString()}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground"
                                  >
                                    Total
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle>
                    {getContextText(
                      "Good Decisions by Type",
                      "{mission} Good Decisions"
                    )}
                  </CardTitle>
                  <CardDescription>
                    {getContextText(
                      "Distribution of successful decisions by type",
                      "Your successful decisions in {mission} by type"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={{
                      diplomatic: {
                        label: "Diplomatic",
                        color: "#3b82f6",
                      },
                      strategic: {
                        label: "Strategic",
                        color: "#10b981",
                      },
                      action: {
                        label: "Action",
                        color: "#f59e0b",
                      },
                      investigation: {
                        label: "Investigation",
                        color: "#ef4444",
                      },
                    }}
                    className="mx-auto aspect-square max-h-[200px] sm:max-h-[250px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={[
                          {
                            name: "diplomatic",
                            value: filteredProgress.reduce(
                              (sum, p) =>
                                sum + (p.diplomatic_good_decisions || 0),
                              0
                            ),
                            fill: "#3b82f6",
                          },
                          {
                            name: "strategic",
                            value: filteredProgress.reduce(
                              (sum, p) =>
                                sum + (p.strategic_good_decisions || 0),
                              0
                            ),
                            fill: "#10b981",
                          },
                          {
                            name: "action",
                            value: filteredProgress.reduce(
                              (sum, p) => sum + (p.action_good_decisions || 0),
                              0
                            ),
                            fill: "#f59e0b",
                          },
                          {
                            name: "investigation",
                            value: filteredProgress.reduce(
                              (sum, p) =>
                                sum + (p.investigation_good_decisions || 0),
                              0
                            ),
                            fill: "#ef4444",
                          },
                        ].filter((item) => item.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    {totalGoodDecisions.toLocaleString()}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground"
                                  >
                                    Good
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle>
                    {getContextText(
                      "Bad Decisions by Type",
                      "{mission} Bad Decisions"
                    )}
                  </CardTitle>
                  <CardDescription>
                    {getContextText(
                      "Distribution of unsuccessful decisions by type",
                      "Your unsuccessful decisions in {mission} by type"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={{
                      diplomatic: {
                        label: "Diplomatic",
                        color: "#3b82f6",
                      },
                      strategic: {
                        label: "Strategic",
                        color: "#10b981",
                      },
                      action: {
                        label: "Action",
                        color: "#f59e0b",
                      },
                      investigation: {
                        label: "Investigation",
                        color: "#ef4444",
                      },
                    }}
                    className="mx-auto aspect-square max-h-[200px] sm:max-h-[250px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={[
                          {
                            name: "diplomatic",
                            value: filteredProgress.reduce(
                              (sum, p) =>
                                sum + (p.diplomatic_bad_decisions || 0),
                              0
                            ),
                            fill: "#3b82f6",
                          },
                          {
                            name: "strategic",
                            value: filteredProgress.reduce(
                              (sum, p) =>
                                sum + (p.strategic_bad_decisions || 0),
                              0
                            ),
                            fill: "#10b981",
                          },
                          {
                            name: "action",
                            value: filteredProgress.reduce(
                              (sum, p) => sum + (p.action_bad_decisions || 0),
                              0
                            ),
                            fill: "#f59e0b",
                          },
                          {
                            name: "investigation",
                            value: filteredProgress.reduce(
                              (sum, p) =>
                                sum + (p.investigation_bad_decisions || 0),
                              0
                            ),
                            fill: "#ef4444",
                          },
                        ].filter((item) => item.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    {totalBadDecisions.toLocaleString()}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground"
                                  >
                                    Bad
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Individual Mission Decision Radar Charts - Only missions with data */}
            <div
              className={`grid gap-4 sm:gap-6 ${(() => {
                const filteredMissionsCount = missions.filter((mission) => {
                  if (
                    selectedMission !== "all" &&
                    mission.id !== selectedMission
                  ) {
                    return false;
                  }
                  const missionProgress = filteredProgress.find(
                    (p) => p.mission_id === mission.id
                  );
                  return (
                    missionProgress && (missionProgress.decisions_made || 0) > 0
                  );
                }).length;

                if (filteredMissionsCount === 1) return "grid-cols-1";
                if (filteredMissionsCount === 2)
                  return "grid-cols-1 sm:grid-cols-2";
                if (filteredMissionsCount === 3)
                  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
                return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
              })()}`}
            >
              {missions
                .filter((mission) => {
                  if (
                    selectedMission !== "all" &&
                    mission.id !== selectedMission
                  ) {
                    return false;
                  }
                  const missionProgress = filteredProgress.find(
                    (p) => p.mission_id === mission.id
                  );
                  return (
                    missionProgress && (missionProgress.decisions_made || 0) > 0
                  );
                })
                .map((mission) => {
                  // Find progress for this specific mission
                  const missionProgress = filteredProgress.find(
                    (p) => p.mission_id === mission.id
                  );

                  return (
                    <MissionRadarChart
                      key={mission.id}
                      mission={mission}
                      missionProgress={missionProgress}
                    />
                  );
                })}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4 sm:space-y-6">
            {/* Achievement Gallery */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Achievement Gallery
                    </CardTitle>
                    <CardDescription>
                      Your accomplishments and progress in Story Quest (
                      {userAchievements.length}/{achievements.length} unlocked)
                    </CardDescription>
                  </div>

                  <div className="flex flex-row items-end gap-3 sm:gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground font-medium">
                        Filter
                      </span>
                      <Select
                        value={achievementFilter}
                        onValueChange={setAchievementFilter}
                      >
                        <SelectTrigger className="w-[120px] sm:w-[140px]">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="unlocked">Unlocked</SelectItem>
                          <SelectItem value="locked">Locked</SelectItem>
                          <SelectItem value="common">Common</SelectItem>
                          <SelectItem value="rare">Rare</SelectItem>
                          <SelectItem value="epic">Epic</SelectItem>
                          <SelectItem value="legendary">Legendary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground font-medium">
                        Sort by
                      </span>
                      <Select
                        value={achievementSort}
                        onValueChange={setAchievementSort}
                      >
                        <SelectTrigger className="w-[120px] sm:w-[140px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="rarity">Rarity</SelectItem>
                          <SelectItem value="alphabetical">A-Z</SelectItem>
                          <SelectItem value="progress">Progress</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredAndSortedAchievements.map((achievement) => {
                    const isUnlocked = userAchievements.some(
                      (ua) => ua.id === achievement.id
                    );
                    const unlockedAchievement = userAchievements.find(
                      (ua) => ua.id === achievement.id
                    );

                    // Calculate progress for this achievement
                    let progress = 0;
                    let progressText = "";
                    let xpReward = 0;

                    // Set XP rewards based on rarity
                    switch (achievement.rarity) {
                      case "common":
                        xpReward = 50;
                        break;
                      case "rare":
                        xpReward = 100;
                        break;
                      case "epic":
                        xpReward = 200;
                        break;
                      case "legendary":
                        xpReward = 500;
                        break;
                    }

                    if (!isUnlocked) {
                      // Calculate progress based on achievement type
                      switch (achievement.id) {
                        case "first_mission":
                          progress = Math.min(
                            100,
                            (completedMissions / 1) * 100
                          );
                          progressText = `Complete ${completedMissions}/1 missions`;
                          break;
                        case "all_missions":
                          progress = Math.min(
                            100,
                            (completedMissions / 4) * 100
                          );
                          progressText = `Complete ${completedMissions}/4 missions`;
                          break;
                        case "diplomat":
                          const totalDiplomatic = filteredProgress.reduce(
                            (sum, p) => sum + (p.diplomatic_decisions || 0),
                            0
                          );
                          progress = Math.min(100, (totalDiplomatic / 3) * 100);
                          progressText = `Make ${totalDiplomatic}/3 diplomatic decisions`;
                          break;
                        case "strategist":
                          const totalStrategic = filteredProgress.reduce(
                            (sum, p) => sum + (p.strategic_decisions || 0),
                            0
                          );
                          progress = Math.min(100, (totalStrategic / 3) * 100);
                          progressText = `Make ${totalStrategic}/3 strategic decisions`;
                          break;
                        case "action_hero":
                          const totalAction = filteredProgress.reduce(
                            (sum, p) => sum + (p.action_decisions || 0),
                            0
                          );
                          progress = Math.min(100, (totalAction / 3) * 100);
                          progressText = `Make ${totalAction}/3 action decisions`;
                          break;
                        case "detective":
                          const totalInvestigation = filteredProgress.reduce(
                            (sum, p) => sum + (p.investigation_decisions || 0),
                            0
                          );
                          progress = Math.min(
                            100,
                            (totalInvestigation / 3) * 100
                          );
                          progressText = `Make ${totalInvestigation}/3 investigation decisions`;
                          break;
                        case "explorer":
                          progress = Math.min(100, (totalDecisions / 10) * 100);
                          progressText = `Make ${totalDecisions}/10 total decisions`;
                          break;
                        default:
                          progressText = "Requirements not met";
                      }
                    }

                    return (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        isUnlocked={isUnlocked}
                        progress={progress}
                        progressText={progressText}
                        unlockedDate={unlockedAchievement?.unlocked_at}
                        xpReward={xpReward}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <QuestionButton />
    </div>
  );
}
