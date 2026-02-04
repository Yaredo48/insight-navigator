import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Play, Trash2 } from "lucide-react";
import type { Quiz } from "@/hooks/useQuizzes";

interface QuizCardProps {
  quiz: Quiz;
  onStart: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  questionCount?: number;
}

export function QuizCard({ quiz, onStart, onDelete, questionCount = 0 }: QuizCardProps) {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{quiz.title}</CardTitle>
            {quiz.topic && (
              <Badge variant="secondary" className="text-xs">
                {quiz.topic}
              </Badge>
            )}
          </div>
          <Badge className={difficultyColors[quiz.difficulty]}>
            {quiz.difficulty}
          </Badge>
        </div>
        {quiz.description && (
          <CardDescription className="line-clamp-2">
            {quiz.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>{questionCount} questions</span>
          </div>
          {quiz.time_limit_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{quiz.time_limit_minutes} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>Pass: {quiz.passing_score}%</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={() => onStart(quiz.id)} className="gap-2">
          <Play className="w-4 h-4" />
          Start Quiz
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(quiz.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
