import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubjectPerformance {
  subject_id: number;
  subject_name: string;
  quizzes_taken: number;
  average_score: number;
  flashcards_reviewed: number;
  total_minutes: number;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface WeeklyActivity {
  day: string;
  minutes: number;
  quizzes: number;
}

export interface AnalyticsSummary {
  total_study_minutes: number;
  total_quizzes: number;
  total_flashcards: number;
  total_videos: number;
  average_score: number;
  current_streak: number;
  longest_streak: number;
  subjects: SubjectPerformance[];
  weekly_activity: WeeklyActivity[];
  weak_topics: { topic: string; subject: string; score: number }[];
}

export function useLearningAnalytics(userId: string) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    total_study_minutes: 0,
    total_quizzes: 0,
    total_flashcards: 0,
    total_videos: 0,
    average_score: 0,
    current_streak: 0,
    longest_streak: 0,
    subjects: [],
    weekly_activity: [],
    weak_topics: [],
  });

  const fetchAnalytics = async () => {
    try {
      // Fetch student progress across subjects
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('*, subjects(name)')
        .eq('user_id', userId);

      // Fetch quiz attempts for detailed analysis
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('*, quizzes(title, topic, subject_id, subjects(name))')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      // Fetch learning sessions for time tracking
      const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('*, subjects(name)')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      // Fetch video progress
      const { data: videoProgress } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId);

      // Fetch flashcard reviews
      const { data: flashcardReviews } = await supabase
        .from('flashcard_reviews')
        .select('*')
        .eq('user_id', userId);

      // Aggregate totals
      let totalMinutes = 0;
      let totalQuizzes = 0;
      let totalFlashcards = flashcardReviews?.length || 0;
      let totalVideos = videoProgress?.filter((v) => v.completed)?.length || 0;
      let totalScore = 0;
      let currentStreak = 0;
      let longestStreak = 0;

      if (progressData) {
        for (const p of progressData) {
          totalMinutes += p.total_study_minutes || 0;
          totalQuizzes += p.quizzes_completed || 0;
          currentStreak = Math.max(currentStreak, p.current_streak || 0);
          longestStreak = Math.max(longestStreak, p.longest_streak || 0);
        }
      }

      // From sessions
      if (sessions) {
        for (const s of sessions) {
          totalMinutes += s.duration_minutes || 0;
        }
      }

      // Calculate average score from quiz attempts
      const completedAttempts = quizAttempts?.filter((a) => a.completed_at) || [];
      if (completedAttempts.length > 0) {
        totalScore = completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length;
      }

      // Build subject performance
      const subjectMap = new Map<number, SubjectPerformance>();
      const subjectNames = new Map<number, string>();

      if (progressData) {
        for (const p of progressData) {
          if (p.subject_id) {
            const subName = (p as any).subjects?.name || `Subject ${p.subject_id}`;
            subjectNames.set(p.subject_id, subName);
            subjectMap.set(p.subject_id, {
              subject_id: p.subject_id,
              subject_name: subName,
              quizzes_taken: p.quizzes_completed || 0,
              average_score: p.average_score || 0,
              flashcards_reviewed: p.flashcards_reviewed || 0,
              total_minutes: p.total_study_minutes || 0,
              strength: (p.average_score || 0) >= 80 ? 'strong' : (p.average_score || 0) >= 60 ? 'moderate' : 'weak',
            });
          }
        }
      }

      // Identify weak topics from quiz attempts
      const weakTopics: { topic: string; subject: string; score: number }[] = [];
      if (completedAttempts.length > 0) {
        const topicScores = new Map<string, { total: number; count: number; subject: string }>();
        for (const attempt of completedAttempts) {
          const quiz = attempt.quizzes as any;
          const topic = quiz?.topic || quiz?.title || 'Unknown';
          const subject = quiz?.subjects?.name || 'Unknown';
          const existing = topicScores.get(topic) || { total: 0, count: 0, subject };
          existing.total += attempt.percentage || 0;
          existing.count += 1;
          topicScores.set(topic, existing);
        }

        for (const [topic, data] of topicScores) {
          const avg = data.total / data.count;
          if (avg < 70) {
            weakTopics.push({ topic, subject: data.subject, score: Math.round(avg) });
          }
        }
        weakTopics.sort((a, b) => a.score - b.score);
      }

      // Build weekly activity (last 7 days)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyActivity: WeeklyActivity[] = [];
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        let dayMinutes = 0;
        let dayQuizzes = 0;

        if (sessions) {
          for (const s of sessions) {
            const sDate = new Date(s.started_at);
            if (sDate >= dayStart && sDate <= dayEnd) {
              dayMinutes += s.duration_minutes || 0;
            }
          }
        }

        if (completedAttempts) {
          for (const a of completedAttempts) {
            if (a.completed_at) {
              const aDate = new Date(a.completed_at);
              if (aDate >= dayStart && aDate <= dayEnd) {
                dayQuizzes += 1;
              }
            }
          }
        }

        weeklyActivity.push({
          day: days[new Date(now.getTime() - i * 86400000).getDay()],
          minutes: dayMinutes,
          quizzes: dayQuizzes,
        });
      }

      setAnalytics({
        total_study_minutes: totalMinutes,
        total_quizzes: totalQuizzes,
        total_flashcards: totalFlashcards,
        total_videos: totalVideos,
        average_score: Math.round(totalScore),
        current_streak: currentStreak,
        longest_streak: longestStreak,
        subjects: Array.from(subjectMap.values()),
        weekly_activity: weeklyActivity,
        weak_topics: weakTopics.slice(0, 5),
      });
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackSession = async (subjectId: number, gradeId: number, durationMinutes: number, topic?: string, sessionType: string = 'study') => {
    try {
      await supabase.from('learning_sessions').insert({
        user_id: userId,
        subject_id: subjectId,
        grade_id: gradeId,
        duration_minutes: durationMinutes,
        topic,
        session_type: sessionType,
        ended_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error tracking session:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  return { analytics, loading, refresh: fetchAnalytics, trackSession };
}
