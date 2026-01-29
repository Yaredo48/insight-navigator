import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TeacherResource, Grade, Subject } from '@/types/education';

interface ResourceLibraryProps {
    userId: string | null;
}

export const ResourceLibrary = ({ userId }: ResourceLibraryProps) => {
    const { toast } = useToast();
    const [resources, setResources] = useState<TeacherResource[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGrade, setSelectedGrade] = useState<string>('all');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
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

                // Load resources
                await loadResources();
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const loadResources = async () => {
        let query = supabase
            .from('teacher_resources')
            .select('*')
            .order('created_at', { ascending: false });

        if (selectedGrade !== 'all') {
            query = query.eq('grade_id', parseInt(selectedGrade));
        }

        if (selectedSubject !== 'all') {
            query = query.eq('subject_id', parseInt(selectedSubject));
        }

        if (selectedType !== 'all') {
            query = query.eq('resource_type', selectedType);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error loading resources:', error);
            toast({
                title: 'Error',
                description: 'Failed to load resources',
                variant: 'destructive',
            });
            return;
        }

        setResources((data as unknown as TeacherResource[]) || []);
    };

    useEffect(() => {
        loadResources();
    }, [selectedGrade, selectedSubject, selectedType]);

    const filteredResources = resources.filter((resource) =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const resourceTypeColors: Record<string, string> = {
        lesson_plan: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        quiz: 'bg-green-500/10 text-green-500 border-green-500/20',
        exercise: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        guide: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading resources...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Filter Resources</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search resources..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Grade Filter */}
                        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Grades" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Grades</SelectItem>
                                {grades.map((grade) => (
                                    <SelectItem key={grade.id} value={grade.id.toString()}>
                                        {grade.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Subject Filter */}
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Subjects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {subjects.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id.toString()}>
                                        {subject.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Type Filter */}
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="lesson_plan">Lesson Plans</SelectItem>
                                <SelectItem value="quiz">Quizzes</SelectItem>
                                <SelectItem value="exercise">Exercises</SelectItem>
                                <SelectItem value="guide">Guides</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Resources List */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Available Resources ({filteredResources.length})
                </h3>

                {filteredResources.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No resources found</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Try adjusting your filters or upload new materials
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-4">
                            {filteredResources.map((resource) => (
                                <Card key={resource.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-5 h-5 text-primary" />
                                                <h4 className="font-semibold text-foreground">
                                                    {resource.title}
                                                </h4>
                                            </div>

                                            {resource.description && (
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {resource.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge
                                                    variant="outline"
                                                    className={resourceTypeColors[resource.resource_type]}
                                                >
                                                    {resource.resource_type.replace('_', ' ')}
                                                </Badge>

                                                {resource.grade_id && (
                                                    <Badge variant="outline">
                                                        Grade {grades.find((g) => g.id === resource.grade_id)?.grade_number}
                                                    </Badge>
                                                )}

                                                {resource.subject_id && (
                                                    <Badge variant="outline">
                                                        {subjects.find((s) => s.id === resource.subject_id)?.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {resource.file_url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(resource.file_url, '_blank')}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Download
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </Card>
        </div>
    );
};
