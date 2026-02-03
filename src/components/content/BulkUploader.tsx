import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FolderUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileWithStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface BulkUploaderProps {
  onUpload: (file: File) => Promise<boolean>;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
}

export function BulkUploader({
  onUpload,
  acceptedTypes = ['.pdf', '.doc', '.docx'],
  maxFiles = 20,
  maxSize = 50,
  className,
}: BulkUploaderProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!acceptedTypes.includes(extension)) {
      return `Invalid file type. Accepted: ${acceptedTypes.join(', ')}`;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File too large. Maximum size: ${maxSize}MB`;
    }

    return null;
  }, [acceptedTypes, maxSize]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive',
      });
      return;
    }

    const validatedFiles: FileWithStatus[] = fileArray.map(file => {
      const error = validateFile(file);
      return {
        file,
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined,
      };
    });

    setFiles(prev => [...prev, ...validatedFiles]);
  }, [files.length, maxFiles, validateFile, toast]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const uploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsProcessing(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;

      // Update status to uploading
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      try {
        // Simulate progress
        for (let p = 0; p <= 90; p += 10) {
          await new Promise(r => setTimeout(r, 100));
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, progress: p } : f
          ));
        }

        const success = await onUpload(files[i].file);

        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: success ? 'success' : 'error', 
            progress: 100,
            error: success ? undefined : 'Upload failed'
          } : f
        ));
      } catch (error) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error', 
            progress: 0,
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f
        ));
      }
    }

    setIsProcessing(false);

    const successCount = files.filter(f => f.status === 'success').length;
    const errorCount = files.filter(f => f.status === 'error').length;

    toast({
      title: 'Upload Complete',
      description: `${successCount} succeeded, ${errorCount} failed`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const getFileIcon = (status: FileWithStatus['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        )}
      >
        <input
          type="file"
          id="bulk-file-input"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <label htmlFor="bulk-file-input" className="cursor-pointer">
          <motion.div
            animate={{ scale: isDragging ? 1.05 : 1 }}
            className="space-y-4"
          >
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <FolderUp className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports {acceptedTypes.join(', ')} • Max {maxSize}MB per file • Up to {maxFiles} files
              </p>
            </div>
          </motion.div>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <span className="font-medium">{files.length} Files</span>
              {successCount > 0 && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                  {successCount} uploaded
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="outline">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {successCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCompleted}>
                  Clear Completed
                </Button>
              )}
              <Button
                size="sm"
                onClick={uploadAll}
                disabled={isProcessing || pendingCount === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload All ({pendingCount})
                  </>
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-64">
            <div className="divide-y">
              {files.map((fileWithStatus, index) => (
                <motion.div
                  key={`${fileWithStatus.file.name}-${index}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {getFileIcon(fileWithStatus.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileWithStatus.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(fileWithStatus.file.size)}
                      </span>
                      {fileWithStatus.error && (
                        <span className="text-xs text-destructive">
                          {fileWithStatus.error}
                        </span>
                      )}
                    </div>
                    {fileWithStatus.status === 'uploading' && (
                      <Progress value={fileWithStatus.progress} className="h-1 mt-2" />
                    )}
                  </div>

                  {fileWithStatus.status !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
