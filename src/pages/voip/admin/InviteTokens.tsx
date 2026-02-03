import { useState, useEffect } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Plus, Copy, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface InviteToken {
  id: number;
  token: string;
  email: string | null;
  expires_at: string | null;
  used: number;
  used_by: number | null;
  used_by_name: string | null;
  used_by_email: string | null;
  used_at: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export default function InviteTokens() {
  const { apiCall } = useVoipApi();
  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // New token form
  const [newEmail, setNewEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");

  const fetchTokens = async () => {
    setIsLoading(true);
    const { data, error } = await apiCall<{ tokens: InviteToken[] }>("voip-admin", {
      params: { action: "invite-tokens" },
    });

    if (data) {
      setTokens(data.tokens);
    } else {
      toast.error(error || "Failed to load invite tokens");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);

    const { data, error } = await apiCall<{ id: number; token: string }>("voip-admin", {
      method: "POST",
      params: { action: "invite-tokens" },
      body: {
        email: newEmail.trim() || null,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : null,
      },
    });

    if (data) {
      toast.success("Invite token created successfully");
      // Copy to clipboard
      await navigator.clipboard.writeText(data.token);
      toast.info("Token copied to clipboard");
      setDialogOpen(false);
      setNewEmail("");
      setExpiresInDays("");
      fetchTokens();
    } else {
      toast.error(error || "Failed to create token");
    }

    setIsCreating(false);
  };

  const handleCopy = async (token: string, id: number) => {
    await navigator.clipboard.writeText(token);
    setCopiedId(id);
    toast.success("Token copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: number) => {
    const { error } = await apiCall("voip-admin", {
      method: "DELETE",
      params: { action: "invite-tokens", id: id.toString() },
    });

    if (!error) {
      toast.success("Token deleted");
      fetchTokens();
    } else {
      toast.error(error || "Failed to delete token");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeTokens = tokens.filter((t) => !t.used);
  const usedTokens = tokens.filter((t) => t.used);

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invite Tokens</h1>
            <p className="text-muted-foreground">
              Generate tokens to allow new users to sign up
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invite Token</DialogTitle>
                <DialogDescription>
                  Generate a new invite token for user registration
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Restrict to Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to allow any email to use this token
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires">Expires In (Days)</Label>
                  <Input
                    id="expires"
                    type="number"
                    placeholder="7"
                    min="1"
                    max="365"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no expiration
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create & Copy Token"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Tokens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Active Tokens
            </CardTitle>
            <CardDescription>
              Tokens that haven't been used yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active tokens. Create one to invite users.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Restricted Email</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell className="font-mono text-sm">
                        {token.token.slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        {token.email || <span className="text-muted-foreground">Any</span>}
                      </TableCell>
                      <TableCell>
                        {token.expires_at ? (
                          new Date(token.expires_at) < new Date() ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            formatDate(token.expires_at)
                          )
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>{token.created_by_name}</TableCell>
                      <TableCell>{formatDate(token.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(token.token, token.id)}
                          >
                            {copiedId === token.id ? (
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(token.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Used Tokens */}
        {usedTokens.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Used Tokens
              </CardTitle>
              <CardDescription>
                Tokens that have been redeemed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Used By</TableHead>
                    <TableHead>Used At</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usedTokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {token.token.slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{token.used_by_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {token.used_by_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(token.used_at)}</TableCell>
                      <TableCell>{token.created_by_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </VoipLayout>
  );
}
