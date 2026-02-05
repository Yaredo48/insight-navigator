 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Plus, Loader2, Megaphone } from 'lucide-react';
 import { useAnnouncements, Announcement } from '@/hooks/useAnnouncements';
 import { AnnouncementCard } from './AnnouncementCard';
 import { AnnouncementComposer } from './AnnouncementComposer';
 
 interface AnnouncementManagerProps {
   userId: string;
 }
 
 export function AnnouncementManager({ userId }: AnnouncementManagerProps) {
   const { 
     announcements, 
     loading, 
     createAnnouncement, 
     updateAnnouncement, 
     deleteAnnouncement 
   } = useAnnouncements(userId);
   
   const [composerOpen, setComposerOpen] = useState(false);
   const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
 
   const handleSave = async (data: Partial<Announcement>) => {
     if (editingAnnouncement) {
       await updateAnnouncement(editingAnnouncement.id, data);
     } else {
       await createAnnouncement(data);
     }
     setEditingAnnouncement(null);
   };
 
   const handleEdit = (announcement: Announcement) => {
     setEditingAnnouncement(announcement);
     setComposerOpen(true);
   };
 
   const handleTogglePin = async (announcement: Announcement) => {
     await updateAnnouncement(announcement.id, { is_pinned: !announcement.is_pinned });
   };
 
   // Sort: pinned first, then by date
   const sortedAnnouncements = [...announcements].sort((a, b) => {
     if (a.is_pinned && !b.is_pinned) return -1;
     if (!a.is_pinned && b.is_pinned) return 1;
     return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
   });
 
   if (loading) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-xl font-semibold">Announcements</h2>
           <p className="text-sm text-muted-foreground">
             Post updates and important information to students
           </p>
         </div>
         <Button onClick={() => { setEditingAnnouncement(null); setComposerOpen(true); }}>
           <Plus className="w-4 h-4 mr-2" />
           New Announcement
         </Button>
       </div>
 
       {sortedAnnouncements.length === 0 ? (
         <div className="text-center py-12 bg-muted/30 rounded-lg">
           <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
           <h3 className="font-medium mb-2">No announcements yet</h3>
           <p className="text-sm text-muted-foreground mb-4">
             Keep your students informed with announcements
           </p>
           <Button onClick={() => setComposerOpen(true)}>
             <Plus className="w-4 h-4 mr-2" />
             Post Announcement
           </Button>
         </div>
       ) : (
         <div className="space-y-4">
           {sortedAnnouncements.map((announcement) => (
             <AnnouncementCard
               key={announcement.id}
               announcement={announcement}
               onEdit={handleEdit}
               onDelete={deleteAnnouncement}
               onTogglePin={handleTogglePin}
             />
           ))}
         </div>
       )}
 
       <AnnouncementComposer
         open={composerOpen}
         onOpenChange={setComposerOpen}
         onSave={handleSave}
         editData={editingAnnouncement}
         teacherId={userId}
       />
     </div>
   );
 }