import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Image, File, Loader2 } from 'lucide-react';
import type { UploadedFile } from '@/hooks/useFileUpload';

interface FileUploadAreaProps {
  uploadedFiles: UploadedFile[];
  uploading: boolean;
  onUpload: (files: FileList) => void;
  onRemove: (url: string) => void;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
  if (type === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadArea({ uploadedFiles, uploading, onUpload, onRemove }: FileUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-medium">Click or drag files to upload</p>
            <p className="text-xs text-muted-foreground">
              PDF, Images, Word, Text • Max 10MB each
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.txt,.csv"
          onChange={(e) => e.target.files && onUpload(e.target.files)}
        />
      </div>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Attached Files ({uploadedFiles.length})</p>
          {uploadedFiles.map((file) => (
            <div
              key={file.url}
              className="flex items-center justify-between gap-3 p-2 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(file.type)}
                <span className="text-sm truncate">{file.name}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {formatSize(file.size)}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(file.url);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
