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
     if (!hasPhone) return;
     navigator.clipboard.writeText(normalizedPhone);
     toast({
       title: "Copied!",
       description: `${normalizedPhone} copied to clipboard`,
     });
   };
 
   const openTextNow = () => {
     if (!hasPhone) return;
     const popup = window.open(
       'https://www.textnow.com/messaging',
       'TextNow',
       'width=480,height=780,resizable=yes'
     );
     if (!popup || popup.closed) {
       window.open('https://www.textnow.com/messaging', '_blank');
     }
     onTextNowOpen();
   };
 
   const openGoogleVoice = () => {
     window.open('https://voice.google.com/u/0/calls', '_blank');
   };
 
   const dialOnDevice = () => {
     if (!hasPhone) return;
     window.location.href = `tel:${normalizedPhone}`;
   };
 
   if (disabled || !hasPhone) {
     return (
       <div className="p-4 rounded-lg bg-muted/50 text-center text-muted-foreground">
         <Phone className="w-6 h-6 mx-auto mb-2 opacity-50" />
         <p className="text-sm">No phone number available</p>
       </div>
     );
   }
 
   return (
     <div className="space-y-3">
       <h4 className="text-sm font-medium text-muted-foreground">Call Tools</h4>
       <div className="grid grid-cols-2 gap-2">
         <Button variant="outline" onClick={copyNumber} className="flex items-center gap-2">
           <Copy className="w-4 h-4" />
           Copy Number
         </Button>
         <Button onClick={openTextNow} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
           <MessageCircle className="w-4 h-4" />
           Open TextNow
         </Button>
         <Button variant="outline" onClick={openGoogleVoice} className="flex items-center gap-2">
           <ExternalLink className="w-4 h-4" />
           Google Voice
         </Button>
         <Button variant="outline" onClick={dialOnDevice} className="flex items-center gap-2">
           <Phone className="w-4 h-4" />
           Dial on Device
         </Button>
       </div>
     </div>
   );
 }