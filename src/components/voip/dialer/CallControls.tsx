import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Phone, PhoneOff, Mic, MicOff, Pause, Play, Volume2 } from "lucide-react";

interface CallControlsProps {
  isCallActive: boolean;
  isMuted: boolean;
  isOnHold: boolean;
  onCall: () => void;
  onHangup: () => void;
  onMuteToggle: () => void;
  onHoldToggle: () => void;
  disabled?: boolean;
}

export function CallControls({
  isCallActive,
  isMuted,
  isOnHold,
  onCall,
  onHangup,
  onMuteToggle,
  onHoldToggle,
  disabled,
}: CallControlsProps) {
  if (!isCallActive) {
    return (
      <Button
        size="lg"
        disabled={disabled}
        onClick={onCall}
        className={cn(
          "w-full max-w-[280px] h-14 rounded-2xl text-lg font-semibold",
          "bg-green-500 hover:bg-green-600 text-white",
          "transition-all active:scale-95",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Phone className="w-5 h-5 mr-2" />
        Call
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="lg"
        onClick={onMuteToggle}
        className={cn(
          "h-14 w-14 rounded-full",
          isMuted && "bg-destructive/10 border-destructive text-destructive"
        )}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </Button>

      <Button
        size="lg"
        onClick={onHangup}
        className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
      >
        <PhoneOff className="w-6 h-6" />
      </Button>

      <Button
        variant="outline"
        size="lg"
        onClick={onHoldToggle}
        className={cn(
          "h-14 w-14 rounded-full",
          isOnHold && "bg-yellow-500/10 border-yellow-500 text-yellow-500"
        )}
      >
        {isOnHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
      </Button>
    </div>
  );
}
