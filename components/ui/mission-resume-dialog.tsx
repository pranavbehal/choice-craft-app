/**
 * Mission Resume Dialog Component
 *
 * Shows when a user has existing chat history for a mission,
 * allowing them to resume or start fresh.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, RotateCcw, Play } from "lucide-react";

interface MissionResumeDialogProps {
  isOpen: boolean;
  onResume: () => void;
  onStartFresh: () => void;
  onClose: () => void;
  missionTitle: string;
  totalMessages: number;
  lastAiMessage: string;
  completionPercentage: number;
}

export function MissionResumeDialog({
  isOpen,
  onResume,
  onStartFresh,
  onClose,
  missionTitle,
  totalMessages,
  lastAiMessage,
  completionPercentage,
}: MissionResumeDialogProps) {
  // Parse and clean the last AI message
  const getReadableMessage = (message: string): string => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(message);

      // Extract readable text from common JSON structures
      if (parsed.userResponse) {
        return parsed.userResponse;
      }
      if (parsed.content) {
        return parsed.content;
      }
      if (parsed.text) {
        return parsed.text;
      }
      if (parsed.message) {
        return parsed.message;
      }

      // If it's a JSON object but no recognizable text field, stringify it cleanly
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If not JSON, return as is
      return message;
    }
  };

  const readableMessage = getReadableMessage(lastAiMessage);
  const truncatedMessage =
    readableMessage.length > 150
      ? readableMessage.substring(0, 150) + "..."
      : readableMessage;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal>
      <DialogContent
        className="sm:max-w-[500px] w-[95vw]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-start gap-2 text-lg leading-tight">
            <MessageSquare className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="break-words">Resume Mission Progress?</span>
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed break-words">
            You have a previous session for{" "}
            <strong className="font-semibold break-words">
              {missionTitle}
            </strong>
            .
            <br />
            Would you like to continue where you left off or start fresh?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Progress Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium break-words flex-1">
                Mission Progress
              </span>
              <Badge
                variant="secondary"
                className="flex-shrink-0 whitespace-nowrap"
              >
                {completionPercentage}% Complete
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                <MessageSquare className="h-4 w-4" />
                <span>{totalMessages} messages</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                <Clock className="h-4 w-4" />
                <span>Previous session</span>
              </div>
            </div>

            {/* Last AI Message Preview */}
            {truncatedMessage && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Last AI message:
                </span>
                <div className="bg-background/60 rounded-md p-3 border">
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    &ldquo;{truncatedMessage}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Clickable Options */}
          <div className="space-y-3">
            <Button
              variant="outline"
              size="lg"
              onClick={onResume}
              className="w-full h-auto p-4 justify-start hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950/20 dark:hover:border-green-700 transition-colors"
            >
              <div className="flex items-start gap-3 text-left w-full min-w-0">
                <Play className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="font-medium text-sm break-words">
                    Resume Progress
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                    {completionPercentage >= 100
                      ? "Continue exploring - your progress won't increase, but you can enjoy a longer storyline"
                      : "Continue your story from where you left off with full chat history"}
                  </p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onStartFresh}
              className="w-full h-auto p-4 justify-start hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-950/20 dark:hover:border-orange-700 transition-colors"
            >
              <div className="flex items-start gap-3 text-left w-full min-w-0">
                <RotateCcw className="h-5 w-5 text-orange-600 mt-1 flex-shrink-0" />
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="font-medium text-sm break-words">
                    Start Fresh
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                    Begin the mission from the beginning (chat history will be
                    cleared, but achievements will be saved)
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
