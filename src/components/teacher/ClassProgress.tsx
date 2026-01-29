import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Award, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { StudentProgress, Grade, Subject } from '@/types/education';

interface ProgressWithDetails extends StudentProgress {
    grade?: Grade;
    subject?: Subject;
}

export const ClassProgress = () => {
    const [progressData, setProgressData] = useState<ProgressWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalInteractions, setTotalInteractions] = useState(0);
    const [averageProgress, setAverageProgress] = useState(0);

    useEffect(() => {
        const loadProgress = async () => {
            try {
                // Load all student progress with grade and subject details
                const { data, error } = await supabase
                    .from('student_progress')
                    .select(`
            *,
            grade:grades(*),
            subject:subjects(*)
          `)
                    .order('total_interactions', { ascending: false });

                if (error) throw error;

                setProgressData((data as unknown as ProgressWithDetails[]) || []);

                // Calculate stats
                const uniqueStudents = new Set(data?.map((p) => p.user_id) || []);
                setTotalStudents(uniqueStudents.size);

                const totalInt = data?.reduce((sum, p) => sum + p.total_interactions, 0) || 0;
                setTotalInteractions(totalInt);

                const avgExercises = data?.length
                    ? data.reduce((sum, p) => sum + p.exercises_completed, 0) / data.length
                    : 0;
                setAverageProgress(avgExercises);
            } catch (error) {
                console.error('Error loading progress:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProgress();
    }, []);

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading class progress...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 bg-blue-500/5 border-blue-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
                            <p className="text-sm text-muted-foreground">Active Students</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-green-500/5 border-green-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                            <Activity className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{totalInteractions}</p>
                            <p className="text-sm text-muted-foreground">Total Interactions</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-purple-500/5 border-purple-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                            <Award className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {Math.round(averageProgress)}
                            </p>
                            <p className="text-sm text-muted-foreground">Avg. Exercises</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-orange-500/5 border-orange-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {progressData.length}
                            </p>
                            <p className="text-sm text-muted-foreground">Subject Enrollments</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Detailed Progress */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Student Progress by Subject</h3>

                {progressData.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No student activity yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Progress will appear here as students engage with the system
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                            {progressData.map((progress) => (
                                <Card key={progress.id} className="p-4">
                                    <div className="space-y-3">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    S
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">Student</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {progress.grade && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {progress.grade.name}
                                                            </Badge>
                                                        )}
                                                        {progress.subject && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {progress.subject.name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {progress.total_interactions} interactions
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {progress.current_streak} day streak 🔥
                                                </p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">
                                                    Exercises Completed
                                                </span>
                                                <span className="text-sm font-semibold text-foreground">
                                                    {progress.exercises_completed}
                                                </span>
                                            </div>
                                            <Progress
                                                value={Math.min((progress.exercises_completed / 50) * 100, 100)}
                                                className="h-2"
                                            />
                                        </div>

                                        {/* Topics */}
                                        {progress.topics_completed && progress.topics_completed.length > 0 && (
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Topics Completed: {progress.topics_completed.length}
                                                </p>
                                                <div className="flex flex-wrap gap-1">
                                                    {progress.topics_completed.slice(0, 5).map((topic, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {topic}
                                                        </Badge>
                                                    ))}
                                                    {progress.topics_completed.length > 5 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            +{progress.topics_completed.length - 5} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </Card>
        </div>
    );
};
