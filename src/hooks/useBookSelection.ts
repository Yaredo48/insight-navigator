import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SelectedBook {
    id: string;
    title: string;
    author: string | null;
    chapter: number | null;
    extractedText: string;
}

export function useBookSelection() {
    const [selectedBooks, setSelectedBooks] = useState<SelectedBook[]>([]);
    const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Toggle book selection
    const toggleBookSelection = useCallback(async (bookId: string) => {
        const isCurrentlySelected = selectedBookIds.has(bookId);

        if (isCurrentlySelected) {
            // Deselect book
            setSelectedBookIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(bookId);
                return newSet;
            });
            setSelectedBooks(prev => prev.filter(b => b.id !== bookId));
        } else {
            // Select book - fetch full content
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('books')
                    .select('id, title, author, chapter, extracted_text')
                    .eq('id', bookId)
                    .single();

                if (error) throw error;

                if (!data.extracted_text) {
                    toast({
                        title: 'Book not processed',
                        description: 'This book has not been processed yet and cannot be used for chat.',
                        variant: 'destructive',
                    });
                    return;
                }

                setSelectedBookIds(prev => new Set(prev).add(bookId));
                setSelectedBooks(prev => [...prev, {
                    id: data.id,
                    title: data.title,
                    author: data.author,
                    chapter: data.chapter,
                    extractedText: data.extracted_text,
                }]);

                toast({
                    title: 'Book selected',
                    description: `"${data.title}" is now available for chat.`,
                });
            } catch (error) {
                console.error('Error selecting book:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to select book for chat.',
                    variant: 'destructive',
                });
            } finally {
                setIsLoading(false);
            }
        }
    }, [selectedBookIds, toast]);

    // Clear all selections
    const clearSelection = useCallback(() => {
        setSelectedBooks([]);
        setSelectedBookIds(new Set());
        toast({
            title: 'Selection cleared',
            description: 'All books have been deselected.',
        });
    }, [toast]);

    // Check if a book is selected
    const isBookSelected = useCallback((bookId: string) => {
        return selectedBookIds.has(bookId);
    }, [selectedBookIds]);

    // Get book context for chat (formatted for AI)
    const getBookContext = useCallback(() => {
        if (selectedBooks.length === 0) return null;

        return selectedBooks.map(book => {
            // Truncate to ~10,000 characters to avoid token limits
            const truncatedText = book.extractedText.substring(0, 10000);
            const isTruncated = book.extractedText.length > 10000;

            return `## Book: ${book.title}
${book.author ? `Author: ${book.author}` : ''}
${book.chapter ? `Chapter: ${book.chapter}` : ''}

Content:
${truncatedText}${isTruncated ? '\n\n[Content truncated for length...]' : ''}

---`;
        }).join('\n\n');
    }, [selectedBooks]);

    return {
        selectedBooks,
        selectedBookIds: Array.from(selectedBookIds),
        isLoading,
        toggleBookSelection,
        clearSelection,
        isBookSelected,
        getBookContext,
        selectionCount: selectedBooks.length,
    };
}
