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
    title: "Welcome to Story Quest",
    content:
      "Embark on an interactive adventure where your choices shape the story. Chat with unique AI companions and explore different worlds through immersive missions.",
  },
  {
    title: "Choose Your Mission",
    content:
      "Start by selecting one of four unique missions: explore an ancient Lost City, navigate a Space Odyssey, discover an Enchanted Forest, or solve a high-tech Cyber Heist.",
  },
  {
    title: "Interact with Companions",
    content:
      "Each mission features a unique AI companion. Chat naturally with Professor Blue, Captain Nova, Fairy Lumi, or Sergeant Nexus via the chatbox at the bottom of the screen. They'll respond to your choices!",
  },
  {
    title: "Voice & Visuals",
    content:
      "Enable voice narration in Settings to hear your companion speak. Watch as the environment changes through AI-generated backgrounds that match your story progression.",
  },
  {
    title: "Track Your Progress",
    content:
      "Visit the Results page to view your mission statistics, decision patterns, and achievements. Looking to customize, analyze, and download your results? The Results page is the place to go!",
  },
  {
    title: "Helpful Commands",
    content:
      "Type 'stop' at any time to end a mission. Need to adjust settings? Click the Settings icon to customize your experience, including voice options and avatar selection. You can also sign in and out via the button in the top left of the screen.",
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
