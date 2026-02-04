import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Search, 
  Pin, 
  PinOff, 
  Trash2, 
  Edit2, 
  Save,
  X,
  FileText
} from "lucide-react";
import type { StudentNote } from "@/hooks/useStudentNotes";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

interface NoteTakerProps {
  notes: StudentNote[];
  currentNote: StudentNote | null;
  onSelectNote: (note: StudentNote | null) => void;
  onCreateNote: (data: { title: string; content?: string; tags?: string[] }) => Promise<StudentNote | null>;
  onUpdateNote: (noteId: string, data: { title?: string; content?: string; tags?: string[]; is_pinned?: boolean }) => Promise<unknown>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onTogglePin: (noteId: string) => Promise<void>;
  isLoading: boolean;
}

export function NoteTaker({
  notes,
  currentNote,
  onSelectNote,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
  isLoading
}: NoteTakerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Filter notes
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Load note for editing
  useEffect(() => {
    if (currentNote && isEditing) {
      setEditTitle(currentNote.title);
      setEditContent(currentNote.content || '');
      setEditTags(currentNote.tags || []);
    }
  }, [currentNote, isEditing]);

  const handleCreateNote = async () => {
    const note = await onCreateNote({
      title: 'Untitled Note',
      content: ''
    });
    if (note) {
      onSelectNote(note);
      setIsEditing(true);
    }
  };

  const handleSaveNote = async () => {
    if (!currentNote) return;
    
    await onUpdateNote(currentNote.id, {
      title: editTitle,
      content: editContent,
      tags: editTags
    });
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags(prev => prev.filter(t => t !== tag));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Notes List */}
      <div className="w-80 flex flex-col border rounded-lg">
        <div className="p-4 border-b space-y-4">
          <Button onClick={handleCreateNote} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            New Note
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No notes found</p>
            ) : (
              filteredNotes.map(note => (
                <Card
                  key={note.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors",
                    currentNote?.id === note.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => {
                    onSelectNote(note);
                    setIsEditing(false);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {note.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                          <h4 className="font-medium truncate">{note.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {note.content?.substring(0, 50) || 'No content'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(note.updated_at)}
                        </p>
                      </div>
                    </div>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{note.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Note Editor/Viewer */}
      <div className="flex-1 border rounded-lg flex flex-col">
        {!currentNote ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a note or create a new one</p>
            </div>
          </div>
        ) : isEditing ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xl font-bold border-0 p-0 focus-visible:ring-0"
                placeholder="Note title..."
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNote}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>

            {/* Tags editor */}
            <div className="p-4 border-b">
              <div className="flex flex-wrap gap-2 items-center">
                {editTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <div className="flex gap-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add tag..."
                    className="h-7 w-24 text-xs"
                  />
                  <Button variant="ghost" size="sm" onClick={handleAddTag} className="h-7 px-2">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write your note here... (Markdown supported)"
              className="flex-1 border-0 rounded-none resize-none focus-visible:ring-0 p-4"
            />
          </>
        ) : (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{currentNote.title}</h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onTogglePin(currentNote.id)}
                >
                  {currentNote.is_pinned ? (
                    <PinOff className="w-4 h-4" />
                  ) : (
                    <Pin className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => {
                    onDeleteNote(currentNote.id);
                    onSelectNote(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {currentNote.tags && currentNote.tags.length > 0 && (
              <div className="px-4 py-2 border-b flex flex-wrap gap-2">
                {currentNote.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}

            <ScrollArea className="flex-1 p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {currentNote.content ? (
                  <ReactMarkdown>{currentNote.content}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground italic">No content yet. Click edit to start writing.</p>
                )}
              </div>
            </ScrollArea>

            <div className="p-2 border-t text-xs text-muted-foreground text-center">
              Last updated: {formatDate(currentNote.updated_at)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
