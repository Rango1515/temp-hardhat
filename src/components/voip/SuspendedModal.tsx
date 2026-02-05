 import { AlertTriangle } from "lucide-react";
 
 interface SuspendedModalProps {
   reason?: string;
   status: "suspended" | "pending" | "disabled";
 }
 
 export function SuspendedModal({ reason, status }: SuspendedModalProps) {
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
     switch (status) {
       case "suspended":
         return reason
           ? `Your account has been suspended. Reason: ${reason}`
           : "Your account has been suspended. Please contact an administrator for more information.";
       case "pending":
         return "Your account is pending approval. An administrator will review your account shortly.";
       case "disabled":
         return "Your account has been disabled. Please contact an administrator if you believe this is an error.";
       default:
         return "Your account is currently unavailable. Please contact support.";
     }
   };
 
   return (
     <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
       <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center shadow-2xl">
         <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
           <AlertTriangle className="w-8 h-8 text-destructive" />
         </div>
         
         <h1 className="text-2xl font-bold text-foreground mb-4">{getTitle()}</h1>
         
         <p className="text-muted-foreground mb-6">{getMessage()}</p>
         
         <div className="text-sm text-muted-foreground/70">
           <p>Contact support:</p>
           <a 
             href="mailto:admin@hardhathosting.work" 
             className="text-primary hover:underline"
           >
             admin@hardhathosting.work
           </a>
         </div>
       </div>
     </div>
   );
 }