"use client";

import { useState } from "react";
import { HelpMenu } from "./help-menu";
import { QAMenu } from "./qa-menu";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import OnboardingPopup from "./onboarding-popup";

export function InteractiveMenu() {
  const [activeMenu, setActiveMenu] = useState<"help" | "qa">("help");
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="w-full">
      <div className="flex space-x-2 mb-4">
        <Button
          variant={activeMenu === "help" ? "default" : "outline"}
          onClick={() => setActiveMenu("help")}
        >
          Help Menu
        </Button>
        <Button
          variant={activeMenu === "qa" ? "default" : "outline"}
          onClick={() => setActiveMenu("qa")}
        >
          Q&A Menu
        </Button>
        <Button
          variant="outline"
          className="ml-auto"
          onClick={() => setShowTutorial(true)}
        >
          <Play className="h-4 w-4 mr-2" />
          Replay Tutorial
        </Button>
      </div>
      {activeMenu === "help" ? <HelpMenu /> : <QAMenu />}
      {showTutorial && (
        <OnboardingPopup
          isReplay={true}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
}
