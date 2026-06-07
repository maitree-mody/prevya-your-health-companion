export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_actions: {
        Row: {
          action_detail: string | null
          action_type: string | null
          agent_name: string | null
          id: string
          result: string | null
          status: string | null
          timestamp: string | null
          user_id: string | null
          verified_boolean: boolean | null
        }
        Insert: {
          action_detail?: string | null
          action_type?: string | null
          agent_name?: string | null
          id?: string
          result?: string | null
          status?: string | null
          timestamp?: string | null
          user_id?: string | null
          verified_boolean?: boolean | null
        }
        Update: {
          action_detail?: string | null
          action_type?: string | null
          agent_name?: string | null
          id?: string
          result?: string | null
          status?: string | null
          timestamp?: string | null
          user_id?: string | null
          verified_boolean?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_goals: {
        Row: {
          blocked_reason: string | null
          completed_at: string | null
          created_at: string | null
          goal_description: string | null
          id: string
          priority: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          goal_description?: string | null
          id?: string
          priority?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          goal_description?: string | null
          id?: string
          priority?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          date: string | null
          dossier_sent: boolean | null
          follow_up_booked: boolean | null
          id: string
          location: string | null
          outcome: string | null
          specialist_type: string | null
          user_id: string | null
        }
        Insert: {
          date?: string | null
          dossier_sent?: boolean | null
          follow_up_booked?: boolean | null
          id?: string
          location?: string | null
          outcome?: string | null
          specialist_type?: string | null
          user_id?: string | null
        }
        Update: {
          date?: string | null
          dossier_sent?: boolean | null
          follow_up_booked?: boolean | null
          id?: string
          location?: string | null
          outcome?: string | null
          specialist_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          created_at: string | null
          date: string | null
          distress_score: number | null
          dominant_emotion: string | null
          emotion_timeline: Json | null
          fatigue_score: number | null
          id: string
          pain_score: number | null
          symptoms_extracted: Json | null
          transcript: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          distress_score?: number | null
          dominant_emotion?: string | null
          emotion_timeline?: Json | null
          fatigue_score?: number | null
          id?: string
          pain_score?: number | null
          symptoms_extracted?: Json | null
          transcript?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          distress_score?: number | null
          dominant_emotion?: string | null
          emotion_timeline?: Json | null
          fatigue_score?: number | null
          id?: string
          pain_score?: number | null
          symptoms_extracted?: Json | null
          transcript?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          extracted_json: Json | null
          file_url: string | null
          id: string
          processed_boolean: boolean | null
          source: string | null
          upload_date: string | null
          user_id: string | null
        }
        Insert: {
          extracted_json?: Json | null
          file_url?: string | null
          id?: string
          processed_boolean?: boolean | null
          source?: string | null
          upload_date?: string | null
          user_id?: string | null
        }
        Update: {
          extracted_json?: Json | null
          file_url?: string | null
          id?: string
          processed_boolean?: boolean | null
          source?: string | null
          upload_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_logs: {
        Row: {
          correlated_symptom_score: number | null
          date: string | null
          foods: string[] | null
          id: string
          meal: string | null
          user_id: string | null
        }
        Insert: {
          correlated_symptom_score?: number | null
          date?: string | null
          foods?: string[] | null
          id?: string
          meal?: string | null
          user_id?: string | null
        }
        Update: {
          correlated_symptom_score?: number | null
          date?: string | null
          foods?: string[] | null
          id?: string
          meal?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      patterns: {
        Row: {
          added_to_dossier: boolean | null
          clinical_significance: string | null
          cycle_correlation: string | null
          first_detected: string | null
          id: string
          pattern_description: string | null
          user_id: string | null
        }
        Insert: {
          added_to_dossier?: boolean | null
          clinical_significance?: string | null
          cycle_correlation?: string | null
          first_detected?: string | null
          id?: string
          pattern_description?: string | null
          user_id?: string | null
        }
        Update: {
          added_to_dossier?: boolean | null
          clinical_significance?: string | null
          cycle_correlation?: string | null
          first_detected?: string | null
          id?: string
          pattern_description?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          clinical_flag: boolean | null
          content: string | null
          date: string | null
          event_type: string | null
          id: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          clinical_flag?: boolean | null
          content?: string | null
          date?: string | null
          event_type?: string | null
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          clinical_flag?: boolean | null
          content?: string | null
          date?: string | null
          event_type?: string | null
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age: number | null
          conditions_suspected: string[] | null
          created_at: string | null
          current_goal: string | null
          cycle_start_dates: string[] | null
          fertility_intent: boolean | null
          goal_set_date: string | null
          id: string
          name: string | null
        }
        Insert: {
          age?: number | null
          conditions_suspected?: string[] | null
          created_at?: string | null
          current_goal?: string | null
          cycle_start_dates?: string[] | null
          fertility_intent?: boolean | null
          goal_set_date?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          age?: number | null
          conditions_suspected?: string[] | null
          created_at?: string | null
          current_goal?: string | null
          cycle_start_dates?: string[] | null
          fertility_intent?: boolean | null
          goal_set_date?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
