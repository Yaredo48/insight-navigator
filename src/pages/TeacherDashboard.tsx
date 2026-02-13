import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Users, Upload, Eye, FolderTree, ClipboardList, Megaphone, Calendar, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourceLibrary } from '@/components/teacher/ResourceLibrary';
import { ClassProgress } from '@/components/teacher/ClassProgress';
import { DocumentUploader } from '@/components/teacher/DocumentUploader';
import { ClassManager } from '@/components/teacher/classes';
import { AssignmentManager } from '@/components/teacher/assignments';
import { AnnouncementManager } from '@/components/teacher/announcements';
import { LessonPlanManager } from '@/components/teacher/lessons';
import { AnalyticsDashboard } from '@/components/teacher/analytics';
import { useAuth } from '@/contexts/AuthContext';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  // Use the authenticated user's ID
  const userId = user?.id;

  const handleViewStudentDashboard = () => {
    navigate('/student');
  };

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
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {profile?.name}
              </span>
              <Button
                variant="outline"
                onClick={() => navigate('/content')}
                className="gap-2"
              >
                <FolderTree className="w-4 h-4" />
                Content Manager
              </Button>
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



        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs defaultValue="classes" className="space-y-6">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1">
              <TabsTrigger value="classes" className="gap-2">
                <Users className="w-4 h-4" />
                Classes
              </TabsTrigger>
              <TabsTrigger value="assignments" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Assignments
              </TabsTrigger>
              <TabsTrigger value="announcements" className="gap-2">
                <Megaphone className="w-4 h-4" />
                Announcements
              </TabsTrigger>
              <TabsTrigger value="lessons" className="gap-2">
                <Calendar className="w-4 h-4" />
                Lesson Plans
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="resources">Resource Library</TabsTrigger>
              <TabsTrigger value="upload">Upload Materials</TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="space-y-4">
              <ClassManager userId={userId} />
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <AssignmentManager userId={userId} />
            </TabsContent>

            <TabsContent value="announcements" className="space-y-4">
              <AnnouncementManager userId={userId} />
            </TabsContent>

            <TabsContent value="lessons" className="space-y-4">
              <LessonPlanManager userId={userId} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <AnalyticsDashboard userId={userId} />
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <ResourceLibrary userId={userId} />
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <DocumentUploader userId={userId} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
