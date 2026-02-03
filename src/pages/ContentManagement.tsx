import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  Upload, 
  Search, 
  FolderTree,
  FileText,
  Video,
  Tag,
  X,
  Plus,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBooksSupabase, Book } from '@/hooks/useBooksSupabase';
import { useGradesSubjects } from '@/hooks/useGradesSubjects';
import { 
  PDFViewer, 
  ContentEditor, 
  VideoPlayer, 
  TagManager, 
  BulkUploader, 
  ContentSearch,
  ChapterManager,
  type SearchFilters,
  type Chapter
} from '@/components/content';

const ContentManagement = () => {
  const navigate = useNavigate();
  const { books, isLoading, fetchBooks, uploadBook, updateBook, deleteBook } = useBooksSupabase();
  const { grades, subjects, getGradeName, getSubjectName } = useGradesSubjects();
  
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [viewerMode, setViewerMode] = useState<'pdf' | 'video' | 'editor' | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    author: '',
    description: '',
    gradeId: '',
    subjectId: '',
    chapter: '',
    language: 'en',
    videoUrl: '',
    tags: [] as string[],
  });

  // Chapter organization
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Organize books into chapters
  useEffect(() => {
    const chapterMap = new Map<number, Book[]>();
    
    books.forEach(book => {
      const chapterNum = book.chapter || 0;
      if (!chapterMap.has(chapterNum)) {
        chapterMap.set(chapterNum, []);
      }
      chapterMap.get(chapterNum)!.push(book);
    });

    const organizedChapters: Chapter[] = Array.from(chapterMap.entries())
      .map(([num, booksInChapter]) => ({
        id: `chapter-${num}`,
        number: num,
        title: num === 0 ? 'Uncategorized' : `Chapter ${num}`,
        books: booksInChapter,
      }))
      .sort((a, b) => a.number - b.number);

    setChapters(organizedChapters);
  }, [books]);

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    
    // Determine view mode based on content
    const metadata = book.metadata as Record<string, unknown> | null;
    if (metadata?.video_url) {
      setViewerMode('video');
    } else if (book.file_type === 'application/pdf') {
      setViewerMode('pdf');
    } else {
      setViewerMode('editor');
    }
  };

  const handleFiltersChange = useCallback((filters: SearchFilters) => {
    fetchBooks({
      gradeId: filters.gradeId,
      subjectId: filters.subjectId,
      chapter: filters.chapter,
      searchQuery: filters.query,
      isProcessed: filters.isProcessed,
    });
  }, [fetchBooks]);

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadForm.title) return;

    await uploadBook(uploadFile, {
      title: uploadForm.title,
      author: uploadForm.author || undefined,
      description: uploadForm.description || undefined,
      gradeId: uploadForm.gradeId ? parseInt(uploadForm.gradeId) : undefined,
      subjectId: uploadForm.subjectId ? parseInt(uploadForm.subjectId) : undefined,
      chapter: uploadForm.chapter ? parseInt(uploadForm.chapter) : undefined,
      language: uploadForm.language,
      tags: uploadForm.tags,
      videoUrl: uploadForm.videoUrl || undefined,
    });

    // Reset form
    setUploadFile(null);
    setUploadForm({
      title: '',
      author: '',
      description: '',
      gradeId: '',
      subjectId: '',
      chapter: '',
      language: 'en',
      videoUrl: '',
      tags: [],
    });
    setIsUploadDialogOpen(false);
  };

  const handleBulkUpload = async (file: File): Promise<boolean> => {
    const result = await uploadBook(file, {
      title: file.name.replace(/\.[^/.]+$/, ''),
    });
    return result !== null;
  };

  const handleContentSave = async (content: string) => {
    if (!selectedBook) return;
    
    await updateBook(selectedBook.id, {
      extractedText: content,
      isProcessed: true,
    });
    
    setViewerMode(null);
  };

  const handleChapterAdd = (title: string) => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      number: chapters.length + 1,
      title,
      books: [],
    };
    setChapters([...chapters, newChapter]);
  };

  const handleChapterEdit = (chapterId: string, title: string) => {
    setChapters(chapters.map(c => 
      c.id === chapterId ? { ...c, title } : c
    ));
  };

  const handleChapterDelete = (chapterId: string) => {
    setChapters(chapters.filter(c => c.id !== chapterId));
  };

  const closeViewer = () => {
    setSelectedBook(null);
    setViewerMode(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/teacher')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
                <p className="text-sm text-muted-foreground">
                  Upload, organize, and manage educational content
                </p>
              </div>
            </div>
            
            <Button onClick={() => setIsUploadDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Content
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="p-4 bg-blue-500/5 border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{books.length}</p>
                <p className="text-sm text-muted-foreground">Total Books</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-green-500/5 border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileText className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {books.filter(b => b.is_processed).length}
                </p>
                <p className="text-sm text-muted-foreground">Processed</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-purple-500/5 border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FolderTree className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{chapters.length}</p>
                <p className="text-sm text-muted-foreground">Chapters</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-orange-500/5 border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Video className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {books.filter(b => (b.metadata as Record<string, unknown>)?.video_url).length}
                </p>
                <p className="text-sm text-muted-foreground">With Videos</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="browse" className="gap-2">
                <Search className="w-4 h-4" />
                Browse
              </TabsTrigger>
              <TabsTrigger value="chapters" className="gap-2">
                <FolderTree className="w-4 h-4" />
                Chapters
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="w-4 h-4" />
                Bulk Upload
              </TabsTrigger>
              <TabsTrigger value="tags" className="gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="browse">
                <Card className="p-6">
                  <ContentSearch
                    books={books}
                    grades={grades}
                    subjects={subjects}
                    onFiltersChange={handleFiltersChange}
                    onBookSelect={handleBookSelect}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="chapters">
                <Card className="p-6">
                  <ChapterManager
                    chapters={chapters}
                    onChapterAdd={handleChapterAdd}
                    onChapterEdit={handleChapterEdit}
                    onChapterDelete={handleChapterDelete}
                    onBookSelect={handleBookSelect}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="upload">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Bulk Upload</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload multiple PDF documents at once
                      </p>
                    </div>
                    <BulkUploader
                      onUpload={handleBulkUpload}
                      acceptedTypes={['.pdf', '.doc', '.docx']}
                      maxFiles={20}
                      maxSize={50}
                    />
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="tags">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Tag Management</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage tags to organize and categorize content
                      </p>
                    </div>

                    {/* Tag usage overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-4">Popular Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {['Important', 'Exam Topic', 'Practice Required', 'Beginner', 'Advanced', 'Lab Work', 'Theory'].map(tag => (
                            <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm">
                              <Tag className="w-3 h-3" />
                              {tag}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-4">Recently Used</h4>
                        <div className="flex flex-wrap gap-2">
                          {['Formula', 'Definition', 'Example', 'Exercise', 'Review'].map(tag => (
                            <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-sm">
                              {tag}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Content</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>File</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                      if (!uploadForm.title) {
                        setUploadForm(prev => ({ 
                          ...prev, 
                          title: file.name.replace(/\.[^/.]+$/, '') 
                        }));
                      }
                    }
                  }}
                  className="hidden"
                  id="single-upload"
                />
                <label htmlFor="single-upload" className="cursor-pointer">
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-500">
                      <FileText className="w-6 h-6" />
                      <span>{uploadFile.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to select a file
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label>Author</Label>
              <Input
                value={uploadForm.author}
                onChange={(e) => setUploadForm(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Enter author"
              />
            </div>

            {/* Grade & Subject */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select
                  value={uploadForm.gradeId}
                  onValueChange={(v) => setUploadForm(prev => ({ ...prev, gradeId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(grade => (
                      <SelectItem key={grade.id} value={grade.id.toString()}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={uploadForm.subjectId}
                  onValueChange={(v) => setUploadForm(prev => ({ ...prev, subjectId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chapter */}
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Input
                type="number"
                value={uploadForm.chapter}
                onChange={(e) => setUploadForm(prev => ({ ...prev, chapter: e.target.value }))}
                placeholder="Enter chapter number"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
                rows={3}
              />
            </div>

            {/* Video URL */}
            <div className="space-y-2">
              <Label>Video URL (optional)</Label>
              <Input
                value={uploadForm.videoUrl}
                onChange={(e) => setUploadForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="YouTube or Vimeo URL"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagManager
                tags={uploadForm.tags}
                onChange={(tags) => setUploadForm(prev => ({ ...prev, tags }))}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFileUpload}
                disabled={!uploadFile || !uploadForm.title || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content Viewer Modal */}
      <AnimatePresence>
        {selectedBook && viewerMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
          >
            <div className="container mx-auto px-4 py-4 h-full flex flex-col">
              {/* Viewer Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedBook.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedBook.author || 'Unknown Author'} • {getGradeName(selectedBook.grade_id)} • {getSubjectName(selectedBook.subject_id)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewerMode === 'pdf' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewerMode('pdf')}
                    disabled={!selectedBook.download_url}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant={viewerMode === 'video' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewerMode('video')}
                    disabled={!(selectedBook.metadata as Record<string, unknown>)?.video_url}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Video
                  </Button>
                  <Button
                    variant={viewerMode === 'editor' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewerMode('editor')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" onClick={closeViewer}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Viewer Content */}
              <div className="flex-1 min-h-0">
                {viewerMode === 'pdf' && selectedBook.download_url && (
                  <PDFViewer
                    url={selectedBook.download_url}
                    title={selectedBook.title}
                    className="h-full"
                  />
                )}
                
                {viewerMode === 'video' && (selectedBook.metadata as Record<string, unknown>)?.video_url && (
                  <VideoPlayer
                    url={(selectedBook.metadata as Record<string, unknown>).video_url as string}
                    title={selectedBook.title}
                    className="h-full max-h-[70vh] mx-auto"
                  />
                )}
                
                {viewerMode === 'editor' && (
                  <ContentEditor
                    initialContent={selectedBook.extracted_text || ''}
                    onSave={handleContentSave}
                    onCancel={() => setViewerMode(null)}
                    className="h-full"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentManagement;
