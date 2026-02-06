import { useState, useEffect, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Users, Loader2, Search, ChevronDown, Phone, Clock, Calendar, AlertTriangle, Trash2, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getCategoryLabel } from "@/lib/leadCategories";

interface Lead {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  website: string | null;
  status: string;
  attempt_count: number;
  created_at: string;
  assigned_to: number | null;
  assigned_user_name?: string;
  category?: string | null;
}

interface CallRecord {
  id: number;
  start_time: string;
  duration_seconds: number;
  outcome: string | null;
  notes: string | null;
  caller_name: string;
  followup_at: string | null;
  followup_priority: string | null;
  followup_notes: string | null;
}

interface FollowUp {
  id: number;
  lead_id: number;
  lead_name: string;
  lead_phone: string;
  caller_name: string;
  followup_at: string;
  followup_priority: string | null;
  followup_notes: string | null;
}

export default function LeadInfo() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");
  const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);
  const [leadCalls, setLeadCalls] = useState<Record<number, CallRecord[]>>({});
  const [loadingCalls, setLoadingCalls] = useState<number | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMasterClear, setShowMasterClear] = useState(false);
  const [masterClearConfirmation, setMasterClearConfirmation] = useState("");
  const [clearHistory, setClearHistory] = useState(false);
  const [isMasterClearing, setIsMasterClearing] = useState(false);
  const [deletingFollowupId, setDeletingFollowupId] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const pageSize = 50;
  const totalPages = Math.ceil(totalLeads / pageSize);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    const params: Record<string, string> = {
      action: "all-leads",
      page: currentPage.toString(),
      pageSize: pageSize.toString(),
    };
    if (searchDebounce) params.search = searchDebounce;

    const result = await apiCall<{ leads: Lead[]; total: number; page: number }>("voip-leads", { params });
    if (result.data) {
      setLeads(result.data.leads);
      setTotalLeads(result.data.total);
    }
    setIsLoading(false);
  }, [apiCall, currentPage, searchDebounce]);

  const fetchFollowups = useCallback(async () => {
    const result = await apiCall<{ followups: FollowUp[] }>("voip-leads", {
      params: { action: "followups" },
    });
    if (result.data?.followups) {
      setFollowups(result.data.followups);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const fetchLeadCalls = async (leadId: number) => {
    if (leadCalls[leadId]) return;
    setLoadingCalls(leadId);
    const result = await apiCall<{ calls: CallRecord[] }>("voip-leads", {
      params: { action: "lead-calls", leadId: leadId.toString() },
    });
    if (result.data?.calls) {
      setLeadCalls((prev) => ({ ...prev, [leadId]: result.data!.calls }));
    }
    setLoadingCalls(null);
  };

  const handleDeleteLead = async () => {
    if (!deletingLeadId) return;
    setIsDeleting(true);
    const result = await apiCall("voip-leads", {
      method: "POST",
      params: { action: "delete-lead" },
      body: { leadId: deletingLeadId },
    });
    if (result.error) {
      toast({ title: "Delete Failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Lead Deleted", description: "Lead has been permanently removed" });
      setLeads(prev => prev.filter(l => l.id !== deletingLeadId));
      setTotalLeads(prev => prev - 1);
    }
    setDeletingLeadId(null);
    setIsDeleting(false);
  };

  const handleMasterClear = async () => {
    if (masterClearConfirmation !== "DELETE ALL LEADS") {
      toast({ title: "Invalid Confirmation", description: "Please type exactly: DELETE ALL LEADS", variant: "destructive" });
      return;
    }
    setIsMasterClearing(true);
    const result = await apiCall<{ leadsDeleted: number }>("voip-leads", {
      method: "POST",
      params: { action: "master-clear-leads" },
      body: { confirmation: masterClearConfirmation, clearHistory },
    });
    if (result.error) {
      toast({ title: "Clear Failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Leads Cleared", description: `${result.data?.leadsDeleted || 0} leads have been deleted` });
      setLeads([]);
      setFollowups([]);
      setLeadCalls({});
      setTotalLeads(0);
    }
    setShowMasterClear(false);
    setMasterClearConfirmation("");
    setClearHistory(false);
    setIsMasterClearing(false);
  };

  const handleDeleteFollowup = async (callId: number) => {
    setDeletingFollowupId(callId);
    const result = await apiCall("voip-leads", {
      method: "POST",
      params: { action: "delete-followup" },
      body: { callId },
    });
    if (result.error) {
      toast({ title: "Delete Failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Follow-up Removed", description: "Scheduled follow-up has been deleted" });
      setFollowups(prev => prev.filter(f => f.id !== callId));
    }
    setDeletingFollowupId(null);
  };

  const toggleExpand = (leadId: number) => {
    if (expandedLeadId === leadId) {
      setExpandedLeadId(null);
    } else {
      setExpandedLeadId(leadId);
      fetchLeadCalls(leadId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW": return <Badge variant="secondary">New</Badge>;
      case "ASSIGNED": return <Badge className="bg-blue-600">Assigned</Badge>;
      case "COMPLETED": return <Badge className="bg-green-600">Completed</Badge>;
      case "DNC": return <Badge variant="destructive">DNC</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case "high": return <Badge variant="destructive">High</Badge>;
      case "medium": return <Badge className="bg-orange-500">Medium</Badge>;
      case "low": return <Badge variant="secondary">Low</Badge>;
      default: return null;
    }
  };

  const formatOutcome = (outcome: string | null) => {
    if (!outcome) return "—";
    return outcome.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalLeads)} of {totalLeads}
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {pages.map(p => (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === currentPage}
                  onClick={() => setCurrentPage(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Lead Info</h1>
            <p className="text-muted-foreground">View all leads and their call history</p>
          </div>
          <Button variant="destructive" onClick={() => setShowMasterClear(true)} className="gap-2">
            <AlertCircle className="w-4 h-4" />
            Master Clear All Leads
          </Button>
        </div>

        {/* Scheduled Follow-ups */}
        {followups.length > 0 && (
          <Card className="border-orange-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <Calendar className="w-5 h-5" />
                Scheduled Follow-ups ({followups.length})
              </CardTitle>
              <CardDescription>Calls that need to be made</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {followups.slice(0, 5).map((fu) => (
                  <div key={fu.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{fu.lead_name || "None"}</p>
                        <p className="text-sm text-muted-foreground">Assigned by {fu.caller_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(fu.followup_priority)}
                      <div className="text-right">
                        <p className="text-sm font-medium">{format(new Date(fu.followup_at), "MMM d, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(fu.followup_at), "h:mm a")}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteFollowup(fu.id)} disabled={deletingFollowupId === fu.id} className="text-destructive hover:text-destructive ml-2">
                        {deletingFollowupId === fu.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
                {followups.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">+{followups.length - 5} more follow-ups</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads Table with Pagination */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Leads ({totalLeads})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30px]"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No leads found
                          </TableCell>
                        </TableRow>
                      ) : (
                        leads.map((lead) => (
                          <Collapsible key={lead.id} open={expandedLeadId === lead.id}>
                            <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(lead.id)}>
                              <TableCell>
                                <CollapsibleTrigger asChild>
                                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedLeadId === lead.id ? "rotate-180" : ""}`} />
                                </CollapsibleTrigger>
                              </TableCell>
                              <TableCell className="font-medium">{lead.name || "—"}</TableCell>
                              <TableCell className="font-mono">{lead.phone}</TableCell>
                              <TableCell className="text-sm">{getCategoryLabel(lead.category)}</TableCell>
                              <TableCell>{getStatusBadge(lead.status)}</TableCell>
                              <TableCell>{lead.attempt_count}</TableCell>
                              <TableCell>{format(new Date(lead.created_at), "MMM d, yyyy")}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeletingLeadId(lead.id); }} className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            <CollapsibleContent asChild>
                              <TableRow>
                                <TableCell colSpan={8} className="bg-muted/30 p-0">
                                  <div className="p-4 space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Email</p>
                                        <p className="font-medium">{lead.email || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Website</p>
                                        <p className="font-medium">{lead.website || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Assigned To</p>
                                        <p className="font-medium">{lead.assigned_user_name || "—"}</p>
                                      </div>
                                    </div>
                                    <div className="border-t pt-3">
                                      <h4 className="font-medium mb-2">Call History</h4>
                                      {loadingCalls === lead.id ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          Loading calls...
                                        </div>
                                      ) : leadCalls[lead.id]?.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No calls yet</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {leadCalls[lead.id]?.map((call) => (
                                            <div key={call.id} className="flex items-center justify-between p-2 rounded bg-background">
                                              <div className="flex items-center gap-3">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                  <p className="text-sm">
                                                    {format(new Date(call.start_time), "MMM d, h:mm a")} by{" "}
                                                    <span className="font-medium">{call.caller_name}</span>
                                                  </p>
                                                  {call.notes && <p className="text-xs text-muted-foreground">{call.notes}</p>}
                                                  {call.followup_at && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                      <Calendar className="w-3 h-3 text-orange-500" />
                                                      <span className="text-xs text-orange-500">
                                                        Follow-up: {format(new Date(call.followup_at), "MMM d, h:mm a")}
                                                      </span>
                                                      {getPriorityBadge(call.followup_priority)}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <Badge variant="outline">{formatOutcome(call.outcome)}</Badge>
                                                <p className="text-xs text-muted-foreground mt-1">{call.duration_seconds}s</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </CollapsibleContent>
                          </Collapsible>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {renderPagination()}
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Single Lead Confirmation */}
        <AlertDialog open={!!deletingLeadId} onOpenChange={() => setDeletingLeadId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this lead? This action cannot be undone.
                Call history will be preserved but unlinked from this lead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteLead} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {isDeleting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>) : "Delete Lead"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Master Clear Dialog */}
        <Dialog open={showMasterClear} onOpenChange={setShowMasterClear}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Master Clear All Leads
              </DialogTitle>
              <DialogDescription>
                This will permanently delete ALL leads from the system. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm font-medium text-destructive mb-2">Warning!</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>All leads will be permanently deleted</li>
                  <li>All assignment history will be cleared</li>
                  <li>Duplicates can be re-imported as new leads</li>
                  <li>Call history will be preserved but unlinked</li>
                </ul>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="clearHistory" checked={clearHistory} onCheckedChange={(checked) => setClearHistory(checked as boolean)} />
                <Label htmlFor="clearHistory" className="text-sm">Also clear upload history records</Label>
              </div>
              <div className="space-y-2">
                <Label>Type <span className="font-mono text-destructive">DELETE ALL LEADS</span> to confirm:</Label>
                <Input value={masterClearConfirmation} onChange={(e) => setMasterClearConfirmation(e.target.value)} placeholder="DELETE ALL LEADS" className="font-mono" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMasterClear(false)} disabled={isMasterClearing}>Cancel</Button>
              <Button variant="destructive" onClick={handleMasterClear} disabled={masterClearConfirmation !== "DELETE ALL LEADS" || isMasterClearing}>
                {isMasterClearing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Clearing...</>) : "Permanently Delete All Leads"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </VoipLayout>
  );
}
