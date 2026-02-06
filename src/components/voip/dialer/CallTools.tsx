import { useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Phone, MessageCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CallToolsProps {
  phoneNumber: string;
  onTextNowOpen: () => void;
  disabled?: boolean;
}

export interface CallToolsRef {
  openTextNow: () => void;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\.]/g, '');
}

export const CallTools = forwardRef<CallToolsRef, CallToolsProps>(
  ({ phoneNumber, onTextNowOpen, disabled }, ref) => {
    const { toast } = useToast();
    const normalizedPhone = normalizePhone(phoneNumber);
    const hasPhone = normalizedPhone.length >= 10;
    const textNowRef = useRef<Window | null>(null);
    const [popupBlocked, setPopupBlocked] = useState(false);

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
      // If the TextNow window is still open, just re-focus it
      if (textNowRef.current && !textNowRef.current.closed) {
        textNowRef.current.focus();
        if (hasPhone) onTextNowOpen();
        return;
      }

      // Calculate position: right side of screen
      const screenW = window.screen.availWidth;
      const popW = 480;
      const popH = 780;
      const left = screenW - popW;
      const top = 0;

      const popup = window.open(
        'https://www.textnow.com/messaging',
        'TextNow',
        `width=${popW},height=${popH},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setPopupBlocked(true);
        window.open('https://www.textnow.com/messaging', '_blank');
        toast({
          title: "Popup Blocked",
          description: "TextNow opened in a new tab instead. Allow popups for a better experience.",
        });
      } else {
        textNowRef.current = popup;
        setPopupBlocked(false);
        toast({
          title: "TextNow Opened",
          description: "Window positioned on the right side of your screen",
        });
      }

      if (hasPhone) {
        onTextNowOpen();
      }
    };

    // Expose openTextNow via ref so Dialer can call it
    useImperativeHandle(ref, () => ({
      openTextNow,
    }));

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

    const focusTextNow = () => {
      if (textNowRef.current && !textNowRef.current.closed) {
        textNowRef.current.focus();
        toast({ title: "TextNow Focused", description: "Brought TextNow window to front" });
      } else {
        openTextNow();
      }
    };

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Call Tools</h4>

        {popupBlocked && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Popup blocked — allow popups for this site to auto-open TextNow.</span>
          </div>
        )}

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
            onClick={focusTextNow} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="w-4 h-4" />
            {textNowRef.current && !textNowRef.current?.closed ? "Focus TextNow" : "Open TextNow"}
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
);

CallTools.displayName = "CallTools";
