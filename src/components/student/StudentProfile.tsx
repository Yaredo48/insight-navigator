import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Trophy, Target, Flame, BookOpen } from 'lucide-react';
import type { StudentProgress } from '@/types/education';

interface StudentProfileProps {
    userName?: string;
    progress?: StudentProgress;
    badgeCount: number;
}

export const StudentProfile = ({
    userName = 'Student',
    progress,
    badgeCount,
}: StudentProfileProps) => {
    const totalInteractions = progress?.total_interactions || 0;
    const exercisesCompleted = progress?.exercises_completed || 0;
    const currentStreak = progress?.current_streak || 0;
    const topicsCompleted = progress?.topics_completed?.length || 0;

    const stats = [
        {
            label: 'Interactions',
            value: totalInteractions,
            icon: Target,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            label: 'Exercises',
            value: exercisesCompleted,
            icon: BookOpen,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
        },
        {
            label: 'Day Streak',
            value: currentStreak,
            icon: Flame,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
        },
        {
            label: 'Badges',
            value: badgeCount,
            icon: Trophy,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
        },
    ];

    return (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Welcome back, {userName}!</h2>
                    <p className="text-muted-foreground">Keep up the great work! 🎓</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {userName.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className={`${stat.bgColor} rounded-lg p-4 text-center`}
                    >
                        <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                        <div className={`text-2xl font-bold ${stat.color}`}>
                            {stat.value}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Progress Indicator */}
            {topicsCompleted > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                            Topics Completed
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {topicsCompleted} topics
                        </span>
                    </div>
                    <Progress value={Math.min((topicsCompleted / 20) * 100, 100)} className="h-2" />
                </div>
            )}

            {/* Streak Motivation */}
            {currentStreak > 0 && (
                <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-medium text-foreground">
                            {currentStreak} day streak! Keep it going! 🔥
                        </span>
                    </div>
                </div>
            )}
        </Card>
    );
};
