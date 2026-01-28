import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { useChat } from '@/hooks/useChat';

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
  } = useChat();

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={() => createConversation()}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
      />
      <ChatContainer
        messages={messages}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onSendMessage={sendMessage}
      />
    </div>
  );
};

export default Index;
