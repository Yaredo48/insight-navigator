import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FlashcardDeck {
  id: string;
  title: string;
  description?: string;
  grade_id?: number;
  subject_id?: number;
  topic?: string;
  created_by?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  card_count?: number;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front_text: string;
  back_text: string;
  front_image_url?: string;
  back_image_url?: string;
  order_index: number;
  created_at: string;
}

export interface FlashcardReview {
  id: string;
  flashcard_id: string;
  user_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_quality?: number;
  created_at: string;
  updated_at: string;
}

// SM-2 Spaced Repetition Algorithm
function calculateNextReview(
  quality: number, // 0-5, where 0-2 = fail, 3-5 = pass
  repetitions: number,
  easeFactor: number,
  interval: number
): { newInterval: number; newEaseFactor: number; newRepetitions: number } {
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor);

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Failed - reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Passed
    newRepetitions = repetitions + 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  return { newInterval, newEaseFactor, newRepetitions };
}

export function useFlashcards() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [currentDeck, setCurrentDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchDecks = useCallback(async (filters?: {
    gradeId?: number;
    subjectId?: number;
    topic?: string;
  }) => {
    setIsLoading(true);
    try {
      let query = supabase.from('flashcard_decks').select('*');
      
      if (filters?.gradeId) query = query.eq('grade_id', filters.gradeId);
      if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
      if (filters?.topic) query = query.ilike('topic', `%${filters.topic}%`);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      // Get card counts
      const deckIds = (data || []).map(d => d.id);
      if (deckIds.length > 0) {
        const { data: cardsData } = await supabase
          .from('flashcards')
          .select('deck_id')
          .in('deck_id', deckIds);

        const counts: Record<string, number> = {};
        (cardsData || []).forEach(c => {
          counts[c.deck_id] = (counts[c.deck_id] || 0) + 1;
        });

        setDecks((data || []).map(d => ({ ...d, card_count: counts[d.id] || 0 })) as FlashcardDeck[]);
      } else {
        setDecks([]);
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
      toast({ title: 'Error', description: 'Failed to load flashcard decks', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchDeckWithCards = useCallback(async (deckId: string) => {
    setIsLoading(true);
    try {
      const [deckRes, cardsRes] = await Promise.all([
        supabase.from('flashcard_decks').select('*').eq('id', deckId).maybeSingle(),
        supabase.from('flashcards').select('*').eq('deck_id', deckId).order('order_index')
      ]);

      if (deckRes.error) throw deckRes.error;
      if (cardsRes.error) throw cardsRes.error;

      setCurrentDeck(deckRes.data as FlashcardDeck);
      setCards((cardsRes.data || []) as Flashcard[]);
      return { deck: deckRes.data as FlashcardDeck, cards: (cardsRes.data || []) as Flashcard[] };
    } catch (error) {
      console.error('Error fetching deck:', error);
      toast({ title: 'Error', description: 'Failed to load flashcard deck', variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchDueCards = useCallback(async (userId: string, deckId?: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('flashcard_reviews')
        .select('*, flashcards(*)')
        .eq('user_id', userId)
        .lte('next_review_date', today);

      if (deckId) {
        query = query.eq('flashcards.deck_id', deckId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const dueFlashcards = (data || [])
        .filter(r => r.flashcards)
        .map(r => r.flashcards as unknown as Flashcard);
      
      setDueCards(dueFlashcards);
      return dueFlashcards;
    } catch (error) {
      console.error('Error fetching due cards:', error);
      return [];
    }
  }, []);

  const createDeck = useCallback(async (data: {
    title: string;
    description?: string;
    grade_id?: number;
    subject_id?: number;
    topic?: string;
    created_by?: string;
  }) => {
    try {
      const { data: deck, error } = await supabase
        .from('flashcard_decks')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Success', description: 'Deck created successfully' });
      return deck as FlashcardDeck;
    } catch (error) {
      console.error('Error creating deck:', error);
      toast({ title: 'Error', description: 'Failed to create deck', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const addCard = useCallback(async (data: {
    deck_id: string;
    front_text: string;
    back_text: string;
    front_image_url?: string;
    back_image_url?: string;
    order_index?: number;
  }) => {
    try {
      const { data: card, error } = await supabase
        .from('flashcards')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      setCards(prev => [...prev, card as Flashcard]);
      return card as Flashcard;
    } catch (error) {
      console.error('Error adding card:', error);
      toast({ title: 'Error', description: 'Failed to add card', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const reviewCard = useCallback(async (
    flashcardId: string,
    userId: string,
    quality: number // 0-5
  ) => {
    try {
      // Get existing review or create new
      const { data: existingReview } = await supabase
        .from('flashcard_reviews')
        .select('*')
        .eq('flashcard_id', flashcardId)
        .eq('user_id', userId)
        .maybeSingle();

      const current = existingReview || {
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 0
      };

      const { newInterval, newEaseFactor, newRepetitions } = calculateNextReview(
        quality,
        current.repetitions,
        Number(current.ease_factor),
        current.interval_days
      );

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

      if (existingReview) {
        const { error } = await supabase
          .from('flashcard_reviews')
          .update({
            ease_factor: newEaseFactor,
            interval_days: newInterval,
            repetitions: newRepetitions,
            next_review_date: nextReviewDate.toISOString().split('T')[0],
            last_quality: quality
          })
          .eq('id', existingReview.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('flashcard_reviews')
          .insert({
            flashcard_id: flashcardId,
            user_id: userId,
            ease_factor: newEaseFactor,
            interval_days: newInterval,
            repetitions: newRepetitions,
            next_review_date: nextReviewDate.toISOString().split('T')[0],
            last_quality: quality
          });

        if (error) throw error;
      }

      return { newInterval, newEaseFactor, newRepetitions };
    } catch (error) {
      console.error('Error reviewing card:', error);
      toast({ title: 'Error', description: 'Failed to save review', variant: 'destructive' });
      return null;
    }
  }, [toast]);

  const deleteDeck = useCallback(async (deckId: string) => {
    try {
      const { error } = await supabase.from('flashcard_decks').delete().eq('id', deckId);
      if (error) throw error;
      setDecks(prev => prev.filter(d => d.id !== deckId));
      toast({ title: 'Deleted', description: 'Deck deleted successfully' });
    } catch (error) {
      console.error('Error deleting deck:', error);
      toast({ title: 'Error', description: 'Failed to delete deck', variant: 'destructive' });
    }
  }, [toast]);

  return {
    decks,
    currentDeck,
    cards,
    dueCards,
    isLoading,
    fetchDecks,
    fetchDeckWithCards,
    fetchDueCards,
    createDeck,
    addCard,
    reviewCard,
    deleteDeck
  };
}
