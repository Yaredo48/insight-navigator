import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  grade_id?: number;
  subject_id?: number;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit_minutes?: number;
  passing_score: number;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching';
  question_text: string;
  options?: Json;
  correct_answer: Json;
  explanation?: string;
  points: number;
  order_index: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score?: number;
  total_points?: number;
  percentage?: number;
  time_taken_seconds?: number;
  answers?: Json;
  started_at: string;
  completed_at?: string;
}

export interface CreateQuizData {
  title: string;
  description?: string;
  grade_id?: number;
  subject_id?: number;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  time_limit_minutes?: number;
  passing_score?: number;
  is_published?: boolean;
  created_by?: string;
}

export interface CreateQuestionData {
  quiz_id: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching';
  question_text: string;
  options?: Record<string, unknown>[];
  correct_answer: unknown;
  explanation?: string;
  points?: number;
  order_index?: number;
}

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchQuizzes = useCallback(async (filters?: {
    gradeId?: number;
    subjectId?: number;
    topic?: string;
    published?: boolean;
  }) => {
    setIsLoading(true);
    try {
      let query = supabase.from('quizzes').select('*');
      
      if (filters?.gradeId) query = query.eq('grade_id', filters.gradeId);
      if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
      if (filters?.topic) query = query.ilike('topic', `%${filters.topic}%`);
      if (filters?.published !== undefined) query = query.eq('is_published', filters.published);

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setQuizzes((data || []) as Quiz[]);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast({ title: 'Error', description: 'Failed to load quizzes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchQuizWithQuestions = useCallback(async (quizId: string) => {
    setIsLoading(true);
    try {
      const [quizRes, questionsRes] = await Promise.all([
        supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle(),
        supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('order_index')
      ]);

      if (quizRes.error) throw quizRes.error;
      if (questionsRes.error) throw questionsRes.error;

      setCurrentQuiz(quizRes.data as Quiz);
      setQuestions((questionsRes.data || []) as QuizQuestion[]);
      return { quiz: quizRes.data as Quiz, questions: (questionsRes.data || []) as QuizQuestion[] };
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast({ title: 'Error', description: 'Failed to load quiz', variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createQuiz = useCallback(async (data: CreateQuizData) => {
    try {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .insert({
          ...data,
          difficulty: data.difficulty || 'medium',
          passing_score: data.passing_score || 70,
          is_published: data.is_published || false
        })
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Quiz created successfully' });
      return quiz as Quiz;
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({ title: 'Error', description: 'Failed to create quiz', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const addQuestion = useCallback(async (data: CreateQuestionData) => {
    try {
      const { data: question, error } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: data.quiz_id,
          question_type: data.question_type,
          question_text: data.question_text,
          options: data.options as Json,
          correct_answer: data.correct_answer as Json,
          explanation: data.explanation,
          points: data.points || 1,
          order_index: data.order_index || 0
        })
        .select()
        .single();

      if (error) throw error;
      return question as QuizQuestion;
    } catch (error) {
      console.error('Error adding question:', error);
      toast({ title: 'Error', description: 'Failed to add question', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const submitQuizAttempt = useCallback(async (
    quizId: string,
    userId: string,
    answers: Record<string, unknown>,
    timeTaken: number
  ) => {
    try {
      // Get questions to calculate score
      const { data: questionsData, error: qError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId);

      if (qError) throw qError;

      let score = 0;
      let totalPoints = 0;
      
      (questionsData || []).forEach((q) => {
        totalPoints += q.points || 1;
        const userAnswer = answers[q.id];
        const correctAnswer = q.correct_answer;
        
        // Simple comparison - can be made more sophisticated
        if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
          score += q.points || 1;
        }
      });

      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

      const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: userId,
          score,
          total_points: totalPoints,
          percentage,
          time_taken_seconds: timeTaken,
          answers: answers as Json,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { attempt: attempt as QuizAttempt, score, totalPoints, percentage };
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({ title: 'Error', description: 'Failed to submit quiz', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const deleteQuiz = useCallback(async (quizId: string) => {
    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
      if (error) throw error;
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      toast({ title: 'Deleted', description: 'Quiz deleted successfully' });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({ title: 'Error', description: 'Failed to delete quiz', variant: 'destructive' });
    }
  }, [toast]);

  return {
    quizzes,
    currentQuiz,
    questions,
    isLoading,
    fetchQuizzes,
    fetchQuizWithQuestions,
    createQuiz,
    addQuestion,
    submitQuizAttempt,
    deleteQuiz
  };
}
