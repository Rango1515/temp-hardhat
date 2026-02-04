import { useState, useCallback, useEffect } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { CallTimer } from "@/components/voip/dialer/CallTimer";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Phone, User, Mail, Globe, Loader2, PhoneCall, PhoneOff, CalendarIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  website: string | null;
  attempt_count?: number;
}

type CallStatus = "idle" | "calling" | "connected" | "ended";

const OUTCOMES = [
  { value: "no_answer", label: "No Answer" },
  { value: "voicemail", label: "Voicemail" },
  { value: "not_interested", label: "Not Interested" },
  { value: "interested", label: "Interested" },
  { value: "followup", label: "Follow-up Scheduled" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "dnc", label: "Do Not Call" },
];

export default function Dialer() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();

  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [isLoadingLead, setIsLoadingLead] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [followupDate, setFollowupDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current assigned lead on mount
  useEffect(() => {
    const fetchCurrentLead = async () => {
      const result = await apiCall<{ lead: Lead | null }>("voip-leads", {
        params: { action: "current" },
      });
      if (result.data?.lead) {
        setCurrentLead(result.data.lead);
      }
    };
    fetchCurrentLead();
  }, [apiCall]);

  const requestNextLead = async () => {
    setIsLoadingLead(true);
    setCurrentLead(null);
    setSelectedOutcome("");
    setNotes("");
    setFollowupDate(undefined);

    const result = await apiCall<{ lead: Lead | null; message?: string }>("voip-leads", {
      method: "POST",
      params: { action: "request-next" },
    });

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.data?.lead) {
      setCurrentLead(result.data.lead);
      toast({
        title: "Lead Assigned",
        description: `${result.data.lead.name} - ${result.data.lead.phone}`,
      });
    } else {
      toast({
        title: "No Leads Available",
        description: result.data?.message || "Check back later for more leads",
      });
    }

    setIsLoadingLead(false);
  };

  const handleCall = useCallback(() => {
    if (!currentLead) return;
    setCallStatus("calling");
    
    // Simulate call connection after 2s
    setTimeout(() => {
      setCallStatus("connected");
    }, 2000);
  }, [currentLead]);

  const handleHangup = useCallback(() => {
    setCallStatus("ended");
  }, []);

  const handleSubmitOutcome = async () => {
    if (!currentLead || !selectedOutcome) {
      toast({
        title: "Select Outcome",
        description: "Please select a call outcome",
        variant: "destructive",
      });
      return;
    }

    if (selectedOutcome === "followup" && !followupDate) {
      toast({
        title: "Select Follow-up Date",
        description: "Please select a follow-up date",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const result = await apiCall<{ success: boolean; newStatus: string }>("voip-leads", {
      method: "POST",
      params: { action: "complete" },
      body: {
        leadId: currentLead.id,
        outcome: selectedOutcome,
        notes: notes || null,
        followupAt: followupDate?.toISOString() || null,
      },
    });

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      const outcomeLabel = OUTCOMES.find((o) => o.value === selectedOutcome)?.label;
      toast({
        title: "Outcome Saved",
        description: `${outcomeLabel} - Lead ${result.data?.newStatus === "COMPLETED" ? "completed" : "updated"}`,
      });

      // Reset and get next lead
      setCurrentLead(null);
      setCallStatus("idle");
      setCallDuration(0);
      setSelectedOutcome("");
      setNotes("");
      setFollowupDate(undefined);
    }

    setIsSubmitting(false);
  };

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <VoipLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Request Lead Button */}
        {!currentLead && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Ready to Start Calling?</h2>
                  <p className="text-muted-foreground mt-1">
                    Request your next lead to begin
                  </p>
                </div>
                <Button onClick={requestNextLead} disabled={isLoadingLead} size="lg">
                  {isLoadingLead ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Lead...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Request Next Lead
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Lead Display */}
        {currentLead && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Current Lead
                </CardTitle>
                <CardDescription>Lead assigned to you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{currentLead.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium font-mono">{formatPhoneDisplay(currentLead.phone)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{currentLead.email || "None"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      {currentLead.website ? (
                        <a
                          href={currentLead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline truncate block max-w-48"
                        >
                          {currentLead.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <p className="font-medium">None</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Call Controls */}
                <div className="flex flex-col items-center gap-4 pt-4 border-t">
                  {callStatus === "connected" && (
                    <CallTimer isRunning={true} onDurationChange={setCallDuration} />
                  )}
                  {callStatus === "calling" && (
                    <p className="text-sm text-muted-foreground animate-pulse">Connecting...</p>
                  )}
                  
                  <div className="flex gap-3">
                    {callStatus === "idle" && (
                      <Button onClick={handleCall} size="lg" className="bg-green-600 hover:bg-green-700">
                        <PhoneCall className="w-5 h-5 mr-2" />
                        Call {formatPhoneDisplay(currentLead.phone)}
                      </Button>
                    )}
                    {(callStatus === "calling" || callStatus === "connected") && (
                      <Button onClick={handleHangup} size="lg" variant="destructive">
                        <PhoneOff className="w-5 h-5 mr-2" />
                        End Call
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Outcome Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Call Outcome</CardTitle>
                <CardDescription>Record the result of this call</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={selectedOutcome} onValueChange={setSelectedOutcome}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {OUTCOMES.map((outcome) => (
                      <div key={outcome.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={outcome.value} id={outcome.value} />
                        <Label htmlFor={outcome.value} className="cursor-pointer">
                          {outcome.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {selectedOutcome === "followup" && (
                  <div className="space-y-2">
                    <Label>Follow-up Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !followupDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {followupDate ? format(followupDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={followupDate}
                          onSelect={setFollowupDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about the call..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmitOutcome}
                    disabled={!selectedOutcome || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Submit & Get Next Lead"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground">
          <Phone className="w-4 h-4 inline-block mr-1" />
          Demo mode: Calls are simulated. Configure Twilio for real calls.
        </p>
      </div>
    </VoipLayout>
  );
}
