import { useState, useEffect } from 'react';
import { Book, useBooks } from '@/hooks/useBooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Trash2, Download, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookManagerProps {
  gradeId?: number;
  subjectId?: number;
}

// Static grade/subject options for now (until database tables are created)
const GRADES = [
  { id: 9, name: 'Grade 9' },
  { id: 10, name: 'Grade 10' },
  { id: 11, name: 'Grade 11' },
  { id: 12, name: 'Grade 12' },
];

const SUBJECTS = [
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'Physics' },
  { id: 3, name: 'Chemistry' },
  { id: 4, name: 'Biology' },
  { id: 5, name: 'English' },
  { id: 6, name: 'Amharic' },
  { id: 7, name: 'History' },
  { id: 8, name: 'Geography' },
];

export function BookManager({ gradeId, subjectId }: BookManagerProps) {
  const { books, isLoading, fetchBooks, downloadAndRegisterBook, deleteBook } = useBooks();
  const [isIngesting, setIsIngesting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    fileUrl: '',
    officialSource: '',
    selectedGradeId: gradeId?.toString() || '',
    selectedSubjectId: subjectId?.toString() || '',
    chapter: '',
  });

  // Load books when filters change
  useEffect(() => {
    fetchBooks({ 
      gradeId: gradeId || (formData.selectedGradeId ? parseInt(formData.selectedGradeId) : undefined), 
      subjectId: subjectId || (formData.selectedSubjectId ? parseInt(formData.selectedSubjectId) : undefined) 
    });
  }, [gradeId, subjectId, fetchBooks]);

  const handleIngest = async () => {
    if (!formData.title || !formData.fileUrl) {
      return;
    }

    setIsIngesting(true);
    try {
      await downloadAndRegisterBook({
        sourceUrl: formData.fileUrl,
        title: formData.title,
        author: formData.author || undefined,
        description: formData.description || undefined,
        gradeId: formData.selectedGradeId ? parseInt(formData.selectedGradeId) : undefined,
        subjectId: formData.selectedSubjectId ? parseInt(formData.selectedSubjectId) : undefined,
      });

      // Reset form
      setFormData({
        title: '',
        author: '',
        description: '',
        fileUrl: '',
        officialSource: '',
        selectedGradeId: gradeId?.toString() || '',
        selectedSubjectId: subjectId?.toString() || '',
        chapter: '',
      });
      setIsDialogOpen(false);
    } finally {
      setIsIngesting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Book Management</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ingest New Book</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Book Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Physics Grade 10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g., Ethiopian Ministry of Education"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    value={formData.selectedGradeId}
                    onValueChange={(value) => setFormData({ ...formData, selectedGradeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((grade) => (
                        <SelectItem key={grade.id} value={grade.id.toString()}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={formData.selectedSubjectId}
                    onValueChange={(value) => setFormData({ ...formData, selectedSubjectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter</Label>
                <Input
                  id="chapter"
                  type="number"
                  value={formData.chapter}
                  onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                  placeholder="e.g., 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileUrl">PDF URL *</Label>
                <Input
                  id="fileUrl"
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://example.com/book.pdf"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officialSource">Official Source</Label>
                <Input
                  id="officialSource"
                  value={formData.officialSource}
                  onChange={(e) => setFormData({ ...formData, officialSource: e.target.value })}
                  placeholder="e.g., Ministry of Education"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the book"
                />
              </div>
              <Button
                onClick={handleIngest}
                disabled={isIngesting || !formData.title || !formData.fileUrl}
                className="w-full"
              >
                {isIngesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ingesting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Ingest Book
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Book management requires a Django backend. Make sure the backend is running at the configured API URL.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No books found</p>
          <p className="text-sm">Click "Add Book" to ingest your first book</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author || '-'}</TableCell>
                  <TableCell>{book.grade_id ? `Grade ${book.grade_id}` : '-'}</TableCell>
                  <TableCell>{book.subject_id || '-'}</TableCell>
                  <TableCell>{book.chapter || '-'}</TableCell>
                  <TableCell>{formatFileSize(book.file_size)}</TableCell>
                  <TableCell>
                    <Badge variant={book.is_processed ? "default" : "secondary"}>
                      {book.is_processed ? 'Processed' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {book.download_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(book.download_url!, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBook(book.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
