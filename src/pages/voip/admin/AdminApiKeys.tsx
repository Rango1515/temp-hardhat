import { useEffect, useState } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Key, Plus, Copy, Trash2, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ApiKey {
  id: number;
  name: string;
  key_prefix: string;
  permissions: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function AdminApiKeys() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("never");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(true);

  const fetchKeys = async () => {
    setIsLoading(true);
    const result = await apiCall<{ keys: ApiKey[] }>("voip-api-keys");
    if (result.data) setKeys(result.data.keys);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, [apiCall]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your API key",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    const expirationDays = newKeyExpiry === "never" ? null : parseInt(newKeyExpiry);

    const result = await apiCall<{ id: number; api_key: string }>("voip-api-keys", {
      method: "POST",
      body: { keyName: newKeyName, expirationDays },
    });

    if (result.error) {
      toast({
        title: "Failed to Create Key",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.data) {
      setNewKey(result.data.api_key);
      fetchKeys();
    }

    setIsCreating(false);
  };

  const handleRevoke = async (keyId: number) => {
    const result = await apiCall("voip-api-keys", {
      method: "DELETE",
      params: { id: keyId.toString() },
    });

    if (result.error) {
      toast({
        title: "Failed to Revoke Key",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "API Key Revoked",
        description: "The API key has been revoked",
      });
      fetchKeys();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const resetDialog = () => {
    setNewKeyName("");
    setNewKeyExpiry("never");
    setNewKey(null);
    setCreateDialogOpen(false);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">API Keys</h1>
            <p className="text-muted-foreground">Manage API access keys (Admin Only)</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setNewKey(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              {newKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>API Key Created</DialogTitle>
                    <DialogDescription>
                      Copy this key now. You won't be able to see it again!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="flex-1 font-mono text-sm break-all">
                        {showNewKey ? newKey : "•".repeat(newKey.length)}
                      </code>
                      <button
                        onClick={() => setShowNewKey(!showNewKey)}
                        className="p-2 hover:bg-background rounded"
                      >
                        {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(newKey)}
                        className="p-2 hover:bg-background rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 text-yellow-600 rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Make sure to copy this key. It won't be displayed again.</span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={resetDialog}>Done</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key for programmatic access
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName">Key Name</Label>
                      <Input
                        id="keyName"
                        placeholder="My App"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        disabled={isCreating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiration</Label>
                      <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry} disabled={isCreating}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Never</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Key"
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              System API keys for programmatic access. Maximum 5 active keys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {keys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No API keys yet</p>
                <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                  Create Your First Key
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Key className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <p className="font-mono text-sm text-muted-foreground">{key.key_prefix}...</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {format(new Date(key.created_at), "MMM d, yyyy")}
                          {key.expires_at && ` · Expires ${format(new Date(key.expires_at), "MMM d, yyyy")}`}
                          {key.last_used_at && ` · Last used ${format(new Date(key.last_used_at), "MMM d")}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRevoke(key.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </VoipLayout>
  );
}
