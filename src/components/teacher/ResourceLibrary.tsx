import { useState } from 'react';
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
  const [resources] = useState<TeacherResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

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
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Teacher resources require a teacher_resources table. Create the table to persist resources.
        </AlertDescription>
      </Alert>

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
        <h3 className="text-lg font-semibold mb-4">
          Available Resources ({filteredResources.length})
        </h3>

        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No resources found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Upload materials using the Document Uploader to see them here
          </p>
        </div>
      </Card>
    </div>
  );
};
