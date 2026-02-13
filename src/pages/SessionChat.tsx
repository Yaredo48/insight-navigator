import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useChat } from "@/hooks/useChat";
import { PDFViewer } from "@/components/content/PDFViewer";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, GraduationCap, User, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

interface SessionContext {
    role: string;
    gradeName?: string;
    subjectName?: string;
    gradeId?: number;
    subjectId?: number;
    bookId?: string;
    pdfUrl?: string;
    bookTitle?: string;
}

const SessionChat = () => {
    const { conversationId } = useParams<{ conversationId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [context, setContext] = useState<SessionContext | undefined>(undefined);

    const {
        messages,
        sendMessage,
        isLoading,
        isStreaming,
        selectConversation,
        loadConversations
    } = useChat();

    // Extract context from navigation state
    useEffect(() => {
        if (location.state) {
            setContext(location.state as SessionContext);
        }
    }, [location.state]);

    // Load conversation if ID is provided
    useEffect(() => {
        if (conversationId) {
            selectConversation(conversationId);
        }
    }, [conversationId, selectConversation]);

    const handleSendMessage = useCallback((message: string) => {
        if (!message.trim()) return;

        // Pass bookId for RAG grounding
        sendMessage(message, undefined, {
            role: context?.role || 'student',
            grade: context?.gradeName,
            subject: context?.subjectName,
            // @ts-ignore - sendMessage in useChat should be updated to accept bookId
            book_id: context?.bookId
        });
    }, [sendMessage, context]);

    return (
        <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
            {/* Header */}
            <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            Learning Session: {context?.bookTitle || 'Textbook'}
                        </h1>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5" />
                                {context?.gradeName}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span>{context?.subjectName}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                        <User className="w-3.5 h-3.5" />
                        <span className="capitalize">{context?.role} Mode</span>
                    </div>
                </div>
            </header>

            {/* Split Screen Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left: PDF Viewer */}
                <div className="hidden lg:flex flex-1 border-r bg-muted/10">
                    <PDFViewer
                        url={context?.pdfUrl || ''}
                        title={context?.bookTitle}
                        className="w-full h-full border-0 rounded-none"
                    />
                </div>

                {/* Right: Chat Area */}
                <div className="w-full lg:w-[500px] xl:w-[600px] flex flex-col bg-card/30 backdrop-blur-sm">
                    <div className="flex-1 overflow-hidden relative">
                        <ChatContainer
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            isLoading={isLoading}
                            isStreaming={isStreaming}
                            gradeId={context?.gradeId}
                            subjectId={context?.subjectId}
                            // Hide things that might clutter the session view
                            currentConversationId={conversationId}
                        />
                    </div>
                </div>
            </main>

            {/* Mobile Toggle (Simplified for brevity) */}
            <div className="lg:hidden fixed bottom-20 right-4 z-50">
                <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
                    <MessageSquare className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
};

export default SessionChat;
