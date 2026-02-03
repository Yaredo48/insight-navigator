import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid, 
  List,
  X,
  ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import type { Book } from '@/hooks/useBooksSupabase';
import type { Grade, Subject } from '@/hooks/useGradesSubjects';

export interface SearchFilters {
  query: string;
  gradeId?: number;
  subjectId?: number;
  chapter?: number;
  tags: string[];
  isProcessed?: boolean;
}

interface ContentSearchProps {
  books: Book[];
  grades: Grade[];
  subjects: Subject[];
  onFiltersChange: (filters: SearchFilters) => void;
  onBookSelect: (book: Book) => void;
  className?: string;
}

type SortField = 'title' | 'created_at' | 'file_size' | 'chapter';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export function ContentSearch({
  books,
  grades,
  subjects,
  onFiltersChange,
  onBookSelect,
  className,
}: ContentSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    tags: [],
  });
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Update filters and notify parent
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Apply search query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.description?.toLowerCase().includes(query)
      );
    }

    // Apply grade filter
    if (filters.gradeId) {
      result = result.filter(book => book.grade_id === filters.gradeId);
    }

    // Apply subject filter
    if (filters.subjectId) {
      result = result.filter(book => book.subject_id === filters.subjectId);
    }

    // Apply chapter filter
    if (filters.chapter) {
      result = result.filter(book => book.chapter === filters.chapter);
    }

    // Apply processed filter
    if (filters.isProcessed !== undefined) {
      result = result.filter(book => book.is_processed === filters.isProcessed);
    }

    // Apply tag filters
    if (filters.tags.length > 0) {
      result = result.filter(book => {
        const bookTags = (book.metadata as Record<string, unknown>)?.tags as string[] | undefined;
        if (!bookTags) return false;
        return filters.tags.some(tag => bookTags.includes(tag));
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'file_size':
          comparison = a.file_size - b.file_size;
          break;
        case 'chapter':
          comparison = (a.chapter || 0) - (b.chapter || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [books, filters, sortField, sortOrder]);

  const getGradeName = (gradeId: number | null) => {
    if (!gradeId) return '-';
    const grade = grades.find(g => g.id === gradeId);
    return grade?.name || `Grade ${gradeId}`;
  };

  const getSubjectName = (subjectId: number | null) => {
    if (!subjectId) return '-';
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || '-';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const clearFilters = () => {
    const cleared: SearchFilters = { query: '', tags: [] };
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  const hasActiveFilters = filters.gradeId || filters.subjectId || filters.chapter || filters.tags.length > 0 || filters.isProcessed !== undefined;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search books, authors, content..."
            value={filters.query}
            onChange={(e) => updateFilters({ query: e.target.value })}
            className="pl-10"
          />
          {filters.query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => updateFilters({ query: '' })}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {[filters.gradeId, filters.subjectId, filters.chapter, ...filters.tags].filter(Boolean).length}
                </Badge>
              )}
              <ChevronDown className={cn('w-4 h-4 transition-transform', isFiltersOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {/* View Toggle */}
        <div className="flex items-center border rounded-lg">
          <Toggle
            pressed={viewMode === 'grid'}
            onPressedChange={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid className="w-4 h-4" />
          </Toggle>
          <Toggle
            pressed={viewMode === 'list'}
            onPressedChange={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Toggle>
        </div>

        {/* Sort */}
        <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="file_size">Size</SelectItem>
            <SelectItem value="chapter">Chapter</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Collapsible Filters */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border rounded-lg bg-muted/30 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={filters.gradeId?.toString() || 'all'}
                onValueChange={(v) => updateFilters({ gradeId: v === 'all' ? undefined : parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map(grade => (
                    <SelectItem key={grade.id} value={grade.id.toString()}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.subjectId?.toString() || 'all'}
                onValueChange={(v) => updateFilters({ subjectId: v === 'all' ? undefined : parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Chapter"
                value={filters.chapter || ''}
                onChange={(e) => updateFilters({ chapter: e.target.value ? parseInt(e.target.value) : undefined })}
              />

              <Select
                value={filters.isProcessed === undefined ? 'all' : filters.isProcessed.toString()}
                onValueChange={(v) => updateFilters({ isProcessed: v === 'all' ? undefined : v === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Processing Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Processed</SelectItem>
                  <SelectItem value="false">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>

      {/* Results */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredBooks.length} books found</span>
      </div>

      {/* Book Grid/List */}
      <AnimatePresence mode="wait">
        {filteredBooks.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No books found matching your criteria</p>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onBookSelect(book)}
                className="border rounded-lg p-4 hover:border-primary/50 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={book.is_processed ? 'default' : 'secondary'} className="text-xs">
                    {book.is_processed ? 'Processed' : 'Pending'}
                  </Badge>
                  {book.chapter && (
                    <Badge variant="outline" className="text-xs">
                      Ch. {book.chapter}
                    </Badge>
                  )}
                </div>
                <h3 className="font-medium line-clamp-2 mb-2">{book.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {book.author || 'Unknown Author'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{getGradeName(book.grade_id)}</span>
                  <span>•</span>
                  <span>{getSubjectName(book.subject_id)}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onBookSelect(book)}
                className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary/50 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{book.title}</h3>
                    <Badge variant={book.is_processed ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {book.is_processed ? 'Processed' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {book.author || 'Unknown Author'} • {getGradeName(book.grade_id)} • {getSubjectName(book.subject_id)}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground text-right shrink-0">
                  <div>{formatFileSize(book.file_size)}</div>
                  {book.chapter && <div className="text-xs">Chapter {book.chapter}</div>}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
