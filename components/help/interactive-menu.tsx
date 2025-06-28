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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeMenu === "help" ? "default" : "outline"}
            onClick={() => setActiveMenu("help")}
            size="sm"
            className="text-sm"
          >
            Help Menu
          </Button>
          <Button
            variant={activeMenu === "qa" ? "default" : "outline"}
            onClick={() => setActiveMenu("qa")}
            size="sm"
            className="text-sm"
          >
            Q&A Menu
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTutorial(true)}
          className="text-sm w-full sm:w-auto"
        >
          <Play className="h-4 w-4 mr-2" />
          Replay Tutorial
        </Button>
      </div>

      <div className="min-h-0">
        {activeMenu === "help" ? <HelpMenu /> : <QAMenu />}
      </div>

      {showTutorial && (
        <OnboardingPopup
          isReplay={true}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
}
