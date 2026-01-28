import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex gap-4 px-6 py-5',
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
        <p className="text-sm font-medium text-muted-foreground">
          {isUser ? 'You' : 'Support Assistant'}
        </p>
        <div className={cn(
          'prose prose-sm max-w-none',
          'prose-p:leading-relaxed prose-p:text-foreground',
          'prose-headings:text-foreground prose-strong:text-foreground',
          'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          'prose-pre:bg-muted prose-pre:border prose-pre:border-border',
          'prose-ul:text-foreground prose-ol:text-foreground',
          'prose-li:marker:text-muted-foreground'
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
      </div>
    </motion.div>
  );
}
