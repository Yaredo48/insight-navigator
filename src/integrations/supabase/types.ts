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
      announcements: {
        Row: {
          class_id: string | null
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          priority: string | null
          published_at: string | null
          target_grade_id: number | null
          target_type: string | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          published_at?: string | null
          target_grade_id?: number | null
          target_type?: string | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          published_at?: string | null
          target_grade_id?: number | null
          target_type?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_target_grade_id_fkey"
            columns: ["target_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string | null
          feedback: string | null
          file_urls: Json | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          id: string
          is_late: boolean | null
          quiz_attempt_id: string | null
          status: string | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          feedback?: string | null
          file_urls?: Json | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          quiz_attempt_id?: string | null
          status?: string | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          feedback?: string | null
          file_urls?: Json | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          quiz_attempt_id?: string | null
          status?: string | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late_submissions: boolean | null
          assignment_type: string
          attachments: Json | null
          class_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          is_published: boolean | null
          max_points: number | null
          quiz_id: string | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_late_submissions?: boolean | null
          assignment_type?: string
          attachments?: Json | null
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean | null
          max_points?: number | null
          quiz_id?: string | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_late_submissions?: boolean | null
          assignment_type?: string
          attachments?: Json | null
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean | null
          max_points?: number | null
          quiz_id?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string | null
          chapter: number | null
          created_at: string
          created_by: string | null
          description: string | null
          download_url: string | null
          extracted_text: string | null
          file_name: string
          file_size: number
          file_type: string
          grade_id: number | null
          id: string
          is_processed: boolean | null
          isbn: string | null
          language: string | null
          metadata: Json | null
          official_source: string | null
          page_count: number | null
          published_year: number | null
          publisher: string | null
          source_url: string | null
          storage_path: string
          subject_id: number | null
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          author?: string | null
          chapter?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_url?: string | null
          extracted_text?: string | null
          file_name: string
          file_size: number
          file_type: string
          grade_id?: number | null
          id?: string
          is_processed?: boolean | null
          isbn?: string | null
          language?: string | null
          metadata?: Json | null
          official_source?: string | null
          page_count?: number | null
          published_year?: number | null
          publisher?: string | null
          source_url?: string | null
          storage_path: string
          subject_id?: number | null
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          author?: string | null
          chapter?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_url?: string | null
          extracted_text?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          grade_id?: number | null
          id?: string
          is_processed?: boolean | null
          isbn?: string | null
          language?: string | null
          metadata?: Json | null
          official_source?: string | null
          page_count?: number | null
          published_year?: number | null
          publisher?: string | null
          source_url?: string | null
          storage_path?: string
          subject_id?: number | null
          title?: string
          updated_at?: string
          version?: string | null
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
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          created_at: string
          description: string | null
          grade_id: number | null
          id: string
          is_active: boolean | null
          name: string
          section: string | null
          subject_id: number | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          description?: string | null
          grade_id?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          section?: string | null
          subject_id?: number | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          description?: string | null
          grade_id?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          section?: string | null
          subject_id?: number | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
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
      flashcard_decks: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          grade_id: number | null
          id: string
          is_public: boolean | null
          subject_id: number | null
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          grade_id?: number | null
          id?: string
          is_public?: boolean | null
          subject_id?: number | null
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          grade_id?: number | null
          id?: string
          is_public?: boolean | null
          subject_id?: number | null
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_decks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          created_at: string
          ease_factor: number | null
          flashcard_id: string
          id: string
          interval_days: number | null
          last_quality: number | null
          next_review_date: string | null
          repetitions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ease_factor?: number | null
          flashcard_id: string
          id?: string
          interval_days?: number | null
          last_quality?: number | null
          next_review_date?: string | null
          repetitions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ease_factor?: number | null
          flashcard_id?: string
          id?: string
          interval_days?: number | null
          last_quality?: number | null
          next_review_date?: string | null
          repetitions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back_image_url: string | null
          back_text: string
          created_at: string
          deck_id: string
          front_image_url: string | null
          front_text: string
          id: string
          order_index: number | null
        }
        Insert: {
          back_image_url?: string | null
          back_text: string
          created_at?: string
          deck_id: string
          front_image_url?: string | null
          front_text: string
          id?: string
          order_index?: number | null
        }
        Update: {
          back_image_url?: string | null
          back_text?: string
          created_at?: string
          deck_id?: string
          front_image_url?: string | null
          front_text?: string
          id?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string
          grade_number: number
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          grade_number: number
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          grade_number?: number
          id?: number
          name?: string
        }
        Relationships: []
      }
      learning_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          ended_at: string | null
          grade_id: number | null
          id: string
          metadata: Json | null
          session_type: string
          started_at: string
          subject_id: number | null
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          grade_id?: number | null
          id?: string
          metadata?: Json | null
          session_type?: string
          started_at?: string
          subject_id?: number | null
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          grade_id?: number | null
          id?: string
          metadata?: Json | null
          session_type?: string
          started_at?: string
          subject_id?: number | null
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          activities: Json | null
          assessment_methods: string | null
          class_id: string | null
          created_at: string
          duration_minutes: number | null
          grade_id: number | null
          id: string
          materials: Json | null
          notes: string | null
          objectives: Json | null
          scheduled_date: string | null
          status: string | null
          subject_id: number | null
          teacher_id: string
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          activities?: Json | null
          assessment_methods?: string | null
          class_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          grade_id?: number | null
          id?: string
          materials?: Json | null
          notes?: string | null
          objectives?: Json | null
          scheduled_date?: string | null
          status?: string | null
          subject_id?: number | null
          teacher_id: string
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          activities?: Json | null
          assessment_methods?: string | null
          class_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          grade_id?: number | null
          id?: string
          materials?: Json | null
          notes?: string | null
          objectives?: Json | null
          scheduled_date?: string | null
          status?: string | null
          subject_id?: number | null
          teacher_id?: string
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          created_at: string
          id: string
          lesson_plan_id: string
          notes: string | null
          order_index: number | null
          resource_id: string
          resource_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_plan_id: string
          notes?: string | null
          order_index?: number | null
          resource_id: string
          resource_type: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_plan_id?: string
          notes?: string | null
          order_index?: number | null
          resource_id?: string
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_plan_id_fkey"
            columns: ["lesson_plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          id: string
          percentage: number | null
          quiz_id: string
          score: number | null
          started_at: string
          time_taken_seconds: number | null
          total_points: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          percentage?: number | null
          quiz_id: string
          score?: number | null
          started_at?: string
          time_taken_seconds?: number | null
          total_points?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          percentage?: number | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          time_taken_seconds?: number | null
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: Json
          created_at: string
          explanation: string | null
          id: string
          options: Json | null
          order_index: number | null
          points: number | null
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer: Json
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text: string
          question_type: string
          quiz_id: string
        }
        Update: {
          correct_answer?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          grade_id: number | null
          id: string
          is_published: boolean | null
          passing_score: number | null
          subject_id: number | null
          time_limit_minutes: number | null
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          grade_id?: number | null
          id?: string
          is_published?: boolean | null
          passing_score?: number | null
          subject_id?: number | null
          time_limit_minutes?: number | null
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          grade_id?: number | null
          id?: string
          is_published?: boolean | null
          passing_score?: number | null
          subject_id?: number | null
          time_limit_minutes?: number | null
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          book_id: string | null
          content: string | null
          created_at: string
          grade_id: number | null
          id: string
          is_pinned: boolean | null
          subject_id: number | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id?: string | null
          content?: string | null
          created_at?: string
          grade_id?: number | null
          id?: string
          is_pinned?: boolean | null
          subject_id?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string | null
          content?: string | null
          created_at?: string
          grade_id?: number | null
          id?: string
          is_pinned?: boolean | null
          subject_id?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          average_score: number | null
          created_at: string
          current_streak: number | null
          flashcards_reviewed: number | null
          grade_id: number | null
          id: string
          last_study_date: string | null
          longest_streak: number | null
          notes_created: number | null
          quizzes_completed: number | null
          quizzes_passed: number | null
          subject_id: number | null
          total_study_minutes: number | null
          updated_at: string
          user_id: string
          videos_watched: number | null
        }
        Insert: {
          average_score?: number | null
          created_at?: string
          current_streak?: number | null
          flashcards_reviewed?: number | null
          grade_id?: number | null
          id?: string
          last_study_date?: string | null
          longest_streak?: number | null
          notes_created?: number | null
          quizzes_completed?: number | null
          quizzes_passed?: number | null
          subject_id?: number | null
          total_study_minutes?: number | null
          updated_at?: string
          user_id: string
          videos_watched?: number | null
        }
        Update: {
          average_score?: number | null
          created_at?: string
          current_streak?: number | null
          flashcards_reviewed?: number | null
          grade_id?: number | null
          id?: string
          last_study_date?: string | null
          longest_streak?: number | null
          notes_created?: number | null
          quizzes_completed?: number | null
          quizzes_passed?: number | null
          subject_id?: number | null
          total_study_minutes?: number | null
          updated_at?: string
          user_id?: string
          videos_watched?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
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
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
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
      video_lessons: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          grade_id: number | null
          id: string
          is_published: boolean | null
          order_index: number | null
          subject_id: number | null
          thumbnail_url: string | null
          title: string
          topic: string | null
          updated_at: string
          video_type: string | null
          video_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          grade_id?: number | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          subject_id?: number | null
          thumbnail_url?: string | null
          title: string
          topic?: string | null
          updated_at?: string
          video_type?: string | null
          video_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          grade_id?: number | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          subject_id?: number | null
          thumbnail_url?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
          video_type?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_lessons_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      video_progress: {
        Row: {
          completed: boolean | null
          id: string
          last_watched_at: string | null
          user_id: string
          video_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          id?: string
          last_watched_at?: string | null
          user_id: string
          video_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          id?: string
          last_watched_at?: string | null
          user_id?: string
          video_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avg_score: number | null
          best_streak: number | null
          total_flashcards: number | null
          total_minutes: number | null
          total_passed: number | null
          total_quizzes: number | null
          total_videos: number | null
          user_id: string | null
        }
        Relationships: []
      }
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
