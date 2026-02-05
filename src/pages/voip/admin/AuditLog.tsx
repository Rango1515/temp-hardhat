 import { VoipLayout } from "@/components/voip/layout/VoipLayout";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { useEffect, useState } from "react";
 import { useVoipApi } from "@/hooks/useVoipApi";
 
 interface AuditLogEntry {
   id: number;
   admin_id: number;
   admin_name: string;
   action: string;
   entity_type: string | null;
   entity_id: number | null;
   details: Record<string, unknown> | null;
   created_at: string;
 }
 
 interface Pagination {
   page: number;
   limit: number;
   total: number;
 }
 
 const actionLabels: Record<string, string> = {
   user_delete: "User Deleted",
   user_suspended: "User Suspended",
   user_reactivated: "User Reactivated",
   password_reset: "Password Reset",
   lead_upload: "Lead Upload",
   lead_upload_deleted: "Upload Deleted",
   reset_analytics: "Analytics Reset",
 };
 
 const actionColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
   user_delete: "destructive",
   user_suspended: "destructive",
   reset_analytics: "destructive",
   user_reactivated: "default",
   password_reset: "secondary",
   lead_upload: "default",
   lead_upload_deleted: "secondary",
 };
 
 export default function AuditLog() {
   const { apiCall } = useVoipApi();
   const [logs, setLogs] = useState<AuditLogEntry[]>([]);
   const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0 });
   const [loading, setLoading] = useState(true);
 
   const fetchLogs = async (page: number) => {
     setLoading(true);
     const result = await apiCall<{ logs: AuditLogEntry[]; pagination: Pagination }>("voip-admin", {
       params: { action: "audit-log", page: page.toString() },
     });
     if (result.data) {
       setLogs(result.data.logs);
       setPagination(result.data.pagination);
     }
     setLoading(false);
   };
 
   useEffect(() => {
     fetchLogs(1);
   }, []);
 
   const totalPages = Math.ceil(pagination.total / pagination.limit);
 
   return (
     <VoipLayout>
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Audit Log</h1>
           <p className="text-muted-foreground">Administrative actions history</p>
         </div>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <ScrollText className="w-5 h-5" />
               Activity Log
             </CardTitle>
             <CardDescription>
               {pagination.total} total entries
             </CardDescription>
           </CardHeader>
           <CardContent>
             {loading ? (
               <div className="flex items-center justify-center h-48">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
               </div>
             ) : (
               <>
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Time</TableHead>
                       <TableHead>Admin</TableHead>
                       <TableHead>Action</TableHead>
                       <TableHead>Entity</TableHead>
                       <TableHead>Details</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {logs.map((log) => (
                       <TableRow key={log.id}>
                         <TableCell className="whitespace-nowrap">
                           {new Date(log.created_at).toLocaleString()}
                         </TableCell>
                         <TableCell>{log.admin_name}</TableCell>
                         <TableCell>
                           <Badge variant={actionColors[log.action] || "outline"}>
                             {actionLabels[log.action] || log.action}
                           </Badge>
                         </TableCell>
                         <TableCell>
                           {log.entity_type && (
                             <span className="text-muted-foreground">
                               {log.entity_type} #{log.entity_id}
                             </span>
                           )}
                         </TableCell>
                         <TableCell>
                           {log.details && (
                             <code className="text-xs bg-muted px-2 py-1 rounded">
                               {JSON.stringify(log.details).slice(0, 50)}
                               {JSON.stringify(log.details).length > 50 && "..."}
                             </code>
                           )}
                         </TableCell>
                       </TableRow>
                     ))}
                     {logs.length === 0 && (
                       <TableRow>
                         <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                           No audit logs found
                         </TableCell>
                       </TableRow>
                     )}
                   </TableBody>
                 </Table>
 
                 {totalPages > 1 && (
                   <div className="flex items-center justify-center gap-2 mt-4">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => fetchLogs(pagination.page - 1)}
                       disabled={pagination.page <= 1}
                     >
                       <ChevronLeft className="w-4 h-4" />
                     </Button>
                     <span className="text-sm text-muted-foreground">
                       Page {pagination.page} of {totalPages}
                     </span>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => fetchLogs(pagination.page + 1)}
                       disabled={pagination.page >= totalPages}
                     >
                       <ChevronRight className="w-4 h-4" />
                     </Button>
                   </div>
                 )}
               </>
             )}
           </CardContent>
         </Card>
       </div>
     </VoipLayout>
   );
 }