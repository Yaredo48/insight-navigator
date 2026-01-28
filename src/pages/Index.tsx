import { useEffect, useCallback } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useDocuments } from '@/hooks/useDocuments';

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

    // Create a conversation if none exists
    if (!convId) {
      const newConv = await createConversation('New Conversation');
      if (newConv) {
        convId = newConv.id;
      }
    }

    if (convId) {
      await uploadDocument(file, convId);
    }
  }, [currentConversationId, createConversation, uploadDocument]);

  // Handle delete current conversation
  const handleDeleteCurrentConversation = useCallback(() => {
    if (currentConversationId) {
      deleteConversation(currentConversationId);
    }
  }, [currentConversationId, deleteConversation]);

  return (
    <div className="flex h-screen overflow-hidden">
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
      />
    </div>
  );
};

export default Index;
