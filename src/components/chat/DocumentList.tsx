import { FileText, X, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Document } from '@/hooks/useDocuments';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string, storagePath: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string) {
  if (fileType === 'application/pdf') {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  return <File className="h-4 w-4 text-primary" />;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  if (documents.length === 0) return null;

  return (
    <div className="border-t border-border bg-secondary/30 px-4 py-3">
      <div className="mx-auto max-w-4xl">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Attached Documents ({documents.length})
        </p>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'group flex items-center gap-2 rounded-lg',
                  'bg-background border border-border',
                  'px-3 py-2 text-sm',
                  'hover:border-accent/50 transition-colors'
                )}
              >
                {getFileIcon(doc.file_type)}
                <span className="max-w-[150px] truncate font-medium text-foreground">
                  {doc.file_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(doc.file_size)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(doc.id, doc.storage_path)}
                  className={cn(
                    'h-5 w-5 p-0 opacity-0 group-hover:opacity-100',
                    'text-muted-foreground hover:text-destructive',
                    'transition-opacity'
                  )}
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
