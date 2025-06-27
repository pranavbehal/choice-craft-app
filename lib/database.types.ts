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
          can_resume?: boolean;
          last_message_order?: number;
          resumed_at?: string;
          diplomatic_good_decisions?: number;
          diplomatic_bad_decisions?: number;
          strategic_good_decisions?: number;
          strategic_bad_decisions?: number;
          action_good_decisions?: number;
          action_bad_decisions?: number;
          investigation_good_decisions?: number;
          investigation_bad_decisions?: number;
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
          can_resume?: boolean;
          last_message_order?: number;
          resumed_at?: string;
          diplomatic_good_decisions?: number;
          diplomatic_bad_decisions?: number;
          strategic_good_decisions?: number;
          strategic_bad_decisions?: number;
          action_good_decisions?: number;
          action_bad_decisions?: number;
          investigation_good_decisions?: number;
          investigation_bad_decisions?: number;
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
          can_resume?: boolean;
          last_message_order?: number;
          resumed_at?: string;
          diplomatic_good_decisions?: number;
          diplomatic_bad_decisions?: number;
          strategic_good_decisions?: number;
          strategic_bad_decisions?: number;
          action_good_decisions?: number;
          action_bad_decisions?: number;
          investigation_good_decisions?: number;
          investigation_bad_decisions?: number;
        };
      };

      /** Chat messages for mission conversations */
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          mission_id: string;
          role: string;
          content: string;
          metadata: Json;
          created_at: string;
          message_order: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          mission_id: string;
          role: string;
          content: string;
          metadata?: Json;
          created_at?: string;
          message_order: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          mission_id?: string;
          role?: string;
          content?: string;
          metadata?: Json;
          created_at?: string;
          message_order?: number;
        };
      };
    };
  };
}
