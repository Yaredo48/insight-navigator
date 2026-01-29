import { useRef, useEffect, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { DocumentList } from './DocumentList';
import { ProgressTracker } from './ProgressTracker';
import { TroubleshootingFlow } from './TroubleshootingFlow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Wrench, X } from 'lucide-react';
import type { Message } from '@/hooks/useChat';
import type { Document } from '@/hooks/useDocuments';
import { motion, AnimatePresence } from 'framer-motion';
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
  onCreateConversation?: () => Promise<string | null>;
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
  onCreateConversation,
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  const {
    activeSession,
    currentFlow,
    userProgress,
    isLoading: isTroubleshootingLoading,
    startFlow,
    respondToStep,
    abandonSession,
    loadActiveSession,
  } = useTroubleshooting();

  // Load active session when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadActiveSession(currentConversationId);
    }
  }, [currentConversationId, loadActiveSession]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversationId, onCreateConversation]);

  // Auto-scroll to bottom on new messages or when troubleshooting step changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeSession?.current_step_index]);

  const handleStartTroubleshooting = async (issue: string) => {
    let convId = currentConversationId;

    // Create conversation if it doesn't exist
    if (!convId && onCreateConversation) {
      const newId = await onCreateConversation();
      if (newId) convId = newId;
    }

    if (!convId) return;

    // Start the troubleshooting flow
    await startFlow(convId, undefined, issue);
  };

  const handleTroubleshootingResponse = async (response: 'yes' | 'no') => {
    if (activeSession) {
      await respondToStep(activeSession.id, response);
    }
  };

  const handleAbandonSession = async () => {
    if (activeSession) {
      await abandonSession(activeSession.id);
    }
  };

  const troubleshootingSuggestions = [
    'My device isn\'t turning on',
    'I can\'t connect to the internet',
    'Help me troubleshoot an issue',
  ];

  return (
    <div className="flex flex-1 flex-col bg-transparent">
      <ChatHeader
        isStreaming={isStreaming}
        hasMessages={messages.length > 0}
        onExportTxt={() => onExportChat?.('txt')}
        onExportJson={() => onExportChat?.('json')}
        onDeleteConversation={() => onDeleteConversation?.()}
      />

      {/* Progress Tracker (shown when there's an active session) */}
      {activeSession && currentFlow && (
        <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm px-6 py-3">
          <div className="flex items-center justify-between">
            <ProgressTracker
              userProgress={userProgress}
              currentStepIndex={activeSession.current_step_index}
              totalSteps={currentFlow.steps.length}
              showBadges={false}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAbandonSession}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Exit Flow
            </Button>
          </div>
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
        {messages.length === 0 && !activeSession ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex h-full flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/30 mb-6 shadow-xl"
            >
              <Bot className="h-12 w-12 text-indigo-400" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-foreground mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              How can I help you today?
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-center max-w-md mb-10 leading-relaxed"
            >
              I'm your AI-powered support assistant. Ask me anything about our products,
              services, or get help with any issues you're experiencing.
            </motion.p>
            <div className="grid gap-3 sm:grid-cols-2 max-w-2xl w-full">
              {troubleshootingSuggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStartTroubleshooting(suggestion)}
                  className="group rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-left text-sm transition-all duration-300 hover:bg-white/10 hover:border-indigo-400/50 hover:shadow-lg flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                    <Wrench className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                  </div>
                  <span className="text-foreground/80 group-hover:text-foreground font-medium">{suggestion}</span>
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + troubleshootingSuggestions.length * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSendMessage('What services do you offer?')}
                className="group rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-left text-sm transition-all duration-300 hover:bg-white/10 hover:border-purple-400/50 hover:shadow-lg"
              >
                <span className="text-foreground/80 group-hover:text-foreground font-medium">What services do you offer?</span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-0">
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
            
            {/* Troubleshooting Flow - shown inline after messages */}
            <AnimatePresence>
              {activeSession && currentFlow && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="px-6 py-6"
                >
                  <TroubleshootingFlow
                    session={activeSession}
                    flow={currentFlow}
                    onResponse={handleTroubleshootingResponse}
                    isLoading={isTroubleshootingLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
