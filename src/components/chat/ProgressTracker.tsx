import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target } from 'lucide-react';
import { UserProgress } from '@/types/troubleshooting';
import { BadgeDisplay } from './BadgeDisplay';

interface ProgressTrackerProps {
    userProgress: UserProgress | null;
    currentStepIndex?: number;
    totalSteps?: number;
    showBadges?: boolean;
}

export function ProgressTracker({
    userProgress,
    currentStepIndex,
    totalSteps,
    showBadges = true,
}: ProgressTrackerProps) {
    const flowProgress = currentStepIndex !== undefined && totalSteps
        ? ((currentStepIndex + 1) / totalSteps) * 100
        : 0;

    return (
        <div className="space-y-4">
            {/* Current Flow Progress */}
            {currentStepIndex !== undefined && totalSteps && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">
                                Current Flow Progress
                            </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            Step {currentStepIndex + 1} of {totalSteps}
                        </span>
                    </div>
                    <Progress value={flowProgress} className="h-2" />
                </motion.div>
            )}

            {/* Overall User Progress */}
            {userProgress && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium text-foreground">
                                Overall Progress
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                            {userProgress.flows_completed} flow{userProgress.flows_completed !== 1 ? 's' : ''} completed
                        </span>
                    </div>

                    {/* Badges */}
                    {showBadges && userProgress.badges.length > 0 && (
                        <BadgeDisplay badges={userProgress.badges} compact />
                    )}

                    {/* Next Milestone */}
                    {userProgress.flows_completed < 25 && (
                        <div className="text-xs text-muted-foreground">
                            {getNextMilestone(userProgress.flows_completed)}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

function getNextMilestone(flowsCompleted: number): string {
    if (flowsCompleted < 1) {
        return '🏆 Complete your first flow to earn the "First Fix" badge!';
    } else if (flowsCompleted < 5) {
        return `🔧 ${5 - flowsCompleted} more flow${5 - flowsCompleted !== 1 ? 's' : ''} until "Tech Wizard" badge!`;
    } else if (flowsCompleted < 10) {
        return `🧠 ${10 - flowsCompleted} more flow${10 - flowsCompleted !== 1 ? 's' : ''} until "Problem Solver" badge!`;
    } else if (flowsCompleted < 25) {
        return `👑 ${25 - flowsCompleted} more flow${25 - flowsCompleted !== 1 ? 's' : ''} until "Master Troubleshooter" badge!`;
    }
    return '🎉 You\'ve unlocked all milestone badges!';
}
