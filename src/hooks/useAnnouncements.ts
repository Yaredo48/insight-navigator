 import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

export type Announcement = Tables<'announcements'> & {
  classes?: { name: string } | null;
  grades?: { name: string } | null;
};

export function useAnnouncements(teacherId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`*, classes(name), grades(name)`)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error fetching announcements', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [teacherId, toast]);

  const createAnnouncement = async (data: Partial<Announcement>) => {
    try {
      const { data: created, error } = await supabase
        .from('announcements')
        .insert([{ ...data, teacher_id: teacherId, title: data.title || 'New Announcement', content: data.content || '' }])
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Announcement posted!' });
      fetchAnnouncements();

      // Send notification (fire and forget)
      if (created) {
        supabase.functions.invoke('send-notification', {
          body: {
            type: 'announcement',
            announcement_title: created.title,
            announcement_content: created.content,
            class_id: created.class_id,
          },
        }).catch((err) => console.error('Notification error:', err));
      }

      return created;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error creating announcement', description: errorMessage, variant: 'destructive' });
      return null;
    }
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Announcement updated!' });
      fetchAnnouncements();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error updating announcement', description: errorMessage, variant: 'destructive' });
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Announcement deleted' });
      fetchAnnouncements();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Error deleting announcement', description: errorMessage, variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (teacherId) {
      fetchAnnouncements();
    }
  }, [teacherId, fetchAnnouncements]);

  return {
    announcements,
    loading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    refresh: fetchAnnouncements
  };
}