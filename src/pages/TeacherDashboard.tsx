import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Users, Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourceLibrary } from '@/components/teacher/ResourceLibrary';
import { ClassProgress } from '@/components/teacher/ClassProgress';
import { DocumentUploader } from '@/components/teacher/DocumentUploader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadTeacherProfile = async () => {
            try {
                // Get or create teacher profile
                const { data: profileData, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('role', 'teacher')
                    .limit(1)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    throw profileError;
                }

                let currentUserId = profileData?.id;

                if (!profileData) {
                    // Create a new teacher profile
                    const { data: newProfile, error: createError } = await supabase
                        .from('user_profiles')
                        .insert({ role: 'teacher', name: 'Teacher' })
                        .select()
                        .single();

                    if (createError) throw createError;
                    currentUserId = newProfile.id;
                }

                setUserId(currentUserId);
            } catch (error) {
                console.error('Error loading teacher profile:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load teacher profile',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadTeacherProfile();
    }, [toast]);

    const handleViewStudentDashboard = () => {
        navigate('/student');
    };

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
            <div className="border-b bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm sticky top-0 z-10">
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
                                <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage resources, track progress, and support learning
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleViewStudentDashboard}
                            className="gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            View Student Dashboard
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Welcome Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="p-6 mb-8 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">
                                    Welcome, Teacher! 👨‍🏫
                                </h2>
                                <p className="text-muted-foreground">
                                    Access curriculum resources, manage lesson plans, and monitor student progress
                                </p>
                            </div>
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                T
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                >
                    <Card className="p-6 bg-blue-500/5 border-blue-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <BookOpen className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">7</p>
                                <p className="text-sm text-muted-foreground">Subjects</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-green-500/5 border-green-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <Users className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">4</p>
                                <p className="text-sm text-muted-foreground">Grade Levels</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-purple-500/5 border-purple-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <Upload className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">Ready</p>
                                <p className="text-sm text-muted-foreground">Upload Materials</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Main Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Tabs defaultValue="resources" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                            <TabsTrigger value="resources">Resource Library</TabsTrigger>
                            <TabsTrigger value="upload">Upload Materials</TabsTrigger>
                            <TabsTrigger value="progress">Class Progress</TabsTrigger>
                        </TabsList>

                        <TabsContent value="resources" className="space-y-4">
                            <ResourceLibrary userId={userId} />
                        </TabsContent>

                        <TabsContent value="upload" className="space-y-4">
                            <DocumentUploader userId={userId} />
                        </TabsContent>

                        <TabsContent value="progress" className="space-y-4">
                            <ClassProgress />
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
