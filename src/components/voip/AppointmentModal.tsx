import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2, Calendar as CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useVoipApi } from "@/hooks/useVoipApi";
import { useToast } from "@/hooks/use-toast";

const PLAN_OPTIONS = [
  { value: "standard", label: "Standard Landing Page ($300 + $25/mo)" },
  { value: "advanced", label: "Advanced Website ($500 + $30/mo)" },
  { value: "custom", label: "Full Custom Website ($1,500 + $50/mo)" },
  { value: "other", label: "Other" },
];

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: number | null;
  leadName?: string;
  leadPhone?: string;
  outcome?: string;
  onSuccess?: () => void;
}

export function AppointmentModal({
  open,
  onOpenChange,
  leadId,
  leadName = "",
  leadPhone = "",
  outcome = "manual",
  onSuccess,
}: AppointmentModalProps) {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState(leadPhone);
  const [name, setName] = useState(leadName);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [customPlanDetails, setCustomPlanDetails] = useState("");
  const [negotiatedPrice, setNegotiatedPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone(leadPhone);
      setName(leadName);
    }
  }, [open, leadPhone, leadName]);

  const handleSubmit = async () => {
    if (!date) {
      toast({ title: "Date Required", description: "Please select an appointment date", variant: "destructive" });
      return;
    }
    if (!phone) {
      toast({ title: "Phone Required", description: "Please enter a phone number", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const [hours, minutes] = time.split(":").map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const planValue = selectedPlan === "other" ? customPlanDetails : 
      PLAN_OPTIONS.find(p => p.value === selectedPlan)?.label || null;

    const result = await apiCall<{ success: boolean }>("voip-leads-ext", {
      method: "POST",
      params: { action: "create-appointment" },
      body: {
        leadId: leadId || null,
        leadName: name || null,
        leadPhone: phone,
        scheduledAt: scheduledAt.toISOString(),
        notes: notes || null,
        outcome,
        selectedPlan: planValue || null,
        negotiatedPrice: negotiatedPrice || null,
      },
    });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Appointment Created", description: `Scheduled for ${format(scheduledAt, "PPP 'at' h:mm a")}` });
      setDate(undefined);
      setTime("10:00");
      setNotes("");
      setPhone(leadPhone);
      setName(leadName);
      setSelectedPlan("");
      setCustomPlanDetails("");
      setNegotiatedPrice("");
      onOpenChange(false);
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            Schedule Appointment
          </DialogTitle>
          <DialogDescription>
            {outcome === "interested" 
              ? "Client is interested! Set up a callback appointment."
              : "Create a new appointment."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!leadId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Client Name</Label>
                <Input id="name" placeholder="Enter client name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" placeholder="Enter phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="font-mono" />
              </div>
            </>
          )}

          {leadId && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{leadName || "Unknown"}</p>
              <p className="text-sm font-mono">{leadPhone}</p>
            </div>
          )}

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label>Plan Selected</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan..." />
              </SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlan === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customPlan">Custom Plan Details</Label>
              <Input id="customPlan" placeholder="Describe the custom plan..." value={customPlanDetails} onChange={(e) => setCustomPlanDetails(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="negotiatedPrice">Negotiated Price (optional)</Label>
            <Input id="negotiatedPrice" placeholder="e.g. $400 build + $20/mo" value={negotiatedPrice} onChange={(e) => setNegotiatedPrice(e.target.value)} />
          </div>

          {/* Date and Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus disabled={(d) => d < new Date()} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="What is this appointment about?" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
            ) : (
              <><CalendarCheck className="w-4 h-4 mr-2" />Create Appointment</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
