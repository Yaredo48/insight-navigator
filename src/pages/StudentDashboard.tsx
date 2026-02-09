import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, BookOpen, ClipboardList, Megaphone, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GradeSelector } from '@/components/student/GradeSelector';
import { SubjectSelector } from '@/components/student/SubjectSelector';
import { StudentProfile } from '@/components/student/StudentProfile';
import { BadgeDisplay } from '@/components/chat/BadgeDisplay';
import { StudentAssignmentManager } from '@/components/student/assignments';
import { StudentAnnouncementList } from '@/components/student/StudentAnnouncementList';
import { PerformanceDashboard } from '@/components/student/analytics';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import type { Grade, Subject, UserBadge } from '@/types/education';

const GRADES: Grade[] = [
  { id: 9, grade_number: 9, name: 'Grade 9' },
  { id: 10, grade_number: 10, name: 'Grade 10' },
  { id: 11, grade_number: 11, name: 'Grade 11' },
  { id: 12, grade_number: 12, name: 'Grade 12' },
];

const SUBJECTS: Subject[] = [
  { id: 1, name: 'Mathematics', code: 'MATH' },
  { id: 2, name: 'Physics', code: 'PHY' },
  { id: 3, name: 'Chemistry', code: 'CHEM' },
  { id: 4, name: 'Biology', code: 'BIO' },
  { id: 5, name: 'English', code: 'ENG' },
  { id: 6, name: 'Amharic', code: 'AMH' },
  { id: 7, name: 'History', code: 'HIST' },
  { id: 8, name: 'Geography', code: 'GEO' },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, profile, user } = useAuth();

  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [userBadges] = useState<UserBadge[]>([]);
  // Use the authenticated user's ID, or fallback if not loaded (though protected route handles this)
  const studentId = user?.id || '';

  const { progressData, fetchProgress } = useStudentProgress(studentId);

  // Transform progressData to match StudentProfile expectation (StudentProgress interface)
  // We aggregate the data from the hook to create a single progress object
  const progress: StudentProgress | null = progressData.length > 0 ? {
    id: progressData[0].id,
    user_id: progressData[0].user_id,
    grade_id: progressData[0].grade_id || 0,
    subject_id: progressData[0].subject_id || 0,
    topics_completed: [], // data not available in hook yet
    exercises_completed: progressData.reduce((acc, p) => acc + (p.quizzes_completed || 0), 0), // mapping quizzes to exercises for now
    current_streak: Math.max(...progressData.map(p => p.current_streak || 0)),
    total_interactions: progressData.reduce((acc, p) => acc + (p.quizzes_completed + p.flashcards_reviewed + p.videos_watched), 0),
    created_at: progressData[0].created_at,
    updated_at: progressData[0].updated_at
  } : null;

  // Fetch progress on mount
  // Fetch progress on mount
  useEffect(() => {
    if (studentId) fetchProgress();
  }, [studentId, fetchProgress]);

  const handleStartLearning = useCallback(async () => {
    if (!selectedGrade || !selectedSubject) return;

    const selectedGradeData = GRADES.find((g) => g.id === selectedGrade);
    const selectedSubjectData = SUBJECTS.find((s) => s.id === selectedSubject);

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        title: `${selectedGradeData?.name} - ${selectedSubjectData?.name}`,
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

    navigate(`/chat/${conversation.id}`, {
      state: {
        role: 'student',
        gradeName: selectedGradeData?.name,
        subjectName: selectedSubjectData?.name,
        gradeId: selectedGrade,
        subjectId: selectedSubject,
      },
    });
  }, [selectedGrade, selectedSubject, navigate, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Ethiopian Secondary Education • Grades 9-12
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profile?.name && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Welcome, {profile.name}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="home">
              <BookOpen className="w-4 h-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger value="assignments">
              <ClipboardList className="w-4 h-4 mr-2" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Megaphone className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <div className="space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <StudentProfile
                  userName="Student"
                  progress={progress || undefined}
                  badgeCount={userBadges.length}
                />
              </motion.div>

              {userBadges.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <BadgeDisplay
                    badges={userBadges
                      .filter((ub) => ub.badge)
                      .map((ub) => ({
                        ...ub.badge!,
                        id: ub.badge!.id.toString(),
                        icon: ub.badge!.icon || '🏆',
                        description: ub.badge!.description || '',
                        criteria: ub.badge!.criteria,
                        name: ub.badge!.name,
                        unlocked_at: ub.earned_at,
                      }))}
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GradeSelector
                  grades={GRADES}
                  selectedGrade={selectedGrade}
                  onSelectGrade={setSelectedGrade}
                />
              </motion.div>

              {selectedGrade && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <SubjectSelector
                    subjects={SUBJECTS}
                    selectedSubject={selectedSubject}
                    onSelectSubject={setSelectedSubject}
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row justify-center gap-4"
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/learn')}
                  className="px-8 py-6 text-lg"
                >
                  <BookOpen className="w-6 h-6 mr-2" />
                  Learning Center
                </Button>
                {selectedGrade && selectedSubject && (
                  <Button
                    size="lg"
                    onClick={handleStartLearning}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 py-6 text-lg"
                  >
                    <MessageSquare className="w-6 h-6 mr-2" />
                    Start Learning Session
                  </Button>
                )}
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="assignments">
            <StudentAssignmentManager studentId={studentId} />
          </TabsContent>

          <TabsContent value="announcements">
            <StudentAnnouncementList studentId={studentId} />
          </TabsContent>

          <TabsContent value="analytics">
            <PerformanceDashboard studentId={studentId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
