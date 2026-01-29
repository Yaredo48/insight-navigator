import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    TroubleshootingSession,
    TroubleshootingFlowData,
    UserProgress,
    StepHistoryEntry,
    Badge,
    BADGE_DEFINITIONS,
    BadgeId,
} from '@/types/troubleshooting';

// Generate a simple user ID for anonymous users (stored in localStorage)
const getUserId = (): string => {
    let userId = localStorage.getItem('troubleshooting_user_id');
    if (!userId) {
        userId = `user_${crypto.randomUUID()}`;
        localStorage.setItem('troubleshooting_user_id', userId);
    }
    return userId;
};

export function useTroubleshooting() {
    const [activeSession, setActiveSession] = useState<TroubleshootingSession | null>(null);
    const [currentFlow, setCurrentFlow] = useState<TroubleshootingFlowData | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Load user progress
    const loadUserProgress = useCallback(async () => {
        const userId = getUserId();

        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error loading user progress:', error);
            return;
        }

        if (data) {
            setUserProgress(data as unknown as UserProgress);
        } else {
            // Create initial progress record
            const { data: newProgress, error: createError } = await supabase
                .from('user_progress')
                .insert({
                    user_id: userId,
                    flows_completed: 0,
                    badges: [],
                    tips_unlocked: [],
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating user progress:', createError);
                return;
            }

            setUserProgress(newProgress as unknown as UserProgress);
        }
    }, []);

    // Start a new troubleshooting flow
    const startFlow = useCallback(async (
        conversationId: string,
        flowId?: string,
        issueDescription?: string
    ): Promise<TroubleshootingSession | null> => {
        setIsLoading(true);

        try {
            let selectedFlowId = flowId;
            let flow: TroubleshootingFlowData | null = null;

            // If no flowId provided, try to find a matching flow or use a default
            if (!selectedFlowId && issueDescription) {
                // Simple keyword matching for demo
                const lowerIssue = issueDescription.toLowerCase();

                const { data: flows } = await supabase
                    .from('troubleshooting_flows')
                    .select('*');

                if (flows && flows.length > 0) {
                    const typedFlows = flows as unknown as TroubleshootingFlowData[];
                    // Match keywords to categories
                    if (lowerIssue.includes('turn on') || lowerIssue.includes('power') || lowerIssue.includes('device')) {
                        flow = typedFlows.find(f => f.category === 'device') || typedFlows[0];
                    } else if (lowerIssue.includes('internet') || lowerIssue.includes('wifi') || lowerIssue.includes('connection')) {
                        flow = typedFlows.find(f => f.category === 'connection') || typedFlows[0];
                    } else if (lowerIssue.includes('upload') || lowerIssue.includes('file') || lowerIssue.includes('document')) {
                        flow = typedFlows.find(f => f.category === 'upload') || typedFlows[0];
                    } else {
                        // For generic "Start Guide" or unknown issues, try to find a general flow or default to the first one
                        flow = typedFlows.find(f => f.category === 'general') || typedFlows[0];
                    }

                    selectedFlowId = flow?.id;
                }
            } else if (selectedFlowId) {
                // Load the specified flow
                const { data: flowData } = await supabase
                    .from('troubleshooting_flows')
                    .select('*')
                    .eq('id', selectedFlowId)
                    .single();

                flow = flowData as unknown as TroubleshootingFlowData;
            }

            if (!selectedFlowId || !flow) {
                toast({
                    title: 'Error',
                    description: 'No troubleshooting flow found for this issue',
                    variant: 'destructive',
                });
                return null;
            }

            // Create a new session
            const { data: session, error } = await supabase
                .from('troubleshooting_sessions')
                .insert({
                    conversation_id: conversationId,
                    flow_id: selectedFlowId,
                    current_step_index: 0,
                    step_history: [],
                    status: 'active',
                    metadata: {
                        issue_description: issueDescription,
                        started_at: new Date().toISOString(),
                    },
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating session:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to start troubleshooting session',
                    variant: 'destructive',
                });
                return null;
            }

            const newSession = session as unknown as TroubleshootingSession;
            setActiveSession(newSession);
            setCurrentFlow(flow);

            return newSession;
        } catch (error) {
            console.error('Error starting flow:', error);
            toast({
                title: 'Error',
                description: 'Failed to start troubleshooting flow',
                variant: 'destructive',
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Complete a session
    const completeSession = useCallback(async (sessionId: string): Promise<void> => {
        if (!activeSession) return;

        const completedAt = new Date().toISOString();
        const startedAt = activeSession.metadata?.started_at || activeSession.started_at;
        const duration = new Date(completedAt).getTime() - new Date(startedAt as string).getTime();
        const durationMinutes = duration / 1000 / 60;

        // Update session status
        await supabase
            .from('troubleshooting_sessions')
            .update({
                status: 'completed',
                completed_at: completedAt,
            })
            .eq('id', sessionId);

        // Update user progress
        const userId = getUserId();
        const newFlowsCompleted = (userProgress?.flows_completed || 0) + 1;

        // Check for new badges
        const newBadges: Badge[] = [...(userProgress?.badges || [])];
        const existingBadgeIds = new Set(newBadges.map(b => b.id));

        // First Fix badge
        if (newFlowsCompleted === 1 && !existingBadgeIds.has(BADGE_DEFINITIONS.FIRST_FIX.id)) {
            newBadges.push({
                ...BADGE_DEFINITIONS.FIRST_FIX,
                unlocked_at: completedAt,
            });

            toast({
                title: '🏆 Badge Unlocked!',
                description: 'First Fix - You completed your first troubleshooting flow!',
            });
        }

        // Tech Wizard badge
        if (newFlowsCompleted === 5 && !existingBadgeIds.has(BADGE_DEFINITIONS.TECH_WIZARD.id)) {
            newBadges.push({
                ...BADGE_DEFINITIONS.TECH_WIZARD,
                unlocked_at: completedAt,
            });

            toast({
                title: '🔧 Badge Unlocked!',
                description: 'Tech Wizard - You completed 5 troubleshooting flows!',
            });
        }

        // Speed Demon badge (under 2 minutes)
        if (durationMinutes < 2 && !existingBadgeIds.has(BADGE_DEFINITIONS.SPEED_DEMON.id)) {
            newBadges.push({
                ...BADGE_DEFINITIONS.SPEED_DEMON,
                unlocked_at: completedAt,
            });

            toast({
                title: '⚡ Badge Unlocked!',
                description: 'Speed Demon - You completed a flow in under 2 minutes!',
            });
        }

        // Perfect Path badge (no backtracking)
        const stepIds = activeSession.step_history.map(h => h.stepId);
        const uniqueSteps = new Set(stepIds);
        if (stepIds.length === uniqueSteps.size && !existingBadgeIds.has(BADGE_DEFINITIONS.PERFECT_PATH.id)) {
            newBadges.push({
                ...BADGE_DEFINITIONS.PERFECT_PATH,
                unlocked_at: completedAt,
            });

            toast({
                title: '🎯 Badge Unlocked!',
                description: 'Perfect Path - You completed a flow without backtracking!',
            });
        }

        // Problem Solver badge
        if (newFlowsCompleted === 10 && !existingBadgeIds.has(BADGE_DEFINITIONS.PROBLEM_SOLVER.id)) {
            newBadges.push({
                ...BADGE_DEFINITIONS.PROBLEM_SOLVER,
                unlocked_at: completedAt,
            });

            toast({
                title: '🧠 Badge Unlocked!',
                description: 'Problem Solver - You completed 10 troubleshooting flows!',
            });
        }

        // Master Troubleshooter badge
        if (newFlowsCompleted === 25 && !existingBadgeIds.has(BADGE_DEFINITIONS.MASTER_TROUBLESHOOTER.id)) {
            newBadges.push({
                ...BADGE_DEFINITIONS.MASTER_TROUBLESHOOTER,
                unlocked_at: completedAt,
            });

            toast({
                title: '👑 Badge Unlocked!',
                description: 'Master Troubleshooter - You completed 25 troubleshooting flows!',
            });
        }

        await supabase
            .from('user_progress')
            .update({
                flows_completed: newFlowsCompleted,
                badges: newBadges as unknown as undefined, // Type cast for Json
                last_active: completedAt,
            })
            .eq('user_id', userId);

        // Reload progress
        await loadUserProgress();

        // Clear active session
        setActiveSession(null);
        setCurrentFlow(null);

        toast({
            title: 'Flow Completed!',
            description: 'Great job troubleshooting! 🎉',
        });
    }, [activeSession, userProgress, toast, loadUserProgress]);

    // Respond to a step (yes/no)
    const respondToStep = useCallback(async (
        sessionId: string,
        response: 'yes' | 'no'
    ): Promise<boolean> => {
        if (!activeSession || !currentFlow) return false;

        setIsLoading(true);

        try {
            const currentStep = currentFlow.steps[activeSession.current_step_index];

            // Add to step history
            const newHistoryEntry: StepHistoryEntry = {
                stepId: currentStep.id,
                response,
                timestamp: new Date().toISOString(),
            };

            const updatedHistory = [...activeSession.step_history, newHistoryEntry];

            // Determine next step based on response
            let nextStepId: string | undefined;

            if (currentStep.type === 'yes_no' && currentStep.branches) {
                nextStepId = currentStep.branches[response];
            } else if (currentStep.next) {
                nextStepId = currentStep.next;
            }

            // Find next step index
            const nextStepIndex = nextStepId
                ? currentFlow.steps.findIndex(s => s.id === nextStepId)
                : -1;

            if (nextStepIndex === -1) {
                // No next step, complete the session
                await completeSession(sessionId);
                return true;
            }

            // Update session
            const { error } = await supabase
                .from('troubleshooting_sessions')
                .update({
                    current_step_index: nextStepIndex,
                    step_history: updatedHistory as unknown as undefined, // Type cast for Json
                })
                .eq('id', sessionId);

            if (error) {
                console.error('Error updating session:', error);
                return false;
            }

            // Update local state
            setActiveSession({
                ...activeSession,
                current_step_index: nextStepIndex,
                step_history: updatedHistory,
            });

            return true;
        } catch (error) {
            console.error('Error responding to step:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [activeSession, currentFlow, completeSession]);

    // Abandon a session
    const abandonSession = useCallback(async (sessionId: string): Promise<void> => {
        await supabase
            .from('troubleshooting_sessions')
            .update({
                status: 'abandoned',
            })
            .eq('id', sessionId);

        setActiveSession(null);
        setCurrentFlow(null);
    }, []);

    // Load active session for a conversation
    const loadActiveSession = useCallback(async (conversationId: string): Promise<void> => {
        const { data: session } = await supabase
            .from('troubleshooting_sessions')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('status', 'active')
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

        if (session) {
            setActiveSession(session as unknown as TroubleshootingSession);

            // Load the flow
            if (session.flow_id) {
                const { data: flow } = await supabase
                    .from('troubleshooting_flows')
                    .select('*')
                    .eq('id', session.flow_id)
                    .single();

                if (flow) {
                    setCurrentFlow(flow as unknown as TroubleshootingFlowData);
                }
            }
        }
    }, []);

    // Load user progress on mount
    useEffect(() => {
        loadUserProgress();
    }, [loadUserProgress]);

    return {
        activeSession,
        currentFlow,
        userProgress,
        isLoading,
        startFlow,
        respondToStep,
        completeSession,
        abandonSession,
        loadUserProgress,
        loadActiveSession,
    };
}
