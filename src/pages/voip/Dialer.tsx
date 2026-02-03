import { useState, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { DialPad } from "@/components/voip/dialer/DialPad";
import { CallControls } from "@/components/voip/dialer/CallControls";
import { CallTimer } from "@/components/voip/dialer/CallTimer";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Delete, Phone, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CallStatus = "idle" | "initiated" | "ringing" | "in_progress" | "completed" | "failed";

export default function Dialer() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callId, setCallId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const handleDigitPress = (digit: string) => {
    if (callStatus === "idle") {
      setPhoneNumber((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPhoneNumber("");
  };

  const formatPhoneDisplay = (number: string) => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Mock call simulation
  const simulateCall = useCallback(async (callId: number) => {
    // Simulate ringing after 1s
    await new Promise((r) => setTimeout(r, 1000));
    setCallStatus("ringing");

    // Simulate answer/fail after 2-5s
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));

    const outcome = Math.random();
    if (outcome > 0.2) {
      // 80% success
      setCallStatus("in_progress");

      // Simulate call duration (10-60s for demo)
      const duration = 10 + Math.floor(Math.random() * 50);
      await new Promise((r) => setTimeout(r, duration * 1000));

      // End call
      setCallStatus("completed");
      await apiCall("voip-calls", {
        method: "PATCH",
        params: { id: callId.toString() },
        body: { status: "completed", duration_seconds: duration },
      });

      toast({
        title: "Call Completed",
        description: `Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}`,
      });
    } else if (outcome > 0.1) {
      // 10% no answer
      setCallStatus("failed");
      await apiCall("voip-calls", {
        method: "PATCH",
        params: { id: callId.toString() },
        body: { status: "no_answer" },
      });

      toast({
        title: "No Answer",
        description: "The call was not answered",
        variant: "destructive",
      });
    } else {
      // 10% failed
      setCallStatus("failed");
      await apiCall("voip-calls", {
        method: "PATCH",
        params: { id: callId.toString() },
        body: { status: "failed" },
      });

      toast({
        title: "Call Failed",
        description: "Unable to connect the call",
        variant: "destructive",
      });
    }

    // Reset after 2s
    setTimeout(() => {
      setCallStatus("idle");
      setCallId(null);
      setIsMuted(false);
      setIsOnHold(false);
      setCallDuration(0);
    }, 2000);
  }, [apiCall, toast]);

  const handleCall = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setCallStatus("initiated");

    const result = await apiCall<{ id: number }>("voip-calls", {
      method: "POST",
      body: { toNumber: phoneNumber },
    });

    if (result.error) {
      toast({
        title: "Call Failed",
        description: result.error,
        variant: "destructive",
      });
      setCallStatus("idle");
      return;
    }

    if (result.data) {
      setCallId(result.data.id);
      simulateCall(result.data.id);
    }
  };

  const handleHangup = async () => {
    if (callId) {
      await apiCall("voip-calls", {
        method: "PATCH",
        params: { id: callId.toString() },
        body: { status: "completed", duration_seconds: callDuration },
      });
    }

    setCallStatus("idle");
    setCallId(null);
    setIsMuted(false);
    setIsOnHold(false);
    setCallDuration(0);

    toast({
      title: "Call Ended",
      description: `Duration: ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, "0")}`,
    });
  };

  const getStatusText = () => {
    switch (callStatus) {
      case "initiated":
        return "Connecting...";
      case "ringing":
        return "Ringing...";
      case "in_progress":
        return isOnHold ? "On Hold" : "Connected";
      case "completed":
        return "Call Ended";
      case "failed":
        return "Call Failed";
      default:
        return "";
    }
  };

  const isCallActive = ["initiated", "ringing", "in_progress"].includes(callStatus);

  return (
    <VoipLayout>
      <div className="max-w-md mx-auto">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="pt-6 pb-8 space-y-6">
            {/* Number Display */}
            <div className="text-center space-y-2">
              {isCallActive && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{getStatusText()}</span>
                </div>
              )}
              <div className="relative">
                <Input
                  type="tel"
                  value={formatPhoneDisplay(phoneNumber)}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter number"
                  disabled={isCallActive}
                  className="text-center text-2xl font-mono h-14 bg-muted/50 border-none"
                />
                {phoneNumber && !isCallActive && (
                  <button
                    onClick={handleBackspace}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                )}
              </div>
              {isCallActive && (
                <CallTimer
                  isRunning={callStatus === "in_progress"}
                  onDurationChange={setCallDuration}
                />
              )}
            </div>

            {/* Dial Pad */}
            <DialPad onDigitPress={handleDigitPress} disabled={isCallActive} />

            {/* Call Controls */}
            <div className="flex justify-center">
              <CallControls
                isCallActive={isCallActive}
                isMuted={isMuted}
                isOnHold={isOnHold}
                onCall={handleCall}
                onHangup={handleHangup}
                onMuteToggle={() => setIsMuted(!isMuted)}
                onHoldToggle={() => setIsOnHold(!isOnHold)}
                disabled={!phoneNumber && !isCallActive}
              />
            </div>

            {/* Clear Button */}
            {phoneNumber && !isCallActive && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          <Phone className="w-4 h-4 inline-block mr-1" />
          Demo mode: Calls are simulated
        </p>
      </div>
    </VoipLayout>
  );
}
