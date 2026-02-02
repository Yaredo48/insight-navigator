import { useState, useEffect } from 'react';
import { Book as BookIcon, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Book {
  id: string;
  title: string;
  file_name: string;
  file_size: number;
  download_url?: string;
  is_processed: boolean;
}

interface BookListProps {
  gradeId?: number;
  subjectId?: number;
}

export function BookList({ gradeId, subjectId }: BookListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Note: The 'books' table doesn't exist in the database yet.
    // This component will show an empty state until the table is created.
    const fetchBooks = async () => {
      if (!gradeId || !subjectId) return;

      setIsLoading(true);
      try {
        // Simulating API call - replace with actual supabase query when books table exists
        console.log(`Would fetch books for grade ${gradeId}, subject ${subjectId}`);
        // For now, return empty array since books table doesn't exist
        setBooks([]);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [gradeId, subjectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (books.length === 0) return null;

  return (
    <div className="border-t border-border bg-secondary/20 px-4 py-3">
      <div className="mx-auto max-w-4xl">
        <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Curriculum Textbooks ({books.length})
        </p>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {books.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'group flex items-center gap-2 rounded-lg',
                  'bg-background border border-border shadow-sm',
                  'px-3 py-2 text-sm',
                  'hover:border-primary/30 hover:bg-primary/5 transition-all'
                )}
              >
                <BookIcon className="h-4 w-4 text-primary" />
                <span className="max-w-[200px] truncate font-medium text-foreground">
                  {book.title}
                </span>
                {book.download_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(book.download_url, '_blank')}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
