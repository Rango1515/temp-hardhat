 import { Button } from "@/components/ui/button";
 import { Copy, ExternalLink, Phone, MessageCircle } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 
 interface CallToolsProps {
   phoneNumber: string;
   onTextNowOpen: () => void;
   disabled?: boolean;
 }
 
 function normalizePhone(phone: string): string {
   return phone.replace(/[\s\-\(\)\.]/g, '');
 }
 
 export function CallTools({ phoneNumber, onTextNowOpen, disabled }: CallToolsProps) {
   const { toast } = useToast();
   const normalizedPhone = normalizePhone(phoneNumber);
   const hasPhone = normalizedPhone.length >= 10;
 
   const copyNumber = () => {
     if (!hasPhone) {
       toast({ title: "No phone number", description: "Request a lead first", variant: "destructive" });
       return;
     }
     navigator.clipboard.writeText(normalizedPhone);
     toast({
       title: "Copied!",
       description: `${normalizedPhone} copied to clipboard`,
     });
   };
 
   const openTextNow = () => {
     const popup = window.open(
       'https://www.textnow.com/messaging',
       'TextNow',
       'width=480,height=780,resizable=yes,scrollbars=yes'
     );
     if (!popup || popup.closed || typeof popup.closed === 'undefined') {
       // Popup blocked - open in new tab as fallback
       window.open('https://www.textnow.com/messaging', '_blank');
       toast({
         title: "Popup Blocked",
         description: "TextNow opened in a new tab instead",
       });
     }
     if (hasPhone) {
       onTextNowOpen();
     }
   };
 
   const openGoogleVoice = () => {
     window.open('https://voice.google.com/u/0/calls', '_blank');
   };
 
   const dialOnDevice = () => {
     if (!hasPhone) {
       toast({ title: "No phone number", description: "Request a lead first", variant: "destructive" });
       return;
     }
     window.location.href = `tel:${normalizedPhone}`;
   };
 
   // Always show call tools - buttons are disabled based on phone availability
   return (
     <div className="space-y-3">
       <h4 className="text-sm font-medium text-muted-foreground">Call Tools</h4>
       <div className="grid grid-cols-2 gap-2">
         <Button 
           variant="outline" 
           onClick={copyNumber} 
           disabled={disabled || !hasPhone}
           className="flex items-center gap-2"
         >
           <Copy className="w-4 h-4" />
           Copy Number
         </Button>
         <Button 
           onClick={openTextNow} 
           className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
         >
           <MessageCircle className="w-4 h-4" />
           Open TextNow
         </Button>
         <Button 
           variant="outline" 
           onClick={openGoogleVoice} 
           className="flex items-center gap-2"
         >
           <ExternalLink className="w-4 h-4" />
           Google Voice
         </Button>
         <Button 
           variant="outline" 
           onClick={dialOnDevice} 
           disabled={disabled || !hasPhone}
           className="flex items-center gap-2"
         >
           <Phone className="w-4 h-4" />
           Dial on Device
         </Button>
       </div>
       {!hasPhone && (
         <p className="text-xs text-muted-foreground text-center">
           Request a lead to enable Copy Number and Dial on Device
         </p>
       )}
     </div>
   );
 }