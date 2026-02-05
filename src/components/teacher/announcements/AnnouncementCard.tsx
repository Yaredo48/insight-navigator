 import { Card } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Pin, Edit, Trash2, MoreVertical, Bell, Clock } from 'lucide-react';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { format } from 'date-fns';
 import type { Announcement } from '@/hooks/useAnnouncements';
 
 interface AnnouncementCardProps {
   announcement: Announcement;
   onEdit: (announcement: Announcement) => void;
   onDelete: (id: string) => void;
   onTogglePin: (announcement: Announcement) => void;
 }
 
 const priorityColors: Record<string, string> = {
   low: 'bg-muted text-muted-foreground',
   normal: 'bg-blue-500/10 text-blue-600',
   high: 'bg-orange-500/10 text-orange-600',
   urgent: 'bg-destructive/10 text-destructive'
 };
 
 export function AnnouncementCard({ announcement, onEdit, onDelete, onTogglePin }: AnnouncementCardProps) {
   return (
     <Card className={`p-5 ${announcement.is_pinned ? 'ring-2 ring-primary/20' : ''}`}>
       <div className="flex items-start justify-between">
         <div className="flex-1">
           <div className="flex items-center gap-2 mb-2">
             {announcement.is_pinned && <Pin className="w-4 h-4 text-primary" />}
             <h3 className="font-semibold">{announcement.title}</h3>
             <Badge className={priorityColors[announcement.priority || 'normal']}>
               {announcement.priority}
             </Badge>
           </div>
           
           <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
             {announcement.target_type === 'class' && announcement.classes?.name && (
               <Badge variant="outline">{announcement.classes.name}</Badge>
             )}
             {announcement.target_type === 'grade' && announcement.grades?.name && (
               <Badge variant="outline">{announcement.grades.name}</Badge>
             )}
             {announcement.target_type === 'school' && (
               <Badge variant="outline">School-wide</Badge>
             )}
           </div>
           
           <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
             {announcement.content}
           </p>
           
           <div className="flex items-center gap-4 text-xs text-muted-foreground">
             <span className="flex items-center gap-1">
               <Clock className="w-3 h-3" />
               {format(new Date(announcement.published_at || announcement.created_at), 'MMM d, h:mm a')}
             </span>
             {announcement.expires_at && (
               <span>
                 Expires: {format(new Date(announcement.expires_at), 'MMM d')}
               </span>
             )}
           </div>
         </div>
         
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon">
               <MoreVertical className="w-4 h-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={() => onTogglePin(announcement)}>
               <Pin className="w-4 h-4 mr-2" />
               {announcement.is_pinned ? 'Unpin' : 'Pin'}
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => onEdit(announcement)}>
               <Edit className="w-4 h-4 mr-2" />
               Edit
             </DropdownMenuItem>
             <DropdownMenuItem 
               onClick={() => onDelete(announcement.id)}
               className="text-destructive"
             >
               <Trash2 className="w-4 h-4 mr-2" />
               Delete
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       </div>
     </Card>
   );
 }