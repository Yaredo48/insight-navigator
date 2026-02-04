import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";
import type { VideoLesson, VideoProgress } from "@/hooks/useVideoLessons";

interface VideoPlayerPageProps {
  video: VideoLesson;
  progress?: VideoProgress;
  onUpdateProgress: (watchedSeconds: number, completed?: boolean) => void;
  onClose: () => void;
}

export function VideoPlayerPage({ video, progress, onUpdateProgress, onClose }: VideoPlayerPageProps) {
  const [watchedSeconds, setWatchedSeconds] = useState(progress?.watched_seconds || 0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const extractVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  };

  // Track progress
  useEffect(() => {
    progressInterval.current = setInterval(() => {
      setWatchedSeconds(prev => {
        const newValue = prev + 5;
        const completed = video.duration_seconds ? newValue >= video.duration_seconds * 0.9 : false;
        onUpdateProgress(newValue, completed);
        return newValue;
      });
    }, 5000);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [video.duration_seconds, onUpdateProgress]);

  const renderVideo = () => {
    if (video.video_type === 'youtube') {
      const videoId = extractYouTubeId(video.video_url);
      if (!videoId) return <p className="text-destructive">Invalid YouTube URL</p>;
      
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&start=${Math.floor(watchedSeconds)}`}
          className="w-full aspect-video rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (video.video_type === 'vimeo') {
      const videoId = extractVimeoId(video.video_url);
      if (!videoId) return <p className="text-destructive">Invalid Vimeo URL</p>;
      
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=0`}
          className="w-full aspect-video rounded-lg"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Direct video
    return (
      <video
        src={video.video_url}
        controls
        className="w-full aspect-video rounded-lg"
        onTimeUpdate={(e) => {
          const currentTime = Math.floor(e.currentTarget.currentTime);
          setWatchedSeconds(currentTime);
          onUpdateProgress(currentTime, e.currentTarget.ended);
        }}
      >
        Your browser does not support the video tag.
      </video>
    );
  };

  const watchProgress = video.duration_seconds
    ? Math.min(100, (watchedSeconds / video.duration_seconds) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Videos
        </Button>
        <div className="flex items-center gap-4">
          {progress?.completed && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
          {video.duration_seconds && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {formatDuration(watchedSeconds)} / {formatDuration(video.duration_seconds)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Video Player */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          {renderVideo()}
        </CardContent>
      </Card>

      {/* Progress bar */}
      {video.duration_seconds && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(watchProgress)}%</span>
          </div>
          <Progress value={watchProgress} />
        </div>
      )}

      {/* Video Info */}
      <Card>
        <CardHeader>
          <CardTitle>{video.title}</CardTitle>
        </CardHeader>
        {video.description && (
          <CardContent>
            <p className="text-muted-foreground">{video.description}</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
