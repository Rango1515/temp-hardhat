import { useState, useEffect } from "react";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Link2, Users, UserPlus, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ReferralClient {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

interface ReferralToken {
  id: number;
  token_code_display: string;
  token_code: string;
  max_uses: number | null;
  uses_count: number;
  status: string;
  created_at: string;
  clients: ReferralClient[];
}

interface ReferralStats {
  totalReferralLinks: number;
  totalSignups: number;
  totalClients: number;
  tokens: ReferralToken[];
  clients: ReferralClient[];
}

interface PartnerExpandedRowProps {
  partnerId: number;
  colSpan: number;
}

export function PartnerExpandedRow({ partnerId, colSpan }: PartnerExpandedRowProps) {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyClientId = (clientId: number) => {
    navigator.clipboard.writeText(String(clientId));
    setCopiedId(clientId);
    toast({ title: "Copied!", description: `Client ID ${clientId} copied to clipboard` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const result = await apiCall<ReferralStats>("voip-partner-admin", {
        params: { action: "partner-referral-stats", partnerId: String(partnerId) },
      });
      if (result.data) setStats(result.data);
      setLoading(false);
    };
    fetchStats();
  }, [partnerId, apiCall]);

  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="bg-muted/30">
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (!stats) return null;

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="bg-muted/30 p-0">
        <div className="px-6 py-4 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3">
              <Link2 className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Referral Links</p>
                <p className="text-lg font-bold text-foreground">{stats.totalReferralLinks}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3">
              <UserPlus className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Link Signups</p>
                <p className="text-lg font-bold text-foreground">{stats.totalSignups}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3">
              <Users className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Clients</p>
                <p className="text-lg font-bold text-foreground">{stats.totalClients}</p>
              </div>
            </div>
          </div>

          {/* Referral Links with Signups */}
          {stats.tokens.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Referral Links</h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Token</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Signups</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.tokens.map((token) => (
                      <>
                        <TableRow key={token.id}>
                          <TableCell className="font-mono text-xs">{token.token_code_display}</TableCell>
                          <TableCell>
                            <Badge variant={token.status === "active" ? "default" : "secondary"} className="text-xs">
                              {token.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {token.clients.length} signup{token.clients.length !== 1 ? "s" : ""}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(token.created_at), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                        {/* Show clients who signed up with this token */}
                        {token.clients.map((client) => (
                          <TableRow key={`client-${client.id}`} className="bg-muted/20">
                            <TableCell className="pl-8 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-muted-foreground">ID: {client.id}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={(e) => { e.stopPropagation(); copyClientId(client.id); }}
                                >
                                  {copiedId === client.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <span className="font-medium">{client.name}</span>
                              <span className="text-muted-foreground ml-2">{client.email}</span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={client.status === "active" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {client.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {format(new Date(client.created_at), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* All clients (including those who may not have a token record) */}
          {stats.clients.length > 0 && stats.tokens.length === 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">All Clients</h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.clients.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            <span className="font-mono">{c.id}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={(e) => { e.stopPropagation(); copyClientId(c.id); }}
                            >
                              {copiedId === c.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{c.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.email}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-xs">
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(c.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {stats.tokens.length === 0 && stats.clients.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No referral links or clients yet
            </p>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
