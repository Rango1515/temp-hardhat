import { useEffect, useState } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Loader2, Check, X, Phone } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface NumberRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  area_code: string | null;
  city_preference: string | null;
  number_type: string;
  business_name: string;
  business_website: string | null;
  reason: string | null;
  status: string;
  created_at: string;
}

interface PhoneNumber {
  id: number;
  phone_number: string;
  location_city: string | null;
  location_state: string | null;
}

export default function AdminRequests() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [requests, setRequests] = useState<NumberRequest[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");

  // Process dialog
  const [processingRequest, setProcessingRequest] = useState<NumberRequest | null>(null);
  const [processAction, setProcessAction] = useState<"approve" | "deny">("approve");
  const [selectedNumber, setSelectedNumber] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);

    const [requestsRes, numbersRes] = await Promise.all([
      apiCall<{ requests: NumberRequest[] }>("voip-admin", {
        params: { action: "requests", status: statusFilter },
      }),
      apiCall<{ numbers: PhoneNumber[] }>("voip-admin", {
        params: { action: "numbers", status: "available" },
      }),
    ]);

    if (requestsRes.data) setRequests(requestsRes.data.requests);
    if (numbersRes.data) setAvailableNumbers(numbersRes.data.numbers);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [apiCall, statusFilter]);

  const handleProcess = (request: NumberRequest, action: "approve" | "deny") => {
    setProcessingRequest(request);
    setProcessAction(action);
    setSelectedNumber("");
    setAdminNotes("");
  };

  const handleSubmit = async () => {
    if (!processingRequest) return;

    if (processAction === "approve" && !selectedNumber) {
      toast({
        title: "Select a Number",
        description: "Please select a number to assign",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const status = processAction === "approve" ? "fulfilled" : "denied";

    const result = await apiCall("voip-admin", {
      method: "PATCH",
      params: { action: "requests", id: processingRequest.id.toString() },
      body: {
        status,
        adminNotes,
        assignedNumberId: processAction === "approve" ? parseInt(selectedNumber) : null,
      },
    });

    if (result.error) {
      toast({
        title: "Processing Failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: processAction === "approve" ? "Request Approved" : "Request Denied",
        description: processAction === "approve" ? "Number has been assigned" : "Request has been denied",
      });
      setProcessingRequest(null);
      fetchData();
    }

    setIsProcessing(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600",
      approved: "bg-primary/10 text-primary",
      fulfilled: "bg-primary/10 text-primary",
      denied: "bg-destructive/10 text-destructive",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-muted text-muted-foreground"}`}>
        {status}
      </span>
    );
  };

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Number Requests</h1>
            <p className="text-muted-foreground">Process customer number requests</p>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests
            </CardTitle>
            <CardDescription>{requests.length} requests</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No {statusFilter} requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{request.business_name}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.user_name} ({request.user_email})
                        </p>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">Type:</span>{" "}
                            <span className="capitalize">{request.number_type}</span>
                          </p>
                          {request.area_code && (
                            <p>
                              <span className="text-muted-foreground">Area Code:</span> {request.area_code}
                            </p>
                          )}
                          {request.city_preference && (
                            <p>
                              <span className="text-muted-foreground">City:</span> {request.city_preference}
                            </p>
                          )}
                          {request.business_website && (
                            <p>
                              <span className="text-muted-foreground">Website:</span>{" "}
                              <a
                                href={request.business_website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {request.business_website}
                              </a>
                            </p>
                          )}
                        </div>
                        {request.reason && (
                          <p className="text-sm text-muted-foreground italic">"{request.reason}"</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Requested {format(new Date(request.created_at), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>

                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleProcess(request, "approve")}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcess(request, "deny")}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process Dialog */}
        <Dialog open={!!processingRequest} onOpenChange={() => setProcessingRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {processAction === "approve" ? "Approve Request" : "Deny Request"}
              </DialogTitle>
              <DialogDescription>
                {processingRequest?.business_name} - {processingRequest?.user_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {processAction === "approve" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign Number *</label>
                  <Select value={selectedNumber} onValueChange={setSelectedNumber}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select available number" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNumbers.map((number) => (
                        <SelectItem key={number.id} value={number.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {number.phone_number}
                            {number.location_city && ` - ${number.location_city}, ${number.location_state}`}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableNumbers.length === 0 && (
                    <p className="text-sm text-destructive">No available numbers. Add numbers first.</p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  placeholder={processAction === "approve" ? "Optional notes..." : "Reason for denial..."}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProcessingRequest(null)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isProcessing || (processAction === "approve" && !selectedNumber)}
                variant={processAction === "deny" ? "destructive" : "default"}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : processAction === "approve" ? (
                  "Approve & Assign"
                ) : (
                  "Deny Request"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </VoipLayout>
  );
}
