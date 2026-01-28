import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, Pencil, Trash2, Check, X, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  onEdit?: (id: string, content: string) => Promise<boolean>;
  onDelete?: (id: string) => void;
}

export function ChatMessage({ 
  id, 
  role, 
  content, 
  isStreaming,
  onEdit,
  onDelete,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const isUser = role === 'user';

  const handleSaveEdit = async () => {
    if (!onEdit || !editContent.trim()) return;
    
    setIsSaving(true);
    const success = await onEdit(id, editContent.trim());
    setIsSaving(false);
    
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Message copied to clipboard',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group flex gap-4 px-6 py-5',
        isUser ? 'bg-secondary/50' : 'bg-card'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          isUser 
            ? 'bg-chat-user text-chat-user-foreground' 
            : 'bg-primary text-primary-foreground'
        )}
      >
        {isUser ? (
          <User className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </div>
      
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {isUser ? 'You' : 'Support Assistant'}
          </p>
          
          {/* Action buttons */}
          {!isStreaming && !isEditing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
                title="Copy message"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              
              {isUser && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsEditing(true)}
                  title="Edit message"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive"
                      title="Delete message"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Message</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this message? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] resize-none"
              placeholder="Edit your message..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving || !editContent.trim()}
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn(
            'prose prose-sm max-w-none',
            'prose-p:leading-relaxed prose-p:text-foreground',
            'prose-headings:text-foreground prose-strong:text-foreground',
            'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
            'prose-pre:bg-muted prose-pre:border prose-pre:border-border',
            'prose-ul:text-foreground prose-ol:text-foreground',
            'prose-li:marker:text-muted-foreground',
            'prose-table:border-collapse prose-table:w-full',
            'prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted',
            'prose-td:border prose-td:border-border prose-td:p-2'
          )}>
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : isStreaming ? (
              <div className="flex items-center gap-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse animation-delay-150">●</span>
                <span className="animate-pulse animation-delay-300">●</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
}
