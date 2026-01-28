import { useRef, useEffect, useState } from 'react';
import { EnhancedChatMessage } from './EnhancedChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { DocumentList } from './DocumentList';
import { ProgressTracker } from './ProgressTracker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Wrench } from 'lucide-react';
import type { Message } from '@/hooks/useChat';
import type { Document } from '@/hooks/useDocuments';
import { motion } from 'framer-motion';
import { useTroubleshooting } from '@/hooks/useTroubleshooting';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BadgeDisplay } from './BadgeDisplay';

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
  currentConversationId?: string;
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
  currentConversationId,
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  const {
    activeSession,
    currentFlow,
    userProgress,
    startFlow,
    loadActiveSession,
  } = useTroubleshooting();

  // Listen for proactive troubleshooting triggers
  useEffect(() => {
    const handleTrigger = async (e: CustomEvent<{ issue: string }>) => {
      const issue = e.detail.issue;
      handleStartTroubleshooting(issue);
    };

    window.addEventListener('trigger-troubleshooting', handleTrigger as EventListener);
    return () => {
      window.removeEventListener('trigger-troubleshooting', handleTrigger as EventListener);
    };
  }, [currentConversationId, startFlow]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStartTroubleshooting = async (issue: string) => {
    if (!currentConversationId) return;

    const session = await startFlow(currentConversationId, undefined, issue);

    if (session) {
      // Send a special message to trigger troubleshooting flow display
      onSendMessage(`[TROUBLESHOOTING_FLOW] ${issue}`);
    }
  };

  const troubleshootingSuggestions = [
    'My device isn\'t turning on',
    'I can\'t connect to the internet',
    'Help me troubleshoot an issue',
  ];

  return (
    <div className="flex flex-1 flex-col bg-background">
      <ChatHeader
        isStreaming={isStreaming}
        hasMessages={messages.length > 0}
        onExportTxt={() => onExportChat?.('txt')}
        onExportJson={() => onExportChat?.('json')}
        onDeleteConversation={() => onDeleteConversation?.()}
      />

      {/* Progress Tracker (shown when there's an active session) */}
      {activeSession && currentFlow && (
        <div className="border-b border-border bg-secondary/30 px-6 py-3">
          <ProgressTracker
            userProgress={userProgress}
            currentStepIndex={activeSession.current_step_index}
            totalSteps={currentFlow.steps.length}
            showBadges={false}
          />
        </div>
      )}

      {/* User Progress Button (top right) */}
      {userProgress && (
        <div className="absolute top-4 right-4 z-10">
          <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {userProgress.flows_completed} Flows
                </span>
                {userProgress.badges.length > 0 && (
                  <span className="text-xs">
                    {userProgress.badges.slice(0, 3).map(b => b.icon).join('')}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Your Troubleshooting Progress</DialogTitle>
                <DialogDescription>
                  Track your achievements and badges
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <ProgressTracker
                  userProgress={userProgress}
                  showBadges={false}
                />
                {userProgress.badges.length > 0 && (
                  <BadgeDisplay badges={userProgress.badges} />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

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
              {troubleshootingSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleStartTroubleshooting(suggestion)}
                  className="rounded-lg border border-border bg-card p-4 text-left text-sm transition-colors hover:bg-secondary hover:border-accent flex items-start gap-2"
                >
                  <Wrench className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{suggestion}</span>
                </button>
              ))}
              <button
                onClick={() => onSendMessage('What services do you offer?')}
                className="rounded-lg border border-border bg-card p-4 text-left text-sm transition-colors hover:bg-secondary hover:border-accent"
              >
                What services do you offer?
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((message, index) => (
              <EnhancedChatMessage
                key={message.id}
                id={message.id}
                role={message.role}
                content={message.content}
                conversationId={currentConversationId}
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
