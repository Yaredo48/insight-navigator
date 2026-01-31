import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Download,
    ChevronRight,
    ChevronLeft,
    Loader2,
    GraduationCap,
    FileText,
    X,
    CheckCircle2,
    Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useSubjectData } from '@/hooks/useSubjectData';
import { useIsMobile } from '@/hooks/use-mobile';

interface SubjectDataSidebarProps {
    gradeId?: number;
    subjectId?: number;
    onBookSelect?: (bookId: string) => void;
    selectedBookIds?: string[];
    selectionCount?: number;
    onClearSelection?: () => void;
}

export function SubjectDataSidebar({ gradeId, subjectId, onBookSelect, selectedBookIds = [], selectionCount = 0, onClearSelection }: SubjectDataSidebarProps) {
    const { books, subject, grade, bookCount, isLoading } = useSubjectData(gradeId, subjectId);
    const isMobile = useIsMobile();
    const [isCollapsed, setIsCollapsed] = useState(isMobile);

    // Don't render if no context
    if (!gradeId || !subjectId) {
        return null;
    }

    const sidebarWidth = isCollapsed ? 'w-0' : isMobile ? 'w-full' : 'w-80';

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && !isCollapsed && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsCollapsed(true)}
                />
            )}

            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={{ width: isCollapsed ? 0 : isMobile ? '100%' : 320 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={cn(
                    'relative border-l border-white/10 bg-black/20 backdrop-blur-sm',
                    isMobile && !isCollapsed && 'fixed right-0 top-0 bottom-0 z-50'
                )}
            >
                <div className={cn('h-full flex flex-col', isCollapsed && 'hidden')}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                                <BookOpen className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">Subject Resources</h3>
                                <p className="text-xs text-muted-foreground">
                                    {bookCount} {bookCount === 1 ? 'book' : 'books'} available
                                    {selectionCount > 0 && (
                                        <span className="ml-1 text-indigo-400 font-medium">
                                            • {selectionCount} selected
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {selectionCount > 0 && onClearSelection && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearSelection}
                                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                                >
                                    Clear
                                </Button>
                            )}
                            {isMobile && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsCollapsed(true)}
                                    className="h-8 w-8"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Context Info */}
                    {(subject || grade) && (
                        <div className="p-4 space-y-2 border-b border-white/10 bg-white/5">
                            {grade && (
                                <div className="flex items-center gap-2 text-sm">
                                    <GraduationCap className="h-4 w-4 text-blue-400" />
                                    <span className="text-foreground font-medium">{grade.name}</span>
                                </div>
                            )}
                            {subject && (
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="h-4 w-4 text-purple-400" />
                                    <span className="text-foreground font-medium">{subject.name}</span>
                                    <span className="text-xs text-muted-foreground">({subject.code})</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Books List */}
                    <ScrollArea className="flex-1 p-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                                <p className="text-sm text-muted-foreground">Loading resources...</p>
                            </div>
                        ) : books.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                <div className="p-4 rounded-full bg-white/5">
                                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-foreground">No books available</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Books for this subject will appear here
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {books.map((book, index) => (
                                        <motion.div
                                            key={book.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className={cn(
                                                "p-3 border transition-all group cursor-pointer",
                                                selectedBookIds.includes(book.id)
                                                    ? "bg-indigo-500/10 border-indigo-400/50 shadow-md"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-400/30"
                                            )}>
                                                <div className="flex items-start gap-3">
                                                    {/* Selection Indicator */}
                                                    <button
                                                        onClick={() => onBookSelect?.(book.id)}
                                                        className="shrink-0 mt-0.5 hover:scale-110 transition-transform"
                                                    >
                                                        {selectedBookIds.includes(book.id) ? (
                                                            <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                                                        ) : (
                                                            <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-indigo-400/60" />
                                                        )}
                                                    </button>

                                                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shrink-0">
                                                        <BookOpen className="h-4 w-4 text-indigo-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-foreground truncate">
                                                            {book.title}
                                                        </h4>
                                                        {book.author && (
                                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                                by {book.author}
                                                            </p>
                                                        )}
                                                        {book.chapter && (
                                                            <p className="text-xs text-indigo-400 mt-1">
                                                                Chapter {book.chapter}
                                                            </p>
                                                        )}
                                                        {book.page_count && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {book.page_count} pages
                                                            </p>
                                                        )}
                                                    </div>
                                                    {book.download_url && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(book.download_url!, '_blank');
                                                            }}
                                                            className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                {book.description && (
                                                    <p className="text-xs text-muted-foreground mt-2 ml-8 line-clamp-2">
                                                        {book.description}
                                                    </p>
                                                )}
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </motion.div>

            {/* Toggle Button */}
            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                    'absolute top-4 z-10 h-8 w-8 rounded-full shadow-lg',
                    'bg-background border-white/20 hover:bg-white/10',
                    'transition-all duration-300',
                    isCollapsed ? '-left-4' : isMobile ? 'right-4' : '-left-4'
                )}
            >
                {isCollapsed ? (
                    <ChevronLeft className="h-4 w-4" />
                ) : (
                    <ChevronRight className="h-4 w-4" />
                )}
            </Button>
        </>
    );
}
