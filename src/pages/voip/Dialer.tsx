import { useState, useCallback, useEffect } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { CallTimer } from "@/components/voip/dialer/CallTimer";
import { DialPad } from "@/components/voip/dialer/DialPad";
import { AppointmentModal } from "@/components/voip/AppointmentModal";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Phone, User, Mail, Globe, Loader2, PhoneCall, PhoneOff, CalendarIcon, RefreshCw, Delete, StickyNote, ChevronDown, Trash2, Copy, CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const SCRATCH_PAD_KEY = "voip_dialer_scratchpad";

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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [followupDate, setFollowupDate] = useState<Date | undefined>();
  const [followupTime, setFollowupTime] = useState("09:00");
  const [followupPriority, setFollowupPriority] = useState<string>("medium");
  const [followupNotes, setFollowupNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scratchPadNotes, setScratchPadNotes] = useState("");
  const [scratchPadOpen, setScratchPadOpen] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentOutcome, setAppointmentOutcome] = useState<string>("manual");

  // Load scratch pad notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SCRATCH_PAD_KEY);
    if (saved) {
      setScratchPadNotes(saved);
    }
  }, []);

  // Auto-save scratch pad notes to localStorage (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(SCRATCH_PAD_KEY, scratchPadNotes);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [scratchPadNotes]);

  const clearScratchPad = () => {
    setScratchPadNotes("");
    localStorage.removeItem(SCRATCH_PAD_KEY);
  };

  // Fetch current assigned lead on mount
  useEffect(() => {
    const fetchCurrentLead = async () => {
      const result = await apiCall<{ lead: Lead | null }>("voip-leads", {
        params: { action: "current" },
      });
      if (result.data?.lead) {
        setCurrentLead(result.data.lead);
        setPhoneNumber(result.data.lead.phone);
      }
    };
    fetchCurrentLead();
  }, [apiCall]);

  const requestNextLead = async () => {
    setIsLoadingLead(true);
    setCurrentLead(null);
    setPhoneNumber("");
    setSelectedOutcome("");
    setNotes("");
    setFollowupDate(undefined);
    setFollowupTime("09:00");
    setFollowupPriority("medium");
    setFollowupNotes("");

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
      setPhoneNumber(result.data.lead.phone);
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

  const handleDigitPress = (digit: string) => {
    setPhoneNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPhoneNumber("");
  };

  const handleUseLeadNumber = () => {
    if (currentLead?.phone) {
      setPhoneNumber(currentLead.phone);
    }
  };

  const handleCall = useCallback(() => {
    if (!phoneNumber) {
      toast({
        title: "No Phone Number",
        description: "Enter a phone number to call",
        variant: "destructive",
      });
      return;
    }
    setCallStatus("calling");
    
    // Simulate call connection after 2s
    setTimeout(() => {
      setCallStatus("connected");
    }, 2000);
  }, [phoneNumber, toast]);

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

    // Combine date and time for follow-up
    let followupDateTime: string | null = null;
    if (selectedOutcome === "followup" && followupDate) {
      const [hours, minutes] = followupTime.split(":").map(Number);
      const combined = new Date(followupDate);
      combined.setHours(hours, minutes, 0, 0);
      followupDateTime = combined.toISOString();
    }

    const result = await apiCall<{ success: boolean; newStatus: string }>("voip-leads", {
      method: "POST",
      params: { action: "complete" },
      body: {
        leadId: currentLead.id,
        outcome: selectedOutcome,
        notes: notes || null,
        followupAt: followupDateTime,
        followupPriority: selectedOutcome === "followup" ? followupPriority : null,
        followupNotes: selectedOutcome === "followup" ? followupNotes : null,
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

      // Show appointment modal for interested or followup outcomes
      if (selectedOutcome === "interested" || selectedOutcome === "followup") {
        setAppointmentOutcome(selectedOutcome);
        setShowAppointmentModal(true);
      }

      // Reset and get next lead
      setCurrentLead(null);
      setPhoneNumber("");
      setCallStatus("idle");
      setCallDuration(0);
      setSelectedOutcome("");
      setNotes("");
      setFollowupDate(undefined);
      setFollowupTime("09:00");
      setFollowupPriority("medium");
      setFollowupNotes("");
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Lead Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {currentLead ? "Current Lead" : "Request Lead"}
              </CardTitle>
              <CardDescription>
                {currentLead ? "Lead assigned to you" : "Get your next lead to start calling"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!currentLead ? (
                <div className="text-center space-y-4 py-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Ready to Start Calling?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Request your next lead to begin
                    </p>
                  </div>
                  <Button onClick={requestNextLead} disabled={isLoadingLead} size="lg" className="w-full">
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
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <User className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="font-medium truncate">{currentLead.name || "None"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium font-mono truncate">{formatPhoneDisplay(currentLead.phone)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPhoneNumber(currentLead.phone);
                          toast({
                            title: "Copied to Dialer",
                            description: "Phone number loaded into dialer",
                          });
                        }}
                        className="shrink-0"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Use
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium truncate">{currentLead.email || "None"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Website</p>
                        {currentLead.website ? (
                          <a
                            href={currentLead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline truncate block"
                          >
                            {currentLead.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <p className="font-medium">None</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={requestNextLead}
                      disabled={isLoadingLead}
                      variant="outline"
                      className="flex-1"
                    >
                      {isLoadingLead ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Getting Lead...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Request Different Lead
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setAppointmentOutcome("manual");
                        setShowAppointmentModal(true);
                      }}
                    >
                      <CalendarPlus className="w-4 h-4 mr-2" />
                      Set Appointment
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Dialer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Dialer
              </CardTitle>
              <CardDescription>Enter number or use lead phone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone Number Display */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="text-center text-lg font-mono"
                    disabled={callStatus !== "idle" && callStatus !== "ended"}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleBackspace}
                    disabled={callStatus !== "idle" && callStatus !== "ended"}
                  >
                    <Delete className="w-4 h-4" />
                  </Button>
                </div>
                {currentLead && phoneNumber !== currentLead.phone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUseLeadNumber}
                    className="w-full text-xs"
                  >
                    Use Lead Number: {formatPhoneDisplay(currentLead.phone)}
                  </Button>
                )}
              </div>

              {/* DialPad */}
              <DialPad
                onDigitPress={handleDigitPress}
                disabled={callStatus !== "idle" && callStatus !== "ended"}
              />

              {/* Call Status */}
              <div className="flex flex-col items-center gap-3 pt-2">
                {callStatus === "connected" && (
                  <CallTimer isRunning={true} onDurationChange={setCallDuration} />
                )}
                {callStatus === "calling" && (
                  <p className="text-sm text-muted-foreground animate-pulse">Connecting...</p>
                )}

                {/* Call Controls */}
                <div className="flex gap-3 w-full">
                  {callStatus === "idle" || callStatus === "ended" ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleClear}
                        className="flex-1"
                        disabled={!phoneNumber}
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={handleCall}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={!phoneNumber}
                      >
                        <PhoneCall className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleHangup}
                      variant="destructive"
                      className="w-full"
                    >
                      <PhoneOff className="w-4 h-4 mr-2" />
                      End Call
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Outcome Section - Only show when there's a lead */}
        {currentLead && (
          <Card>
            <CardHeader>
              <CardTitle>Call Outcome</CardTitle>
              <CardDescription>Record the result of this call</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={selectedOutcome} onValueChange={setSelectedOutcome}>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <h4 className="font-medium text-sm">Follow-up Details</h4>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Date</Label>
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

                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={followupTime}
                        onChange={(e) => setFollowupTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <RadioGroup
                      value={followupPriority}
                      onValueChange={setFollowupPriority}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="priority-low" />
                        <Label htmlFor="priority-low" className="cursor-pointer text-muted-foreground">Low</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="priority-medium" />
                        <Label htmlFor="priority-medium" className="cursor-pointer text-orange-500">Medium</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="priority-high" />
                        <Label htmlFor="priority-high" className="cursor-pointer text-destructive">High</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="followup-notes">Follow-up Notes</Label>
                    <Textarea
                      id="followup-notes"
                      placeholder="Why should we call back? Any specific topics to discuss..."
                      value={followupNotes}
                      onChange={(e) => setFollowupNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
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

              <Button
                onClick={handleSubmitOutcome}
                disabled={!selectedOutcome || isSubmitting}
                className="w-full"
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
            </CardContent>
          </Card>
        )}

        {/* Scratch Pad */}
        <Collapsible open={scratchPadOpen} onOpenChange={setScratchPadOpen}>
          <Card>
            <CardHeader className="py-3">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <StickyNote className="w-4 h-4" />
                    Scratch Pad
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearScratchPad();
                      }}
                      disabled={!scratchPadNotes}
                      className="h-7 px-2"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", scratchPadOpen && "rotate-180")} />
                  </div>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Textarea
                  placeholder="Quick notes for your calls... (auto-saved locally)"
                  value={scratchPadNotes}
                  onChange={(e) => setScratchPadNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Notes are saved locally and won't be submitted with call outcomes.
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground">
          <Phone className="w-4 h-4 inline-block mr-1" />
          Demo mode: Calls are simulated. Configure Twilio for real calls.
        </p>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        open={showAppointmentModal}
        onOpenChange={setShowAppointmentModal}
        leadId={currentLead?.id}
        leadName={currentLead?.name}
        leadPhone={currentLead?.phone || phoneNumber}
        outcome={appointmentOutcome}
      />
    </VoipLayout>
  );
}
