 import { Card } from '@/components/ui/card';
 import { useTeacherAnalytics } from '@/hooks/useTeacherAnalytics';
 import { Users, FileText, Clock, TrendingUp, Loader2 } from 'lucide-react';
 import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
 
 interface AnalyticsDashboardProps {
   userId: string;
 }
 
 const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];
 
 export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
   const { 
     loading, 
     classAnalytics, 
     totalStudents, 
     totalAssignments, 
     pendingSubmissions 
   } = useTeacherAnalytics(userId);
 
   if (loading) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   const enrollmentData = classAnalytics.map(c => ({
     name: c.class_name.length > 15 ? c.class_name.slice(0, 15) + '...' : c.class_name,
     students: c.enrolled_count,
     assignments: c.assignment_count
   }));
 
   return (
     <div className="space-y-6">
       <div>
         <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
         <p className="text-sm text-muted-foreground">
           Track student performance and class engagement
         </p>
       </div>
 
       {/* Overview Cards */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="p-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-500/10 rounded-lg">
               <Users className="w-5 h-5 text-blue-500" />
             </div>
             <div>
               <p className="text-2xl font-bold">{totalStudents}</p>
               <p className="text-xs text-muted-foreground">Total Students</p>
             </div>
           </div>
         </Card>
         
         <Card className="p-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-green-500/10 rounded-lg">
               <FileText className="w-5 h-5 text-green-500" />
             </div>
             <div>
               <p className="text-2xl font-bold">{totalAssignments}</p>
               <p className="text-xs text-muted-foreground">Assignments</p>
             </div>
           </div>
         </Card>
         
         <Card className="p-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-500/10 rounded-lg">
               <Clock className="w-5 h-5 text-orange-500" />
             </div>
             <div>
               <p className="text-2xl font-bold">{pendingSubmissions}</p>
               <p className="text-xs text-muted-foreground">Pending Grading</p>
             </div>
           </div>
         </Card>
         
         <Card className="p-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-500/10 rounded-lg">
               <TrendingUp className="w-5 h-5 text-purple-500" />
             </div>
             <div>
               <p className="text-2xl font-bold">{classAnalytics.length}</p>
               <p className="text-xs text-muted-foreground">Active Classes</p>
             </div>
           </div>
         </Card>
       </div>
 
       {/* Charts */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="p-6">
           <h3 className="font-semibold mb-4">Students per Class</h3>
           {enrollmentData.length > 0 ? (
             <ResponsiveContainer width="100%" height={250}>
               <BarChart data={enrollmentData}>
                 <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                 <YAxis />
                 <Tooltip />
                 <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           ) : (
             <div className="h-[250px] flex items-center justify-center text-muted-foreground">
               No class data available
             </div>
           )}
         </Card>
         
         <Card className="p-6">
           <h3 className="font-semibold mb-4">Assignments per Class</h3>
           {enrollmentData.length > 0 ? (
             <ResponsiveContainer width="100%" height={250}>
               <PieChart>
                 <Pie
                   data={enrollmentData}
                   dataKey="assignments"
                   nameKey="name"
                   cx="50%"
                   cy="50%"
                   outerRadius={80}
                   label={({ name, assignments }) => `${name}: ${assignments}`}
                 >
                   {enrollmentData.map((_, index) => (
                     <Cell key={index} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           ) : (
             <div className="h-[250px] flex items-center justify-center text-muted-foreground">
               No assignment data available
             </div>
           )}
         </Card>
       </div>
 
       {/* Class Performance Table */}
       <Card className="p-6">
         <h3 className="font-semibold mb-4">Class Overview</h3>
         {classAnalytics.length > 0 ? (
           <div className="overflow-x-auto">
             <table className="w-full text-sm">
               <thead>
                 <tr className="border-b">
                   <th className="text-left py-2 font-medium">Class</th>
                   <th className="text-center py-2 font-medium">Students</th>
                   <th className="text-center py-2 font-medium">Assignments</th>
                 </tr>
               </thead>
               <tbody>
                 {classAnalytics.map((cls) => (
                   <tr key={cls.class_id} className="border-b last:border-0">
                     <td className="py-3">{cls.class_name}</td>
                     <td className="text-center py-3">{cls.enrolled_count}</td>
                     <td className="text-center py-3">{cls.assignment_count}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         ) : (
           <div className="text-center py-8 text-muted-foreground">
             Create classes and assignments to see analytics
           </div>
         )}
       </Card>
     </div>
   );
 }