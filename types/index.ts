export type MissionDifficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Expert";

export interface Mission {
  id: string;
  title: string;
  description: string;
  companion: string;
  image: string;
  difficulty: MissionDifficulty;
  storyline: {
    opening: string;
    milestones: Array<{
      progress: number;
      event: string;
      description: string;
    }>;
  };
}

export type MissionProgress = {
  id: string;
  user_id: string;
  mission_id: string;
  completion_percentage: number;
  achievements: string | null;
  time_spent: string;
  decisions_made: number;
  good_decisions: number;
  bad_decisions: number;
  action_decisions: number;
  strategic_decisions: number;
  diplomatic_decisions: number;
  investigation_decisions: number;
  // New detailed decision tracking
  diplomatic_good_decisions?: number;
  diplomatic_bad_decisions?: number;
  strategic_good_decisions?: number;
  strategic_bad_decisions?: number;
  action_good_decisions?: number;
  action_bad_decisions?: number;
  investigation_good_decisions?: number;
  investigation_bad_decisions?: number;
  last_updated: string;
  // Chat persistence fields
  can_resume?: boolean;
  last_message_order?: number;
  resumed_at?: string;
};

// Enhanced achievement system
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "completion" | "decision" | "time" | "exploration" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
  unlocked_at?: string;
}

// Decision analytics
export interface DecisionAnalytics {
  total_decisions: number;
  success_rate: number;
  preferred_approach: "diplomatic" | "strategic" | "action" | "investigation";
  decision_speed: number; // average time per decision
  risk_tolerance: "conservative" | "moderate" | "aggressive";
}
