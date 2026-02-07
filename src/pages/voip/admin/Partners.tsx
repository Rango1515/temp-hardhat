import { useState, useEffect, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Partner {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
  clientCount: number;
  totalCommission: number;
  profile: { phone: string | null; payout_method: string | null; status: string } | null;
}

export default function Partners() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPayoutMethod, setNewPayoutMethod] = useState("");

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { action: "partners", page: String(page), limit: "20" };
    if (search) params.search = search;

    const result = await apiCall<{ partners: Partner[]; pagination: { total: number } }>("voip-partner-admin", { params });
    if (result.data) {
      setPartners(result.data.partners);
      setTotal(result.data.pagination.total);
    }
    setLoading(false);
  }, [apiCall, page, search]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const handleCreate = async () => {
    if (!newName || !newEmail || !newPassword) {
      toast({ title: "Error", description: "Name, email, and password are required", variant: "destructive" });
      return;
    }

    setCreating(true);
    const result = await apiCall("voip-partner-admin", {
      method: "POST",
      params: { action: "partners" },
      body: { name: newName, email: newEmail, password: newPassword, phone: newPhone || null, payoutMethod: newPayoutMethod || null },
    });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Partner created successfully" });
      setCreateOpen(false);
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewPhone(""); setNewPayoutMethod("");
      fetchPartners();
    }
    setCreating(false);
  };

  const toggleStatus = async (partnerId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    await apiCall("voip-partner-admin", {
      method: "PATCH",
      params: { action: "partners" },
      body: { partnerId, status: newStatus },
    });
    fetchPartners();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Partners</h1>
            <p className="text-muted-foreground">Manage partner accounts</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Create Partner</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Partner</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Partner name" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="partner@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 chars, 1 uppercase, 1 number" />
                </div>
                <div className="space-y-2">
                  <Label>Phone (optional)</Label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+1..." />
                </div>
                <div className="space-y-2">
                  <Label>Payout Method (optional)</Label>
                  <Input value={newPayoutMethod} onChange={(e) => setNewPayoutMethod(e.target.value)} placeholder="PayPal, Zelle, Check..." />
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Partner
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search partners..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : partners.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No partners found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Total Commission</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.email}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "active" ? "default" : "secondary"}>
                          {p.profile?.status || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{p.clientCount}</TableCell>
                      <TableCell className="font-medium">${p.totalCommission.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">{p.profile?.payout_method || "—"}</TableCell>
                      <TableCell>{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleStatus(p.id, p.profile?.status || p.status)}
                        >
                          {(p.profile?.status || p.status) === "active" ? "Pause" : "Activate"}
                        </Button>
                      </TableCell>
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
