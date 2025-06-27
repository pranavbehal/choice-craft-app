import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
  MessageSquare,
  Shield,
  Target,
  Search,
  Heart,
} from "lucide-react";
import { DecisionAnalysis } from "@/lib/achievementEngine";

interface DecisionFeedbackProps {
  analysis: DecisionAnalysis | null;
  xpGained: number;
  isVisible: boolean;
  onClose: () => void;
  oldProgress: number;
  newProgress: number;
}

const getDecisionIcon = (type: string) => {
  switch (type) {
    case "diplomatic":
      return <MessageSquare className="w-4 h-4" />;
    case "strategic":
      return <Shield className="w-4 h-4" />;
    case "action":
      return <Target className="w-4 h-4" />;
    case "investigation":
      return <Search className="w-4 h-4" />;
    default:
      return <Heart className="w-4 h-4" />;
  }
};

const getQualityColor = (quality: string) => {
  switch (quality) {
    case "good":
      return "bg-green-500";
    case "bad":
      return "bg-red-500";
    case "neutral":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

const getQualityVariant = (quality: string) => {
  switch (quality) {
    case "good":
      return "default";
    case "bad":
      return "destructive";
    case "neutral":
      return "secondary";
    default:
      return "outline";
  }
};

export default function DecisionFeedback({
  analysis,
  xpGained,
  isVisible,
  onClose,
  oldProgress,
  newProgress,
}: DecisionFeedbackProps) {
  const [animatedProgress, setAnimatedProgress] = useState(oldProgress);

  useEffect(() => {
    if (isVisible) {
      // Animate progress bar from old to new progress
      const timer = setTimeout(() => setAnimatedProgress(newProgress), 100);

      // Auto-hide after 5 seconds
      const hideTimer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    } else {
      setAnimatedProgress(oldProgress);
    }
  }, [isVisible, onClose, oldProgress, newProgress]);

  if (!isVisible || !analysis) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2">
      <Card className="w-80 border-2 shadow-lg bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`p-1 rounded-full ${getQualityColor(
                  analysis.quality
                )}`}
              >
                {getDecisionIcon(analysis.type)}
              </div>
              <span className="font-semibold text-sm">Decision Analysis</span>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {/* Decision Type and Quality */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {analysis.type}
                </Badge>
                <Badge
                  variant={getQualityVariant(analysis.quality)}
                  className="capitalize"
                >
                  {analysis.quality}
                </Badge>
              </div>
              {analysis.isStoryDecision && (
                <Badge variant="secondary" className="text-xs">
                  Story Decision
                </Badge>
              )}
            </div>

            {/* XP Gain */}
            {xpGained > 0 && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  {xpGained > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  +{xpGained} XP
                </span>
              </div>
            )}

            {/* Progress Advancement - Show different format based on whether progress changed */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Mission Progress</span>
                {oldProgress !== newProgress ? (
                  <span className="font-medium">
                    {oldProgress}% → {newProgress}%
                  </span>
                ) : (
                  <span className="font-medium">{newProgress}%</span>
                )}
              </div>
              <Progress value={animatedProgress} className="h-2" />
            </div>

            {/* Reasoning */}
            {analysis.reasoning && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                {analysis.reasoning}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
