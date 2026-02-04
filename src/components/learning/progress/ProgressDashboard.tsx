import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Brain, 
  Video, 
  FileText, 
  Flame, 
  Clock,
  TrendingUp,
  Award
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ProgressDashboardProps {
  stats: {
    totalQuizzes: number;
    totalPassed: number;
    avgScore: number;
    totalFlashcards: number;
    totalVideos: number;
    totalNotes: number;
    currentStreak: number;
    longestStreak: number;
    totalMinutes: number;
  };
  earnedBadges: Array<{
    id: string;
    badge?: {
      name: string;
      icon: string;
      description?: string;
    };
    earned_at: string;
  }>;
}

export function ProgressDashboard({ stats, earnedBadges }: ProgressDashboardProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const passRate = stats.totalQuizzes > 0 
    ? Math.round((stats.totalPassed / stats.totalQuizzes) * 100) 
    : 0;

  // Mock weekly data - in real app, fetch from database
  const weeklyData = [
    { day: 'Mon', quizzes: 2, flashcards: 15, videos: 1 },
    { day: 'Tue', quizzes: 1, flashcards: 20, videos: 2 },
    { day: 'Wed', quizzes: 3, flashcards: 10, videos: 0 },
    { day: 'Thu', quizzes: 0, flashcards: 25, videos: 1 },
    { day: 'Fri', quizzes: 2, flashcards: 30, videos: 3 },
    { day: 'Sat', quizzes: 4, flashcards: 40, videos: 2 },
    { day: 'Sun', quizzes: 1, flashcards: 15, videos: 1 },
  ];

  const pieData = [
    { name: 'Quizzes', value: stats.totalQuizzes, color: 'hsl(var(--chart-1))' },
    { name: 'Flashcards', value: stats.totalFlashcards, color: 'hsl(var(--chart-2))' },
    { name: 'Videos', value: stats.totalVideos, color: 'hsl(var(--chart-3))' },
    { name: 'Notes', value: stats.totalNotes, color: 'hsl(var(--chart-4))' },
  ].filter(d => d.value > 0);

  const statCards = [
    {
      title: 'Quizzes Completed',
      value: stats.totalQuizzes,
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      title: 'Flashcards Reviewed',
      value: stats.totalFlashcards,
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900'
    },
    {
      title: 'Videos Watched',
      value: stats.totalVideos,
      icon: Video,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900'
    },
    {
      title: 'Notes Created',
      value: stats.totalNotes,
      icon: FileText,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900'
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900'
    },
    {
      title: 'Study Time',
      value: formatTime(stats.totalMinutes),
      icon: Clock,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quiz Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pass Rate</span>
                <span className="font-medium">{passRate}%</span>
              </div>
              <Progress value={passRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Average Score</span>
                <span className="font-medium">{Math.round(stats.avgScore)}%</span>
              </div>
              <Progress value={stats.avgScore} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-green-600">{stats.totalPassed}</p>
                <p className="text-xs text-muted-foreground">Quizzes Passed</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{stats.longestStreak}</p>
                <p className="text-xs text-muted-foreground">Longest Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No activity data yet
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="flashcards" 
                  stackId="1"
                  stroke="hsl(var(--chart-2))" 
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.6}
                  name="Flashcards"
                />
                <Area 
                  type="monotone" 
                  dataKey="quizzes" 
                  stackId="1"
                  stroke="hsl(var(--chart-1))" 
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.6}
                  name="Quizzes"
                />
                <Area 
                  type="monotone" 
                  dataKey="videos" 
                  stackId="1"
                  stroke="hsl(var(--chart-3))" 
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.6}
                  name="Videos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Earned Badges ({earnedBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {earnedBadges.map((ub) => (
                <div
                  key={ub.id}
                  className="text-center p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <span className="text-4xl block mb-2">{ub.badge?.icon}</span>
                  <p className="font-medium text-sm">{ub.badge?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(ub.earned_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Complete activities to earn badges! 🏆
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
