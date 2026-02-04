import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VideoLesson {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  video_type: 'youtube' | 'vimeo' | 'direct';
  thumbnail_url?: string;
  duration_seconds?: number;
  grade_id?: number;
  subject_id?: number;
  topic?: string;
  order_index: number;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoProgress {
  id: string;
  video_id: string;
  user_id: string;
  watched_seconds: number;
  completed: boolean;
  last_watched_at: string;
}

export function useVideoLessons() {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoLesson | null>(null);
  const [progress, setProgress] = useState<Record<string, VideoProgress>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchVideos = useCallback(async (filters?: {
    gradeId?: number;
    subjectId?: number;
    topic?: string;
    published?: boolean;
  }) => {
    setIsLoading(true);
    try {
      let query = supabase.from('video_lessons').select('*');

      if (filters?.gradeId) query = query.eq('grade_id', filters.gradeId);
      if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
      if (filters?.topic) query = query.ilike('topic', `%${filters.topic}%`);
      if (filters?.published !== undefined) query = query.eq('is_published', filters.published);

      const { data, error } = await query.order('order_index');
      if (error) throw error;
      setVideos((data || []) as VideoLesson[]);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({ title: 'Error', description: 'Failed to load videos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchProgress = useCallback(async (userId: string, videoIds?: string[]) => {
    try {
      let query = supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId);

      if (videoIds?.length) {
        query = query.in('video_id', videoIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const progressMap: Record<string, VideoProgress> = {};
      (data || []).forEach(p => {
        progressMap[p.video_id] = p as VideoProgress;
      });
      setProgress(progressMap);
      return progressMap;
    } catch (error) {
      console.error('Error fetching progress:', error);
      return {};
    }
  }, []);

  const createVideo = useCallback(async (data: {
    title: string;
    description?: string;
    video_url: string;
    video_type?: 'youtube' | 'vimeo' | 'direct';
    thumbnail_url?: string;
    duration_seconds?: number;
    grade_id?: number;
    subject_id?: number;
    topic?: string;
    order_index?: number;
    is_published?: boolean;
    created_by?: string;
  }) => {
    try {
      const { data: video, error } = await supabase
        .from('video_lessons')
        .insert({
          ...data,
          video_type: data.video_type || 'youtube',
          order_index: data.order_index || 0,
          is_published: data.is_published ?? true
        })
        .select()
        .single();

      if (error) throw error;
      setVideos(prev => [...prev, video as VideoLesson]);
      toast({ title: 'Success', description: 'Video added successfully' });
      return video as VideoLesson;
    } catch (error) {
      console.error('Error creating video:', error);
      toast({ title: 'Error', description: 'Failed to add video', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const updateProgress = useCallback(async (
    videoId: string,
    userId: string,
    watchedSeconds: number,
    completed?: boolean
  ) => {
    try {
      const existing = progress[videoId];

      if (existing) {
        const { data, error } = await supabase
          .from('video_progress')
          .update({
            watched_seconds: watchedSeconds,
            completed: completed ?? existing.completed,
            last_watched_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        setProgress(prev => ({ ...prev, [videoId]: data as VideoProgress }));
      } else {
        const { data, error } = await supabase
          .from('video_progress')
          .insert({
            video_id: videoId,
            user_id: userId,
            watched_seconds: watchedSeconds,
            completed: completed ?? false
          })
          .select()
          .single();

        if (error) throw error;
        setProgress(prev => ({ ...prev, [videoId]: data as VideoProgress }));
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [progress]);

  const deleteVideo = useCallback(async (videoId: string) => {
    try {
      const { error } = await supabase.from('video_lessons').delete().eq('id', videoId);
      if (error) throw error;
      setVideos(prev => prev.filter(v => v.id !== videoId));
      toast({ title: 'Deleted', description: 'Video deleted successfully' });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({ title: 'Error', description: 'Failed to delete video', variant: 'destructive' });
    }
  }, [toast]);

  return {
    videos,
    currentVideo,
    setCurrentVideo,
    progress,
    isLoading,
    fetchVideos,
    fetchProgress,
    createVideo,
    updateProgress,
    deleteVideo
  };
}
