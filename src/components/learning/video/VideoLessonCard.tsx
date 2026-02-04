import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Clock, CheckCircle } from "lucide-react";
import type { VideoLesson, VideoProgress } from "@/hooks/useVideoLessons";

interface VideoLessonCardProps {
  video: VideoLesson;
  progress?: VideoProgress;
  onWatch: (videoId: string) => void;
}

export function VideoLessonCard({ video, progress, onWatch }: VideoLessonCardProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const watchProgress = progress && video.duration_seconds
    ? Math.min(100, (progress.watched_seconds / video.duration_seconds) * 100)
    : 0;

  const getThumbnail = () => {
    if (video.thumbnail_url) return video.thumbnail_url;
    
    // Extract YouTube thumbnail
    if (video.video_type === 'youtube') {
      const videoId = extractYouTubeId(video.video_url);
      if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    
    return null;
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const thumbnail = getThumbnail();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        {progress?.completed && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          </div>
        )}
        {video.duration_seconds && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-black/70 text-white">
              {formatDuration(video.duration_seconds)}
            </Badge>
          </div>
        )}
        {watchProgress > 0 && !progress?.completed && (
          <div className="absolute bottom-0 left-0 right-0">
            <Progress value={watchProgress} className="h-1 rounded-none" />
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
        </div>
        {video.topic && (
          <Badge variant="outline" className="w-fit text-xs">
            {video.topic}
          </Badge>
        )}
      </CardHeader>

      {video.description && (
        <CardContent className="pb-2">
          <CardDescription className="line-clamp-2">
            {video.description}
          </CardDescription>
        </CardContent>
      )}

      <CardFooter>
        <Button onClick={() => onWatch(video.id)} className="w-full gap-2">
          <Play className="w-4 h-4" />
          {progress?.completed ? 'Watch Again' : watchProgress > 0 ? 'Continue' : 'Watch'}
        </Button>
      </CardFooter>
    </Card>
  );
}
