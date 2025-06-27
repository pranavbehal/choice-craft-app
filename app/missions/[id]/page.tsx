/**
 * Mission Page Component
 *
 * Dynamic interactive story interface for individual missions.
 * Features real-time AI dialogue, voice synthesis, and progress tracking.
 *
 * @component
 * @requires Authentication
 * @requires OpenAI API
 * @requires ElevenLabs API
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Send } from "lucide-react";
import Image from "next/image";
import { missions } from "@/data/missions";
import { useParams, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useChat } from "ai/react";
import { type MissionProgress } from "@/types";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { QuestionButton } from "@/components/help/question-button";
import {
  checkAndAwardAchievements,
  addUserXP,
  calculateMissionXP,
  trackStopCommand,
  type DecisionAnalysis,
} from "@/lib/achievementEngine";
import { useAuth } from "@/contexts/AuthContext";
import DecisionFeedback from "@/components/ui/decision-feedback";
import { useChatPersistence } from "@/hooks/useChatPersistence";
import { MissionResumeDialog } from "@/components/ui/mission-resume-dialog";
import { supabase } from "@/lib/supabase";

/**
 * Maps companion names to their avatar images
 * @param {string} companionName - Name of the companion character
 * @returns {string} Path to companion's avatar image
 */
const getCompanionAvatar = (companionName: string) => {
  const nameToFile: { [key: string]: string } = {
    "Professor Blue": "/companions/professor-blue.png",
    "Captain Nova": "/companions/captain-nova.png",
    "Fairy Lumi": "/companions/fairy-lumi.png",
    "Sergeant Nexus": "/companions/sergeant-nexus.png",
  };
  return nameToFile[companionName] || "/companions/professor-blue.png";
};

export default function MissionPage() {
  // State Management Section
  /** Navigation and routing parameters */
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  /** Character and mission state */
  const [userAvatar, setUserAvatar] = useState("/avatars/avatar-1.png");
  const [currentMission, setCurrentMission] = useState(() => {
    // Initialize with the correct mission from URL instead of default missions[0]
    const missionId = params.id?.toString() || "1";
    return missions.find((m) => m.id === missionId) || missions[0];
  });
  const [aiAvatar, setAiAvatar] = useState(() => {
    const missionId = params.id?.toString() || "1";
    const foundMission =
      missions.find((m) => m.id === missionId) || missions[0];
    return getCompanionAvatar(foundMission.companion);
  });

  /** Progress tracking state */
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<
    "same" | "increase" | "decrease"
  >("same");

  /** Dialogue and interaction state */
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [systemMessage, setSystemMessage] = useState("");
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [isStopping, setIsStopping] = useState(false);

  /** Audio and visual state */
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  /** Database integration */
  const {
    settings,
    updateMissionProgress,
    missionProgress,
    fetchMissionProgress,
  } = useDatabase(`mission-${params.id}`);

  /** Chat persistence integration */
  const {
    saveChatMessage,
    loadChatHistory,
    loadChatHistoryWithMetadata,
    getChatState,
    clearChatHistory,
    chatState: persistenceChatState,
    isLoading: chatLoading,
  } = useChatPersistence({ missionId: currentMission.id });

  /** Resume dialog state */
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const resumeDialogShown = useRef(false);
  const [isRestoringMessages, setIsRestoringMessages] = useState(false);
  const restoredMessageIds = useRef<Set<string>>(new Set());
  const missionProgressInitialized = useRef<Set<string>>(new Set());

  /** Early restoration detection */
  const shouldResumeImmediately = searchParams?.get("resume") === "true";
  const earlyRestorationDone = useRef(false);

  // Direct chat restoration function
  const directRestoreChat = async (
    history: Array<{
      id: string;
      role: string;
      content: string;
      created_at: string;
      metadata?: { backgroundImage?: string };
    }>
  ) => {
    setIsRestoringMessages(true);

    // Convert database messages to useChat format and track their IDs
    const formattedMessages = history.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      createdAt: new Date(msg.created_at),
    }));

    // Track all restored message IDs to prevent them from being processed as new
    formattedMessages.forEach((msg) => {
      restoredMessageIds.current.add(msg.id);
    });

    // Restore the last background image if available
    const lastAIMessage = history
      .filter((msg) => msg.role === "assistant")
      .pop();

    if (lastAIMessage?.metadata?.backgroundImage) {
      console.log(
        "🎨 Direct restore - restoring background image:",
        lastAIMessage.metadata.backgroundImage
      );
      setBackgroundImage(lastAIMessage.metadata.backgroundImage);
    }

    // Restore the last AI message content for display
    if (lastAIMessage) {
      try {
        const responseData = JSON.parse(lastAIMessage.content);
        const textContent = responseData.userResponse || lastAIMessage.content;
        console.log("Restoring AI message text:", textContent);
        setCurrentText(textContent);
        setIsTyping(false);
      } catch {
        console.log("Restoring plain text message:", lastAIMessage.content);
        setCurrentText(lastAIMessage.content);
        setIsTyping(false);
      }
    }

    // Show the current mission state without title overlay
    setShowTitle(false);

    // Restore messages to the chat UI
    console.log("Restoring messages to chat UI");
    setMessages(formattedMessages);

    // Clear the restoring flag after a brief delay
    setTimeout(() => {
      setIsRestoringMessages(false);
    }, 1000);

    toast.success("Chat history restored!", {
      duration: 3000,
    });
  };

  /** Time tracking state */
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);
  const [previousTimeSpent, setPreviousTimeSpent] = useState<number>(0); // Time from previous sessions

  /** Decision tracking state with detailed type tracking */
  const [currentMissionStats, setCurrentMissionStats] = useState({
    decisions_made: 0,
    good_decisions: 0,
    bad_decisions: 0,
    diplomatic_decisions: 0,
    strategic_decisions: 0,
    action_decisions: 0,
    investigation_decisions: 0,
    // New detailed tracking for each type
    diplomatic_good_decisions: 0,
    diplomatic_bad_decisions: 0,
    strategic_good_decisions: 0,
    strategic_bad_decisions: 0,
    action_good_decisions: 0,
    action_bad_decisions: 0,
    investigation_good_decisions: 0,
    investigation_bad_decisions: 0,
  });

  /** Decision feedback state */
  const [decisionFeedback, setDecisionFeedback] = useState<{
    analysis: DecisionAnalysis | null;
    xpGained: number;
    isVisible: boolean;
    oldProgress: number;
    newProgress: number;
  }>({
    analysis: null,
    xpGained: 0,
    isVisible: false,
    oldProgress: 0,
    newProgress: 0,
  });

  /**
   * Helper function to parse time_spent from database format (HH:MM:SS) to seconds
   */
  const parseTimeToSeconds = (timeString: string): number => {
    if (!timeString || timeString === "00:00:00") return 0;

    const parts = timeString.split(":");
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  };

  /**
   * Initialize session timing when mission starts
   */
  useEffect(() => {
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
    }
  }, [sessionStartTime]);

  /**
   * Update time tracking every second
   * Total time = previous sessions time + current session time
   */
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentSessionSeconds = Math.floor(
        (now.getTime() - sessionStartTime.getTime()) / 1000
      );
      setTotalTimeSpent(previousTimeSpent + currentSessionSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime, previousTimeSpent]);

  /**
   * Save time when user leaves the page or tab becomes hidden
   */
  useEffect(() => {
    const saveTimeOnExit = async () => {
      if (!user || totalTimeSpent === 0) return;

      try {
        // Format time as interval string
        const hours = Math.floor(totalTimeSpent / 3600);
        const minutes = Math.floor((totalTimeSpent % 3600) / 60);
        const seconds = totalTimeSpent % 60;
        const timeInterval = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        // Save time to database
        await updateMissionProgress({
          mission_id: currentMission.id,
          time_spent: timeInterval,
        });
      } catch (error) {
        console.error("Error saving time on page exit:", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveTimeOnExit();
      }
    };

    const handleBeforeUnload = () => {
      saveTimeOnExit();
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Save time when component unmounts
      saveTimeOnExit();

      // Remove event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user, totalTimeSpent, currentMission.id, updateMissionProgress]);

  /**
   * Load existing mission progress and stats
   */
  // Mission progress loading is now handled directly in ensureMissionProgressExists effect
  // This prevents race conditions and ensures we always use the most current database data

  /**
   * Initialize system message for AI character interaction
   * Updates when mission changes to maintain character consistency
   */
  useEffect(() => {
    // Get character personality traits based on companion
    const getCharacterDetails = (companion: string) => {
      switch (companion) {
        case "Professor Blue":
          return {
            tone: "Scholarly and thoughtful, with gentle guidance",
            mannerisms:
              "Often references historical examples or archaeological best practices",
            role: "Provides educational insights while helping make informed decisions",
            hintStyle:
              "Poses questions to help think through options rather than giving direct commands",
          };
        case "Captain Nova":
          return {
            tone: "Confident and adventurous, with a hint of mischief",
            mannerisms:
              "Uses space terminology and tactical language like 'roger that' or 'incoming hostiles'",
            role: "Provides strategic advice while maintaining team morale",
            hintStyle:
              "Gives direct, action-oriented suggestions with enthusiasm",
          };
        case "Fairy Lumi":
          return {
            tone: "Whimsical and caring, with a deep connection to nature",
            mannerisms:
              "Often speaks in metaphors related to nature and magic, like 'the forest whispers' or 'nature's balance'",
            role: "Guides through magical challenges while teaching respect for the natural world",
            hintStyle:
              "Offers gentle suggestions that emphasize harmony and understanding",
          };
        case "Sergeant Nexus":
          return {
            tone: "Direct and professional, with a touch of dry humor",
            mannerisms:
              "Uses cybersecurity terms like 'firewall breach' or 'protocol override'",
            role: "Provides tactical guidance in digital operations, prioritizing stealth and precision",
            hintStyle:
              "Gives clear, actionable advice, minimizing unnecessary chatter",
          };
        default:
          return {
            tone: "Helpful and engaging",
            mannerisms: "Speaks naturally and conversationally",
            role: "Provides guidance and support",
            hintStyle: "Offers helpful suggestions",
          };
      }
    };

    const characterDetails = getCharacterDetails(currentMission.companion);

    setSystemMessage(`You are ${currentMission.companion}, a character in an interactive story.
      Current mission: ${currentMission.title} - ${currentMission.description}
      
      Character Details:
      - Tone: ${characterDetails.tone}
      - Mannerisms: ${characterDetails.mannerisms}
      - Role: ${characterDetails.role}
      - Hint Style: ${characterDetails.hintStyle}

      IMPORTANT: This mission follows a structured storyline with specific milestones.
      The storyline and progress tracking will be handled by the chat API system.
      
      Keep responses concise (1-3 sentences) and stay in character.
      Guide the user through the mission while maintaining the story's atmosphere.
      Always present meaningful choices that advance the narrative toward the next story milestone.`);
  }, [
    currentMission.id,
    currentMission.companion,
    currentMission.title,
    currentMission.description,
  ]); // Only depend on specific values, not the full object

  /** Chat integration setup with OpenAI */
  const { messages, input, handleInputChange, append, setMessages } = useChat({
    api: "/api/chat",
    initialMessages: [],
    body: {
      systemMessage,
      currentProgress: progress,
      missionDifficulty: currentMission.difficulty,
      missionStoryline: currentMission.storyline,
    },
    onFinish: () => {
      setIsTyping(false);
      // console.log(messages);
    },
  });

  // Early restoration effect - runs immediately when resume=true is detected
  useEffect(() => {
    if (!shouldResumeImmediately || earlyRestorationDone.current || !user)
      return;

    const performEarlyRestore = async () => {
      console.log("🚀 Early restoration triggered for immediate resume");
      earlyRestorationDone.current = true;

      try {
        // Load chat history immediately
        const history = await loadChatHistoryWithMetadata();

        if (history && history.length > 0) {
          console.log("📦 Early restore: Found", history.length, "messages");

          // Immediately set the restored state BEFORE any UI renders
          const lastAIMessage = history
            .filter((msg) => msg.role === "assistant")
            .pop();

          if (lastAIMessage?.metadata?.backgroundImage) {
            console.log(
              "🎨 Restoring background image:",
              lastAIMessage.metadata.backgroundImage
            );
            setBackgroundImage(lastAIMessage.metadata.backgroundImage);
          }

          if (lastAIMessage) {
            try {
              const responseData = JSON.parse(lastAIMessage.content);
              const textContent =
                responseData.userResponse || lastAIMessage.content;
              setCurrentText(textContent);
              setIsTyping(false);
            } catch {
              setCurrentText(lastAIMessage.content);
              setIsTyping(false);
            }
          }

          // Hide title immediately to prevent flash
          setShowTitle(false);

          // Convert and set messages
          const formattedMessages = history.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            createdAt: new Date(msg.created_at),
          }));

          // Track restored message IDs
          formattedMessages.forEach((msg) => {
            restoredMessageIds.current.add(msg.id);
          });

          setMessages(formattedMessages);

          console.log("✅ Early restoration completed successfully");

          // Clear the resume parameter from URL to prevent issues on refresh
          const url = new URL(window.location.href);
          url.searchParams.delete("resume");
          window.history.replaceState({}, "", url.toString());
        } else {
          console.log("📦 Early restore: No messages found");
        }
      } catch (error) {
        console.error("❌ Early restoration failed:", error);
      }
    };

    // Run immediately, no timeout needed
    performEarlyRestore();
  }, [shouldResumeImmediately, user, loadChatHistoryWithMetadata, setMessages]);

  /**
   * Processes user input and handles commands
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Syntactic validation - checks for empty/whitespace, if the AI is typing, or if the user has triggered the stop command
    if (!input.trim() || isTyping || isStopping) return;

    const userInput = input.trim().toLowerCase();

    // Semantic validation - checks message length
    if (userInput.length > 500) {
      toast.error("Your message is too long (maximum 500 characters)");
      return;
    }

    // Check for stop command
    if (userInput === "stop") {
      setIsStopping(true);

      if (user) {
        try {
          // Save current progress
          const hours = Math.floor(totalTimeSpent / 3600);
          const minutes = Math.floor((totalTimeSpent % 3600) / 60);
          const seconds = totalTimeSpent % 60;
          const timeInterval = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

          await updateMissionProgress({
            mission_id: currentMission.id,
            completion_percentage: Math.max(progress, 5), // Minimum progress for stopping
            time_spent: timeInterval,
            decisions_made: currentMissionStats.decisions_made,
            good_decisions: currentMissionStats.good_decisions,
            bad_decisions: currentMissionStats.bad_decisions,
            diplomatic_decisions: currentMissionStats.diplomatic_decisions,
            strategic_decisions: currentMissionStats.strategic_decisions,
            action_decisions: currentMissionStats.action_decisions,
            investigation_decisions:
              currentMissionStats.investigation_decisions,
            // Include detailed decision tracking
            diplomatic_good_decisions:
              currentMissionStats.diplomatic_good_decisions,
            diplomatic_bad_decisions:
              currentMissionStats.diplomatic_bad_decisions,
            strategic_good_decisions:
              currentMissionStats.strategic_good_decisions,
            strategic_bad_decisions:
              currentMissionStats.strategic_bad_decisions,
            action_good_decisions: currentMissionStats.action_good_decisions,
            action_bad_decisions: currentMissionStats.action_bad_decisions,
            investigation_good_decisions:
              currentMissionStats.investigation_good_decisions,
            investigation_bad_decisions:
              currentMissionStats.investigation_bad_decisions,
          });

          // Track stop command for achievements
          await trackStopCommand(user.id, currentMission.id);

          toast.success(
            "Progress saved! You will be redirected to the home page in 3 seconds."
          );
        } catch (error) {
          console.error("Error saving progress on stop:", error);
          toast.error("Error saving progress, but redirecting anyway.");
        }
      }

      // Disable further interactions
      handleInputChange({
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);

      return;
    }

    // Regular message handling
    if (messages.length === 0) {
      setShowTitle(false);
    }

    const userMessage = `Me: ${userInput}`;
    setShowUserMessage(true);
    setCurrentText(userMessage);

    handleInputChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);

    setTimeout(async () => {
      setIsTyping(true);
      const userMessageObj = {
        content: userMessage,
        role: "user" as const,
        id: `user-${Date.now()}`,
        createdAt: new Date(),
      };

      // Save user message to database
      try {
        const saveResult = await saveChatMessage(userMessageObj);
        console.log("User message saved:", saveResult);
      } catch (error) {
        console.error("Failed to save user message:", error);
        // Continue anyway - don't block the chat flow
      }

      await append({
        content: userMessage,
        role: "user",
      });
      setShowUserMessage(false);
    }, 500);
  };

  /**
   * Processes and displays AI responses with typewriter effect
   * Handles background image generation and audio synthesis
   */
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    // Skip processing entirely if we're restoring messages
    if (isRestoringMessages) {
      console.log("Skipping message processing - currently restoring messages");
      return;
    }

    // Skip processing if this message was restored from database
    if (lastMessage && restoredMessageIds.current.has(lastMessage.id)) {
      console.log(
        "Skipping message processing - this message was restored from database:",
        lastMessage.id
      );
      return;
    }

    if (lastMessage?.role === "assistant" && !showUserMessage) {
      setIsTyping(true);
      setCurrentText(""); // Clear text immediately

      const processMessage = async () => {
        try {
          console.log(
            "Processing NEW AI message - saving to DB and handling decisions"
          );

          // Add better JSON validation and fallback handling
          let responseData;
          let text;

          try {
            responseData = JSON.parse(lastMessage.content);
            text = responseData.userResponse;
          } catch (jsonError) {
            console.warn(
              "Failed to parse JSON, treating as plain text:",
              lastMessage.content
            );
            // Fallback: treat the content as plain text dialogue
            text = lastMessage.content;
            responseData = {
              userResponse: text,
              imagePrompt: null,
              progress: progress, // Keep current progress
              decisionAnalysis: null,
            };
          }

          // Validate that we have the expected response format
          if (!text) {
            console.error("No text content found in response");
            setCurrentText(
              "Sorry, there was an error processing the response."
            );
            setIsTyping(false);
            return;
          }

          // Handle image generation first (before saving message)
          let generatedImageUrl = null;
          if (responseData.imagePrompt) {
            try {
              console.log(
                "Generating image for prompt:",
                responseData.imagePrompt
              );
              const imageResponse = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: responseData.imagePrompt }),
              });

              const imageData = await imageResponse.json();
              if (imageData.imageUrl) {
                generatedImageUrl = imageData.imageUrl;
                setBackgroundImage(imageData.imageUrl);
                console.log(
                  "Image generated and background updated:",
                  imageData.imageUrl
                );
              }
            } catch (error) {
              console.error("Error generating image:", error);
            }
          }

          // Save the AI message to database (after image generation)
          try {
            const metadataToSave = {
              imagePrompt: responseData.imagePrompt,
              decisionAnalysis: responseData.decisionAnalysis,
              backgroundImage:
                generatedImageUrl || backgroundImage || undefined,
            };

            const saveResult = await saveChatMessage(
              lastMessage,
              metadataToSave
            );
            console.log("AI message saved with background image:", saveResult);
          } catch (error) {
            console.error("Failed to save AI message:", error);
            // Continue anyway - don't block the chat flow
          }

          // Handle decision analysis and progress updates
          if (
            responseData.decisionAnalysis &&
            responseData.progress !== undefined
          ) {
            console.log(
              `AI provided progress update: ${progress}% → ${responseData.progress}%`
            );

            // Automatically set quality to "good" for decisions with type "none"
            let processedDecisionAnalysis = responseData.decisionAnalysis;
            if (responseData.decisionAnalysis.type === "none") {
              processedDecisionAnalysis = {
                ...responseData.decisionAnalysis,
                quality: "good",
              };
            }

            await handleDecisionAnalysis(
              processedDecisionAnalysis,
              responseData.progress
            );
          } else if (
            responseData.progress !== undefined &&
            responseData.progress !== progress
          ) {
            // Update progress even without decision analysis
            console.log(
              `AI provided progress update (no decision): ${progress}% → ${responseData.progress}%`
            );
            setProgress(responseData.progress);
          } else if (responseData.progress === undefined) {
            console.log("AI response did not include progress update");
          } else {
            console.log(`AI provided same progress: ${progress}% (no change)`);
          }

          // Extract character name and speech text
          const [characterName, speechText] = text.split(": ");

          // Wait for audio to start playing before starting text animation
          try {
            await playTextToSpeech(speechText, characterName);

            // Start typewriter effect
            let index = 0;
            const typewriterInterval = setInterval(() => {
              if (index <= text.length) {
                setCurrentText(text.slice(0, index));
                index++;
              } else {
                clearInterval(typewriterInterval);
                setIsTyping(false);
              }
            }, 30); // Adjust timing to match speech rate

            // Cleanup interval on unmount
            return () => {
              clearInterval(typewriterInterval);
            };
          } catch (error) {
            console.error("Error with audio playback:", error);
            // Fallback to instant text display if audio fails
            setCurrentText(text);
            setIsTyping(false);
          }
        } catch (error) {
          console.error("Error processing message:", error);
          setIsTyping(false);
        }
      };

      processMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    messages,
    currentMission.companion,
    showUserMessage,
    isRestoringMessages,
  ]);

  /**
   * Handles decision analysis and updates mission progress with detailed tracking
   * @param {DecisionAnalysis} decisionAnalysis - Analysis from AI
   * @param {number} newProgress - New progress percentage
   */
  const handleDecisionAnalysis = async (
    decisionAnalysis: DecisionAnalysis,
    newProgress: number
  ) => {
    if (!user) return;

    try {
      // Update local stats
      const updatedStats = { ...currentMissionStats };

      // Only count decisions that have a type AND are story decisions AND are not "none"
      const isValidDecision =
        decisionAnalysis.isStoryDecision &&
        decisionAnalysis.type !== "none" &&
        (decisionAnalysis.type === "diplomatic" ||
          decisionAnalysis.type === "strategic" ||
          decisionAnalysis.type === "action" ||
          decisionAnalysis.type === "investigation");

      if (isValidDecision) {
        updatedStats.decisions_made += 1;

        // Update decision type counts
        const typeKey =
          `${decisionAnalysis.type}_decisions` as keyof typeof updatedStats;
        updatedStats[typeKey] += 1;

        // Track good/bad for overall totals AND specific types
        const isGoodDecision = decisionAnalysis.quality === "good";
        const isBadDecision = decisionAnalysis.quality === "bad";

        if (isGoodDecision) {
          updatedStats.good_decisions += 1;
          // Update specific type good decisions
          const goodTypeKey =
            `${decisionAnalysis.type}_good_decisions` as keyof typeof updatedStats;
          updatedStats[goodTypeKey] += 1;
        } else if (isBadDecision) {
          updatedStats.bad_decisions += 1;
          // Update specific type bad decisions
          const badTypeKey =
            `${decisionAnalysis.type}_bad_decisions` as keyof typeof updatedStats;
          updatedStats[badTypeKey] += 1;
        } else {
          // Fallback: if somehow neutral slips through, count as bad to maintain data integrity
          console.warn(
            "Decision was not classified as good or bad, defaulting to bad"
          );
          updatedStats.bad_decisions += 1;
          const badTypeKey =
            `${decisionAnalysis.type}_bad_decisions` as keyof typeof updatedStats;
          updatedStats[badTypeKey] += 1;
        }
      }

      setCurrentMissionStats(updatedStats);
      setProgress(newProgress);

      // Format time as interval string
      const hours = Math.floor(totalTimeSpent / 3600);
      const minutes = Math.floor((totalTimeSpent % 3600) / 60);
      const seconds = totalTimeSpent % 60;
      const timeInterval = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      // Update database with real progress INCLUDING detailed decision tracking
      const progressUpdate = {
        mission_id: currentMission.id,
        completion_percentage: newProgress,
        time_spent: timeInterval,
        decisions_made: updatedStats.decisions_made,
        good_decisions: updatedStats.good_decisions,
        bad_decisions: updatedStats.bad_decisions,
        diplomatic_decisions: updatedStats.diplomatic_decisions,
        strategic_decisions: updatedStats.strategic_decisions,
        action_decisions: updatedStats.action_decisions,
        investigation_decisions: updatedStats.investigation_decisions,
        // Include detailed decision tracking in database update
        diplomatic_good_decisions: updatedStats.diplomatic_good_decisions,
        diplomatic_bad_decisions: updatedStats.diplomatic_bad_decisions,
        strategic_good_decisions: updatedStats.strategic_good_decisions,
        strategic_bad_decisions: updatedStats.strategic_bad_decisions,
        action_good_decisions: updatedStats.action_good_decisions,
        action_bad_decisions: updatedStats.action_bad_decisions,
        investigation_good_decisions: updatedStats.investigation_good_decisions,
        investigation_bad_decisions: updatedStats.investigation_bad_decisions,
      };

      await updateMissionProgress(progressUpdate);

      // Calculate XP gained with difficulty multiplier
      let xpGained = 0;
      const difficultyMultiplier = decisionAnalysis.difficultyBonus || 1.0;

      if (decisionAnalysis.quality === "good") {
        const baseXP = 5;
        const adjustedXP = Math.round(baseXP * difficultyMultiplier);
        xpGained += adjustedXP;
        await addUserXP(user.id, adjustedXP);
      }

      // Award XP for progress advancement with difficulty bonus
      if (decisionAnalysis.progressAdvancement > 0) {
        const progressXP = Math.round(
          decisionAnalysis.progressAdvancement * difficultyMultiplier
        );
        xpGained += progressXP;
        await addUserXP(user.id, progressXP);
      }

      // Show decision feedback for ALL AI responses that include analysis
      // This ensures feedback shows consistently after every decision
      const shouldShowFeedback =
        decisionAnalysis.type !== "none" ||
        decisionAnalysis.isStoryDecision ||
        newProgress !== progress ||
        xpGained > 0 ||
        decisionAnalysis.reasoning; // Show if there's any reasoning provided

      if (shouldShowFeedback) {
        setDecisionFeedback({
          analysis: decisionAnalysis,
          xpGained: xpGained,
          isVisible: true,
          oldProgress: progress,
          newProgress: newProgress,
        });
      }

      // Check for achievements - get fresh data directly from database
      const { data: freshProgress, error: progressError } = await supabase
        .from("user_mission_progress")
        .select("*")
        .eq("user_id", user.id);

      if (progressError) {
        console.error("Error fetching fresh progress data:", progressError);
      }

      const allProgress = freshProgress || [];
      const currentProgress = {
        ...progressUpdate,
        user_id: user.id,
        id: `temp-${Date.now()}`,
        last_updated: new Date().toISOString(),
        achievements: null,
      };

      console.log("🎯 Achievement check - Current progress:", currentProgress);
      console.log("🎯 Achievement check - All progress:", allProgress);

      const newAchievements = await checkAndAwardAchievements(
        user.id,
        currentProgress,
        allProgress
      );

      // Show achievement notifications
      newAchievements.forEach((achievement) => {
        toast.success(`🏆 Achievement Unlocked: ${achievement.name}!`, {
          description: achievement.description,
          duration: 5000,
        });
      });

      // Check for mission completion
      if (newProgress >= 100) {
        await handleMissionCompletion(currentProgress);
      }
    } catch (error) {
      console.error("Error handling decision analysis:", error);
    }
  };

  /**
   * Handles mission completion
   */
  const handleMissionCompletion = async (finalProgress: MissionProgress) => {
    if (!user) return;

    try {
      // Award completion XP
      const completionXP = calculateMissionXP(finalProgress);
      await addUserXP(user.id, completionXP);

      toast.success(`🎉 Mission Complete! You earned ${completionXP} XP!`, {
        duration: 5000,
      });

      // Get fresh progress data for achievement checking
      const { data: freshProgress } = await supabase
        .from("user_mission_progress")
        .select("*")
        .eq("user_id", user.id);

      const allProgress = freshProgress || [];

      // Run comprehensive achievement check on completion
      const newAchievements = await checkAndAwardAchievements(
        user.id,
        finalProgress,
        allProgress
      );

      // Show achievement notifications
      newAchievements.forEach((achievement) => {
        toast.success(`🏆 Achievement Unlocked: ${achievement.name}!`, {
          description: achievement.description,
          duration: 5000,
        });
      });
    } catch (error) {
      console.error("Error handling mission completion:", error);
    }
  };

  /**
   * Handles text-to-speech conversion and playback
   * @param {string} text - Text to convert to speech
   * @param {string} character - Character voice to use
   */
  const playTextToSpeech = async (text: string, character: string) => {
    // Skip if voice is disabled
    if (!settings?.voice_on) return;

    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, character }),
      });

      if (!response.ok) throw new Error("Failed to generate speech");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;

        return new Promise<void>((resolve, reject) => {
          if (audioRef.current) {
            audioRef.current.onerror = reject;
            audioRef.current.onplay = () => {
              setIsPlaying(true);
              resolve();
            };
            audioRef.current.onended = () => {
              URL.revokeObjectURL(audioUrl);
              setIsPlaying(false);
            };
            audioRef.current.play().catch(reject);
          }
        });
      }
    } catch (error) {
      console.error("Error playing text to speech:", error);
      throw error;
    }
  };

  // Add this to see all messages
  useEffect(() => {
    // console.log("Current messages:", messages);
  }, [messages]);

  // Handle mission finding
  useEffect(() => {
    const missionId = params.id?.toString() || "1";
    const foundMission =
      missions.find((m) => m.id === missionId) || missions[0];

    // Only update if the mission actually changed
    if (foundMission.id !== currentMission.id) {
      console.log(
        "Mission changing from",
        currentMission.id,
        "to",
        foundMission.id
      );
      setCurrentMission(foundMission);
      setAiAvatar(getCompanionAvatar(foundMission.companion));

      // Reset all mission-specific state when switching missions
      resumeDialogShown.current = false;
      setShowResumeDialog(false);
      setIsRestoringMessages(false);
      restoredMessageIds.current.clear();
      setMessages([]); // Clear chat messages for new mission
      setCurrentText("");
      setShowUserMessage(false);
      setBackgroundImage(null);

      console.log("Mission state reset for new mission:", foundMission.title);
    }
  }, [params.id, currentMission.id, setMessages]);

  // Effect to ensure mission progress exists in database (runs once per mission change)
  useEffect(() => {
    if (!user || !currentMission) return;

    const ensureMissionProgressExists = async () => {
      // Prevent duplicate initialization for the same mission
      if (missionProgressInitialized.current.has(currentMission.id)) {
        console.log(
          "Mission progress already initialized for:",
          currentMission.id
        );
        return;
      }

      console.log("🔍 Checking mission progress for:", currentMission.title);

      try {
        // Mark as being initialized to prevent race conditions
        missionProgressInitialized.current.add(currentMission.id);

        // ALWAYS check the database directly first to get the most current data
        const { data: dbProgress, error: dbError } = await supabase
          .from("user_mission_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("mission_id", currentMission.id)
          .maybeSingle();

        if (dbError) {
          console.error(
            "❌ Error checking database for existing progress:",
            dbError
          );
          // Remove from initialized set on error so it can retry
          missionProgressInitialized.current.delete(currentMission.id);
          return;
        }

        if (dbProgress) {
          // Found existing progress - preserve it!
          console.log("✅ Found existing progress in database:", {
            progress: dbProgress.completion_percentage + "%",
            decisions: dbProgress.decisions_made,
            canResume: dbProgress.can_resume,
          });

          // Set the local progress state to match existing database record
          setProgress(dbProgress.completion_percentage);

          // Load existing time spent from previous sessions
          const existingTimeSeconds = parseTimeToSeconds(
            dbProgress.time_spent || "00:00:00"
          );
          setPreviousTimeSpent(existingTimeSeconds);

          // Update local mission stats to match database
          setCurrentMissionStats({
            decisions_made: dbProgress.decisions_made || 0,
            good_decisions: dbProgress.good_decisions || 0,
            bad_decisions: dbProgress.bad_decisions || 0,
            diplomatic_decisions: dbProgress.diplomatic_decisions || 0,
            strategic_decisions: dbProgress.strategic_decisions || 0,
            action_decisions: dbProgress.action_decisions || 0,
            investigation_decisions: dbProgress.investigation_decisions || 0,
            diplomatic_good_decisions:
              dbProgress.diplomatic_good_decisions || 0,
            diplomatic_bad_decisions: dbProgress.diplomatic_bad_decisions || 0,
            strategic_good_decisions: dbProgress.strategic_good_decisions || 0,
            strategic_bad_decisions: dbProgress.strategic_bad_decisions || 0,
            action_good_decisions: dbProgress.action_good_decisions || 0,
            action_bad_decisions: dbProgress.action_bad_decisions || 0,
            investigation_good_decisions:
              dbProgress.investigation_good_decisions || 0,
            investigation_bad_decisions:
              dbProgress.investigation_bad_decisions || 0,
          });

          console.log("✅ Local progress state synchronized with database");

          // Backup: If we have resumable progress, try to load chat history directly
          if (dbProgress.can_resume && dbProgress.completion_percentage > 0) {
            console.log(
              "🔄 Attempting direct chat restoration due to resumable progress"
            );
            setTimeout(async () => {
              try {
                const history = await loadChatHistoryWithMetadata();
                if (history && history.length > 0 && messages.length === 0) {
                  console.log(
                    "🎯 Direct restoration: Found",
                    history.length,
                    "messages to restore"
                  );
                  await directRestoreChat(history);
                } else {
                  console.log(
                    "🎯 Direct restoration: No messages found or already loaded"
                  );
                }
              } catch (error) {
                console.error("❌ Direct chat restoration failed:", error);
              }
            }, 500); // Give chat persistence time to work first
          }
        } else {
          // No existing progress - create initial record
          console.log(
            "🆕 Creating initial mission progress record for:",
            currentMission.title
          );

          try {
            // Create initial progress record with default values
            await updateMissionProgress({
              mission_id: currentMission.id,
              completion_percentage: 0,
              decisions_made: 0,
              good_decisions: 0,
              bad_decisions: 0,
              diplomatic_decisions: 0,
              strategic_decisions: 0,
              action_decisions: 0,
              investigation_decisions: 0,
              diplomatic_good_decisions: 0,
              diplomatic_bad_decisions: 0,
              strategic_good_decisions: 0,
              strategic_bad_decisions: 0,
              action_good_decisions: 0,
              action_bad_decisions: 0,
              investigation_good_decisions: 0,
              investigation_bad_decisions: 0,
              time_spent: "00:00:00",
              can_resume: false,
              last_message_order: 0,
            });

            console.log("✅ Initial mission progress record created");

            // Refresh mission progress to get the updated state
            await fetchMissionProgress();
          } catch (error) {
            // If it's a duplicate key error, that's fine - another process created it
            if (
              error &&
              typeof error === "object" &&
              "code" in error &&
              (error as { code: string }).code === "23505"
            ) {
              console.log(
                "✅ Mission progress record created by another process"
              );
              // Refresh to get the current state
              await fetchMissionProgress();
            } else {
              throw error; // Re-throw other errors
            }
          }
        }
      } catch (error) {
        console.error("❌ Error ensuring mission progress exists:", error);
        // Remove from initialized set on error so it can retry
        missionProgressInitialized.current.delete(currentMission.id);
      }
    };

    // Use a single debounced call instead of multiple timeouts
    let timeoutId: NodeJS.Timeout;

    // Only initialize if not already done for this mission
    if (!missionProgressInitialized.current.has(currentMission.id)) {
      timeoutId = setTimeout(ensureMissionProgressExists, 100);
    }

    // Cleanup function to clear timeout and prevent memory leaks
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    user?.id,
    currentMission?.id,
    updateMissionProgress,
    fetchMissionProgress,
  ]); // Only depend on IDs, not full objects

  // Check for existing chat history when mission loads (only on initial load)
  useEffect(() => {
    if (
      !user ||
      chatLoading ||
      resumeDialogShown.current ||
      !persistenceChatState ||
      earlyRestorationDone.current // Skip if we already did early restoration
    )
      return;

    const checkForExistingChat = () => {
      console.log(
        "Checking for existing chat for mission:",
        currentMission.id,
        {
          hasExistingChat: persistenceChatState?.has_existing_chat,
          canResume: persistenceChatState?.can_resume,
          totalMessages: persistenceChatState?.total_messages,
          currentProgress: progress,
          messagesLength: messages.length,
          chatLoading,
          resumeDialogShown: resumeDialogShown.current,
          persistenceChatState,
        }
      );

      // Show resume dialog if there are existing chat messages (regardless of progress)
      if (
        persistenceChatState?.has_existing_chat &&
        (persistenceChatState?.total_messages || 0) > 0 &&
        messages.length === 0 &&
        !chatLoading // Don't show if still loading to prevent stale state
      ) {
        console.log("Showing resume dialog for mission:", currentMission.id, {
          hasExistingChat: persistenceChatState?.has_existing_chat,
          totalMessages: persistenceChatState?.total_messages,
          messagesLength: messages.length,
          chatLoading,
        });
        setShowResumeDialog(true);
        resumeDialogShown.current = true;
      } else if (
        // Alternative: Auto-restore if we have chat messages but no persistence state yet
        messages.length === 0 &&
        !persistenceChatState?.has_existing_chat &&
        !resumeDialogShown.current &&
        !shouldResumeImmediately // Don't auto-restore if we're already doing immediate restoration
      ) {
        console.log("Checking for existing chat messages to auto-restore");
        autoRestoreChatHistory();
      } else {
        console.log("Not showing resume dialog - conditions not met", {
          hasExistingChat: persistenceChatState?.has_existing_chat,
          totalMessages: persistenceChatState?.total_messages,
          messagesLength: messages.length,
          chatLoading,
          persistenceChatState,
        });
      }
    };

    // Auto-restore function when chat messages exist but chat state is not detected
    const autoRestoreChatHistory = async () => {
      try {
        resumeDialogShown.current = true; // Prevent multiple attempts

        console.log("Attempting to auto-restore chat history...");
        const history = await loadChatHistoryWithMetadata();

        if (history && history.length > 0) {
          console.log(
            "Found chat history to restore:",
            history.length,
            "messages"
          );
          await restoreChatMessages(history);
        } else {
          console.log("No chat history found to restore");
          // Reset flag if no messages found so other logic can proceed
          resumeDialogShown.current = false;
        }
      } catch (error) {
        console.error("Error auto-restoring chat history:", error);
        // Reset flag on error so other logic can proceed
        resumeDialogShown.current = false;
      }
    };

    // Helper function to restore chat messages
    const restoreChatMessages = async (
      history: Array<{
        id: string;
        role: string;
        content: string;
        created_at: string;
        metadata?: { backgroundImage?: string };
      }>
    ) => {
      setIsRestoringMessages(true);

      // Convert database messages to useChat format and track their IDs
      const formattedMessages = history.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: new Date(msg.created_at),
      }));

      // Track all restored message IDs to prevent them from being processed as new
      formattedMessages.forEach((msg) => {
        restoredMessageIds.current.add(msg.id);
      });

      // Restore the last background image if available
      const lastAIMessage = history
        .filter((msg) => msg.role === "assistant")
        .pop();

      console.log("📸 Auto restore - checking background image:", {
        hasMessage: !!lastAIMessage,
        hasMetadata: !!lastAIMessage?.metadata,
        backgroundImage: lastAIMessage?.metadata?.backgroundImage,
      });

      if (lastAIMessage?.metadata?.backgroundImage) {
        console.log(
          "🎨 Auto restore - restoring background image:",
          lastAIMessage.metadata.backgroundImage
        );
        setBackgroundImage(lastAIMessage.metadata.backgroundImage);
      } else {
        console.log("🎨 Auto restore - no background image found");
      }

      // Restore the last AI message content for display
      if (lastAIMessage) {
        try {
          const responseData = JSON.parse(lastAIMessage.content);
          const textContent =
            responseData.userResponse || lastAIMessage.content;
          console.log("Restoring AI message text:", textContent);
          setCurrentText(textContent);
          setIsTyping(false);
        } catch {
          console.log("Restoring plain text message:", lastAIMessage.content);
          setCurrentText(lastAIMessage.content);
          setIsTyping(false);
        }
      }

      // Show the current mission state without title overlay
      setShowTitle(false);

      // Restore messages to the chat UI
      console.log("Restoring messages to chat UI");
      setMessages(formattedMessages);

      // Clear the restoring flag after a brief delay
      setTimeout(() => {
        setIsRestoringMessages(false);
      }, 1000);

      toast.success("Progress restored! Continue your mission.", {
        duration: 3000,
      });
    };

    // Use a single timeout with proper debouncing
    const timeoutId = setTimeout(checkForExistingChat, 500); // Increased delay to allow persistence state to load
    return () => clearTimeout(timeoutId);
  }, [
    user?.id,
    persistenceChatState?.has_existing_chat,
    persistenceChatState?.can_resume,
    persistenceChatState?.total_messages,
    chatLoading,
    messages.length,
    progress,
    currentMission?.id,
    loadChatHistoryWithMetadata,
  ]); // Depend on specific values, not objects

  // Update useEffect for avatar
  useEffect(() => {
    if (settings?.profile_picture) {
      const avatarIndex = settings.profile_picture - 1;
      const avatarPath = `/avatars/avatar-${avatarIndex + 1}.png`;
      setUserAvatar(avatarPath);
    }
  }, [settings]);

  // Debug messages
  useEffect(() => {
    if (messages.length > 0) {
      // console.log("Messages updated:", messages);
      // console.log("Last message:", messages[messages.length - 1]);
    }
  }, [messages]);

  /**
   * Updates mission progress and handles completion
   * @param {number} newProgress - Updated progress value
   */
  const updateProgress = (newProgress: number) => {
    if (newProgress > progress) {
      setProgressStatus("increase");
    } else if (newProgress < progress) {
      setProgressStatus("decrease");
    } else {
      setProgressStatus("same");
    }
    setProgress(newProgress);
    setTimeout(() => setProgressStatus("same"), 1000);
  };

  const lastMessage = messages[messages.length - 1];

  // Update the character image opacity based on message role
  const getCharacterOpacity = (role: string) => {
    if (!lastMessage) return "opacity-40 scale-75";
    if (role === "assistant" && lastMessage.role === "assistant")
      return "opacity-100 scale-100";
    if (role === "user" && lastMessage.role === "user")
      return "opacity-100 scale-100";
    return "opacity-40 scale-75";
  };

  // Update getDisplayMessage to handle the typewriter effect
  const getDisplayMessage = () => {
    if (showUserMessage) return currentText;
    if (isTyping && !currentText) return "Loading...";
    if (!lastMessage) return "Begin your adventure by saying hello...";

    try {
      if (lastMessage.role === "user") {
        return lastMessage.content;
      } else {
        return currentText || "Loading...";
      }
    } catch (error) {
      console.error("Error parsing message:", error);
      return lastMessage.content;
    }
  };

  // Background image effect
  useEffect(() => {
    if (backgroundImage) {
      const bgDiv = document.querySelector(
        ".absolute.inset-0.-z-10"
      ) as HTMLElement;
      if (bgDiv) {
        const img = new window.Image();
        img.onload = () => {
          bgDiv.style.backgroundImage = `url(${backgroundImage})`;
          bgDiv.style.backgroundSize = "cover";
          bgDiv.style.backgroundPosition = "center";
          bgDiv.style.backgroundAttachment = "fixed";
          bgDiv.style.opacity = "0";
          bgDiv.style.transition = "opacity 0.3s ease-in-out";

          // Trigger the fade in
          requestAnimationFrame(() => {
            bgDiv.style.opacity = "1";
          });
        };
        img.src = backgroundImage;
      }
    }
  }, [backgroundImage]);

  // Clean up mission progress initialization tracking when user changes
  useEffect(() => {
    // Reset initialization tracking when user changes to prevent stale state
    return () => {
      if (!user) {
        missionProgressInitialized.current.clear();
      }
    };
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <audio
        ref={audioRef}
        className="hidden"
        // Uncomment for debugging
        // controls
      />

      {/* Background div with improved transitions */}
      <div
        className="absolute inset-0 -z-10 transition-all duration-1000"
        style={{
          backgroundImage: `url(${currentMission?.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          opacity: backgroundImage ? 0 : 1,
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="relative">
          <Navigation />
          <div className="w-full py-2">
            {/* <div className="max-w-md mx-auto px-4">
              <Progress
                value={progress}
                className="h-2"
                indicatorClassName={cn(
                  "transition-all duration-1000",
                  progressStatus === "increase" && "bg-green-500",
                  progressStatus === "decrease" && "bg-red-500",
                  progressStatus === "same" && "animate-shake"
                )}
              />
              <p className="text-center text-sm mt-1 text-muted-foreground">
                Mission Progress: {progress}%
              </p>
            </div> */}
          </div>
        </div>

        {/* Mission Title with fade out animation - Properly centered */}
        <div
          className="absolute w-full transition-opacity duration-1000 flex items-center justify-center"
          style={{
            top: "20%",
            height: "60%",
            opacity: showTitle ? 1 : 0,
            pointerEvents: showTitle ? "auto" : "none",
          }}
        >
          <h1 className="text-5xl font-bold text-white text-center tracking-tight drop-shadow-lg">
            {currentMission?.title}
          </h1>
        </div>

        <main className="flex-grow flex flex-col">
          {/* Dialogue Section */}
          <div className="flex-grow flex flex-col p-4 relative">
            <div className="absolute bottom-32 left-0 right-0 px-4">
              <div className="relative max-w-2xl mx-auto">
                {/* Character Images */}
                <div className="absolute -top-40 w-full flex justify-between items-end z-10">
                  <div className="flex flex-col items-center ml-6">
                    <Image
                      src={aiAvatar}
                      alt="AI companion"
                      width={160}
                      height={160}
                      className={`transition-all duration-500 ${getCharacterOpacity(
                        "assistant"
                      )}`}
                    />
                  </div>
                  <div className="flex flex-col items-center mr-6">
                    <Image
                      src={userAvatar}
                      alt="User avatar"
                      width={160}
                      height={160}
                      className={`transition-all duration-300 ${getCharacterOpacity(
                        "user"
                      )}`}
                    />
                  </div>
                </div>

                {/* Dialogue Box */}
                <div className="bg-[#F6E6C5] border-4 border-[#8B7355] rounded-2xl p-6 shadow-lg">
                  <p className="text-black text-lg min-h-[28px] [&>span]:font-bold">
                    {isTyping && !currentText ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      getDisplayMessage()
                        .split(": ")
                        .map((part: string, index: number) =>
                          index === 0 ? <span key={index}>{part}: </span> : part
                        )
                    )}
                  </p>

                  {/* Time Display */}
                  <div className="mt-2 pt-2 border-t border-[#8B7355]/30 text-xs text-gray-600">
                    Time: {Math.floor(totalTimeSpent / 3600)}h{" "}
                    {Math.floor((totalTimeSpent % 3600) / 60)}m{" "}
                    {totalTimeSpent % 60}s
                  </div>
                </div>
                <div
                  className="absolute -bottom-4 right-12 w-8 h-8 
                            border-t-4 border-r-4 border-[#8B7355] 
                            transform rotate-45 bg-[#F6E6C5]
                            shadow-md"
                />
              </div>
            </div>

            {/* Input Section */}
            <form
              onSubmit={handleSubmit}
              className="mt-auto flex items-center space-x-3 max-w-2xl mx-auto mb-8"
            >
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="bg-card h-12 text-lg px-4 border-2 focus:border-primary"
              />
              <Button
                type="submit"
                disabled={isTyping || !input.trim()}
                size="lg"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </main>
      </div>
      <div className="relative z-[100]">
        <QuestionButton />
      </div>
      {isStopping && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 pointer-events-none" />
      )}

      {/* Mission Resume Dialog */}
      <MissionResumeDialog
        isOpen={showResumeDialog}
        missionTitle={currentMission.title}
        completionPercentage={progress}
        lastAiMessage={persistenceChatState?.last_ai_message || ""}
        totalMessages={persistenceChatState?.total_messages || 0}
        onResume={async () => {
          setShowResumeDialog(false);

          try {
            // Load chat history and restore to UI
            const history = await loadChatHistoryWithMetadata();
            console.log("Resuming with chat history:", history);

            if (history && history.length > 0) {
              // Set restoring flag BEFORE doing anything else
              setIsRestoringMessages(true);

              // Convert database messages to useChat format and track their IDs
              const formattedMessages = history.map((msg) => ({
                id: msg.id,
                role: msg.role as "user" | "assistant",
                content: msg.content,
                createdAt: new Date(msg.created_at),
              }));

              // Track all restored message IDs to prevent them from being processed as new
              formattedMessages.forEach((msg) => {
                restoredMessageIds.current.add(msg.id);
              });
              console.log(
                "Tracked restored message IDs:",
                Array.from(restoredMessageIds.current)
              );

              // Restore the last background image if available
              const lastAIMessage = history
                .filter((msg) => msg.role === "assistant")
                .pop();

              console.log("📸 Resume dialog - checking background image:", {
                hasMessage: !!lastAIMessage,
                hasMetadata: !!lastAIMessage?.metadata,
                backgroundImage: lastAIMessage?.metadata?.backgroundImage,
              });

              if (lastAIMessage?.metadata?.backgroundImage) {
                console.log(
                  "🎨 Resume dialog - restoring background image:",
                  lastAIMessage.metadata.backgroundImage
                );
                setBackgroundImage(lastAIMessage.metadata.backgroundImage);
              } else {
                console.log("🎨 Resume dialog - no background image found");
              }

              // Restore the last AI message content for display
              if (lastAIMessage) {
                try {
                  const responseData = JSON.parse(lastAIMessage.content);
                  const textContent =
                    responseData.userResponse || lastAIMessage.content;
                  console.log("Restoring AI message text:", textContent);
                  setCurrentText(textContent);
                  setIsTyping(false); // Ensure typing animation doesn't start
                } catch {
                  console.log(
                    "Restoring plain text message:",
                    lastAIMessage.content
                  );
                  setCurrentText(lastAIMessage.content);
                  setIsTyping(false);
                }
              }

              // Show the current mission state without title overlay
              setShowTitle(false);

              // Restore messages to the chat UI - this will trigger useEffect but it will be skipped
              console.log("Restoring messages to chat UI");
              setMessages(formattedMessages);

              toast.success("Chat history restored! Continue your mission.", {
                duration: 3000,
              });

              // Reset the restoring flag after everything is set up
              setTimeout(() => {
                console.log(
                  "Resume complete - enabling normal message processing"
                );
                setIsRestoringMessages(false);
              }, 500);
            }
          } catch (error) {
            console.error("Error resuming chat:", error);
            toast.error("Failed to restore chat history. Starting fresh.");
            // Reset flag on error so user can try again if needed
            resumeDialogShown.current = false;
            setIsRestoringMessages(false);
          }
        }}
        onStartFresh={async () => {
          setShowResumeDialog(false);
          try {
            // Clear chat history from database
            await clearChatHistory();

            // Reset all local state for fresh start
            setMessages([]);
            setProgress(0);
            setBackgroundImage(null);
            setShowTitle(true);
            setCurrentText("");

            // Clear restored message IDs for fresh start
            restoredMessageIds.current.clear();
            console.log("Cleared restored message IDs for fresh start");

            // Reset mission stats for fresh start
            setCurrentMissionStats({
              decisions_made: 0,
              good_decisions: 0,
              bad_decisions: 0,
              diplomatic_decisions: 0,
              strategic_decisions: 0,
              action_decisions: 0,
              investigation_decisions: 0,
              diplomatic_good_decisions: 0,
              diplomatic_bad_decisions: 0,
              strategic_good_decisions: 0,
              strategic_bad_decisions: 0,
              action_good_decisions: 0,
              action_bad_decisions: 0,
              investigation_good_decisions: 0,
              investigation_bad_decisions: 0,
            });

            toast.success("Starting fresh mission!", {
              duration: 3000,
            });
          } catch (error) {
            console.error("Error starting fresh:", error);
            toast.error("Error resetting mission state.");
            // Reset flag on error so user can try again if needed
            resumeDialogShown.current = false;
          }
        }}
        onClose={() => {
          setShowResumeDialog(false);
          // User stays on the current mission page without taking any action
        }}
      />

      {/* Decision Feedback Component */}
      <DecisionFeedback
        analysis={decisionFeedback.analysis}
        xpGained={decisionFeedback.xpGained}
        isVisible={decisionFeedback.isVisible}
        oldProgress={decisionFeedback.oldProgress}
        newProgress={decisionFeedback.newProgress}
        onClose={() =>
          setDecisionFeedback((prev) => ({ ...prev, isVisible: false }))
        }
      />
    </div>
  );
}
