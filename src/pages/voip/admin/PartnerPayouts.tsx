import { useState, useEffect, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, ChevronLeft, ChevronRight, DollarSign, CheckCircle, Clock, Download, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface CommissionItem {
  id: number;
  partner_id: number;
  partner_name: string;
  commission_amount: number;
  commission_rate: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface Partner {
  id: number;
  name: string;
}

interface CommissionSummary {
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
}

export default function PartnerPayouts() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterPartner, setFilterPartner] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [creatingRevenue, setCreatingRevenue] = useState(false);

  // Revenue event form
  const [revClientId, setRevClientId] = useState("");
  const [revPartnerId, setRevPartnerId] = useState("");
  const [revAmount, setRevAmount] = useState("");
  const [revType, setRevType] = useState("subscription");
  const [revDescription, setRevDescription] = useState("");

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { action: "commissions", page: String(page), limit: "20" };
    if (filterPartner) params.partnerId = filterPartner;
    if (filterStatus) params.status = filterStatus;

    const result = await apiCall<{ commissions: CommissionItem[]; summary: CommissionSummary; pagination: { total: number } }>(
      "voip-partner-admin", { params }
    );
    if (result.data) {
      setCommissions(result.data.commissions);
      setSummary(result.data.summary);
      setTotal(result.data.pagination.total);
    }
    setLoading(false);
  }, [apiCall, page, filterPartner, filterStatus]);

  const fetchPartners = useCallback(async () => {
    const result = await apiCall<{ partners: Partner[] }>("voip-partner-admin", {
      params: { action: "partners", limit: "100" },
    });
    if (result.data) setPartners(result.data.partners);
  }, [apiCall]);

  useEffect(() => { fetchCommissions(); fetchPartners(); }, [fetchCommissions, fetchPartners]);

  const bulkAction = async (newStatus: "approved" | "paid") => {
    if (selected.size === 0) return;
    await apiCall("voip-partner-admin", {
      method: "PATCH",
      params: { action: "commissions" },
      body: { commissionIds: Array.from(selected), newStatus },
    });
    toast({ title: "Success", description: `${selected.size} commission(s) marked as ${newStatus}` });
    setSelected(new Set());
    fetchCommissions();
  };

  const exportCSV = async () => {
    const params: Record<string, string> = { action: "commissions-export" };
    if (filterPartner) params.partnerId = filterPartner;
    if (filterStatus) params.status = filterStatus;

    // Direct fetch for CSV download
    const token = localStorage.getItem("voip_token");
    const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-partner-admin`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const response = await fetch(url.href, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    if (response.ok) {
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "commissions-export.csv";
      a.click();
    }
  };

  const handleCreateRevenue = async () => {
    if (!revClientId || !revPartnerId || !revAmount) {
      toast({ title: "Error", description: "Client ID, Partner, and Amount are required", variant: "destructive" });
      return;
    }
    setCreatingRevenue(true);
    const result = await apiCall<{ id: number; commissionAmount: number }>("voip-partner-admin", {
      method: "POST",
      params: { action: "revenue-events" },
      body: {
        clientId: parseInt(revClientId),
        partnerId: parseInt(revPartnerId),
        amount: parseFloat(revAmount),
        type: revType,
        description: revDescription || null,
      },
    });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Revenue event created", description: `Commission of $${result.data?.commissionAmount?.toFixed(2)} generated` });
      setRevenueOpen(false);
      setRevClientId(""); setRevAmount(""); setRevDescription("");
      fetchCommissions();
    }
    setCreatingRevenue(false);
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === commissions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(commissions.map(c => c.id)));
    }
  };

  const totalPages = Math.ceil(total / 20);

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>;
      case "approved": return <Badge variant="outline" className="border-blue-500 text-blue-500">Approved</Badge>;
      case "paid": return <Badge className="bg-green-600">Paid</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Partner Payouts</h1>
            <p className="text-muted-foreground">Manage commissions and payouts</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={revenueOpen} onOpenChange={setRevenueOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Revenue Event</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Revenue Event</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Client User ID *</Label>
                    <Input type="number" value={revClientId} onChange={(e) => setRevClientId(e.target.value)} placeholder="Client user ID" />
                  </div>
                  <div className="space-y-2">
                    <Label>Partner *</Label>
                    <Select value={revPartnerId} onValueChange={setRevPartnerId}>
                      <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                      <SelectContent>
                        {partners.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount ($) *</Label>
                    <Input type="number" step="0.01" value={revAmount} onChange={(e) => setRevAmount(e.target.value)} placeholder="99.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={revType} onValueChange={setRevType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="setup_fee">Setup Fee</SelectItem>
                        <SelectItem value="case_bonus">Case Bonus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input value={revDescription} onChange={(e) => setRevDescription(e.target.value)} />
                  </div>
                  <Button onClick={handleCreateRevenue} disabled={creatingRevenue} className="w-full">
                    {creatingRevenue ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Create Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Clock className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">${(summary?.totalPending || 0).toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">${(summary?.totalApproved || 0).toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">${(summary?.totalPaid || 0).toFixed(2)}</div></CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <Select value={filterPartner || "all"} onValueChange={(v) => { setFilterPartner(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filter by partner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partners</SelectItem>
              {partners.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus || "all"} onValueChange={(v) => { setFilterStatus(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          {selected.size > 0 && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => bulkAction("approved")}>
                <CheckCircle className="w-4 h-4 mr-1" /> Approve ({selected.size})
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkAction("paid")}>
                <DollarSign className="w-4 h-4 mr-1" /> Mark Paid ({selected.size})
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No commissions found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selected.size === commissions.length && commissions.length > 0} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{c.partner_name}</TableCell>
                      <TableCell className="font-medium">${Number(c.commission_amount).toFixed(2)}</TableCell>
                      <TableCell>{(Number(c.commission_rate) * 100).toFixed(0)}%</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell>{c.paid_at ? format(new Date(c.paid_at), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell>{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </VoipLayout>
  );
}
