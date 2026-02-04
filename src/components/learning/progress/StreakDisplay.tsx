import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calendar, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
}

export function StreakDisplay({ currentStreak, longestStreak, lastStudyDate }: StreakDisplayProps) {
  // Generate last 7 days for visual
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en', { weekday: 'short' }),
      isToday: i === 6
    };
  });

  // Simulate which days were studied (in real app, fetch from database)
  const studiedDays = new Set<string>();
  if (lastStudyDate) {
    const lastDate = new Date(lastStudyDate);
    for (let i = 0; i < currentStreak && i < 7; i++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() - i);
      studiedDays.add(d.toISOString().split('T')[0]);
    }
  }

  const streakMessages = [
    { threshold: 0, message: "Start your streak today! 🌱" },
    { threshold: 1, message: "Great start! Keep it up! 💪" },
    { threshold: 3, message: "You're on fire! 🔥" },
    { threshold: 7, message: "A whole week! Amazing! 🌟" },
    { threshold: 14, message: "Two weeks strong! 💎" },
    { threshold: 30, message: "One month! You're unstoppable! 🏆" },
    { threshold: 60, message: "Incredible dedication! 👑" },
    { threshold: 100, message: "Legendary learner! 🎖️" },
  ];

  const getMessage = (streak: number) => {
    for (let i = streakMessages.length - 1; i >= 0; i--) {
      if (streak >= streakMessages[i].threshold) {
        return streakMessages[i].message;
      }
    }
    return streakMessages[0].message;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-6 h-6" />
          Study Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white mb-4">
            <span className="text-4xl font-bold">{currentStreak}</span>
          </div>
          <p className="text-lg font-medium">{getMessage(currentStreak)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {currentStreak === 1 ? 'day' : 'days'} in a row
          </p>
        </div>

        {/* Week calendar */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {last7Days.map((day) => {
            const isStudied = studiedDays.has(day.date);
            return (
              <div key={day.date} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{day.dayName}</p>
                <div
                  className={cn(
                    "w-10 h-10 mx-auto rounded-full flex items-center justify-center",
                    isStudied && "bg-gradient-to-br from-orange-400 to-red-500 text-white",
                    !isStudied && day.isToday && "border-2 border-dashed border-muted-foreground",
                    !isStudied && !day.isToday && "bg-muted"
                  )}
                >
                  {isStudied ? (
                    <Flame className="w-5 h-5" />
                  ) : day.isToday ? (
                    <Target className="w-4 h-4 text-muted-foreground" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted">
            <Calendar className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <Target className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{Math.max(0, 7 - currentStreak)}</p>
            <p className="text-xs text-muted-foreground">Days to Badge</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
