import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from "@/hooks/useChat";
import { useDocuments } from "@/hooks/useDocuments";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, GraduationCap, BookOpen, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBookSelection } from "@/hooks/useBookSelection";

interface ChatContext {
  role: string;
  grade?: string;
  subject?: string;
  gradeName?: string;
  subjectName?: string;
  gradeId?: number;
  subjectId?: number;
}

// Main application entry point
const Index = () => {
  console.log("Index component rendering");
  const location = useLocation();
  console.log("Location:", location);
  const [chatContext, setChatContext] = useState<ChatContext | undefined>(undefined);

  const {
    messages,
    sendMessage,
    isLoading,
    isStreaming,
    // currentConversationId, 
    createConversation,
    exportChat,
    deleteAllConversations,
    // Add other necessary exports from useChat
    conversations,
    currentConversationId,
    selectConversation,
    deleteConversation,
    deleteMessage,
    editMessage,
    loadConversations
  } = useChat();

  const {
    documents,
    uploadDocument,
    deleteDocument,
    isUploading
  } = useDocuments(currentConversationId);

  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Book selection for RAG
  const {
    selectedBookIds,
    selectionCount,
    toggleBookSelection,
    clearSelection,
    getBookContext,
  } = useBookSelection();

  // Extract context from navigation state
  useEffect(() => {
    if (location.state) {
      const state = location.state as { role?: string; gradeId?: number; subjectName?: string; gradeName?: string; subjectId?: number };
      if (state.role) {
        setChatContext({
          role: state.role,
          grade: state.gradeId?.toString(),
          subject: state.subjectName, // passing name for prompt context
          gradeName: state.gradeName,
          subjectName: state.subjectName,
          gradeId: state.gradeId,
          subjectId: state.subjectId
        });
      }
    }
  }, [location.state]);

  const handleSendMessage = useCallback((message: string) => {
    try {
      // If we have documents, include context
      const getDocumentContext = () => {
        if (documents.length === 0) return null;
        return documents.map(doc => `Title: ${doc.file_name}\nContent: ${doc.extracted_text}`).join('\n\n');
      };

      const documentContext = getDocumentContext();
      const bookContextText = getBookContext();

      // Combine document and book context with size limits
      let combinedContext = documentContext || undefined;

      // Only add book context if it exists and isn't too large
      if (bookContextText) {
        // Limit book context to prevent token overflow (max ~15000 chars)
        const truncatedBookContext = bookContextText.length > 15000
          ? bookContextText.substring(0, 15000) + '\n\n[Content truncated due to length...]'
          : bookContextText;

        combinedContext = combinedContext
          ? `${combinedContext}\n\n## Selected Textbooks:\n${truncatedBookContext}`
          : `## Selected Textbooks:\n${truncatedBookContext}`;
      }

      // Pass context to sendMessage
      sendMessage(message, combinedContext, chatContext ? {
        role: chatContext.role,
        grade: chatContext.gradeName, // Use readable names for the prompt
        subject: chatContext.subjectName
      } : undefined);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  }, [sendMessage, documents, chatContext, getBookContext, toast]);

  const handleUploadDocument = useCallback(async (file: File) => {
    let convId = currentConversationId;

    if (!convId) {

      const newConv = await createConversation('New Conversation', chatContext ? {
        role: chatContext.role,
        gradeId: chatContext.gradeId,
        subjectId: chatContext.subjectId
      } : undefined);

      if (newConv) {
        convId = newConv.id;
      }
    }

    if (convId) {
      const success = await uploadDocument(file, convId);
      if (success) {
        toast({
          title: "Document uploaded",
          description: "The AI can now use this document for context.",
        });
      }
    }
  }, [uploadDocument, toast, createConversation, chatContext, currentConversationId]);

  // Handle cleanup of empty conversations
  const handleCreateNewConversation = useCallback(async () => {

    const newConv = await createConversation('New Conversation', chatContext ? {
      role: chatContext.role,
      gradeId: chatContext.gradeId,
      subjectId: chatContext.subjectId
    } : undefined);
    return newConv?.id || null;
  }, [createConversation, chatContext]);

  // Handle export
  const handleExportChat = (format: 'txt' | 'json') => {
    exportChat(format);
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <div className="absolute top-4 left-4 z-50">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[80%] sm:w-[350px]">
              <ChatSidebar
                conversations={conversations}
                currentConversationId={currentConversationId}
                onNewChat={handleCreateNewConversation}
                onSelectConversation={selectConversation}
                onDeleteConversation={deleteConversation}
                onDeleteAllConversations={deleteAllConversations}
              />
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-[300px] border-r">
          <ChatSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onNewChat={handleCreateNewConversation}
            onSelectConversation={selectConversation}
            onDeleteConversation={deleteConversation}
            onDeleteAllConversations={deleteAllConversations}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Context Banner - Show if context is active */}
        {chatContext && (
          <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-medium capitalize">{chatContext.role}</span>
              </div>
              {chatContext.gradeName && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>{chatContext.gradeName}</span>
                </div>
              )}
              {chatContext.subjectName && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>{chatContext.subjectName}</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => window.history.back()}>
              Change Context
            </Button>
          </div>
        )}

        <ChatContainer
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isStreaming={isStreaming}
          gradeId={chatContext?.gradeId}
          subjectId={chatContext?.subjectId}
          onBookSelect={toggleBookSelection}
          selectedBookIds={selectedBookIds}
          selectionCount={selectionCount}
          onClearSelection={clearSelection}
          bookContext={getBookContext()}
        />
      </div>
    </div>
  );
};

export default Index;
