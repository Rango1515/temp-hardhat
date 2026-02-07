import { useState, useEffect, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, DollarSign, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";

interface Commission {
  id: number;
  commission_amount: number;
  commission_rate: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  revenue_amount: number;
  event_type: string;
  client_name: string;
}

interface EarningsSummary {
  lifetime: number;
  thisMonth: number;
  pending: number;
}

export default function PartnerEarnings() {
  const { apiCall } = useVoipApi();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { action: "earnings", page: String(page), limit: "20" };
    if (statusFilter) params.status = statusFilter;

    const [earningsResult, summaryResult] = await Promise.all([
      apiCall<{ commissions: Commission[]; pagination: { total: number } }>("voip-partner", { params }),
      apiCall<EarningsSummary>("voip-partner", { params: { action: "earnings-summary" } }),
    ]);

    if (earningsResult.data) {
      setCommissions(earningsResult.data.commissions);
      setTotal(earningsResult.data.pagination.total);
    }
    if (summaryResult.data) setSummary(summaryResult.data);
    setLoading(false);
  }, [apiCall, page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
          <p className="text-muted-foreground">Your commission history and payouts</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Earned</CardTitle>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(summary?.lifetime || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(summary?.thisMonth || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Clock className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(summary?.pending || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["", "pending", "approved", "paid"].map((s) => (
            <Button
              key={s || "all"}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s || "All"}
            </Button>
          ))}
        </div>

        {/* Commission Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No commissions yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="font-medium">{c.client_name}</TableCell>
                      <TableCell className="capitalize">{c.event_type}</TableCell>
                      <TableCell>${c.revenue_amount.toFixed(2)}</TableCell>
                      <TableCell className="font-medium text-emerald-600">${Number(c.commission_amount).toFixed(2)}</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
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
