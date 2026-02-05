import { useState, useEffect } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Loader2, Check, X, Phone, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DuplicateLead {
  id: number;
  upload_id: number;
  phone: string;
  name: string | null;
  email: string | null;
  website: string | null;
  existing_lead_id: number | null;
  reason: string;
  created_at: string;
  upload_filename?: string;
  existing_lead_status?: string;
  existing_call_count?: number;
}

export default function DuplicateReview() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [duplicates, setDuplicates] = useState<DuplicateLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const fetchDuplicates = async () => {
    setIsLoading(true);
    const result = await apiCall<{ duplicates: DuplicateLead[] }>("voip-leads-ext", {
      params: { action: "duplicates" },
    });
    if (result.data?.duplicates) {
      setDuplicates(result.data.duplicates);
    }
    setIsLoading(false);
  };

  const handleReview = async (duplicateId: number, action: "add" | "skip") => {
    setProcessingId(duplicateId);
    const result = await apiCall<{ success: boolean }>("voip-leads-ext", {
      method: "POST",
      params: { action: "review-duplicate" },
      body: { duplicateId, reviewAction: action },
    });

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: action === "add" ? "Lead Added" : "Lead Skipped",
        description: action === "add" 
          ? "The lead has been added to the queue" 
          : "The duplicate has been marked as skipped",
      });
      setDuplicates((prev) => prev.filter((d) => d.id !== duplicateId));
    }
    setProcessingId(null);
  };

  const handleBulkAction = async (action: "add" | "skip") => {
    const ids = duplicates.map((d) => d.id);
    if (ids.length === 0) return;

    setProcessingId(-1); // Indicate bulk processing
    const result = await apiCall<{ success: boolean; count: number }>("voip-leads-ext", {
      method: "POST",
      params: { action: "bulk-review-duplicates" },
      body: { duplicateIds: ids, reviewAction: action },
    });

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: action === "add" ? "All Leads Added" : "All Skipped",
        description: `${result.data?.count || ids.length} duplicates processed`,
      });
      setDuplicates([]);
    }
    setProcessingId(null);
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case "phone_exists":
        return <Badge variant="secondary">Phone Exists</Badge>;
      case "has_call_history":
        return <Badge className="bg-orange-500">Called Before</Badge>;
      default:
        return <Badge variant="outline">{reason}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <VoipLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </VoipLayout>
    );
  }

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Duplicate Review</h1>
            <p className="text-muted-foreground">
              Review leads that may have been called before
            </p>
          </div>
          <Button variant="outline" onClick={fetchDuplicates}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {duplicates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-semibold text-lg">No Duplicates to Review</h3>
              <p className="text-muted-foreground mt-1">
                All uploaded leads are unique and ready to call
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Pending Review ({duplicates.length})
                  </CardTitle>
                  <CardDescription>
                    These leads match existing numbers or have been called before
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("skip")}
                    disabled={processingId !== null}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Skip All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction("add")}
                    disabled={processingId !== null}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Add All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Existing Status</TableHead>
                      <TableHead>Calls</TableHead>
                      <TableHead>Upload</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicates.map((dup) => (
                      <TableRow key={dup.id}>
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {dup.phone}
                          </div>
                        </TableCell>
                        <TableCell>{dup.name || "—"}</TableCell>
                        <TableCell>{getReasonBadge(dup.reason)}</TableCell>
                        <TableCell>
                          {dup.existing_lead_status ? (
                            <Badge variant="outline">{dup.existing_lead_status}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{dup.existing_call_count || 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dup.upload_filename || `Upload #${dup.upload_id}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReview(dup.id, "skip")}
                              disabled={processingId !== null}
                            >
                              {processingId === dup.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReview(dup.id, "add")}
                              disabled={processingId !== null}
                            >
                              {processingId === dup.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </VoipLayout>
  );
}
