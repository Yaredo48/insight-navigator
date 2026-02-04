import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import type { Grade, Subject } from "@/types/education";

interface QuestionData {
  id: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching';
  question_text: string;
  options: Array<{ id: string; text: string }>;
  correct_answer: unknown;
  explanation: string;
  points: number;
}

interface QuizCreatorProps {
  grades: Grade[];
  subjects: Subject[];
  onSave: (quiz: {
    title: string;
    description?: string;
    grade_id?: number;
    subject_id?: number;
    topic?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    time_limit_minutes?: number;
    passing_score: number;
    is_published: boolean;
  }, questions: QuestionData[]) => Promise<void>;
  onCancel: () => void;
}

export function QuizCreator({ grades, subjects, onSave, onCancel }: QuizCreatorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gradeId, setGradeId] = useState<number | undefined>();
  const [subjectId, setSubjectId] = useState<number | undefined>();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeLimit, setTimeLimit] = useState<number | undefined>();
  const [passingScore, setPassingScore] = useState(70);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const addQuestion = (type: QuestionData['question_type']) => {
    const newQuestion: QuestionData = {
      id: crypto.randomUUID(),
      question_type: type,
      question_text: '',
      options: type === 'multiple_choice' 
        ? [
            { id: 'a', text: '' },
            { id: 'b', text: '' },
            { id: 'c', text: '' },
            { id: 'd', text: '' }
          ]
        : type === 'matching'
        ? [
            { id: '1', text: '' },
            { id: '2', text: '' }
          ]
        : [],
      correct_answer: type === 'true_false' ? true : type === 'multiple_choice' ? 'a' : '',
      explanation: '',
      points: 1
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<QuestionData>) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSave = async () => {
    if (!title || questions.length === 0) return;
    
    setIsSaving(true);
    try {
      await onSave({
        title,
        description: description || undefined,
        grade_id: gradeId,
        subject_id: subjectId,
        topic: topic || undefined,
        difficulty,
        time_limit_minutes: timeLimit,
        passing_score: passingScore,
        is_published: isPublished
      }, questions);
    } finally {
      setIsSaving(false);
    }
  };

  const renderQuestionEditor = (question: QuestionData, index: number) => {
    return (
      <Card key={question.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <span className="font-medium">Question {index + 1}</span>
              <span className="text-sm text-muted-foreground capitalize">
                ({question.question_type.replace('_', ' ')})
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeQuestion(question.id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Question Text</Label>
            <Textarea
              value={question.question_text}
              onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
              placeholder="Enter your question..."
              rows={2}
            />
          </div>

          {question.question_type === 'multiple_choice' && (
            <div className="space-y-2">
              <Label>Answer Options</Label>
              {question.options.map((opt, optIdx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correct_answer === opt.id}
                    onChange={() => updateQuestion(question.id, { correct_answer: opt.id })}
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) => {
                      const newOptions = [...question.options];
                      newOptions[optIdx] = { ...opt, text: e.target.value };
                      updateQuestion(question.id, { options: newOptions });
                    }}
                    placeholder={`Option ${opt.id.toUpperCase()}`}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
            </div>
          )}

          {question.question_type === 'true_false' && (
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Select
                value={question.correct_answer?.toString()}
                onValueChange={(val) => updateQuestion(question.id, { correct_answer: val === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {question.question_type === 'fill_blank' && (
            <div>
              <Label>Correct Answer</Label>
              <Input
                value={question.correct_answer as string}
                onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
                placeholder="Enter the correct answer..."
              />
            </div>
          )}

          {question.question_type === 'matching' && (
            <div className="space-y-2">
              <Label>Matching Pairs</Label>
              {question.options.map((pair, pairIdx) => (
                <div key={pair.id} className="flex items-center gap-2">
                  <Input
                    value={(pair as unknown as { left: string }).left || ''}
                    onChange={(e) => {
                      const newOptions = [...question.options];
                      newOptions[pairIdx] = { ...pair, text: e.target.value } as { id: string; text: string };
                      updateQuestion(question.id, { options: newOptions });
                    }}
                    placeholder="Left side"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">↔</span>
                  <Input
                    value={(pair as unknown as { right: string }).right || ''}
                    onChange={(e) => {
                      // Handle matching pair updates
                    }}
                    placeholder="Right side"
                    className="flex-1"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  updateQuestion(question.id, {
                    options: [...question.options, { id: String(question.options.length + 1), text: '' }]
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Pair
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Points</Label>
              <Input
                type="number"
                min={1}
                value={question.points}
                onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Explanation (optional)</Label>
              <Input
                value={question.explanation}
                onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                placeholder="Why is this the correct answer?"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Create New Quiz</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !title || questions.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Quiz'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Quiz Settings</TabsTrigger>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Quiz Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter quiz title..."
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this quiz covers..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Select
                    value={gradeId?.toString()}
                    onValueChange={(val) => setGradeId(parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map(g => (
                        <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Select
                    value={subjectId?.toString()}
                    onValueChange={(val) => setSubjectId(parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Topic</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Quadratic Equations"
                  />
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(val: 'easy' | 'medium' | 'hard') => setDifficulty(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={timeLimit || ''}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="No limit"
                  />
                </div>
                <div>
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                <Label>Publish quiz (make visible to students)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => addQuestion('multiple_choice')}>
                  <Plus className="w-4 h-4 mr-1" /> Multiple Choice
                </Button>
                <Button variant="outline" onClick={() => addQuestion('true_false')}>
                  <Plus className="w-4 h-4 mr-1" /> True/False
                </Button>
                <Button variant="outline" onClick={() => addQuestion('fill_blank')}>
                  <Plus className="w-4 h-4 mr-1" /> Fill in Blank
                </Button>
                <Button variant="outline" onClick={() => addQuestion('matching')}>
                  <Plus className="w-4 h-4 mr-1" /> Matching
                </Button>
              </div>
            </CardContent>
          </Card>

          {questions.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p>No questions added yet. Click a button above to add your first question.</p>
            </Card>
          ) : (
            questions.map((q, idx) => renderQuestionEditor(q, idx))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
