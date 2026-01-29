import { useEffect, useCallback } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useDocuments } from '@/hooks/useDocuments';
import { useAutoSolution } from '@/hooks/useAutoSolution';


// Main application entry point
const Index = () => {
  const {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    isStreaming,
    sendMessage,
    createConversation,
    selectConversation,
    deleteConversation,
    deleteAllConversations,
    deleteMessage,
    editMessage,
    exportChat,
  } = useChat();

  const {
    documents,
    isUploading,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentContext,
  } = useDocuments(currentConversationId);

  const { trackAction } = useAutoSolution();

  // Load documents when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadDocuments(currentConversationId);
    }
  }, [currentConversationId, loadDocuments]);

  // Handle sending message with document context
  const handleSendMessage = useCallback((message: string) => {
    const documentContext = getDocumentContext();
    sendMessage(message, documentContext || undefined);
  }, [sendMessage, getDocumentContext]);

  // Handle document upload
  const handleUploadDocument = useCallback(async (file: File) => {
    let convId = currentConversationId;
    trackAction('feature_click', { feature: 'upload_document' });

    // Create a conversation if none exists
    if (!convId) {
      const newConv = await createConversation('New Conversation');
      if (newConv) {
        convId = newConv.id;
      }
    }

    if (convId) {
      try {
        await uploadDocument(file, convId);
      } catch (error) {
        trackAction('upload_error', { error });
        throw error;
      }
    }
  }, [currentConversationId, createConversation, uploadDocument, trackAction]);

  // Handle cleanup of empty conversations
  const handleCreateNewConversation = useCallback(async () => {
    const newConv = await createConversation('New Conversation');
    return newConv?.id || null;
  }, [createConversation]);

  // Handle delete current conversation
  const handleDeleteCurrentConversation = useCallback(() => {
    if (currentConversationId) {
      deleteConversation(currentConversationId);
    }
  }, [currentConversationId, deleteConversation]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <div className="z-10 flex h-full w-full glass">
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewChat={() => createConversation()}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onDeleteAllConversations={deleteAllConversations}
        />
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onSendMessage={handleSendMessage}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
          onDeleteConversation={handleDeleteCurrentConversation}
          onExportChat={exportChat}
          documents={documents}
          onUploadDocument={handleUploadDocument}
          onDeleteDocument={deleteDocument}
          isUploading={isUploading}
          currentConversationId={currentConversationId || undefined}
          onCreateConversation={handleCreateNewConversation}
        />
      </div>
    </div>
  );
};

export default Index;
