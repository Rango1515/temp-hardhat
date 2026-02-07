import { useState, useEffect, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, ChevronLeft, ChevronRight, Search, Trash2, Copy, Check, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { PartnerSettingsCard } from "@/components/voip/admin/PartnerSettingsCard";

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

interface PartnerClient {
  id: number;
  name: string;
  email: string;
  status: string;
  role: string;
  created_at: string;
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
  const [newPhone, setNewPhone] = useState("");
  const [newPayoutMethod, setNewPayoutMethod] = useState("");

  // Token result state
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Clients dialog
  const [clientsOpen, setClientsOpen] = useState<number | null>(null);
  const [clientsPartnerName, setClientsPartnerName] = useState("");
  const [clients, setClients] = useState<PartnerClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

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
    if (!newName) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    setCreating(true);
    const result = await apiCall<{ id: number; tokenCode: string }>("voip-partner-admin", {
      method: "POST",
      params: { action: "partners" },
      body: { name: newName, phone: newPhone || null, payoutMethod: newPayoutMethod || null },
    });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result.data) {
      toast({ title: "Partner Created", description: "Signup token generated — share it with the partner." });
      setGeneratedToken(result.data.tokenCode);
      fetchPartners();
    }
    setCreating(false);
  };

  const handleCopyToken = async () => {
    if (!generatedToken) return;
    const baseUrl = "https://hardhathosting.work";
    const signupUrl = `${baseUrl}/voip/partner-signup?token=${generatedToken}`;
    await navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    toast({ title: "Copied!", description: "Signup link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseCreate = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setNewName(""); setNewPhone(""); setNewPayoutMethod("");
      setGeneratedToken(null); setCopied(false);
    }
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

  const deletePartner = async (partnerId: number, partnerName: string) => {
    const result = await apiCall("voip-partner-admin", {
      method: "DELETE",
      params: { action: "partners", partnerId: String(partnerId) },
    });
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Partner removed", description: `${partnerName} has been deleted` });
      fetchPartners();
    }
  };

  const totalPages = Math.ceil(total / 20);

  const viewClients = async (partnerId: number, partnerName: string) => {
    setClientsOpen(partnerId);
    setClientsPartnerName(partnerName);
    setClientsLoading(true);
    const result = await apiCall<{ clients: PartnerClient[] }>("voip-partner-admin", {
      params: { action: "partner-clients", partnerId: String(partnerId) },
    });
    if (result.data) setClients(result.data.clients);
    setClientsLoading(false);
  };

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Partners</h1>
            <p className="text-muted-foreground">Manage partner accounts</p>
          </div>
          <Dialog open={createOpen} onOpenChange={handleCloseCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Create Partner</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{generatedToken ? "Partner Created!" : "Create New Partner"}</DialogTitle>
              </DialogHeader>

              {generatedToken ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Share this signup link with the partner. They'll use it to create their account with their own email and password.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`https://hardhathosting.work/voip/partner-signup?token=${generatedToken}`}
                      className="text-xs font-mono"
                    />
                    <Button size="sm" variant="outline" onClick={handleCopyToken}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">This token can only be used once.</p>
                  <Button variant="outline" className="w-full" onClick={() => handleCloseCreate(false)}>Done</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Partner name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+1..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Payout Method</Label>
                    <Select value={newPayoutMethod} onValueChange={setNewPayoutMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payout method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="wire">Wire Transfer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreate} disabled={creating} className="w-full">
                    {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Create Partner & Generate Token
                  </Button>
                </div>
              )}
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
                      <TableCell className="text-muted-foreground">
                        {p.email.includes("@placeholder.local") ? (
                          <Badge variant="outline" className="text-xs">Pending signup</Badge>
                        ) : p.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "active" ? "default" : "secondary"}>
                          {p.profile?.status || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={() => viewClients(p.id, p.name)}
                        >
                          <Users className="w-3.5 h-3.5" />
                          {p.clientCount}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">${p.totalCommission.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">{p.profile?.payout_method || "—"}</TableCell>
                      <TableCell>{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(p.id, p.profile?.status || p.status)}
                          >
                            {(p.profile?.status || p.status) === "active" ? "Pause" : "Activate"}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Partner</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove <strong>{p.name}</strong>, their tokens, and audit log entries. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deletePartner(p.id, p.name)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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

        {/* Partner Settings */}
        <PartnerSettingsCard />

        {/* Clients Dialog */}
        <Dialog open={clientsOpen !== null} onOpenChange={() => setClientsOpen(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Clients — {clientsPartnerName}</DialogTitle>
            </DialogHeader>
            {clientsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : clients.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No clients have signed up under this partner yet</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground">{c.email}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "active" ? "default" : "secondary"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </VoipLayout>
  );
}