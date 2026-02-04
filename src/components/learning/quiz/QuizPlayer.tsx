import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionRenderer } from './QuestionRenderer';
import { ArrowLeft, ArrowRight, Check, Clock, Trophy, RotateCcw } from "lucide-react";
import type { Quiz, QuizQuestion } from "@/hooks/useQuizzes";
import { cn } from "@/lib/utils";

interface QuizPlayerProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  onSubmit: (answers: Record<string, unknown>, timeTaken: number) => Promise<{
    score: number;
    totalPoints: number;
    percentage: number;
  } | null>;
  onClose: () => void;
}

export function QuizPlayer({ quiz, questions, onSubmit, onClose }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{ score: number; totalPoints: number; percentage: number } | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer
  useEffect(() => {
    if (showResults) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showResults]);

  // Check time limit
  useEffect(() => {
    if (quiz.time_limit_minutes && timeElapsed >= quiz.time_limit_minutes * 60) {
      handleSubmit();
    }
  }, [timeElapsed, quiz.time_limit_minutes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = useCallback((answer: unknown) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  }, [currentQuestion]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await onSubmit(answers, timeElapsed);
    if (result) {
      setResults(result);
      setShowResults(true);
    }
    setIsSubmitting(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResults(false);
    setResults(null);
    setTimeElapsed(0);
  };

  const isCorrect = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return false;
    
    const userAnswer = answers[questionId];
    const correctAnswer = question.correct_answer;
    
    return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
  };

  if (showResults && results) {
    const passed = results.percentage >= quiz.passing_score;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className={cn(
          "text-center",
          passed ? "border-green-500" : "border-red-500"
        )}>
          <CardHeader>
            <div className={cn(
              "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4",
              passed ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
            )}>
              <Trophy className={cn(
                "w-10 h-10",
                passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )} />
            </div>
            <CardTitle className="text-2xl">
              {passed ? '🎉 Congratulations!' : 'Keep Practicing!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold">{results.score}/{results.totalPoints}</p>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold">{results.percentage.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Percentage</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold">{formatTime(timeElapsed)}</p>
                <p className="text-sm text-muted-foreground">Time</p>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-lg",
              passed ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"
            )}>
              <p className={passed ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                {passed 
                  ? `You passed! Required: ${quiz.passing_score}%`
                  : `You need ${quiz.passing_score}% to pass. Keep studying!`
                }
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={onClose}>
                Back to Quizzes
              </Button>
              <Button onClick={handleRestart} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Review answers */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Review Answers</h3>
          {questions.map((q, idx) => (
            <QuestionRenderer
              key={q.id}
              question={q}
              questionNumber={idx + 1}
              totalQuestions={questions.length}
              selectedAnswer={answers[q.id]}
              onAnswer={() => {}}
              showResult
              isCorrect={isCorrect(q.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit Quiz
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className={cn(
              quiz.time_limit_minutes && timeElapsed > quiz.time_limit_minutes * 60 * 0.8 && "text-red-500 font-bold"
            )}>
              {formatTime(timeElapsed)}
              {quiz.time_limit_minutes && ` / ${quiz.time_limit_minutes}:00`}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{quiz.title}</span>
          <span>{answeredCount}/{questions.length} answered</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question navigation dots */}
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "w-8 h-8 rounded-full text-sm font-medium transition-colors",
              idx === currentIndex && "bg-primary text-primary-foreground",
              idx !== currentIndex && answers[q.id] !== undefined && "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
              idx !== currentIndex && answers[q.id] === undefined && "bg-muted hover:bg-muted/80"
            )}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <QuestionRenderer
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          selectedAnswer={answers[currentQuestion.id]}
          onAnswer={handleAnswer}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentIndex === questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || answeredCount < questions.length}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
