// Type definitions for the Smart Interactive Troubleshooting Flow feature

export type StepType = 'yes_no' | 'instruction' | 'success' | 'error';

export interface StepBranches {
    yes?: string;
    no?: string;
}

export interface StepVisual {
    type: 'image' | 'video' | 'diagram';
    url: string;
    alt?: string;
}

export interface TroubleshootingStep {
    id: string;
    question?: string;
    message?: string;
    type: StepType;
    branches?: StepBranches;
    next?: string;
    tip?: string;
    visual?: StepVisual;
}

export interface TroubleshootingFlowData {
    id: string;
    title: string;
    description: string;
    category: string;
    steps: TroubleshootingStep[];
    created_at?: string;
    updated_at?: string;
}

export interface StepHistoryEntry {
    stepId: string;
    response?: 'yes' | 'no';
    timestamp: string;
}

export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface TroubleshootingSession {
    id: string;
    conversation_id: string;
    flow_id: string | null;
    current_step_index: number;
    step_history: StepHistoryEntry[];
    status: SessionStatus;
    started_at: string;
    completed_at?: string;
    metadata: Record<string, any>;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked_at: string;
}

export interface Tip {
    id: string;
    title: string;
    content: string;
    category: string;
    unlocked_at: string;
}

export interface UserProgress {
    id: string;
    user_id: string;
    flows_completed: number;
    badges: Badge[];
    tips_unlocked: Tip[];
    last_active: string;
    created_at: string;
}

// Badge definitions
export const BADGE_DEFINITIONS = {
    FIRST_FIX: {
        id: 'first_fix',
        name: 'First Fix',
        description: 'Complete your first troubleshooting flow',
        icon: '🏆',
    },
    TECH_WIZARD: {
        id: 'tech_wizard',
        name: 'Tech Wizard',
        description: 'Complete 5 troubleshooting flows',
        icon: '🔧',
    },
    SPEED_DEMON: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a flow in under 2 minutes',
        icon: '⚡',
    },
    PERFECT_PATH: {
        id: 'perfect_path',
        name: 'Perfect Path',
        description: 'Complete a flow without backtracking',
        icon: '🎯',
    },
    PROBLEM_SOLVER: {
        id: 'problem_solver',
        name: 'Problem Solver',
        description: 'Complete 10 troubleshooting flows',
        icon: '🧠',
    },
    MASTER_TROUBLESHOOTER: {
        id: 'master_troubleshooter',
        name: 'Master Troubleshooter',
        description: 'Complete 25 troubleshooting flows',
        icon: '👑',
    },
} as const;

export type BadgeId = keyof typeof BADGE_DEFINITIONS;

// Helper type for creating new sessions
export interface CreateSessionInput {
    conversation_id: string;
    flow_id?: string;
    metadata?: Record<string, any>;
}

// Helper type for updating session progress
export interface UpdateSessionInput {
    current_step_index?: number;
    step_history?: StepHistoryEntry[];
    status?: SessionStatus;
    completed_at?: string;
    metadata?: Record<string, any>;
}

// Response type for step progression
export interface StepResponse {
    response: 'yes' | 'no';
    timestamp: string;
}

// Flow generation request (for AI-generated flows)
export interface GenerateFlowRequest {
    issue_description: string;
    conversation_id: string;
    category?: string;
}

// Flow generation response
export interface GenerateFlowResponse {
    flow: TroubleshootingFlowData;
    session: TroubleshootingSession;
}
