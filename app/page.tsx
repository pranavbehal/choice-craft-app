/**
 * Home Page Component
 *
 * Main landing page displaying available missions and their current status.
 * Provides mission selection interface with visual cards and progress tracking.
 *
 * @component
 * @requires Authentication
 */

"use client";

import { Navigation } from "@/components/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { useRouter } from "next/navigation";
import { useDatabase } from "@/hooks/useDatabase";
import { type MissionProgress } from "@/types";
import OnboardingPopup from "@/components/help/onboarding-popup";
import { QuestionButton } from "@/components/help/question-button";
import { missions } from "@/data/missions";
import { AlertCircle, RefreshCw, Play, RotateCcw } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useChatPersistence } from "@/hooks/useChatPersistence";
import { MissionResumeDialog } from "@/components/ui/mission-resume-dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const handleProtectedAction = useProtectedAction();
  const { missionProgress, loading, error, refreshData } = useDatabase("home");

  // Remove component key to prevent unnecessary re-mounts
  // Auth and database state management should handle user changes gracefully

  // State for resume dialog
  const [resumeDialog, setResumeDialog] = useState<{
    isOpen: boolean;
    missionId: string;
    missionTitle: string;
    totalMessages: number;
    lastAiMessage: string;
    completionPercentage: number;
  }>({
    isOpen: false,
    missionId: "",
    missionTitle: "",
    totalMessages: 0,
    lastAiMessage: "",
    completionPercentage: 0,
  });

  // State to track which missions have chat messages
  const [missionChatStatus, setMissionChatStatus] = useState<
    Record<string, boolean>
  >({});

  /**
   * Check if mission has existing chat history
   */
  const checkMissionHistory = useCallback(
    async (missionId: string) => {
      if (!user)
        return { hasMessages: false, totalMessages: 0, lastAiMessage: "" };

      try {
        const { data: messages, error } = await supabase
          .from("chat_messages")
          .select("content, role")
          .eq("user_id", user.id)
          .eq("mission_id", missionId)
          .order("message_order", { ascending: false });

        if (error) {
          console.error("Error checking mission history:", error);
          return { hasMessages: false, totalMessages: 0, lastAiMessage: "" };
        }

        const totalMessages = messages?.length || 0;
        const lastAiMessage =
          messages?.find((m) => m.role === "assistant")?.content || "";

        return {
          hasMessages: totalMessages > 0,
          totalMessages,
          lastAiMessage,
        };
      } catch (error) {
        console.error("Error in checkMissionHistory:", error);
        return { hasMessages: false, totalMessages: 0, lastAiMessage: "" };
      }
    },
    [user]
  );

  /**
   * Load chat status for all missions on component mount
   */
  useEffect(() => {
    const loadAllMissionChatStatus = async () => {
      if (!user) return;

      try {
        const chatStatusPromises = missions.map(async (mission) => {
          const history = await checkMissionHistory(mission.id);
          return { missionId: mission.id, hasMessages: history.hasMessages };
        });

        const results = await Promise.all(chatStatusPromises);
        const statusMap: Record<string, boolean> = {};

        results.forEach(({ missionId, hasMessages }) => {
          statusMap[missionId] = hasMessages;
        });

        setMissionChatStatus(statusMap);
      } catch (error) {
        console.error("Error loading mission chat statuses:", error);
      }
    };

    if (user && !loading) {
      loadAllMissionChatStatus();
    }
  }, [user?.id, loading]); // Remove checkMissionHistory from deps to prevent recreating

  // Removed visibility handler that was causing conflicts with tab switching

  /**
   * Handles mission selection and navigation
   * Shows resume dialog if there's existing progress/chat history
   * @param {string} missionId - ID of the selected mission
   */
  const handleMissionClick = async (missionId: string) => {
    await handleProtectedAction(async () => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission) return;

      const status = getMissionStatus(missionId);
      const history = await checkMissionHistory(missionId);

      // Show resume dialog if there are existing messages
      if (history.hasMessages && history.totalMessages > 0) {
        // Parse AI message if it's JSON format
        let displayMessage = history.lastAiMessage;
        try {
          const parsed = JSON.parse(history.lastAiMessage);
          displayMessage = parsed.userResponse || history.lastAiMessage;
        } catch {
          // Keep original message if not JSON
        }

        setResumeDialog({
          isOpen: true,
          missionId,
          missionTitle: mission.title,
          totalMessages: history.totalMessages,
          lastAiMessage: displayMessage,
          completionPercentage: status.progress,
        });
      } else {
        // No existing messages, go directly to mission
        router.push(`/missions/${missionId}`);
        // Force refresh to ensure proper page load
        setTimeout(() => router.refresh(), 100);
      }
    });
  };

  /**
   * Clear chat history for a mission
   */
  const clearMissionChatHistory = useCallback(
    async (missionId: string) => {
      if (!user) return false;

      try {
        // Delete chat messages
        const { error: chatError } = await supabase
          .from("chat_messages")
          .delete()
          .eq("user_id", user.id)
          .eq("mission_id", missionId);

        if (chatError) {
          console.error("Error clearing chat history:", chatError);
          return false;
        }

        // Delete mission progress row completely when starting fresh
        const { error: progressError } = await supabase
          .from("user_mission_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("mission_id", missionId);

        if (progressError) {
          console.error("Error deleting mission progress:", progressError);
          // Don't return false here - chat clearing was successful
        } else {
          console.log("✅ Mission progress row deleted for fresh start");
        }

        // Update local chat status
        setMissionChatStatus((prev) => ({
          ...prev,
          [missionId]: false,
        }));

        // Refresh data to update UI
        refreshData();

        return true;
      } catch (error) {
        console.error("Error in clearMissionChatHistory:", error);
        return false;
      }
    },
    [user, refreshData]
  );

  /**
   * Gets mission completion status
   */
  const getMissionStatus = (missionId: string) => {
    const progress = missionProgress?.find(
      (p: MissionProgress) => p.mission_id === missionId
    );
    const hasChatMessages = missionChatStatus[missionId] || false;
    const progressPercentage = progress?.completion_percentage || 0;

    return {
      isCompleted: progressPercentage === 100,
      progress: progressPercentage,
      hasStarted: progressPercentage > 0 || hasChatMessages,
    };
  };

  /**
   * Gets color variant for difficulty badge
   */
  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "Intermediate":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Advanced":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Expert":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  /**
   * Gets color variant for status badge
   */
  const getStatusVariant = (status: {
    isCompleted: boolean;
    hasStarted: boolean;
  }) => {
    if (status.isCompleted) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (status.hasStarted) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else {
      return "border-gray-200"; // No background color for "Not Started"
    }
  };

  /**
   * Gets status text and emoji
   */
  const getStatusText = (status: {
    isCompleted: boolean;
    hasStarted: boolean;
  }) => {
    if (status.isCompleted) {
      return "✅ Complete";
    } else if (status.hasStarted) {
      return "🎮 In Progress";
    } else {
      return "⭕ Not Started";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Unable to load missions</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {error}. Please check your connection and try again.
            </p>
            <Button onClick={refreshData} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <OnboardingPopup />
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight mb-6 text-primary">
            Choose Your Adventure
          </h1>
          <div className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg space-y-3">
            <p>
              Welcome to Choice Craft, where your choices shape unique
              adventures across four distinct worlds. Click on a mission below
              to begin.
            </p>
            <p>
              Track your progress, earn achievements, and explore dynamically
              generated environments that respond to your decisions.
            </p>
            <p>Stop the story at any time by saying &quot;stop&quot;.</p>
          </div>
        </header>

        <section
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto"
          role="grid"
          aria-label="Available missions"
        >
          {missions.map((mission, index) => {
            const status = getMissionStatus(mission.id);

            if (loading) {
              return (
                <Card
                  key={mission.id}
                  className="relative aspect-video overflow-hidden"
                >
                  <div className="h-full p-6 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex justify-between items-center pt-4">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </Card>
              );
            }

            return (
              <article
                key={mission.id}
                role="gridcell"
                tabIndex={0}
                onClick={() => handleMissionClick(mission.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleMissionClick(mission.id);
                  }
                }}
                className="cursor-pointer transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                aria-label={`Start ${mission.title} mission - ${mission.description}`}
              >
                <Card className="relative aspect-video overflow-hidden border border-border hover:border-primary group shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                  <div className="absolute inset-0">
                    <Image
                      src={mission.image}
                      alt={`${mission.title} mission background`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover opacity-20 group-hover:opacity-50 transition-opacity duration-300"
                      priority={index < 2} // Priority load for first two images
                    />
                  </div>

                  {/* Play/Continue Button - Appears on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <Button
                      size="default"
                      className="bg-white/95 hover:bg-white text-black font-medium px-6 py-2 shadow-xl backdrop-blur-sm border border-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMissionClick(mission.id);
                      }}
                    >
                      {status.hasStarted ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Continue
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Play
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="relative z-10 h-full flex flex-col p-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold tracking-tight mb-2 mt-2 group-hover:text-primary transition-colors">
                        {mission.title}
                      </h2>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        {mission.description}
                      </p>
                    </div>

                    <div className="space-y-4 mt-auto">
                      {/* Progress indicator for started missions */}
                      {status.hasStarted && !status.isCompleted && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium">
                              {status.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${status.progress}%` }}
                              role="progressbar"
                              aria-valuenow={status.progress}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Mission progress: ${status.progress} percent`}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <Badge
                          className={`text-sm px-3 py-1 font-medium border ${getStatusVariant(
                            status
                          )}`}
                        >
                          {getStatusText(status)}
                        </Badge>

                        <div className="flex items-center gap-4">
                          <Badge
                            className={`text-sm px-3 py-1 font-medium border ${getDifficultyVariant(
                              mission.difficulty
                            )}`}
                          >
                            {mission.difficulty}
                          </Badge>
                          <span className="text-sm text-muted-foreground hidden sm:inline">
                            {mission.companion}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </article>
            );
          })}
        </section>
      </main>
      <div className="no-print">
        <QuestionButton />
      </div>

      {/* Resume Dialog */}
      <MissionResumeDialog
        isOpen={resumeDialog.isOpen}
        missionTitle={resumeDialog.missionTitle}
        totalMessages={resumeDialog.totalMessages}
        lastAiMessage={resumeDialog.lastAiMessage}
        completionPercentage={resumeDialog.completionPercentage}
        onResume={() => {
          setResumeDialog((prev) => ({ ...prev, isOpen: false }));
          router.push(`/missions/${resumeDialog.missionId}?resume=true`);
          // Force refresh to ensure proper page load
          setTimeout(() => router.refresh(), 100);
        }}
        onStartFresh={async () => {
          setResumeDialog((prev) => ({ ...prev, isOpen: false }));

          // Clear chat history from database
          await clearMissionChatHistory(resumeDialog.missionId);

          // Navigate to fresh mission
          router.push(`/missions/${resumeDialog.missionId}`);
          // Force refresh to ensure proper page load
          setTimeout(() => router.refresh(), 100);
        }}
        onClose={() => {
          setResumeDialog((prev) => ({ ...prev, isOpen: false }));
          // User stays on the current page (home)
        }}
      />
    </div>
  );
}
