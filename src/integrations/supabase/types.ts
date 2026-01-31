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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string | null
          criteria: Json
          description: string | null
          icon: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          criteria: Json
          description?: string | null
          icon?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          id: string
          title: string
          author: string | null
          publisher: string | null
          isbn: string | null
          description: string | null
          grade_id: number | null
          subject_id: number | null
          chapter: number | null
          version: string | null
          language: string | null
          file_name: string
          file_size: number
          file_type: string
          storage_path: string
          download_url: string | null
          source_url: string | null
          official_source: string | null
          extracted_text: string | null
          metadata: Json | null
          is_processed: boolean | null
          page_count: number | null
          published_year: number | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          author?: string | null
          publisher?: string | null
          isbn?: string | null
          description?: string | null
          grade_id?: number | null
          subject_id?: number | null
          chapter?: number | null
          version?: string | null
          language?: string | null
          file_name: string
          file_size: number
          file_type?: string
          storage_path: string
          download_url?: string | null
          source_url?: string | null
          official_source?: string | null
          extracted_text?: string | null
          metadata?: Json | null
          is_processed?: boolean | null
          page_count?: number | null
          published_year?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          author?: string | null
          publisher?: string | null
          isbn?: string | null
          description?: string | null
          grade_id?: number | null
          subject_id?: number | null
          chapter?: number | null
          version?: string | null
          language?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          storage_path?: string
          download_url?: string | null
          source_url?: string | null
          official_source?: string | null
          extracted_text?: string | null
          metadata?: Json | null
          is_processed?: boolean | null
          page_count?: number | null
          published_year?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          conversation_id: string
          created_at: string
          extracted_text: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          storage_path: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          storage_path: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      troubleshooting_sessions: {
        Row: {
          completed_at: string | null
          conversation_id: string
          current_step_index: number
          flow_id: string | null
          id: string
          metadata: Json
          started_at: string
          status: string
          step_history: Json
        }
        Insert: {
          completed_at?: string | null
          conversation_id: string
          current_step_index?: number
          flow_id?: string | null
          id?: string
          metadata?: Json
          started_at?: string
          status?: string
          step_history?: Json
        }
        Update: {
          completed_at?: string | null
          conversation_id?: string
          current_step_index?: number
          flow_id?: string | null
          id?: string
          metadata?: Json
          started_at?: string
          status?: string
          step_history?: Json
        }
        Relationships: [
          {
            foreignKeyName: "troubleshooting_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      troubleshooting_templates: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          steps: Json
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          steps: Json
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          steps?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          badges: Json
          created_at: string
          flows_completed: number
          id: string
          last_active: string
          tips_unlocked: Json
          user_id: string
        }
        Insert: {
          badges?: Json
          created_at?: string
          flows_completed?: number
          id?: string
          last_active?: string
          tips_unlocked?: Json
          user_id: string
        }
        Update: {
          badges?: Json
          created_at?: string
          flows_completed?: number
          id?: string
          last_active?: string
          tips_unlocked?: Json
          user_id?: string
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
