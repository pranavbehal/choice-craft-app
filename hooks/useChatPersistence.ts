/**
 * Chat Persistence Hook
 *
 * Manages saving and loading chat messages for mission continuity.
 * Allows users to resume missions where they left off.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { type Message } from "ai/react";
import { type DecisionAnalysis } from "@/lib/achievementEngine";

interface ChatMessage {
  id: string;
  user_id: string;
  mission_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: {
    imagePrompt?: string;
    decisionAnalysis?: DecisionAnalysis;
    backgroundImage?: string;
  };
  created_at: string;
  message_order: number;
}

interface ChatState {
  has_existing_chat: boolean;
  last_message_order: number;
  last_ai_message: string;
  can_resume: boolean;
  total_messages: number;
}

interface UseChatPersistenceProps {
  missionId: string;
}

export function useChatPersistence({ missionId }: UseChatPersistenceProps) {
  const { user } = useAuth();
  const [chatState, setChatState] = useState<ChatState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls and manage state
  const currentMissionRef = useRef(missionId);
  const loadingStateRef = useRef(new Set<string>());
  const mountedRef = useRef(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Debounced state refresh function
  const debouncedRefreshChatState = useCallback(async () => {
    console.log("🔄 debouncedRefreshChatState called", {
      mounted: mountedRef.current,
      hasUser: !!user,
      hasMissionId: !!missionId,
      userId: user?.id,
      missionId,
    });

    if (!mountedRef.current || !user || !missionId) {
      console.log("❌ Early return - missing requirements");
      return;
    }

    // Prevent duplicate calls for the same mission
    const loadingKey = `${user.id}-${missionId}`;
    if (loadingStateRef.current.has(loadingKey)) {
      console.log("❌ Early return - already loading:", loadingKey);
      return;
    }

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    console.log("⏱️ Setting timeout for chat state refresh");

    // Add debouncing to prevent rapid-fire calls
    refreshTimeoutRef.current = setTimeout(async () => {
      console.log("🚀 Executing debounced chat state refresh");

      if (!mountedRef.current || currentMissionRef.current !== missionId) {
        console.log("❌ Mission changed or unmounted, skipping");
        return;
      }

      loadingStateRef.current.add(loadingKey);

      try {
        const state = await getChatStateFallback();
        if (mountedRef.current && currentMissionRef.current === missionId) {
          console.log("✅ Setting chat state:", state);
          setChatState(state);
          setIsLoading(false);
          setError(null);
        }
      } catch (error) {
        console.error("Error refreshing chat state:", error);
        if (mountedRef.current) {
          setError("Failed to load chat state");
          setIsLoading(false);
        }
      } finally {
        loadingStateRef.current.delete(loadingKey);
      }
    }, 100); // 100ms debounce
  }, [user?.id, missionId]);

  // Handle mission changes
  useEffect(() => {
    if (currentMissionRef.current !== missionId) {
      console.log(
        "useChatPersistence mission changed from",
        currentMissionRef.current,
        "to",
        missionId
      );

      // Clear any pending timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Clear loading states for old mission
      loadingStateRef.current.clear();

      // Update current mission
      currentMissionRef.current = missionId;

      // Reset state immediately for new mission
      setChatState({
        has_existing_chat: false,
        last_message_order: 0,
        last_ai_message: "",
        can_resume: false,
        total_messages: 0,
      });
      setIsLoading(true);
      setError(null);

      // Load new mission state
      debouncedRefreshChatState();
    }
  }, [missionId, debouncedRefreshChatState]);

  // Initial load effect
  useEffect(() => {
    if (user && missionId && mountedRef.current) {
      console.log("Initial loading of chat state for mission:", missionId);
      console.log("Current chat state:", chatState);
      console.log("Should load?", {
        hasUser: !!user,
        hasMissionId: !!missionId,
        isMounted: mountedRef.current,
        currentChatState: chatState,
        isLoading,
      });

      // Always attempt to load chat state for a mission
      debouncedRefreshChatState();
    }
  }, [user?.id, missionId, debouncedRefreshChatState]); // Use user?.id to prevent infinite loops

  /**
   * Get the current chat state for this mission
   */
  const getChatState = async (): Promise<ChatState | null> => {
    if (!user) return null;

    try {
      return await getChatStateFallback();
    } catch (error) {
      console.error("Error in getChatState:", error);
      return {
        has_existing_chat: false,
        last_message_order: 0,
        last_ai_message: "",
        can_resume: false,
        total_messages: 0,
      };
    }
  };

  /**
   * Optimized fallback method to get chat state
   */
  const getChatStateFallback = async (): Promise<ChatState | null> => {
    if (!user || !missionId) return null;

    // Prevent stale calls for old mission IDs
    if (currentMissionRef.current !== missionId) {
      console.log(
        "Ignoring stale getChatStateFallback call for mission:",
        missionId,
        "current:",
        currentMissionRef.current
      );
      return null;
    }

    try {
      console.log("getChatStateFallback running for mission:", missionId);

      // Use parallel queries for better performance
      const [messagesQuery, progressQuery] = await Promise.allSettled([
        // Get message count and last AI message
        supabase
          .from("chat_messages")
          .select("message_order, content, role")
          .eq("user_id", user.id)
          .eq("mission_id", String(missionId))
          .order("message_order", { ascending: false }),

        // Get mission progress
        supabase
          .from("user_mission_progress")
          .select("completion_percentage, can_resume")
          .eq("user_id", user.id)
          .eq("mission_id", String(missionId))
          .maybeSingle(),
      ]);

      // Handle messages query
      let messageCount = 0;
      let lastAiMessage = "";

      if (messagesQuery.status === "fulfilled") {
        const { data: messages, error: messagesError } = messagesQuery.value;

        if (messagesError && messagesError.code === "42P01") {
          console.log("chat_messages table doesn't exist yet");
        } else if (!messagesError && messages) {
          messageCount = messages.length;
          lastAiMessage =
            messages.find((m) => m.role === "assistant")?.content || "";
        }
      }

      // Handle progress query
      let hasProgress = false;
      let canResume = false;

      if (progressQuery.status === "fulfilled") {
        const { data: progress, error: progressError } = progressQuery.value;

        if (!progressError && progress) {
          hasProgress = (progress.completion_percentage || 0) > 0;
          canResume =
            hasProgress && messageCount > 0 && progress.can_resume !== false;
        }
      }

      const result = {
        missionId,
        messageCount,
        hasProgress,
        canResume,
        result: {
          has_existing_chat: messageCount > 0,
          last_message_order: messageCount > 0 ? messageCount : 0,
          last_ai_message: lastAiMessage,
          can_resume: canResume,
          total_messages: messageCount,
        },
      };

      console.log("Chat state fallback result:", result);
      console.log("📊 Chat State Details:", {
        "Messages Found": messageCount,
        "Has Progress": hasProgress,
        "Can Resume": canResume,
        "Has Existing Chat": messageCount > 0,
        "Mission ID": missionId,
        "User ID": user.id,
      });

      return result.result;
    } catch (error) {
      console.error("Error in getChatStateFallback:", error);
      return {
        has_existing_chat: false,
        last_message_order: 0,
        last_ai_message: "",
        can_resume: false,
        total_messages: 0,
      };
    }
  };

  /**
   * Load chat history as Message array
   */
  const loadChatHistory = async (): Promise<Message[]> => {
    if (!user) return [];

    try {
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, message_order")
        .eq("user_id", user.id)
        .eq("mission_id", String(missionId))
        .order("message_order", { ascending: true });

      if (error) {
        console.error("Error loading chat history:", error);
        return [];
      }

      return (messages || []).map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      }));
    } catch (error) {
      console.error("Error in loadChatHistory:", error);
      return [];
    }
  };

  /**
   * Load chat history with metadata
   */
  const loadChatHistoryWithMetadata = async (): Promise<ChatMessage[]> => {
    if (!user) return [];

    try {
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .eq("mission_id", String(missionId))
        .order("message_order", { ascending: true });

      if (error) {
        console.error("Error loading chat history with metadata:", error);
        return [];
      }

      return messages || [];
    } catch (error) {
      console.error("Error in loadChatHistoryWithMetadata:", error);
      return [];
    }
  };

  /**
   * Save a chat message
   */
  const saveChatMessage = async (
    message: Message,
    metadata: ChatMessage["metadata"] = {}
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get the next message order
      const { data: lastMessage, error: orderError } = await supabase
        .from("chat_messages")
        .select("message_order")
        .eq("user_id", user.id)
        .eq("mission_id", String(missionId))
        .order("message_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderError && orderError.code !== "42P01") {
        console.error("Error getting last message order:", orderError);
        return false;
      }

      const nextOrder = (lastMessage?.message_order || 0) + 1;

      // Insert the message
      const { error } = await supabase.from("chat_messages").insert({
        user_id: user.id,
        mission_id: String(missionId),
        role: message.role,
        content: message.content,
        metadata,
        message_order: nextOrder,
      });

      if (error) {
        // Handle unique constraint violations with retry
        if (error.code === "23505") {
          console.log(
            "Message order conflict, retrying with different order..."
          );

          const retryOrder = nextOrder + Math.floor(Math.random() * 10) + 1;

          const { error: retryError } = await supabase
            .from("chat_messages")
            .insert({
              user_id: user.id,
              mission_id: String(missionId),
              role: message.role,
              content: message.content,
              metadata,
              message_order: retryOrder,
            });

          if (retryError) {
            console.error("Error saving chat message on retry:", retryError);
            return false;
          }
        } else {
          console.error("Error saving chat message:", error);
          return false;
        }
      }

      // Update mission progress to mark as resumable (only for AI messages)
      if (message.role === "assistant") {
        try {
          await supabase.from("user_mission_progress").upsert(
            {
              user_id: user.id,
              mission_id: String(missionId),
              last_message_order: nextOrder,
              can_resume: true,
              resumed_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,mission_id",
              ignoreDuplicates: false,
            }
          );
        } catch (progressError) {
          console.warn(
            "Could not update mission progress (table may not exist):",
            progressError
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Error in saveChatMessage:", error);
      return false;
    }
  };

  /**
   * Clear all chat history for this mission (restart)
   */
  const clearChatHistory = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      return await clearChatHistoryFallback();
    } catch (error) {
      console.error("Error in clearChatHistory:", error);
      return false;
    }
  };

  /**
   * Fallback method to clear chat history without database function
   */
  const clearChatHistoryFallback = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete chat messages manually if table exists
      const { error: deleteError } = await supabase
        .from("chat_messages")
        .delete()
        .eq("user_id", user.id)
        .eq("mission_id", String(missionId));

      // Ignore error if table doesn't exist
      if (deleteError && deleteError.code !== "42P01") {
        console.error("Error deleting chat messages:", deleteError);
      }

      // Delete the mission progress row completely when starting fresh
      const { error: deleteProgressError } = await supabase
        .from("user_mission_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("mission_id", String(missionId));

      // Ignore table doesn't exist errors
      if (
        deleteProgressError &&
        !deleteProgressError.message.includes("relation") &&
        deleteProgressError.code !== "42P01"
      ) {
        console.error("Error deleting mission progress:", deleteProgressError);
      } else {
        console.log("✅ Mission progress row deleted for fresh start");
      }

      // Refresh chat state
      await debouncedRefreshChatState();
      return true;
    } catch (error) {
      console.error("Error in clearChatHistoryFallback:", error);
      return false;
    }
  };

  /**
   * Refresh the current chat state
   */
  const refreshChatState = async () => {
    debouncedRefreshChatState();
  };

  /**
   * Get the last background image from chat history
   */
  const getLastBackgroundImage = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select("metadata")
        .eq("user_id", user.id)
        .eq("mission_id", String(missionId))
        .eq("role", "assistant")
        .not("metadata->backgroundImage", "is", null)
        .order("message_order", { ascending: false })
        .limit(1);

      if (error || !messages || messages.length === 0) {
        return null;
      }

      return messages[0].metadata?.backgroundImage || null;
    } catch (error) {
      console.error("Error getting last background image:", error);
      return null;
    }
  };

  return {
    // State
    chatState,
    isLoading,
    error,

    // Actions
    loadChatHistory,
    loadChatHistoryWithMetadata,
    saveChatMessage,
    clearChatHistory,
    refreshChatState,
    getChatState,
    getLastBackgroundImage,

    // Computed values
    canResume: chatState?.can_resume || false,
    hasExistingChat: chatState?.has_existing_chat || false,
    totalMessages: chatState?.total_messages || 0,
    lastAiMessage: chatState?.last_ai_message || "",
  };
}
