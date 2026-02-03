import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Code,
  Quote,
  Undo,
  Redo,
  Save,
  Eye,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface ContentEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function ContentEditor({ 
  initialContent = '', 
  onSave, 
  onCancel,
  placeholder = 'Start writing your content...',
  className,
  readOnly = false
}: ContentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const addToHistory = useCallback((newContent: string) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newContent]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // Debounce history updates
    const timer = setTimeout(() => addToHistory(newContent), 500);
    return () => clearTimeout(timer);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setContent(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setContent(history[historyIndex + 1]);
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      before + 
      selectedText + 
      after + 
      content.substring(end);
    
    setContent(newContent);
    addToHistory(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), tooltip: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), tooltip: 'Italic' },
    { icon: Underline, action: () => insertMarkdown('<u>', '</u>'), tooltip: 'Underline' },
    { separator: true },
    { icon: Heading1, action: () => insertMarkdown('# ', ''), tooltip: 'Heading 1' },
    { icon: Heading2, action: () => insertMarkdown('## ', ''), tooltip: 'Heading 2' },
    { icon: Heading3, action: () => insertMarkdown('### ', ''), tooltip: 'Heading 3' },
    { separator: true },
    { icon: List, action: () => insertMarkdown('- ', ''), tooltip: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('1. ', ''), tooltip: 'Numbered List' },
    { separator: true },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), tooltip: 'Link' },
    { icon: Image, action: () => insertMarkdown('![alt](', ')'), tooltip: 'Image' },
    { icon: Code, action: () => insertMarkdown('`', '`'), tooltip: 'Code' },
    { icon: Quote, action: () => insertMarkdown('> ', ''), tooltip: 'Quote' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col border rounded-lg overflow-hidden bg-background', className)}
    >
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-1">
            {toolbarButtons.map((button, index) => (
              button.separator ? (
                <Separator key={index} orientation="vertical" className="h-6 mx-1" />
              ) : (
                <Toggle
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={button.action}
                  title={button.tooltip}
                >
                  <button.icon className="w-4 h-4" />
                </Toggle>
              )
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Editor/Preview Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
        <div className="px-3 py-2 border-b">
          <TabsList>
            <TabsTrigger value="edit" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="m-0">
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[400px] border-0 rounded-none resize-none focus-visible:ring-0 font-mono text-sm"
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="min-h-[400px] p-4 prose prose-sm dark:prose-invert max-w-none">
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">Nothing to preview</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      {!readOnly && onSave && (
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-muted/30">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={() => onSave(content)} className="gap-2">
            <Save className="w-4 h-4" />
            Save Content
          </Button>
        </div>
      )}
    </motion.div>
  );
}
