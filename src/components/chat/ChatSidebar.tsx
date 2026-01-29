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
      <div className="flex h-full w-72 flex-col bg-black/20 backdrop-blur-sm border-r border-white/10 text-sidebar-foreground">
        {/* Header */}
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Support Chat</h1>
            <p className="text-xs text-sidebar-foreground/60">AI-Powered Assistance</p>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-4">
          <Button
            onClick={onNewChat}
            className={cn(
              'w-full justify-start gap-2 h-11',
              'bg-gradient-to-r from-indigo-500/80 to-purple-500/80 hover:from-indigo-500 hover:to-purple-500',
              'text-white shadow-md border-0',
              'transition-all duration-300 transform hover:-translate-y-0.5'
            )}
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">New Conversation</span>
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
                      'group flex items-center gap-2 rounded-xl px-3 py-3 cursor-pointer transition-all duration-200',
                      currentConversationId === conversation.id
                        ? 'bg-white/15 text-white shadow-inner font-medium'
                        : 'hover:bg-white/5 text-sidebar-foreground/70 hover:text-white'
                    )}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <MessageSquare className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      currentConversationId === conversation.id ? "text-indigo-300" : "text-gray-400 group-hover:text-indigo-300"
                    )} />
                    <span className="flex-1 truncate text-sm">
                      {conversation.title || 'New Conversation'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConversationToDelete(conversation.id);
                      }}
                      className={cn(
                        'opacity-0 group-hover:opacity-100 transition-all duration-200',
                        'p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400',
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
              <div className="px-4 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white/20" />
                </div>
                <p className="text-sm text-sidebar-foreground/50">
                  No conversations yet.
                  <br />
                  Start a new chat!
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with Delete All option */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center justify-between">
            <p className="text-xs text-sidebar-foreground/40 font-medium">
              POWERED BY AI
            </p>
            {conversations.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-sidebar-foreground/60 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900/90 border-slate-700 backdrop-blur-xl text-slate-100">
                  <DropdownMenuItem
                    onClick={() => setShowDeleteAllDialog(true)}
                    className="text-red-400 focus:text-red-300 focus:bg-red-900/20"
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
