import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentUpload } from './DocumentUpload';

interface ChatInputProps {
  onSend: (message: string) => void;
  onUpload?: (file: File) => Promise<void>;
  isLoading: boolean;
  isUploading?: boolean;
  placeholder?: string;
  hasDocuments?: boolean;
}

export function ChatInput({ 
  onSend, 
  onUpload,
  isLoading, 
  isUploading = false,
  placeholder = 'Type your message...',
  hasDocuments = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleUpload = async (file: File) => {
    if (onUpload) {
      await onUpload(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-card p-4">
      <div className="mx-auto max-w-4xl">
        <div className="relative flex items-end gap-2">
          {onUpload && (
            <DocumentUpload 
              onUpload={handleUpload}
              isUploading={isUploading}
              disabled={isLoading}
            />
          )}
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasDocuments ? 'Ask a question about your documents...' : placeholder}
              disabled={isLoading}
              rows={1}
              className={cn(
                'min-h-[52px] max-h-[200px] resize-none pr-4',
                'bg-background border-border',
                'focus-visible:ring-1 focus-visible:ring-accent',
                'placeholder:text-muted-foreground'
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={!message.trim() || isLoading}
            className={cn(
              'h-[52px] w-[52px] shrink-0',
              'bg-accent hover:bg-accent/90 text-accent-foreground',
              'transition-all duration-200',
              'disabled:opacity-50'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {hasDocuments 
            ? 'Documents attached • Press Enter to send'
            : 'Press Enter to send, Shift + Enter for new line'}
        </p>
      </div>
    </form>
  );
}
