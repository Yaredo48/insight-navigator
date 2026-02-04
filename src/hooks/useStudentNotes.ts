import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StudentNote {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  grade_id?: number;
  subject_id?: number;
  book_id?: string;
  tags?: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export function useStudentNotes(userId: string = 'anonymous') {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [currentNote, setCurrentNote] = useState<StudentNote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchNotes = useCallback(async (filters?: {
    gradeId?: number;
    subjectId?: number;
    bookId?: string;
    search?: string;
    tags?: string[];
  }) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('student_notes')
        .select('*')
        .eq('user_id', userId);

      if (filters?.gradeId) query = query.eq('grade_id', filters.gradeId);
      if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
      if (filters?.bookId) query = query.eq('book_id', filters.bookId);
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }
      if (filters?.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error } = await query
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes((data || []) as StudentNote[]);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({ title: 'Error', description: 'Failed to load notes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const createNote = useCallback(async (data: {
    title: string;
    content?: string;
    grade_id?: number;
    subject_id?: number;
    book_id?: string;
    tags?: string[];
  }) => {
    try {
      const { data: note, error } = await supabase
        .from('student_notes')
        .insert({
          ...data,
          user_id: userId,
          is_pinned: false
        })
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => [note as StudentNote, ...prev]);
      toast({ title: 'Success', description: 'Note created successfully' });
      return note as StudentNote;
    } catch (error) {
      console.error('Error creating note:', error);
      toast({ title: 'Error', description: 'Failed to create note', variant: 'destructive' });
      return null;
    }
  }, [userId, toast]);

  const updateNote = useCallback(async (noteId: string, data: Partial<{
    title: string;
    content: string;
    grade_id: number;
    subject_id: number;
    book_id: string;
    tags: string[];
    is_pinned: boolean;
  }>) => {
    try {
      const { data: note, error } = await supabase
        .from('student_notes')
        .update(data)
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => prev.map(n => n.id === noteId ? note as StudentNote : n));
      if (currentNote?.id === noteId) setCurrentNote(note as StudentNote);
      return note as StudentNote;
    } catch (error) {
      console.error('Error updating note:', error);
      toast({ title: 'Error', description: 'Failed to update note', variant: 'destructive' });
      return null;
    }
  }, [currentNote, toast]);

  const deleteNote = useCallback(async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('student_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (currentNote?.id === noteId) setCurrentNote(null);
      toast({ title: 'Deleted', description: 'Note deleted successfully' });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({ title: 'Error', description: 'Failed to delete note', variant: 'destructive' });
    }
  }, [currentNote, toast]);

  const togglePin = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      await updateNote(noteId, { is_pinned: !note.is_pinned });
    }
  }, [notes, updateNote]);

  return {
    notes,
    currentNote,
    setCurrentNote,
    isLoading,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin
  };
}
