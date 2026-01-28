import { Plus, MessageSquare, Trash2, Headphones, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/hooks/useChat';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onDeleteAllConversations: () => void;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onDeleteAllConversations,
}: ChatSidebarProps) {
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  return (
    <>
      <div className="flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-sidebar-border p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <Headphones className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold">Support Chat</h1>
            <p className="text-xs text-sidebar-foreground/60">AI-Powered Assistance</p>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={onNewChat}
            className={cn(
              'w-full justify-start gap-2',
              'bg-sidebar-accent hover:bg-sidebar-accent/80',
              'text-sidebar-accent-foreground',
              'border border-sidebar-border'
            )}
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 px-3 chat-scrollbar">
          <div className="space-y-1 pb-4">
            <AnimatePresence mode="popLayout">
              {conversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={cn(
                      'group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors',
                      currentConversationId === conversation.id
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground'
                    )}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate text-sm">
                      {conversation.title || 'New Conversation'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConversationToDelete(conversation.id);
                      }}
                      className={cn(
                        'opacity-0 group-hover:opacity-100 transition-opacity',
                        'p-1 rounded hover:bg-destructive/20',
                        currentConversationId === conversation.id && 'opacity-100'
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {conversations.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-sidebar-foreground/50">
                No conversations yet.
                <br />
                Start a new chat!
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Footer with Delete All option */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-sidebar-foreground/50">
              Powered by AI
            </p>
            {conversations.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setShowDeleteAllDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Conversations
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Conversations</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all conversations? This will permanently remove all your chat history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteAllConversations();
                setShowDeleteAllDialog(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Single Conversation Confirmation Dialog */}
      <AlertDialog open={!!conversationToDelete} onOpenChange={() => setConversationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? All messages will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (conversationToDelete) {
                  onDeleteConversation(conversationToDelete);
                }
                setConversationToDelete(null);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
