import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { DocumentList } from './DocumentList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot } from 'lucide-react';
import type { Message } from '@/hooks/useChat';
import type { Document } from '@/hooks/useDocuments';
import { motion } from 'framer-motion';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
  onEditMessage?: (id: string, content: string) => Promise<boolean>;
  onDeleteMessage?: (id: string) => void;
  onDeleteConversation?: () => void;
  onExportChat?: (format: 'txt' | 'json') => void;
  documents?: Document[];
  onUploadDocument?: (file: File) => Promise<void>;
  onDeleteDocument?: (id: string, storagePath: string) => void;
  isUploading?: boolean;
}

export function ChatContainer({
  messages,
  isLoading,
  isStreaming,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onDeleteConversation,
  onExportChat,
  documents = [],
  onUploadDocument,
  onDeleteDocument,
  isUploading = false,
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <ChatHeader
        isStreaming={isStreaming}
        hasMessages={messages.length > 0}
        onExportTxt={() => onExportChat?.('txt')}
        onExportJson={() => onExportChat?.('json')}
        onDeleteConversation={() => onDeleteConversation?.()}
      />

      {/* Messages */}
      <ScrollArea 
        ref={scrollRef}
        className="flex-1 chat-scrollbar"
      >
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex h-full flex-col items-center justify-center p-8"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              How can I help you today?
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              I'm your AI-powered support assistant. Ask me anything about our products, 
              services, or get help with any issues you're experiencing.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 max-w-xl w-full">
              {[
                'What services do you offer?',
                'Help me troubleshoot an issue',
                'Tell me about your pricing',
                'How do I contact support?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSendMessage(suggestion)}
                  className="rounded-lg border border-border bg-card p-4 text-left text-sm transition-colors hover:bg-secondary hover:border-accent"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                id={message.id}
                role={message.role}
                content={message.content}
                isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Document List */}
      {onDeleteDocument && (
        <DocumentList
          documents={documents}
          onDelete={onDeleteDocument}
        />
      )}

      {/* Input */}
      <ChatInput
        onSend={onSendMessage}
        onUpload={onUploadDocument}
        isLoading={isLoading}
        isUploading={isUploading}
        placeholder="Ask a question or describe your issue..."
        hasDocuments={documents.length > 0}
      />
    </div>
  );
}
