import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Search, Filter, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { TeacherResource } from '@/types/education';

// Static grade/subject options (until database tables are created)
const GRADES = [
  { id: 9, name: 'Grade 9', grade_number: 9 },
  { id: 10, name: 'Grade 10', grade_number: 10 },
  { id: 11, name: 'Grade 11', grade_number: 11 },
  { id: 12, name: 'Grade 12', grade_number: 12 },
];

const SUBJECTS = [
  { id: 1, name: 'Mathematics', code: 'MATH' },
  { id: 2, name: 'Physics', code: 'PHY' },
  { id: 3, name: 'Chemistry', code: 'CHEM' },
  { id: 4, name: 'Biology', code: 'BIO' },
  { id: 5, name: 'English', code: 'ENG' },
  { id: 6, name: 'Amharic', code: 'AMH' },
  { id: 7, name: 'History', code: 'HIST' },
  { id: 8, name: 'Geography', code: 'GEO' },
];

interface ResourceLibraryProps {
  userId: string | null;
}

export const ResourceLibrary = ({ userId }: ResourceLibraryProps) => {
  const [resources, setResources] = useState<TeacherResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchResources();
  }, [userId, selectedGrade, selectedSubject, selectedType]);

  const fetchResources = async () => {
    try {
      setLoading(true);
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
        throw error;
      }

      if (data) {
        setResources(data as TeacherResource[]);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

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
                {GRADES.map((grade) => (
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
                {SUBJECTS.map((subject) => (
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Available Resources ({filteredResources.length})
          </h3>
          <Button variant="outline" size="sm" onClick={fetchResources}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No resources found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload materials using the Document Uploader to see them here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className={`p-4 border ${resourceTypeColors[resource.resource_type] || 'border-border'}`}>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className={resourceTypeColors[resource.resource_type]?.replace('border-', 'bg-').split(' ')[0] + ' border-transparent'}>
                    {resource.resource_type.replace('_', ' ')}
                  </Badge>
                  {resource.file_url && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                      <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
                <h4 className="font-semibold truncate" title={resource.title}>{resource.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-3">
                  {resource.description || 'No description provided'}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-auto">
                  {resource.grade_id && (
                    <span className="bg-secondary px-2 py-0.5 rounded">
                      Grade {GRADES.find(g => g.id === resource.grade_id)?.grade_number || resource.grade_id}
                    </span>
                  )}
                  {resource.subject_id && (
                    <span className="bg-secondary px-2 py-0.5 rounded">
                      {SUBJECTS.find(s => s.id === resource.subject_id)?.name || 'Subject ' + resource.subject_id}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  Added: {new Date(resource.created_at).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
