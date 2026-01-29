import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Grade, Subject } from '@/types/education';

interface DocumentUploaderProps {
    userId: string | null;
}

export const DocumentUploader = ({ userId }: DocumentUploaderProps) => {
    const { toast } = useToast();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [resourceType, setResourceType] = useState<string>('');
    const [selectedGrade, setSelectedGrade] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        const loadData = async () => {
            // Load grades
            const { data: gradesData } = await supabase
                .from('grades')
                .select('*')
                .order('grade_number');
            setGrades(gradesData || []);

            // Load subjects
            const { data: subjectsData } = await supabase
                .from('subjects')
                .select('*')
                .order('name');
            setSubjects(subjectsData || []);
        };

        loadData();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Check file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(selectedFile.type)) {
                toast({
                    title: 'Invalid file type',
                    description: 'Please upload a PDF or Word document',
                    variant: 'destructive',
                });
                return;
            }

            // Check file size (max 10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                toast({
                    title: 'File too large',
                    description: 'Please upload a file smaller than 10MB',
                    variant: 'destructive',
                });
                return;
            }

            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !resourceType) {
            toast({
                title: 'Missing information',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);

        try {
            let fileUrl = null;

            // Upload file if provided
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `teacher-resources/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(filePath);

                fileUrl = urlData.publicUrl;
            }

            // Create resource record
            const { error: insertError } = await supabase
                .from('teacher_resources')
                .insert({
                    title,
                    description,
                    resource_type: resourceType,
                    grade_id: selectedGrade ? parseInt(selectedGrade) : null,
                    subject_id: selectedSubject ? parseInt(selectedSubject) : null,
                    file_url: fileUrl,
                    created_by: userId,
                });

            if (insertError) throw insertError;

            toast({
                title: 'Success!',
                description: 'Resource uploaded successfully',
            });

            // Reset form
            setTitle('');
            setDescription('');
            setResourceType('');
            setSelectedGrade('');
            setSelectedSubject('');
            setFile(null);
        } catch (error) {
            console.error('Error uploading resource:', error);
            toast({
                title: 'Upload failed',
                description: error instanceof Error ? error.message : 'Failed to upload resource',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Upload Curriculum Materials</h3>
                <p className="text-sm text-muted-foreground">
                    Upload textbooks, teacher guides, lesson plans, and other educational resources
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    <Label htmlFor="title">
                        Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="title"
                        placeholder="e.g., Grade 9 Chemistry Textbook"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="Brief description of the resource..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Resource Type */}
                <div className="space-y-2">
                    <Label htmlFor="type">
                        Resource Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={resourceType} onValueChange={setResourceType} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="exercise">Exercise</SelectItem>
                            <SelectItem value="guide">Teacher Guide</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Grade and Subject */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="grade">Grade (Optional)</Label>
                        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                                {grades.map((grade) => (
                                    <SelectItem key={grade.id} value={grade.id.toString()}>
                                        {grade.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject (Optional)</Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id.toString()}>
                                        {subject.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                    <Label htmlFor="file">Upload File (PDF or Word)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <input
                            id="file"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label htmlFor="file" className="cursor-pointer">
                            {file ? (
                                <div className="flex items-center justify-center gap-2 text-green-500">
                                    <CheckCircle className="w-6 h-6" />
                                    <span className="font-medium">{file.name}</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                                    <p className="text-sm text-muted-foreground">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        PDF or Word documents (max 10MB)
                                    </p>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={isUploading}
                    className="w-full"
                    size="lg"
                >
                    {isUploading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Resource
                        </>
                    )}
                </Button>
            </form>
        </Card>
    );
};
