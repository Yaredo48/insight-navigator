import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, Brain, BookOpen, Video, Flame, TrendingUp, TrendingDown, AlertTriangle, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, CartesianGrid } from 'recharts';
import { useLearningAnalytics } from '@/hooks/useLearningAnalytics';

interface PerformanceDashboardProps {
  studentId: string;
}

export function PerformanceDashboard({ studentId }: PerformanceDashboardProps) {
  const { analytics, loading } = useLearningAnalytics(studentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const radarData = analytics.subjects.map((s) => ({
    subject: s.subject_name.length > 8 ? s.subject_name.slice(0, 8) + '…' : s.subject_name,
    score: s.average_score,
    fullMark: 100,
  }));

  const handleExport = () => {
    const lines = [
      'Learning Analytics Report',
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      'Summary',
      `Total Study Time: ${formatMinutes(analytics.total_study_minutes)}`,
      `Quizzes Completed: ${analytics.total_quizzes}`,
      `Average Score: ${analytics.average_score}%`,
      `Flashcards Reviewed: ${analytics.total_flashcards}`,
      `Videos Watched: ${analytics.total_videos}`,
      `Current Streak: ${analytics.current_streak} days`,
      `Longest Streak: ${analytics.longest_streak} days`,
      '',
      'Subject Performance',
      ...analytics.subjects.map(
        (s) => `${s.subject_name}: ${s.average_score}% avg (${s.quizzes_taken} quizzes, ${formatMinutes(s.total_minutes)} study time) - ${s.strength}`
      ),
      '',
      'Weak Topics',
      ...(analytics.weak_topics.length > 0
        ? analytics.weak_topics.map((t) => `${t.topic} (${t.subject}): ${t.score}%`)
        : ['No weak topics identified']),
      '',
      'Weekly Activity',
      ...analytics.weekly_activity.map(
        (d) => `${d.day}: ${d.minutes}min, ${d.quizzes} quizzes`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Performance Dashboard</h2>
          <p className="text-sm text-muted-foreground">Track your learning progress and identify areas to improve</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Study Time</span>
          </div>
          <p className="text-xl font-bold">{formatMinutes(analytics.total_study_minutes)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Quizzes</span>
          </div>
          <p className="text-xl font-bold">{analytics.total_quizzes}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Avg Score</span>
          </div>
          <p className="text-xl font-bold">{analytics.average_score}%</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Flashcards</span>
          </div>
          <p className="text-xl font-bold">{analytics.total_flashcards}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Videos</span>
          </div>
          <p className="text-xl font-bold">{analytics.total_videos}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Streak</span>
          </div>
          <p className="text-xl font-bold">{analytics.current_streak}d</p>
          <p className="text-xs text-muted-foreground">Best: {analytics.longest_streak}d</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Weekly Activity</h3>
          {analytics.weekly_activity.some((d) => d.minutes > 0 || d.quizzes > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.weekly_activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="minutes" name="Minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quizzes" name="Quizzes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              No activity this week — start a learning session!
            </div>
          )}
        </Card>

        {/* Subject Radar */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Subject Strengths</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              Complete quizzes to see subject strengths
            </div>
          )}
        </Card>
      </div>

      {/* Subject Performance & Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Subject Performance</h3>
          {analytics.subjects.length > 0 ? (
            <div className="space-y-4">
              {analytics.subjects.map((s) => (
                <div key={s.subject_id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{s.subject_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{s.average_score}%</span>
                      <Badge
                        variant="outline"
                        className={
                          s.strength === 'strong'
                            ? 'border-green-500 text-green-600'
                            : s.strength === 'moderate'
                              ? 'border-yellow-500 text-yellow-600'
                              : 'border-red-500 text-red-600'
                        }
                      >
                        {s.strength === 'strong' ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : s.strength === 'weak' ? (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        ) : null}
                        {s.strength}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={s.average_score} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {s.quizzes_taken} quizzes • {s.flashcards_reviewed} flashcards • {formatMinutes(s.total_minutes)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Study subjects to see performance data
            </div>
          )}
        </Card>

        {/* Weak Topics */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Topics to Improve
          </h3>
          {analytics.weak_topics.length > 0 ? (
            <div className="space-y-3">
              {analytics.weak_topics.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{t.topic}</p>
                    <p className="text-xs text-muted-foreground">{t.subject}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      t.score < 50
                        ? 'border-red-500 text-red-600'
                        : 'border-yellow-500 text-yellow-600'
                    }
                  >
                    {t.score}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              🎉 No weak topics — keep up the great work!
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
