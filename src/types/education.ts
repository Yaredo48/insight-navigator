export type UserRole = 'student' | 'teacher';

export interface UserProfile {
    id: string;
    role: UserRole;
    name?: string;
    created_at: string;
    updated_at: string;
}

export interface Grade {
    id: number;
    grade_number: number;
    name: string;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
}

export interface StudentProgress {
    id: string;
    user_id: string;
    grade_id: number;
    subject_id: number;
    topics_completed: string[];
    exercises_completed: number;
    current_streak: number;
    total_interactions: number;
    last_interaction_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Badge {
    id: number;
    name: string;
    description?: string;
    icon?: string;
    criteria: Record<string, unknown>;
    created_at: string;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_id: number;
    earned_at: string;
    badge?: Badge;
}

export interface TeacherResource {
    id: string;
    title: string;
    description?: string;
    resource_type: 'lesson_plan' | 'quiz' | 'exercise' | 'guide';
    grade_id?: number;
    subject_id?: number;
    content?: Record<string, unknown>;
    file_url?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface DocumentMetadata {
    document_type?: 'textbook' | 'teacher_guide' | 'lesson_plan' | 'exercise' | 'student_note';
    grade_id?: number;
    subject_id?: number;
    chapter?: string;
    topics?: string[];
}

export interface Book {
    id: string;
    title: string;
    author?: string;
    publisher?: string;
    isbn?: string;
    description?: string;
    grade_id?: number;
    subject_id?: number;
    chapter?: number;
    version?: string;
    language?: string;
    file_name: string;
    file_size: number;
    file_type: string;
    storage_path: string;
    download_url?: string;
    source_url?: string;
    official_source?: string;
    extracted_text?: string;
    metadata?: Record<string, unknown>;
    is_processed?: boolean;
    page_count?: number;
    published_year?: number;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}
