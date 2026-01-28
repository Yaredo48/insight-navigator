import { ChatMessage } from './ChatMessage';
import { TroubleshootingFlow } from './TroubleshootingFlow';
import { useTroubleshooting } from '@/hooks/useTroubleshooting';
import { useEffect } from 'react';

interface EnhancedChatMessageProps {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    conversationId?: string;
    isStreaming?: boolean;
    onEdit?: (id: string, content: string) => Promise<boolean>;
    onDelete?: (id: string) => void;
}

export function EnhancedChatMessage({
    id,
    role,
    content,
    conversationId,
    isStreaming,
    onEdit,
    onDelete,
}: EnhancedChatMessageProps) {
    const {
        activeSession,
        currentFlow,
        respondToStep,
        isLoading: isTroubleshootingLoading,
    } = useTroubleshooting();

    // Check if this message contains a troubleshooting flow marker
    const isTroubleshootingMessage = content.includes('[TROUBLESHOOTING_FLOW]');

    // Show troubleshooting flow if:
    // 1. This is an assistant message
    // 2. There's an active session for this conversation
    // 3. The message is marked as a troubleshooting flow
    const showTroubleshootingFlow =
        role === 'assistant' &&
        activeSession &&
        currentFlow &&
        conversationId === activeSession.conversation_id &&
        isTroubleshootingMessage;

    const handleResponse = async (response: 'yes' | 'no') => {
        if (activeSession) {
            await respondToStep(activeSession.id, response);
        }
    };

    if (showTroubleshootingFlow) {
        return (
            <div className="px-6 py-5">
                <TroubleshootingFlow
                    session={activeSession}
                    flow={currentFlow}
                    onResponse={handleResponse}
                    isLoading={isTroubleshootingLoading}
                />
            </div>
        );
    }

    // Regular chat message
    return (
        <ChatMessage
            id={id}
            role={role}
            content={content}
            isStreaming={isStreaming}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );
}
