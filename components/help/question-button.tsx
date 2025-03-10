"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InteractiveMenu } from "./interactive-menu";

export function QuestionButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 rounded-full w-12 h-12"
          size="icon"
          aria-label="Open help menu"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="mb-1 text-2xl">
            Story Quest Help Center
          </DialogTitle>
        </DialogHeader>
        <InteractiveMenu />
      </DialogContent>
    </Dialog>
  );
}
