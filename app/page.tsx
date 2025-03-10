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
import Image from "next/image";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { useRouter } from "next/navigation";
import { useDatabase } from "@/hooks/useDatabase";
import { type MissionProgress } from "@/types";
import OnboardingPopup from "@/components/help/onboarding-popup";
import { QuestionButton } from "@/components/help/question-button";
import { missions } from "@/data/missions";

export default function Home() {
  const router = useRouter();
  const handleProtectedAction = useProtectedAction();
  const { missionProgress } = useDatabase();

  /**
   * Handles mission selection and navigation
   * Requires authentication before proceeding
   * @param {string} missionId - ID of the selected mission
   */
  const handleMissionClick = (missionId: string) => {
    handleProtectedAction(() => {
      router.push(`/missions/${missionId}`);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <OnboardingPopup />
      <main className="container mx-auto px-4 py-8">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight mb-4 text-center text-primary">
          Choose Your Adventure
        </h1>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Welcome to Story Quest, where your choices shape unique adventures
          across four distinct worlds. Track your progress, earn achievements,
          and explore dynamically generated environments that respond to your
          decisions. top the story at any time by saying &quot;stop&quot;.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {missions.map((mission) => (
            <div
              key={mission.id}
              onClick={() => handleMissionClick(mission.id)}
              className="cursor-pointer transition-transform hover:scale-[1.02] duration-300"
            >
              <Card className="relative aspect-video overflow-hidden border border-border hover:border-primary group">
                <div className="absolute inset-0">
                  <Image
                    src={mission.image}
                    alt={mission.title}
                    fill
                    className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                  />
                </div>
                <div className="relative z-10 h-full flex flex-col p-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold tracking-tight mb-2 mt-2">
                      {mission.title}
                    </h2>
                    <p className="text-base text-muted-foreground">
                      {mission.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Badge
                        variant={
                          missionProgress?.find(
                            (p: MissionProgress) =>
                              p.mission_id === mission.id &&
                              p.completion_percentage === 100
                          )
                            ? "default"
                            : "secondary"
                        }
                        className="text-sm px-4 py-1"
                      >
                        {missionProgress?.find(
                          (p: MissionProgress) =>
                            p.mission_id === mission.id &&
                            p.completion_percentage === 100
                        )
                          ? "Complete"
                          : "Not Complete"}
                      </Badge>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-sm px-4 py-1">
                          {mission.difficulty}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Companion: {mission.companion}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </main>
      <QuestionButton />
    </div>
  );
}
