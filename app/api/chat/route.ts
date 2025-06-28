/**
 * Chat API Route Handler
 *
 * Processes chat requests and generates AI responses using Google's Gemini API.
 * Handles message formatting, progress tracking, and scene generation prompts.
 *
 * @route POST /api/chat
 */

type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

interface DifficultySettings {
  goodDecisionThreshold: number;
  xpMultiplier: number;
  progressMultiplier: number;
  description: string;
}

interface MissionMilestone {
  progress: number;
  event: string;
  description: string;
}

interface MissionStoryline {
  opening: string;
  milestones: MissionMilestone[];
}

// Define the structured response schema
const responseSchema = {
  type: "object",
  properties: {
    userResponse: {
      type: "string",
      description:
        "Character dialogue message starting with character name followed by colon, must end with a clear choice for the user",
    },
    imagePrompt: {
      type: "string",
      description:
        "Detailed scene description for image generation, artistic style, usually no people visible",
    },
    progress: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description: "Mission progress percentage from 0 to 100",
    },
    decisionAnalysis: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["diplomatic", "strategic", "action", "investigation", "none"],
          description: "Classification of the user's last decision",
        },
        quality: {
          type: "string",
          enum: ["good", "bad"],
          description: "Whether the user's decision was beneficial or harmful",
        },
        isStoryDecision: {
          type: "boolean",
          description: "Whether this was a meaningful story-advancing choice",
        },
        progressAdvancement: {
          type: "integer",
          minimum: 0,
          maximum: 15,
          description: "How much this decision advances the story (0-15 scale)",
        },
        reasoning: {
          type: "string",
          description:
            "Brief explanation starting with 'You chose to...' describing the decision",
        },
        difficultyBonus: {
          type: "number",
          minimum: 1.0,
          maximum: 3.0,
          description: "XP multiplier based on mission difficulty",
        },
      },
      required: [
        "type",
        "quality",
        "isStoryDecision",
        "progressAdvancement",
        "reasoning",
        "difficultyBonus",
      ],
    },
  },
  required: ["userResponse", "progress", "decisionAnalysis"],
  propertyOrdering: [
    "userResponse",
    "imagePrompt",
    "progress",
    "decisionAnalysis",
  ],
};

/**
 * POST request handler for chat interactions
 * @param {Request} req - Incoming request object containing messages and context
 * @returns {Response} Streamed AI response with formatted dialogue and metadata
 */
export async function POST(req: Request) {
  const {
    messages,
    systemMessage,
    currentProgress,
    missionDifficulty,
    missionStoryline,
  } = await req.json();

  console.log("[Chat API] Incoming request", {
    messagesCount: messages?.length,
    currentProgress,
    missionDifficulty,
  });

  // Map difficulty to scoring multipliers
  const difficultySettings: Record<DifficultyLevel, DifficultySettings> = {
    Beginner: {
      goodDecisionThreshold: 0.5,
      xpMultiplier: 1.0,
      progressMultiplier: 1.2,
      description: "encouraging but requiring thoughtful decisions",
    },
    Intermediate: {
      goodDecisionThreshold: 0.6,
      xpMultiplier: 1.2,
      progressMultiplier: 1.0,
      description: "balanced with meaningful challenge",
    },
    Advanced: {
      goodDecisionThreshold: 0.7,
      xpMultiplier: 1.5,
      progressMultiplier: 0.8,
      description: "challenging and demanding precise choices",
    },
    Expert: {
      goodDecisionThreshold: 0.8,
      xpMultiplier: 2.0,
      progressMultiplier: 0.6,
      description: "extremely challenging with high stakes",
    },
  };

  const difficulty =
    difficultySettings[missionDifficulty as DifficultyLevel] ||
    difficultySettings["Intermediate"];

  // Calculate storyline progression context
  const getStorylineContext = () => {
    if (!missionStoryline) return "";

    const { milestones } = missionStoryline;
    const currentMilestone =
      milestones.find((m: MissionMilestone) => currentProgress < m.progress) ||
      milestones[milestones.length - 1];
    const nextMilestone = milestones.find(
      (m: MissionMilestone) => m.progress > currentProgress
    );
    const lastCompletedMilestone = milestones
      .filter((m: MissionMilestone) => currentProgress >= m.progress)
      .pop();

    let context = `
  MISSION STORYLINE STRUCTURE:
  Opening: ${missionStoryline.opening}
  
  Story Milestones:`;

    milestones.forEach((milestone: MissionMilestone) => {
      const status =
        currentProgress >= milestone.progress
          ? "✓ COMPLETED"
          : currentProgress >= milestone.progress - 10
          ? "→ APPROACHING"
          : "○ UPCOMING";
      context += `
  - ${milestone.progress}%: ${milestone.event} (${status})
    ${milestone.description}`;
    });

    context += `
  
  CURRENT STORY POSITION:
  - Progress: ${currentProgress}%`;

    if (lastCompletedMilestone) {
      context += `
  - Last completed milestone: ${lastCompletedMilestone.event}`;
    }

    if (nextMilestone) {
      context += `
  - Next story milestone: ${nextMilestone.event} (at ${nextMilestone.progress}%)
  - Progress needed: ${nextMilestone.progress - currentProgress}% remaining`;
    }

    if (currentProgress >= 100) {
      context += `
  
  🎯 MISSION COMPLETE: The story has reached its conclusion. If the user continues playing:
  - DO NOT increase progress beyond 100%
  - Present epilogue content or extended exploration
  - Acknowledge that the main story is complete
  - Offer meaningful but non-essential choices that don't affect core progress`;
    } else if (nextMilestone) {
      context += `
  
  📍 STORY FOCUS: Guide the narrative toward "${nextMilestone.event}"
  - Small decisions should give 1-3% progress
  - Major story decisions should give 5-8% progress  
  - Milestone-achieving decisions should give 8-15% progress
  - Ensure story naturally flows toward the next milestone event`;
    }

    return context;
  };

  const enhancedSystem = `${systemMessage}

  ${getStorylineContext()}

  MISSION DIFFICULTY: ${missionDifficulty} - This mission should be ${
    difficulty.description
  }.
  
  CRITICAL: Every response MUST end with a clear choice for the user to make. NEVER EVER just acknowledge their decision or describe what's happening. Present choices naturally within the narrative flow - DO NOT use A/B/C labels.

  MANDATORY: You MUST respond with valid JSON matching the exact schema. Your response will be parsed as JSON.

  Decision Analysis Guidelines (DIFFICULTY-ADJUSTED):
  - "type": Classify the USER'S LAST MESSAGE as: diplomatic, strategic, action, investigation, or none
  - "quality": Mark as "good" only if decision shows ${
    missionDifficulty === "Expert"
      ? "exceptional wisdom"
      : missionDifficulty === "Advanced"
      ? "thoughtful planning"
      : missionDifficulty === "Intermediate"
      ? "reasonable thinking"
      : "basic good judgment"
  }
  - "difficultyBonus": Always set to ${difficulty.xpMultiplier}
  - "progressAdvancement": 0-15 scale, multiply by ${
    difficulty.progressMultiplier
  }

  Examples of natural choice presentation:
  - "Do we set up defenses or enter the ruins immediately?"
  - "Should we take the narrow passage or the wide path?"
  - "Do we negotiate with them or try to sneak past?"

  EVERY response must give the user a choice. NO EXCEPTIONS.

  DIFFICULTY-BASED SCORING:
  - For ${missionDifficulty} missions, good decisions should be ${
    difficulty.goodDecisionThreshold > 0.6
      ? "much harder"
      : difficulty.goodDecisionThreshold > 0.4
      ? "moderately challenging"
      : "relatively achievable"
  } to earn
  - Progress advancement should be ${
    difficulty.progressMultiplier < 1
      ? "slower and more methodical"
      : difficulty.progressMultiplier > 1
      ? "steady with good pacing"
      : "balanced"
  }
  - Wrong choices should have ${
    missionDifficulty === "Expert"
      ? "severe consequences"
      : missionDifficulty === "Advanced"
      ? "significant setbacks"
      : missionDifficulty === "Intermediate"
      ? "moderate consequences"
      : "mild setbacks"
  }

  RESPONSE FORMAT EXAMPLE (MANDATORY):
  "Character: One-line outcome. New situation with built-in choices—Do we do X, Y, or Z?"

  WRONG / RIGHT EXAMPLES:
  - WRONG: "Smart move! Let's take our time to study the mechanism carefully."
  - RIGHT: "We examine the mechanism and discover three activation methods. Do we use the glowing crystal, input the ancient symbols, or try the modern keypad?"

  PROGRESS GUIDELINES (STORYLINE-DRIVEN):
  - Never exceed 100% progress; mission ends at 100%.
  - Small side decisions: 1-3% progress.
  - Major plot decisions: 5-8% progress.
  - Milestone events: 8-15% progress.
  - Bad decisions may decrease progress.

  CHOICE GUIDELINES:
  - Forbidden: A/B/C labels or praising statements without new options.
  - Always end with clear, naturally phrased options ending in a question mark.

  LANGUAGE GUIDELINES:
  - Use "we"/"us" collectively; address the user as "you" when referencing their prior action.

  VALIDATION CHECK BEFORE SENDING:
  1. Ends with user choices?
  2. No A/B/C labels?
  3. Ends cleanly with "?"?
  4. Avoids redundant prompts like "What do we do?"?
  If any answer is NO, rewrite before responding.`;

  try {
    console.log("[Chat API] Using structured output with schema");

    // Use direct Gemini API call with structured output
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${enhancedSystem}\n\n${messages
                    .map(
                      (m: { role: string; content: string }) =>
                        `${m.role === "user" ? "User" : "Assistant"}: ${
                          m.content
                        }`
                    )
                    .join("\n")}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          },
        }),
      }
    );

    console.log("[Chat API] Gemini response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Chat API] Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const geminiData = await response.json();
    console.log(
      "[Chat API] Gemini structured response:",
      JSON.stringify(geminiData).slice(0, 500)
    );

    let textOutput =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    console.log("[Chat API] Raw JSON output:", textOutput.slice(0, 300));

    // Validate that we got valid JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(textOutput);
      console.log("[Chat API] Successfully parsed JSON response");
    } catch (parseError) {
      console.error("[Chat API] Failed to parse JSON response:", parseError);
      console.error("[Chat API] Raw response:", textOutput);

      // Attempt to recover from truncated JSON by creating a fallback response
      console.log("[Chat API] Attempting to recover from truncated JSON...");
      try {
        // Try to extract userResponse from the partial JSON
        const userResponseMatch = textOutput.match(
          /"userResponse":\s*"([^"]*(?:\\.[^"]*)*)/
        );
        const progressMatch = textOutput.match(/"progress":\s*(\d+)/);

        const fallbackResponse = {
          userResponse: userResponseMatch
            ? userResponseMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n")
            : "System: I encountered an issue processing your request. Please try again.",
          imagePrompt:
            "A mystical scene in an enchanted forest with soft, ethereal lighting",
          progress: progressMatch
            ? parseInt(progressMatch[1])
            : currentProgress,
          decisionAnalysis: {
            type: "none",
            quality: "good",
            isStoryDecision: false,
            progressAdvancement: 0,
            reasoning: "Recovered from truncated response",
            difficultyBonus: 1.0,
          },
        };

        console.log("[Chat API] Successfully recovered truncated JSON");
        parsedResponse = fallbackResponse;
        // Update textOutput to use the fallback
        textOutput = JSON.stringify(fallbackResponse);
      } catch (recoveryError) {
        console.error(
          "[Chat API] Failed to recover truncated JSON:",
          recoveryError
        );
        throw new Error("Invalid JSON response from Gemini");
      }
    }

    // Create a streaming response manually for useChat compatibility
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the structured response as a single chunk in the format expected by useChat
        // For data stream protocol, we need to escape the JSON properly and send it as a text part
        const escapedJson = textOutput
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r");
        const chunk = `0:"${escapedJson}"\n`;
        console.log("[Chat API] Sending chunk:", chunk.slice(0, 200));
        controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-vercel-ai-data-stream": "v1",
      },
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);

    // Return error in streaming format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const errorResponse = JSON.stringify({
          userResponse:
            "System: I apologize, but I encountered an error. Please try again.",
          progress: currentProgress,
          decisionAnalysis: {
            type: "none",
            quality: "bad",
            isStoryDecision: false,
            progressAdvancement: 0,
            reasoning: "System error occurred",
            difficultyBonus: 1.0,
          },
        });
        const chunk = `0:"${errorResponse.replace(/"/g, '\\"')}"\n`;
        controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200, // Return 200 to avoid useChat errors
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-vercel-ai-data-stream": "v1",
      },
    });
  }
}
