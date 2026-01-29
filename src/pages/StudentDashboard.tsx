import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GradeSelector } from '@/components/student/GradeSelector';
import { SubjectSelector } from '@/components/student/SubjectSelector';
import { StudentProfile } from '@/components/student/StudentProfile';
import { BadgeDisplay } from '@/components/chat/BadgeDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Grade, Subject, StudentProgress, UserBadge } from '@/types/education';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [grades, setGrades] = useState<Grade[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
    const [progress, setProgress] = useState<StudentProgress | null>(null);
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load grades and subjects
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load grades
                const { data: gradesData, error: gradesError } = await supabase
                    .from('grades')
                    .select('*')
                    .order('grade_number');

                if (gradesError) throw gradesError;
                setGrades(gradesData || []);

                // Load subjects
                const { data: subjectsData, error: subjectsError } = await supabase
                    .from('subjects')
                    .select('*')
                    .order('name');

                if (subjectsError) throw subjectsError;
                setSubjects(subjectsData || []);

                // Create or get user profile
                const { data: profileData, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('role', 'student')
                    .limit(1)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    // PGRST116 is "no rows returned"
                    throw profileError;
                }

                let currentUserId = profileData?.id;

                if (!profileData) {
                    // Create a new student profile
                    const { data: newProfile, error: createError } = await supabase
                        .from('user_profiles')
                        .insert({ role: 'student', name: 'Student' })
                        .select()
                        .single();

                    if (createError) throw createError;
                    currentUserId = newProfile.id;
                }

                setUserId(currentUserId);

                // Load user badges
                if (currentUserId) {
                    const { data: badgesData } = await supabase
                        .from('user_badges')
                        .select('*, badge:badges(*)')
                        .eq('user_id', currentUserId);

                    setUserBadges((badgesData as unknown as UserBadge[]) || []);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load dashboard data',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [toast]);

    // Load progress when grade and subject are selected
    useEffect(() => {
        const loadProgress = async () => {
            if (!userId || !selectedGrade || !selectedSubject) return;

            const { data, error } = await supabase
                .from('student_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('grade_id', selectedGrade)
                .eq('subject_id', selectedSubject)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading progress:', error);
                return;
            }

            if (!data) {
                // Create initial progress record
                const { data: newProgress } = await supabase
                    .from('student_progress')
                    .insert({
                        user_id: userId,
                        grade_id: selectedGrade,
                        subject_id: selectedSubject,
                    })
                    .select()
                    .single();

                setProgress({
                    ...newProgress,
                    topics_completed: (newProgress.topics_completed as unknown as string[]) || []
                });
            } else {
                setProgress({
                    ...data,
                    topics_completed: data.topics_completed as string[]
                });
            }
        };

        loadProgress();
    }, [userId, selectedGrade, selectedSubject]);

    const handleStartLearning = useCallback(async () => {
        if (!selectedGrade || !selectedSubject || !userId) return;

        // Create a new conversation with context
        const selectedGradeData = grades.find((g) => g.id === selectedGrade);
        const selectedSubjectData = subjects.find((s) => s.id === selectedSubject);

        const { data: conversation, error } = await supabase
            .from('conversations')
            .insert({
                title: `${selectedGradeData?.name} - ${selectedSubjectData?.name}`,
                user_id: userId,
                role: 'student',
                grade_id: selectedGrade,
                subject_id: selectedSubject,
            })
            .select()
            .single();

        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to start learning session',
                variant: 'destructive',
            });
            return;
        }

        // Navigate to chat with context in state
        navigate(`/chat/${conversation.id}`, {
            state: {
                role: 'student',
                gradeName: selectedGradeData?.name,
                subjectName: selectedSubjectData?.name,
                gradeId: selectedGrade,
                subjectId: selectedSubject
            }
        });
    }, [selectedGrade, selectedSubject, userId, grades, subjects, navigate, toast]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/')}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
                                <p className="text-sm text-muted-foreground">
                                    Ethiopian Secondary Education • Grades 9-12
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="space-y-8">
                    {/* Profile Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <StudentProfile
                            userName="Student"
                            progress={progress || undefined}
                            badgeCount={userBadges.length}
                        />
                    </motion.div>

                    {/* Badges Section */}
                    {userBadges.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <BadgeDisplay badges={userBadges
                                .filter(ub => ub.badge)
                                .map((ub) => ({
                                    ...ub.badge!,
                                    id: ub.badge!.id.toString(),
                                    icon: ub.badge!.icon || '🏆',
                                    description: ub.badge!.description || '',
                                    criteria: ub.badge!.criteria,
                                    name: ub.badge!.name,
                                    unlocked_at: ub.earned_at
                                }))}
                            />
                        </motion.div>
                    )}

                    {/* Grade Selection */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <GradeSelector
                            grades={grades}
                            selectedGrade={selectedGrade}
                            onSelectGrade={setSelectedGrade}
                        />
                    </motion.div>

                    {/* Subject Selection */}
                    {selectedGrade && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <SubjectSelector
                                subjects={subjects}
                                selectedSubject={selectedSubject}
                                onSelectSubject={setSelectedSubject}
                            />
                        </motion.div>
                    )}

                    {/* Start Learning Button */}
                    {selectedGrade && selectedSubject && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex justify-center"
                        >
                            <Button
                                size="lg"
                                onClick={handleStartLearning}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg"
                            >
                                <MessageSquare className="w-6 h-6 mr-2" />
                                Start Learning Session
                            </Button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
