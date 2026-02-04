import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import type { LeaderboardEntry } from "@/hooks/useStudentProgress";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 text-center text-sm font-bold">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300';
      case 2:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300';
      case 3:
        return 'bg-amber-100 dark:bg-amber-900 border-amber-300';
      default:
        return '';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No entries yet. Be the first to study!
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                  entry.rank && entry.rank <= 3 && getRankBadge(entry.rank),
                  entry.user_id === currentUserId && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-center justify-center w-8">
                  {entry.rank && getRankIcon(entry.rank)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {entry.user_id === currentUserId ? 'You' : `Student ${entry.user_id.slice(0, 8)}`}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {entry.total_quizzes} quizzes
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {entry.total_flashcards} cards
                    </Badge>
                    {entry.best_streak > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        🔥 {entry.best_streak} streak
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold">{Math.round(entry.avg_score)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(entry.total_minutes)} studied
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
