import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Megaphone, Pin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Announcement = Tables<'announcements'> & {
  classes?: { name: string } | null;
};

interface StudentAnnouncementListProps {
  studentId: string;
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  low: 'bg-muted text-muted-foreground',
};

export function StudentAnnouncementList({ studentId }: StudentAnnouncementListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // Get enrolled classes
        const { data: enrollments } = await supabase
          .from('class_enrollments')
          .select('class_id')
          .eq('student_id', studentId)
          .eq('status', 'active');

        const classIds = enrollments?.map((e) => e.class_id) || [];

        // Fetch announcements: school-wide (no class_id) + student's classes
        let query = supabase
          .from('announcements')
          .select('*, classes(name)')
          .order('created_at', { ascending: false })
          .limit(20);

        const { data, error } = await query;
        if (error) throw error;

        // Filter: show school-wide or ones matching student's classes
        const filtered = (data || []).filter(
          (a) => !a.class_id || classIds.includes(a.class_id)
        );

        setAnnouncements(filtered);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg">
        <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">No announcements</h3>
        <p className="text-sm text-muted-foreground">
          You'll see announcements from your teachers here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Announcements</h2>
        <p className="text-sm text-muted-foreground">Updates from your teachers</p>
      </div>

      <div className="space-y-3">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {announcement.is_pinned && (
                    <Pin className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <h3 className="font-semibold">{announcement.title}</h3>
                  {announcement.priority && announcement.priority !== 'normal' && (
                    <Badge
                      className={priorityColors[announcement.priority] || ''}
                    >
                      {announcement.priority}
                    </Badge>
                  )}
                </div>
                {announcement.classes?.name && (
                  <Badge variant="outline" className="mb-2">
                    {announcement.classes.name}
                  </Badge>
                )}
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {announcement.content}
                </p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
