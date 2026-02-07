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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, ChevronLeft, ChevronRight, Copy, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface TokenItem {
  id: number;
  token_code: string;
  token_display: string;
  partner_id: number;
  partner_name: string;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  status: string;
  created_at: string;
}

interface Partner {
  id: number;
  name: string;
}

interface TokenUsage {
  id: number;
  client_user_id: number;
  client_name: string;
  created_at: string;
}

export default function PartnerTokens() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterPartner, setFilterPartner] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [usageOpen, setUsageOpen] = useState<number | null>(null);
  const [usageData, setUsageData] = useState<TokenUsage[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  // Create form
  const [selectedPartner, setSelectedPartner] = useState("");
  const [isMultiUse, setIsMultiUse] = useState(false);
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { action: "partner-tokens", page: String(page), limit: "20" };
    if (filterPartner) params.partnerId = filterPartner;

    const result = await apiCall<{ tokens: TokenItem[]; pagination: { total: number } }>("voip-partner-admin", { params });
    if (result.data) {
      setTokens(result.data.tokens);
      setTotal(result.data.pagination.total);
    }
    setLoading(false);
  }, [apiCall, page, filterPartner]);

  const fetchPartners = useCallback(async () => {
    const result = await apiCall<{ partners: Partner[] }>("voip-partner-admin", {
      params: { action: "partners", limit: "100" },
    });
    if (result.data) setPartners(result.data.partners);
  }, [apiCall]);

  useEffect(() => { fetchTokens(); fetchPartners(); }, [fetchTokens, fetchPartners]);

  const handleCreate = async () => {
    if (!selectedPartner) {
      toast({ title: "Error", description: "Select a partner", variant: "destructive" });
      return;
    }

    setCreating(true);
    const body: Record<string, unknown> = { partnerId: parseInt(selectedPartner) };
    if (isMultiUse && maxUses) body.maxUses = parseInt(maxUses);
    if (!isMultiUse) body.maxUses = 1;
    if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();

    const result = await apiCall<{ tokenCode: string; id: number }>("voip-partner-admin", {
      method: "POST",
      params: { action: "partner-tokens" },
      body,
    });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result.data) {
      setCreatedToken(result.data.tokenCode);
      fetchTokens();
    }
    setCreating(false);
  };

  const revokeToken = async (tokenId: number) => {
    await apiCall("voip-partner-admin", {
      method: "DELETE",
      params: { action: "partner-tokens", tokenId: String(tokenId) },
    });
    toast({ title: "Token revoked" });
    fetchTokens();
  };

  const viewUsage = async (tokenId: number) => {
    setUsageOpen(tokenId);
    setUsageLoading(true);
    const result = await apiCall<{ usage: TokenUsage[] }>("voip-partner-admin", {
      params: { action: "token-usage", tokenId: String(tokenId) },
    });
    if (result.data) setUsageData(result.data.usage);
    setUsageLoading(false);
  };

  const copyToken = (tokenCode: string) => {
    navigator.clipboard.writeText(tokenCode);
    toast({ title: "Copied!", description: "Token copied to clipboard" });
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Partner Tokens</h1>
            <p className="text-muted-foreground">Manage invite tokens for partners</p>
          </div>
          <Dialog open={createOpen || !!createdToken} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setCreatedToken(null); } }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setCreateOpen(true); setCreatedToken(null); }}>
                <Plus className="w-4 h-4 mr-2" /> Generate Token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{createdToken ? "Token Created!" : "Generate Partner Token"}</DialogTitle>
              </DialogHeader>
              {createdToken ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Copy this token now — it won't be shown again in full.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={createdToken} readOnly className="font-mono" />
                    <Button size="sm" variant="outline" onClick={() => copyToken(createdToken)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button className="w-full" onClick={() => { setCreatedToken(null); setCreateOpen(false); }}>Done</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Partner *</Label>
                    <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                      <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                      <SelectContent>
                        {partners.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={isMultiUse} onCheckedChange={setIsMultiUse} />
                    <Label>Multi-use token</Label>
                  </div>
                  {isMultiUse && (
                    <div className="space-y-2">
                      <Label>Max Uses (leave empty for unlimited)</Label>
                      <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="e.g. 10" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Expires At (optional)</Label>
                    <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                  </div>
                  <Button onClick={handleCreate} disabled={creating} className="w-full">
                    {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Generate Token
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter by partner */}
        <div className="max-w-xs">
          <Select value={filterPartner} onValueChange={(v) => { setFilterPartner(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Filter by partner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partners</SelectItem>
              {partners.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No tokens found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.token_display}</TableCell>
                      <TableCell className="font-medium">{t.partner_name}</TableCell>
                      <TableCell>{t.uses_count}{t.max_uses ? `/${t.max_uses}` : "/∞"}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === "active" ? "default" : "destructive"}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.expires_at ? format(new Date(t.expires_at), "MMM d, yyyy") : "Never"}</TableCell>
                      <TableCell>{format(new Date(t.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => viewUsage(t.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {t.status === "active" && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => revokeToken(t.id)}>
                              <X className="w-4 h-4" />
                            </Button>
                          )}
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

        {/* Usage History Dialog */}
        <Dialog open={usageOpen !== null} onOpenChange={() => setUsageOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Token Usage History</DialogTitle>
            </DialogHeader>
            {usageLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : usageData.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No usage yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageData.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.client_name}</TableCell>
                      <TableCell>{format(new Date(u.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </VoipLayout>
  );
}
