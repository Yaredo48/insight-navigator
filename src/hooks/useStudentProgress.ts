import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface StudentProgressData {
  id: string;
  user_id: string;
  grade_id?: number;
  subject_id?: number;
  quizzes_completed: number;
  quizzes_passed: number;
  average_score?: number;
  flashcards_reviewed: number;
  videos_watched: number;
  notes_created: number;
  current_streak: number;
  longest_streak: number;
  last_study_date?: string;
  total_study_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface LeaderboardEntry {
  user_id: string;
  total_quizzes: number;
  total_passed: number;
  avg_score: number;
  total_flashcards: number;
  total_videos: number;
  best_streak: number;
  total_minutes: number;
  rank?: number;
}

export function useStudentProgress(userId: string = 'anonymous') {
  const [progressData, setProgressData] = useState<StudentProgressData[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchProgress = useCallback(async (gradeId?: number, subjectId?: number) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', userId);

      if (gradeId) query = query.eq('grade_id', gradeId);
      if (subjectId) query = query.eq('subject_id', subjectId);

      const { data, error } = await query;
      if (error) throw error;
      setProgressData((data || []) as StudentProgressData[]);
      return (data || []) as StudentProgressData[];
    } catch (error) {
      console.error('Error fetching progress:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const updateProgress = useCallback(async (
    gradeId: number | null,
    subjectId: number | null,
    updates: Partial<{
      quizzes_completed: number;
      quizzes_passed: number;
      average_score: number;
      flashcards_reviewed: number;
      videos_watched: number;
      notes_created: number;
      total_study_minutes: number;
    }>,
    increment: boolean = true
  ) => {
    try {
      // Find existing progress
      let query = supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', userId);
      
      if (gradeId !== null) {
        query = query.eq('grade_id', gradeId);
      } else {
        query = query.is('grade_id', null);
      }
      
      if (subjectId !== null) {
        query = query.eq('subject_id', subjectId);
      } else {
        query = query.is('subject_id', null);
      }

      const { data: existing } = await query.maybeSingle();

      const today = new Date().toISOString().split('T')[0];
      let currentStreak = existing?.current_streak || 0;
      let longestStreak = existing?.longest_streak || 0;

      // Update streak
      if (existing?.last_study_date) {
        const lastDate = new Date(existing.last_study_date);
        const daysDiff = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak += 1;
        } else if (daysDiff > 1) {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      longestStreak = Math.max(longestStreak, currentStreak);

      const updateData: Record<string, unknown> = {
        ...updates,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_study_date: today
      };

      if (increment && existing) {
        // Increment values
        Object.keys(updates).forEach(key => {
          if (key !== 'average_score') {
            updateData[key] = (existing[key as keyof typeof existing] as number || 0) + (updates[key as keyof typeof updates] as number || 0);
          }
        });
      }

      if (existing) {
        const { data, error } = await supabase
          .from('student_progress')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as StudentProgressData;
      } else {
        const { data, error } = await supabase
          .from('student_progress')
          .insert({
            user_id: userId,
            grade_id: gradeId,
            subject_id: subjectId,
            ...updateData
          })
          .select()
          .single();

        if (error) throw error;
        return data as StudentProgressData;
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      return null;
    }
  }, [userId]);

  const fetchBadges = useCallback(async () => {
    try {
      const [badgesRes, earnedRes] = await Promise.all([
        supabase.from('badges').select('*').order('requirement_value'),
        supabase.from('user_badges').select('*, badges(*)').eq('user_id', userId)
      ]);

      if (badgesRes.error) throw badgesRes.error;
      if (earnedRes.error) throw earnedRes.error;

      setBadges((badgesRes.data || []) as Badge[]);
      setEarnedBadges((earnedRes.data || []).map(ub => ({
        ...ub,
        badge: ub.badges as unknown as Badge
      })) as UserBadge[]);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  }, [userId]);

  const checkAndAwardBadges = useCallback(async () => {
    try {
      // Get user's total progress
      const { data: allProgress } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', userId);

      if (!allProgress?.length) return [];

      // Aggregate totals
      const totals = allProgress.reduce((acc, p) => ({
        quizzes_completed: acc.quizzes_completed + (p.quizzes_completed || 0),
        flashcards_reviewed: acc.flashcards_reviewed + (p.flashcards_reviewed || 0),
        videos_watched: acc.videos_watched + (p.videos_watched || 0),
        notes_created: acc.notes_created + (p.notes_created || 0),
        current_streak: Math.max(acc.current_streak, p.current_streak || 0),
        total_study_minutes: acc.total_study_minutes + (p.total_study_minutes || 0)
      }), {
        quizzes_completed: 0,
        flashcards_reviewed: 0,
        videos_watched: 0,
        notes_created: 0,
        current_streak: 0,
        total_study_minutes: 0
      });

      // Get all badges and earned badges
      const [allBadges, earned] = await Promise.all([
        supabase.from('badges').select('*'),
        supabase.from('user_badges').select('badge_id').eq('user_id', userId)
      ]);

      const earnedIds = new Set((earned.data || []).map(e => e.badge_id));
      const newBadges: Badge[] = [];

      // Check each badge
      for (const badge of (allBadges.data || []) as Badge[]) {
        if (earnedIds.has(badge.id)) continue;

        let earned = false;
        switch (badge.requirement_type) {
          case 'quizzes_completed':
            earned = totals.quizzes_completed >= badge.requirement_value;
            break;
          case 'flashcards_reviewed':
            earned = totals.flashcards_reviewed >= badge.requirement_value;
            break;
          case 'videos_watched':
            earned = totals.videos_watched >= badge.requirement_value;
            break;
          case 'notes_created':
            earned = totals.notes_created >= badge.requirement_value;
            break;
          case 'current_streak':
            earned = totals.current_streak >= badge.requirement_value;
            break;
          case 'total_study_minutes':
            earned = totals.total_study_minutes >= badge.requirement_value;
            break;
        }

        if (earned) {
          await supabase.from('user_badges').insert({
            user_id: userId,
            badge_id: badge.id
          });
          newBadges.push(badge);
          toast({
            title: `🎉 Badge Earned: ${badge.name}`,
            description: badge.description
          });
        }
      }

      if (newBadges.length > 0) {
        await fetchBadges();
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }, [userId, toast, fetchBadges]);

  const fetchLeaderboard = useCallback(async (limit: number = 10) => {
    try {
      // Since we can't query views directly with the typed client, we aggregate manually
      const { data, error } = await supabase
        .from('student_progress')
        .select('*');

      if (error) throw error;

      // Aggregate by user
      const userMap = new Map<string, LeaderboardEntry>();
      
      (data || []).forEach(p => {
        const existing = userMap.get(p.user_id) || {
          user_id: p.user_id,
          total_quizzes: 0,
          total_passed: 0,
          avg_score: 0,
          total_flashcards: 0,
          total_videos: 0,
          best_streak: 0,
          total_minutes: 0
        };

        userMap.set(p.user_id, {
          user_id: p.user_id,
          total_quizzes: existing.total_quizzes + (p.quizzes_completed || 0),
          total_passed: existing.total_passed + (p.quizzes_passed || 0),
          avg_score: p.average_score ? (existing.avg_score + Number(p.average_score)) / 2 : existing.avg_score,
          total_flashcards: existing.total_flashcards + (p.flashcards_reviewed || 0),
          total_videos: existing.total_videos + (p.videos_watched || 0),
          best_streak: Math.max(existing.best_streak, p.current_streak || 0),
          total_minutes: existing.total_minutes + (p.total_study_minutes || 0)
        });
      });

      const entries = Array.from(userMap.values())
        .sort((a, b) => b.avg_score - a.avg_score || b.total_quizzes - a.total_quizzes)
        .slice(0, limit)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboard(entries);
      return entries;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }, []);

  const getOverallStats = useCallback(() => {
    return progressData.reduce((acc, p) => ({
      totalQuizzes: acc.totalQuizzes + p.quizzes_completed,
      totalPassed: acc.totalPassed + p.quizzes_passed,
      avgScore: p.average_score ? (acc.avgScore + Number(p.average_score)) / 2 : acc.avgScore,
      totalFlashcards: acc.totalFlashcards + p.flashcards_reviewed,
      totalVideos: acc.totalVideos + p.videos_watched,
      totalNotes: acc.totalNotes + p.notes_created,
      currentStreak: Math.max(acc.currentStreak, p.current_streak),
      longestStreak: Math.max(acc.longestStreak, p.longest_streak),
      totalMinutes: acc.totalMinutes + p.total_study_minutes
    }), {
      totalQuizzes: 0,
      totalPassed: 0,
      avgScore: 0,
      totalFlashcards: 0,
      totalVideos: 0,
      totalNotes: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalMinutes: 0
    });
  }, [progressData]);

  return {
    progressData,
    badges,
    earnedBadges,
    leaderboard,
    isLoading,
    fetchProgress,
    updateProgress,
    fetchBadges,
    checkAndAwardBadges,
    fetchLeaderboard,
    getOverallStats
  };
}
