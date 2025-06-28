/**
 * Chat API Route Handler
 *
 * Processes chat requests and generates AI responses using OpenAI's API.
 * Handles message formatting, progress tracking, and scene generation prompts.
 *
 * @route POST /api/chat
 */

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

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

  // Map difficulty to scoring multipliers
  const difficultySettings: Record<DifficultyLevel, DifficultySettings> = {
    Beginner: {
      goodDecisionThreshold: 0.5, // 50% chance for good decision (more critical)
      xpMultiplier: 1.0,
      progressMultiplier: 1.2,
      description: "encouraging but requiring thoughtful decisions",
    },
    Intermediate: {
      goodDecisionThreshold: 0.6, // 60% chance for good decision (more critical)
      xpMultiplier: 1.2,
      progressMultiplier: 1.0,
      description: "balanced with meaningful challenge",
    },
    Advanced: {
      goodDecisionThreshold: 0.7, // 70% chance for good decision (harder to get good)
      xpMultiplier: 1.5,
      progressMultiplier: 0.8,
      description: "challenging and demanding precise choices",
    },
    Expert: {
      goodDecisionThreshold: 0.8, // 80% chance for good decision (very hard to get good)
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

  CRITICAL: Every response MUST end with a clear choice for the user to make. NEVER EVER just acknowledge their decision or describe what's happening. FORBIDDEN phrases include: "Good choice!", "Smart move!", "Let's do X", "We need to Y" without immediately giving options. 

  MANDATORY FORMAT: Every response must follow this pattern:
  1. Brief description of what happens as a result of their choice (1 sentence max)
  2. IMMEDIATELY present the next situation that requires a decision
  3. Present the decision options naturally within the narrative flow - DO NOT use A/B/C labels

  WRONG: "Smart move! Let's take our time to study the mechanism carefully."
  RIGHT: "You study the mechanism and notice three activation sequences. Do we activate the glowing blue sequence, try the ancient red symbols, or use the modern-looking silver panel?"

  CRITICAL: You MUST return your responses ONLY as a valid JSON object with these exact fields. DO NOT include any text before or after the JSON object. The response must be parseable by JSON.parse():
  {
    "userResponse": "Your actual dialogue message starting with your name (e.g., 'Professor Blue: Hello!'). MUST end with a clear choice presented naturally like 'Do we set up defenses or enter the ruins immediately?'. NEVER use A/B/C labels. NEVER just acknowledge their previous choice - always give them the NEXT choice to make.",
    "imagePrompt": "Detailed scene description for image generation. Should be artistic and usually have no people visible. Good example: A mystical ancient stone city hidden in dense jungle, with crumbling temples, overgrown with vines, mysterious glowing symbols carved into walls, mist rolling through narrow streets, dramatic lighting, digital art style",
    "progress": number (0-100, current: ${currentProgress}),
    "decisionAnalysis": {
      "type": "diplomatic|strategic|action|investigation|none",
      "quality": "good|bad",
      "isStoryDecision": boolean,
      "progressAdvancement": number,
      "reasoning": "Brief explanation starting with 'You chose to...' describing the decision classification",
      "difficultyBonus": number (XP multiplier based on mission difficulty: ${
        difficulty.xpMultiplier
      })
    }
  }

  Decision Analysis Guidelines (DIFFICULTY-ADJUSTED):
  - "type": Classify the USER'S LAST MESSAGE (not your response) as one of the decision types:
    * "diplomatic" - negotiation, persuasion, talking, peaceful solutions
    * "strategic" - planning, thinking, analyzing, careful approaches  
    * "action" - fighting, running, physical actions, aggressive moves
    * "investigation" - searching, examining, gathering information
    * "none" - just questions, clarifications, or greetings
    
  - "quality": Evaluate if the USER'S decision was beneficial (good) or harmful (bad) to the story outcome
    * IMPORTANT: Every story decision MUST be classified as either "good" or "bad" - NEVER use "neutral"
    * For ${missionDifficulty} missions: Be ${
    difficulty.goodDecisionThreshold > 0.6
      ? "very strict"
      : difficulty.goodDecisionThreshold > 0.4
      ? "moderately strict"
      : "reasonably lenient"
  } when marking decisions as "good"
    * Only mark as "good" if the decision shows ${
      missionDifficulty === "Expert"
        ? "exceptional wisdom and careful consideration"
        : missionDifficulty === "Advanced"
        ? "thoughtful planning and skill"
        : missionDifficulty === "Intermediate"
        ? "reasonable thinking"
        : "basic good judgment"
    }
    * Bad decisions should have ${
      missionDifficulty === "Expert"
        ? "major story consequences"
        : missionDifficulty === "Advanced"
        ? "significant setbacks"
        : "appropriate consequences"
    }
    * If unsure, lean toward "bad" for higher difficulties and "good" for lower difficulties
    
  - "isStoryDecision": true if the user made a meaningful choice that advances the story, false for questions/clarifications
  
  - "progressAdvancement": How much this decision should advance the story (0-10 scale)
    * Multiply base advancement by ${
      difficulty.progressMultiplier
    } for ${missionDifficulty} difficulty
    * ${missionDifficulty} missions should progress ${
    difficulty.progressMultiplier < 1
      ? "more slowly, requiring multiple good decisions"
      : "at a steady pace"
  }
    
  - "difficultyBonus": Always set to ${
    difficulty.xpMultiplier
  } (the XP multiplier for ${missionDifficulty} missions)
  
  - IMPORTANT: You are analyzing what the USER said, not what you are saying in response
  - Examples:
    * User: "I try to negotiate with the guards" → type: "diplomatic", quality: depends on difficulty and context
    * User: "I attack the monster" → type: "action", quality: depends on difficulty and situation wisdom
    * User: "I examine the ancient symbols" → type: "investigation", quality: "good" if appropriate for difficulty level
    * User: "I plan my next move carefully" → type: "strategic", quality: should be "good" for most difficulties
    * User: "What's that sound?" → type: "none", isStoryDecision: false

  Progress Guidelines (STORYLINE-DRIVEN):
  - CRITICAL: Progress is now storyline-based, not arbitrary
  - NEVER increase progress beyond 100% - mission is complete at 100%
  - Progress should align with story milestones at 25%, 50%, 75%, and 100%
  - Small decisions (side conversations, minor choices): 1-3% progress
  - Major story decisions (key plot points): 5-8% progress  
  - Milestone-achieving decisions (major story events): 8-15% progress
  - Bad decisions may decrease progress (setbacks in the story)
  - Consider current progress (${currentProgress}) and guide toward next milestone
  - ${missionDifficulty} missions should require ${
    difficulty.goodDecisionThreshold > 0.6
      ? "consistently excellent decisions"
      : difficulty.goodDecisionThreshold > 0.4
      ? "mostly good decisions"
      : "reasonable decisions"
  } to progress smoothly
  - When progress reaches 100%, the story is COMPLETE - offer only epilogue content

  Choice Guidelines:
  - FORBIDDEN: Any response that doesn't end with specific options for the user
  - FORBIDDEN: "Smart move!", "Good choice!", "Let's do X", "We need to Y" without options
  - FORBIDDEN: Describing what you're going to do without giving the user a choice
  - FORBIDDEN: Using A/B/C format - present choices naturally in narrative
  - MANDATORY: Every single response must end with clear options integrated into the story
  - Make each option clearly different (diplomatic vs action vs strategic)
  - Be specific, not vague
  - Present choices naturally: "Do we negotiate or fight?" instead of "A) Negotiate B) Fight"
  - For ${missionDifficulty} missions: Make choices ${
    difficulty.goodDecisionThreshold > 0.6
      ? "more nuanced and complex"
      : difficulty.goodDecisionThreshold > 0.4
      ? "moderately challenging"
      : "straightforward but meaningful"
  }

  Response Structure (MANDATORY):
  "[Character Name]: [What happens from their choice]. [New situation]. [Natural question presenting the choices]?"
  
  Examples of natural choice presentation:
  - "Do we set up defenses or enter the ruins immediately?"
  - "Should we take the narrow passage or the wide path?"
  - "Do we negotiate with them or try to sneak past?"

  Language Guidelines:
  - Use "we" and "us" since you're working together with the user
  - Use "you" when referring to the user's specific actions or decisions
  - Examples: "We approach the door", "What do we do next?", "You decide to examine the symbols"

  Examples:
  - WRONG: "Professor Blue: Smart move! Let's take our time to study the mechanism carefully."
  - RIGHT: "Professor Blue: We examine the mechanism together and find three different activation methods. Do we try the glowing crystal, input the ancient symbols, or use the modern keypad?"
  
     EVERY response must give the user a choice. NO EXCEPTIONS.

  VALIDATION CHECK: Before sending your response, ask yourself:
  1. Does my response end with clear options for the user to choose from?
  2. Are the choices presented naturally without A/B/C labels?
  3. Does my response end cleanly with a question mark after the choices?
  4. Did I avoid adding extra "What do we do" or similar redundant text?
  5. If any answer is NO, then REWRITE it

  Remember: The user should NEVER have to just say "ok" or "continue" - they should always have meaningful choices to make.
  
  CRITICAL: Your userResponse should end immediately after presenting the choices with a question mark. Do NOT add extra prompting text.`;

  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: enhancedSystem,
      messages,
      temperature: 0.7,
      maxTokens: 800, // Increased to accommodate JSON
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
