"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";

const steps = [
  {
    title: "Welcome to Choice Craft",
    content:
      "Embark on an interactive adventure where your choices shape the story. Chat with unique AI companions and explore immersive worlds through four distinct missions. Your decisions influence the narrative and unlock achievements as you progress.",
  },
  {
    title: "Choose Your Mission & Companion",
    content:
      "Select from four unique missions: explore the Lost City with Professor Blue, journey through Space with Captain Nova, discover the Enchanted Forest with Fairy Lumi, or execute a Cyber Heist with Sergeant Nexus. Each mission has a structured storyline with clear progression milestones.",
  },
  {
    title: "Interactive Storytelling",
    content:
      "Chat naturally with your AI companion using the message box at the bottom of the screen. Your choices are categorized as Diplomatic, Strategic, Action, or Investigation decisions. Complete the main story (100% completion) or continue exploring with unlimited additional content.",
  },
  {
    title: "Voice & Visual Experience",
    content:
      "Enable voice narration in Settings to hear your companion's unique ElevenLabs AI voice. Watch as AI-generated background images dynamically change based on your story progression, creating an immersive visual experience that adapts to your choices.",
  },
  {
    title: "Profile & Achievement System",
    content:
      "Customize your profile in Settings: set a display name for leaderboards, choose your avatar, and toggle voice options. Unlock achievements by completing missions and making specific decision types. Achievements are ranked by rarity and provide XP rewards.",
  },
  {
    title: "Results & Leaderboard",
    content:
      "Track your progress on the Results page with detailed analytics, decision patterns, and achievement tracking. Export your data for analysis and view comprehensive charts. Compare your XP and level with other players on the Leaderboard page.",
  },
  {
    title: "Navigation & Controls",
    content:
      "Type 'stop' during any mission to end early (progress is saved). Use the help button (bottom-right) for assistance. Your progress automatically saves, allowing you to resume missions from where you left off. Sign in/out using the button in the top-left corner.",
  },
];

interface OnboardingPopupProps {
  isReplay?: boolean;
  onClose?: () => void;
}

export default function OnboardingPopup({
  isReplay,
  onClose,
}: OnboardingPopupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { settings, updateUserSettings } = useDatabase();

  useEffect(() => {
    if (!isReplay && user && settings) {
      if (!settings.has_seen_tutorial) {
        setIsOpen(true);
      }
    } else if (isReplay) {
      setIsOpen(true);
    }
  }, [user, settings, isReplay]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = async () => {
    setIsOpen(false);
    if (!isReplay && user) {
      try {
        await updateUserSettings({ has_seen_tutorial: true });
      } catch (error) {
        console.error("Failed to update tutorial status:", error);
      }
    }
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {steps[currentStep].title}
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-5">
            {steps[currentStep].content}
          </p>
          <Progress
            value={((currentStep + 1) / steps.length) * 100}
            className="w-full"
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handlePrevious} disabled={currentStep === 0}>
            Previous
          </Button>
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? "Start Adventure" : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
