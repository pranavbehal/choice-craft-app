/**
 * AchievementCard Component
 *
 * Reusable card component for displaying achievement information,
 * progress, and unlock status.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";
import { type Achievement } from "@/types";

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: number;
  progressText?: string;
  unlockedDate?: string;
  xpReward: number;
}

export function AchievementCard({
  achievement,
  isUnlocked,
  progress = 0,
  progressText = "",
  unlockedDate,
  xpReward,
}: AchievementCardProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-amber-500 text-white border-0 font-medium";
      case "epic":
        return "bg-purple-500 text-white border-0 font-medium";
      case "rare":
        return "bg-blue-500 text-white border-0 font-medium";
      default:
        return "bg-green-500 text-white border-0 font-medium";
    }
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
        isUnlocked
          ? "border-green-500/30 shadow-lg bg-gradient-to-br from-background via-background to-green-500/5"
          : "border-muted/50 bg-muted/20"
      }`}
    >
      <CardContent className="p-2 sm:p-4">
        {/* Achievement Icon & Header */}
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className={`relative ${isUnlocked ? "" : "opacity-50"}`}>
            <div className={`text-4xl ${!isUnlocked ? "grayscale" : ""}`}>
              {isUnlocked ? achievement.icon : "🔒"}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={`font-semibold text-sm sm:text-base ${
                  !isUnlocked ? "text-muted-foreground" : ""
                }`}
              >
                {achievement.name}
              </h3>
            </div>

            <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
              <Badge
                variant="secondary"
                className={getRarityColor(achievement.rarity)}
              >
                {achievement.rarity.charAt(0).toUpperCase() +
                  achievement.rarity.slice(1)}
              </Badge>
              <Badge variant="outline" className="text-xs font-medium">
                <Zap className="w-3 h-3 mr-1" />
                {xpReward} XP
              </Badge>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
          {achievement.description}
        </p>

        {/* Status Section */}
        {isUnlocked ? (
          unlockedDate && (
            <div className="p-2 sm:p-3 bg-muted/50 rounded-lg border border-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs sm:text-sm font-medium">
                  Unlocked on {new Date(unlockedDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-2 sm:space-y-3">
            <div className="text-xs sm:text-sm text-muted-foreground font-medium">
              {progressText}
            </div>
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="relative">
                <Progress value={progress} className="h-2" />
                {progress > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/20 rounded-full" />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
