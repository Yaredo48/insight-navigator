import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/hooks/useQuizzes";

interface QuestionRendererProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: unknown;
  onAnswer: (answer: unknown) => void;
  showResult?: boolean;
  isCorrect?: boolean;
}

interface OptionItem {
  id: string;
  text: string;
}

interface MatchingItem {
  left: string;
  right: string;
}

export function QuestionRenderer({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswer,
  showResult = false,
  isCorrect
}: QuestionRendererProps) {
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});

  const renderMultipleChoice = () => {
    const options = (question.options as unknown as OptionItem[]) || [];
    const correctAnswer = question.correct_answer as string;

    return (
      <RadioGroup
        value={selectedAnswer as string}
        onValueChange={onAnswer}
        disabled={showResult}
      >
        <div className="space-y-3">
          {options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrectOption = option.id === correctAnswer;

            return (
              <div
                key={option.id}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border transition-colors",
                  !showResult && "hover:bg-muted/50 cursor-pointer",
                  isSelected && !showResult && "border-primary bg-primary/5",
                  showResult && isCorrectOption && "border-green-500 bg-green-50 dark:bg-green-950",
                  showResult && isSelected && !isCorrectOption && "border-red-500 bg-red-50 dark:bg-red-950"
                )}
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
                {showResult && isCorrectOption && (
                  <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                )}
                {showResult && isSelected && !isCorrectOption && (
                  <span className="text-red-600 text-sm font-medium">✗ Incorrect</span>
                )}
              </div>
            );
          })}
        </div>
      </RadioGroup>
    );
  };

  const renderTrueFalse = () => {
    const correctAnswer = question.correct_answer as boolean;

    return (
      <RadioGroup
        value={selectedAnswer?.toString()}
        onValueChange={(val) => onAnswer(val === 'true')}
        disabled={showResult}
      >
        <div className="space-y-3">
          {[
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' }
          ].map((option) => {
            const isSelected = selectedAnswer?.toString() === option.value;
            const isCorrectOption = correctAnswer.toString() === option.value;

            return (
              <div
                key={option.value}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border transition-colors",
                  !showResult && "hover:bg-muted/50 cursor-pointer",
                  isSelected && !showResult && "border-primary bg-primary/5",
                  showResult && isCorrectOption && "border-green-500 bg-green-50 dark:bg-green-950",
                  showResult && isSelected && !isCorrectOption && "border-red-500 bg-red-50 dark:bg-red-950"
                )}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer text-lg font-medium">
                  {option.label}
                </Label>
              </div>
            );
          })}
        </div>
      </RadioGroup>
    );
  };

  const renderFillBlank = () => {
    const correctAnswer = question.correct_answer as string;
    const userAnswer = selectedAnswer as string || '';

    return (
      <div className="space-y-4">
        <Input
          value={userAnswer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Type your answer..."
          disabled={showResult}
          className={cn(
            "text-lg p-6",
            showResult && isCorrect && "border-green-500",
            showResult && !isCorrect && "border-red-500"
          )}
        />
        {showResult && (
          <div className={cn(
            "p-4 rounded-lg",
            isCorrect ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" 
                     : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
          )}>
            {isCorrect ? (
              <p>✓ Correct!</p>
            ) : (
              <p>✗ Incorrect. The correct answer is: <strong>{correctAnswer}</strong></p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMatching = () => {
    const items = (question.options as unknown as MatchingItem[]) || [];
    const correctAnswers = question.correct_answer as Record<string, string>;

    // Shuffle right side options
    const rightOptions = items.map(i => i.right).sort(() => Math.random() - 0.5);

    const handleMatch = (left: string, right: string) => {
      const newMatches = { ...matchingAnswers, [left]: right };
      setMatchingAnswers(newMatches);
      onAnswer(newMatches);
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Match each item on the left with the correct item on the right
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border bg-muted/30 font-medium"
              >
                {item.left}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <select
                key={idx}
                value={matchingAnswers[item.left] || ''}
                onChange={(e) => handleMatch(item.left, e.target.value)}
                disabled={showResult}
                className={cn(
                  "w-full p-4 rounded-lg border bg-background",
                  showResult && correctAnswers[item.left] === matchingAnswers[item.left] && "border-green-500",
                  showResult && correctAnswers[item.left] !== matchingAnswers[item.left] && "border-red-500"
                )}
              >
                <option value="">Select...</option>
                {rightOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderQuestion = () => {
    switch (question.question_type) {
      case 'multiple_choice':
        return renderMultipleChoice();
      case 'true_false':
        return renderTrueFalse();
      case 'fill_blank':
        return renderFillBlank();
      case 'matching':
        return renderMatching();
      default:
        return <p>Unknown question type</p>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-sm text-muted-foreground">
            {question.points} {question.points === 1 ? 'point' : 'points'}
          </span>
        </div>
        <CardTitle className="text-xl">{question.question_text}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderQuestion()}
        
        {showResult && question.explanation && (
          <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Explanation:</p>
            <p className="text-blue-700 dark:text-blue-300">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
