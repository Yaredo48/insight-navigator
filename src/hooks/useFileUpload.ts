import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];

export function useFileUpload(bucket: string = 'submissions') {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large (max 10MB)`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type "${file.type}" is not supported`;
    }
    return null;
  };

  const uploadFiles = async (files: FileList | File[], studentId: string, assignmentId: string): Promise<UploadedFile[]> => {
    const fileArray = Array.from(files);
    const errors: string[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) errors.push(error);
    }

    if (errors.length > 0) {
      toast({ title: 'Upload Error', description: errors.join('\n'), variant: 'destructive' });
      return [];
    }

    setUploading(true);
    const uploaded: UploadedFile[] = [];

    try {
      for (const file of fileArray) {
        const ext = file.name.split('.').pop();
        const path = `${studentId}/${assignmentId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: true });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
          continue;
        }

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

        uploaded.push({
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type,
        });
      }

      setUploadedFiles((prev) => [...prev, ...uploaded]);

      if (uploaded.length > 0) {
        toast({ title: `${uploaded.length} file(s) uploaded` });
      }
    } catch (error: any) {
      toast({ title: 'Upload error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }

    return uploaded;
  };

  const removeFile = (url: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.url !== url));
  };

  const clearFiles = () => setUploadedFiles([]);

  return {
    uploading,
    uploadedFiles,
    uploadFiles,
    removeFile,
    clearFiles,
    setUploadedFiles,
  };
}
