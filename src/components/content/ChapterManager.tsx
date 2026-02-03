import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  FolderOpen, 
  Folder,
  Plus,
  Trash2,
  Edit,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Book } from '@/hooks/useBooksSupabase';

export interface Chapter {
  id: string;
  number: number;
  title: string;
  books: Book[];
}

interface ChapterManagerProps {
  chapters: Chapter[];
  onChapterAdd: (title: string) => void;
  onChapterEdit: (chapterId: string, title: string) => void;
  onChapterDelete: (chapterId: string) => void;
  onBookSelect: (book: Book) => void;
  onBookMove?: (bookId: string, chapterId: string) => void;
  className?: string;
}

export function ChapterManager({
  chapters,
  onChapterAdd,
  onChapterEdit,
  onChapterDelete,
  onBookSelect,
  onBookMove,
  className,
}: ChapterManagerProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const handleAddChapter = () => {
    if (newChapterTitle.trim()) {
      onChapterAdd(newChapterTitle.trim());
      setNewChapterTitle('');
      setIsAddDialogOpen(false);
    }
  };

  const handleEditChapter = () => {
    if (editingChapter && newChapterTitle.trim()) {
      onChapterEdit(editingChapter.id, newChapterTitle.trim());
      setEditingChapter(null);
      setNewChapterTitle('');
    }
  };

  const expandAll = () => {
    setExpandedChapters(new Set(chapters.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedChapters(new Set());
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Chapters</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Chapter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Chapter</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Chapter title..."
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
                />
                <Button onClick={handleAddChapter} className="w-full">
                  Add Chapter
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Chapter List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-2 pr-4">
          {chapters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No chapters yet</p>
              <p className="text-sm">Add a chapter to organize your content</p>
            </div>
          ) : (
            chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="border rounded-lg overflow-hidden"
              >
                {/* Chapter Header */}
                <div
                  className="flex items-center gap-2 p-3 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => toggleChapter(chapter.id)}
                >
                  {onBookMove && (
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  )}
                  
                  {expandedChapters.has(chapter.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}

                  {expandedChapters.has(chapter.id) ? (
                    <FolderOpen className="w-4 h-4 text-primary" />
                  ) : (
                    <Folder className="w-4 h-4 text-muted-foreground" />
                  )}

                  <span className="font-medium flex-1">
                    Chapter {chapter.number}: {chapter.title}
                  </span>

                  <Badge variant="secondary" className="text-xs">
                    {chapter.books.length} books
                  </Badge>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingChapter(chapter);
                        setNewChapterTitle(chapter.title);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => onChapterDelete(chapter.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Chapter Content */}
                <AnimatePresence>
                  {expandedChapters.has(chapter.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="border-t divide-y">
                        {chapter.books.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No books in this chapter
                          </div>
                        ) : (
                          chapter.books.map((book) => (
                            <div
                              key={book.id}
                              className="flex items-center gap-3 p-3 pl-10 hover:bg-muted/30 cursor-pointer transition-colors"
                              onClick={() => onBookSelect(book)}
                            >
                              <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{book.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {book.author || 'Unknown Author'}
                                </p>
                              </div>
                              <Badge 
                                variant={book.is_processed ? 'default' : 'secondary'} 
                                className="text-xs shrink-0"
                              >
                                {book.is_processed ? 'Ready' : 'Processing'}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit Chapter Dialog */}
      <Dialog 
        open={!!editingChapter} 
        onOpenChange={(open) => !open && setEditingChapter(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Chapter title..."
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditChapter()}
            />
            <Button onClick={handleEditChapter} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
