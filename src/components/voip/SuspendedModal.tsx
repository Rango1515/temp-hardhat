 import { AlertTriangle } from "lucide-react";
 import { useVoipAuth } from "@/contexts/VoipAuthContext";
 import { Button } from "@/components/ui/button";
 
 interface SuspendedModalProps {
   reason?: string;
   status: "suspended" | "pending" | "disabled";
 }
 
 export function SuspendedModal({ reason, status }: SuspendedModalProps) {
   const { logout } = useVoipAuth();
 
   const getTitle = () => {
     switch (status) {
       case "suspended":
         return "Account Suspended";
       case "pending":
         return "Account Pending Approval";
       case "disabled":
         return "Account Disabled";
       default:
         return "Account Unavailable";
     }
   };
 
   const getMessage = () => {
     // If reason is provided, show it. Otherwise show default message.
     if (reason && reason.trim()) {
       return (
         <div className="space-y-2">
           <p className="font-medium">Reason:</p>
           <p className="bg-muted/50 p-3 rounded-lg">{reason}</p>
         </div>
       );
     }
 
     return (
       <p>Your account is currently not active. Please contact support.</p>
     );
   };
 
   return (
     <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
       <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center shadow-2xl">
         <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
           <AlertTriangle className="w-8 h-8 text-destructive" />
         </div>
         
         <h1 className="text-2xl font-bold text-foreground mb-4">{getTitle()}</h1>
         
         <div className="text-muted-foreground mb-6">{getMessage()}</div>
         
         <div className="space-y-4">
           <div className="text-sm text-muted-foreground/70">
             <p>Contact support:</p>
             <a 
               href="mailto:admin@hardhathosting.work" 
               className="text-primary hover:underline"
             >
               admin@hardhathosting.work
             </a>
           </div>
 
           <Button variant="outline" onClick={logout} className="w-full">
             Log Out
           </Button>
         </div>
       </div>
     </div>
   );
 }