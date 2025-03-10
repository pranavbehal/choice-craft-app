/**
 * Database Types
 *
 * Type definitions for Supabase database schema.
 * Includes table definitions and relationship types.
 *
 * @types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Database schema type definitions
 * Includes all tables and their respective row types
 */
export interface Database {
  public: {
    Tables: {
      /** User settings and profile information */
      users: {
        Row: {
          id: string;
          username: string | null;
          name: string | null;
          email: string;
          voice_on: boolean;
          profile_picture: number;
          created_at: string;
          has_seen_tutorial: boolean;
        };
        Insert: {
          id: string;
          username?: string | null;
          name?: string | null;
          email: string;
          voice_on?: boolean;
          profile_picture?: number;
          created_at?: string;
          has_seen_tutorial?: boolean;
        };
        Update: {
          id?: string;
          username?: string | null;
          name?: string | null;
          email?: string;
          voice_on?: boolean;
          profile_picture?: number;
          created_at?: string;
          has_seen_tutorial?: boolean;
        };
      };

      /** Mission definitions and parameters */
      missions: {
        Row: {
          id: string;
          title: string;
          description: string | null;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          completion_percentage?: number;
          achievements?: string | null;
          time_spent?: string;
          decisions_made?: number;
          good_decisions?: number;
          bad_decisions?: number;
          action_decisions?: number;
          strategic_decisions?: number;
          diplomatic_decisions?: number;
          investigation_decisions?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          completion_percentage?: number;
          achievements?: string | null;
          time_spent?: string;
          decisions_made?: number;
          good_decisions?: number;
          bad_decisions?: number;
          action_decisions?: number;
          strategic_decisions?: number;
          diplomatic_decisions?: number;
          investigation_decisions?: number;
          created_at?: string;
        };
      };

      /** User progress tracking for missions */
      user_mission_progress: {
        Row: {
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
        Insert: {
          id?: string;
          user_id: string;
          mission_id: string;
          completion_percentage?: number;
          achievements?: string | null;
          time_spent?: string;
          decisions_made?: number;
          good_decisions?: number;
          bad_decisions?: number;
          action_decisions?: number;
          strategic_decisions?: number;
          diplomatic_decisions?: number;
          investigation_decisions?: number;
          last_updated?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mission_id?: string;
          completion_percentage?: number;
          achievements?: string | null;
          time_spent?: string;
          decisions_made?: number;
          good_decisions?: number;
          bad_decisions?: number;
          action_decisions?: number;
          strategic_decisions?: number;
          diplomatic_decisions?: number;
          investigation_decisions?: number;
          last_updated?: string;
        };
      };
    };
  };
}
