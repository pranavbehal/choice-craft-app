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
  last_updated: string;
};
