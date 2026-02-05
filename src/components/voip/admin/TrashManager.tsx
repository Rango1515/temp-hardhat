 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Checkbox } from "@/components/ui/checkbox";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { Trash2, RotateCcw, Archive, MoreHorizontal, Loader2, Eye, EyeOff } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 
 interface TrashManagerProps {
   entityType: "leads" | "appointments" | "calls" | "users" | "tokens";
   selectedIds: number[];
   showTrashed: boolean;
   onToggleTrashed: () => void;
   onTrash: (ids: number[]) => Promise<boolean>;
   onRestore: (ids: number[]) => Promise<boolean>;
   onPermanentDelete: (ids: number[]) => Promise<boolean>;
   onBulkAction: (action: "older-7" | "older-30" | "older-90" | "all") => Promise<boolean>;
   trashedCount: number;
   isLoading?: boolean;
 }
 
 export function TrashManager({
   entityType,
   selectedIds,
   showTrashed,
   onToggleTrashed,
   onTrash,
   onRestore,
   onPermanentDelete,
   onBulkAction,
   trashedCount,
   isLoading,
 }: TrashManagerProps) {
   const { toast } = useToast();
   const [confirmDialog, setConfirmDialog] = useState<{
     open: boolean;
     action: "trash" | "restore" | "delete" | "bulk";
     bulkType?: "older-7" | "older-30" | "older-90" | "all";
   }>({ open: false, action: "trash" });
   const [confirmText, setConfirmText] = useState("");
   const [processing, setProcessing] = useState(false);
 
   const entityLabel = {
     leads: "leads",
     appointments: "appointments",
     calls: "call records",
     users: "users",
     tokens: "tokens",
   }[entityType];
 
   const handleAction = async () => {
     if (confirmDialog.action === "delete" || confirmDialog.action === "bulk") {
       if (confirmText !== "DELETE") {
         toast({
           title: "Confirmation Required",
           description: "Please type DELETE to confirm",
           variant: "destructive",
         });
         return;
       }
     }
 
     setProcessing(true);
     let success = false;
 
     try {
       switch (confirmDialog.action) {
         case "trash":
           success = await onTrash(selectedIds);
           break;
         case "restore":
           success = await onRestore(selectedIds);
           break;
         case "delete":
           success = await onPermanentDelete(selectedIds);
           break;
         case "bulk":
           if (confirmDialog.bulkType) {
             success = await onBulkAction(confirmDialog.bulkType);
           }
           break;
       }
 
       if (success) {
         toast({
           title: "Success",
           description: `${entityLabel} ${confirmDialog.action === "restore" ? "restored" : "deleted"} successfully`,
         });
       }
     } catch (error) {
       toast({
         title: "Error",
         description: `Failed to ${confirmDialog.action} ${entityLabel}`,
         variant: "destructive",
       });
     }
 
     setProcessing(false);
     setConfirmDialog({ open: false, action: "trash" });
     setConfirmText("");
   };
 
   return (
     <>
       <div className="flex items-center gap-2 flex-wrap">
         {/* Toggle Trashed View */}
         <Button
           variant={showTrashed ? "secondary" : "outline"}
           size="sm"
           onClick={onToggleTrashed}
           className="gap-2"
         >
           {showTrashed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
           {showTrashed ? "Showing Trashed" : "Show Trash"}
           {trashedCount > 0 && (
             <Badge variant="secondary" className="ml-1">
               {trashedCount}
             </Badge>
           )}
         </Button>
 
         {/* Selected Actions */}
         {selectedIds.length > 0 && (
           <>
             <Badge variant="outline">{selectedIds.length} selected</Badge>
             
             {showTrashed ? (
               <>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setConfirmDialog({ open: true, action: "restore" })}
                   disabled={isLoading}
                 >
                   <RotateCcw className="w-4 h-4 mr-2" />
                   Restore
                 </Button>
                 <Button
                   variant="destructive"
                   size="sm"
                   onClick={() => setConfirmDialog({ open: true, action: "delete" })}
                   disabled={isLoading}
                 >
                   <Trash2 className="w-4 h-4 mr-2" />
                   Delete Forever
                 </Button>
               </>
             ) : (
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setConfirmDialog({ open: true, action: "trash" })}
                 disabled={isLoading}
               >
                 <Archive className="w-4 h-4 mr-2" />
                 Move to Trash
               </Button>
             )}
           </>
         )}
 
         {/* Bulk Actions Dropdown */}
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="outline" size="sm">
               <MoreHorizontal className="w-4 h-4 mr-2" />
               Bulk Actions
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuItem
               onClick={() =>
                 setConfirmDialog({ open: true, action: "bulk", bulkType: "older-7" })
               }
             >
               Delete older than 7 days
             </DropdownMenuItem>
             <DropdownMenuItem
               onClick={() =>
                 setConfirmDialog({ open: true, action: "bulk", bulkType: "older-30" })
               }
             >
               Delete older than 30 days
             </DropdownMenuItem>
             <DropdownMenuItem
               onClick={() =>
                 setConfirmDialog({ open: true, action: "bulk", bulkType: "older-90" })
               }
             >
               Delete older than 90 days
             </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem
               className="text-destructive"
               onClick={() =>
                 setConfirmDialog({ open: true, action: "bulk", bulkType: "all" })
               }
             >
               Empty Trash (Delete All)
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       </div>
 
       {/* Confirmation Dialog */}
       <AlertDialog
         open={confirmDialog.open}
         onOpenChange={(open) => {
           setConfirmDialog({ ...confirmDialog, open });
           if (!open) setConfirmText("");
         }}
       >
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>
               {confirmDialog.action === "trash" && "Move to Trash?"}
               {confirmDialog.action === "restore" && "Restore Items?"}
               {confirmDialog.action === "delete" && "Permanently Delete?"}
               {confirmDialog.action === "bulk" && "Bulk Delete?"}
             </AlertDialogTitle>
             <AlertDialogDescription>
               {confirmDialog.action === "trash" &&
                 `${selectedIds.length} ${entityLabel} will be moved to trash.`}
               {confirmDialog.action === "restore" &&
                 `${selectedIds.length} ${entityLabel} will be restored.`}
               {confirmDialog.action === "delete" &&
                 `${selectedIds.length} ${entityLabel} will be permanently deleted. This cannot be undone.`}
               {confirmDialog.action === "bulk" &&
                 confirmDialog.bulkType === "all" &&
                 "All trashed items will be permanently deleted. This cannot be undone."}
               {confirmDialog.action === "bulk" &&
                 confirmDialog.bulkType?.startsWith("older-") &&
                 `All ${entityLabel} older than ${confirmDialog.bulkType.split("-")[1]} days will be permanently deleted.`}
             </AlertDialogDescription>
           </AlertDialogHeader>
 
           {(confirmDialog.action === "delete" || confirmDialog.action === "bulk") && (
             <div className="py-4">
               <p className="text-sm text-muted-foreground mb-2">
                 Type <strong>DELETE</strong> to confirm:
               </p>
               <Input
                 value={confirmText}
                 onChange={(e) => setConfirmText(e.target.value)}
                 placeholder="DELETE"
                 className="font-mono"
               />
             </div>
           )}
 
           <AlertDialogFooter>
             <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleAction}
               disabled={
                 processing ||
                 ((confirmDialog.action === "delete" || confirmDialog.action === "bulk") &&
                   confirmText !== "DELETE")
               }
               className={
                 confirmDialog.action === "delete" || confirmDialog.action === "bulk"
                   ? "bg-destructive hover:bg-destructive/90"
                   : ""
               }
             >
               {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
               {confirmDialog.action === "trash" && "Move to Trash"}
               {confirmDialog.action === "restore" && "Restore"}
               {confirmDialog.action === "delete" && "Delete Forever"}
               {confirmDialog.action === "bulk" && "Delete"}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
 }