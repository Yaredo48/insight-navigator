import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  conversation_id?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    setConversations(data || []);
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data?.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      created_at: m.created_at,
      conversation_id: m.conversation_id,
    })) || []);
  }, []);

  // Set up real-time subscription for messages
  const setupRealtimeSubscription = useCallback((conversationId: string) => {
    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, {
                id: newMessage.id,
                role: newMessage.role as 'user' | 'assistant',
                content: newMessage.content,
                created_at: newMessage.created_at,
                conversation_id: newMessage.conversation_id,
              }];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Message;
            setMessages(prev =>
              prev.map(m =>
                m.id === updated.id
                  ? { ...m, content: updated.content }
                  : m
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Message;
            setMessages(prev => prev.filter(m => m.id !== deleted.id));
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  }, []);

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);



  // Select a conversation
  const selectConversation = useCallback(async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    await loadMessages(conversationId);
    setupRealtimeSubscription(conversationId);
  }, [loadMessages, setupRealtimeSubscription]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      });
      return;
    }

    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
      setMessages([]);
    }

    toast({
      title: 'Deleted',
      description: 'Conversation deleted successfully',
    });
  }, [currentConversationId, toast]);

  // Delete all conversations
  const deleteAllConversations = useCallback(async () => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('Error deleting all conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete all conversations',
        variant: 'destructive',
      });
      return;
    }

    setConversations([]);
    setCurrentConversationId(null);
    setMessages([]);

    toast({
      title: 'Deleted',
      description: 'All conversations deleted successfully',
    });
  }, [toast]);

  // Delete a single message
  const deleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
      return;
    }

    setMessages(prev => prev.filter(m => m.id !== messageId));
    toast({
      title: 'Deleted',
      description: 'Message deleted',
    });
  }, [toast]);

  // Edit a message (only user messages)
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ content: newContent })
      .eq('id', messageId);

    if (error) {
      console.error('Error updating message:', error);
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
      return false;
    }

    setMessages(prev =>
      prev.map(m =>
        m.id === messageId ? { ...m, content: newContent } : m
      )
    );

    toast({
      title: 'Updated',
      description: 'Message updated successfully',
    });
    return true;
  }, [toast]);

  // Export chat history
  const exportChat = useCallback((format: 'txt' | 'json') => {
    if (messages.length === 0) {
      toast({
        title: 'No messages',
        description: 'There are no messages to export',
        variant: 'destructive',
      });
      return;
    }

    const conversation = conversations.find(c => c.id === currentConversationId);
    const title = conversation?.title || 'Chat Export';
    const timestamp = new Date().toISOString().split('T')[0];

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'txt') {
      content = messages
        .map(m => `[${m.role.toUpperCase()}] (${new Date(m.created_at).toLocaleString()})\n${m.content}`)
        .join('\n\n---\n\n');
      content = `# ${title}\nExported on: ${timestamp}\n\n${content}`;
      filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.txt`;
      mimeType = 'text/plain';
    } else {
      content = JSON.stringify({
        title,
        exportedAt: new Date().toISOString(),
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
        })),
      }, null, 2);
      filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: `Chat exported as ${format.toUpperCase()}`,
    });
  }, [messages, conversations, currentConversationId, toast]);

  // Create a new conversation
  const createConversation = useCallback(async (initialMessage: string, context?: { role: string, gradeId?: number, subjectId?: number }) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          title: initialMessage.slice(0, 50),
          role: (context?.role as 'student' | 'teacher') || 'student',
          grade_id: context?.gradeId,
          subject_id: context?.subjectId,
        })
        .select()
        .single();

      if (error) throw error;

      setConversations(prev => [data, ...prev]);
      setCurrentConversationId(data.id);
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Send a message
  const sendMessage = useCallback(async (content: string, documentContext?: string, context?: { role: string, grade?: string, subject?: string }) => {
    if (!content.trim() || isLoading) return;

    let conversationId = currentConversationId;

    // Create a new conversation if needed
    if (!conversationId) {
      // Parse IDs from context if available
      const gradeId = context?.grade ? parseInt(context.grade) : undefined;
      const subjectId = context?.subject ? parseInt(context.subject) : undefined;

      const newConv = await createConversation(content, {
        role: context?.role || 'student',
        gradeId: gradeId,
        subjectId: subjectId
      });

      if (!newConv) return;
      conversationId = newConv.id;
    }

    setIsLoading(true);
    setIsStreaming(true);

    // Capture current messages before adding user message (fix race condition)
    const currentMessages = [...messages];
    
    // Add user message optimistically
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      conversation_id: conversationId,
    };
    setMessages(prev => [...prev, userMessage]);

    // Save user message to database
    const { data: savedUserMessage } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content,
    }).select().single();

    // Update the optimistic message with the real ID
    if (savedUserMessage) {
      setMessages(prev =>
        prev.map(m =>
          m.id === userMessage.id
            ? { ...m, id: savedUserMessage.id }
            : m
        )
      );
    }

    // Prepare messages for API (use captured messages to avoid stale closure)
    const apiMessages = [...currentMessages, userMessage].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: apiMessages,
            conversationId,
            documentContext,
            role: context?.role,
            grade: context?.grade,
            subject: context?.subject,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${errorData.details || 'Failed to get response'}`);
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      // Add empty assistant message that we'll update
      const assistantMessageId = crypto.randomUUID();
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        conversation_id: conversationId,
      }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessageId
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            // Incomplete JSON, continue
          }
        }
      }

      // Save assistant message to database
      if (assistantContent) {
        const { data: savedAssistant } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantContent,
        }).select().single();

        // Update with real ID
        if (savedAssistant) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, id: savedAssistant.id }
                : m
            )
          );
        }

        // Update conversation title if it's the first exchange
        if (messages.length === 0) {
          await supabase
            .from('conversations')
            .update({ title: content.slice(0, 50) })
            .eq('id', conversationId);
          loadConversations();
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      // Remove the optimistic messages on error
      setMessages(prev => prev.slice(0, -2));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [currentConversationId, messages, isLoading, createConversation, toast, loadConversations]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
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
    loadConversations,
  };
}
