import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  disabled?: boolean;
}

export function DocumentUpload({ onUpload, isUploading, disabled }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,.csv,text/plain,text/markdown,text/csv,application/pdf"
        onChange={handleChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className={cn(
          'h-[52px] w-[52px] shrink-0',
          'text-muted-foreground hover:text-foreground',
          'hover:bg-secondary',
          'transition-colors duration-200'
        )}
        title="Attach document (PDF, TXT, MD, CSV)"
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </Button>
    </>
  );
}
