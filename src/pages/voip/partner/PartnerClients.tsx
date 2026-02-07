import { useState, useEffect, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { format } from "date-fns";

interface Client {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
  totalCalls: number;
  totalAppointments: number;
}

interface ClientDetail {
  client: { id: number; name: string; email: string; status: string; created_at: string };
  recentCalls: Array<{ id: number; to_number: string; outcome: string; duration_seconds: number; start_time: string }>;
  revenue: Array<{ id: number; amount: number; type: string; created_at: string }>;
}

export default function PartnerClients() {
  const { apiCall } = useVoipApi();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const result = await apiCall<{ clients: Client[]; pagination: { total: number } }>("voip-partner", {
      params: { action: "my-clients", page: String(page), limit: "20" },
    });
    if (result.data) {
      setClients(result.data.clients);
      setTotal(result.data.pagination.total);
    }
    setLoading(false);
  }, [apiCall, page]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const viewClient = async (clientId: number) => {
    setDetailLoading(true);
    const result = await apiCall<ClientDetail>("voip-partner", {
      params: { action: "client-detail", clientId: String(clientId) },
    });
    if (result.data) setSelectedClient(result.data);
    setDetailLoading(false);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Clients</h1>
          <p className="text-muted-foreground">Clients who signed up through your referral links</p>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No clients yet. Share your invite token to get started!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signed Up</TableHead>
                    <TableHead>Calls</TableHead>
                    <TableHead>Appointments</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-muted-foreground">{client.email}</TableCell>
                      <TableCell>
                        <Badge variant={client.status === "active" ? "default" : "secondary"}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(client.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{client.totalCalls}</TableCell>
                      <TableCell>{client.totalAppointments}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => viewClient(client.id)}>
                          <Eye className="w-4 h-4" />
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

        {/* Client Detail Dialog */}
        <Dialog open={!!selectedClient || detailLoading} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedClient?.client.name || "Client Details"}</DialogTitle>
            </DialogHeader>
            {detailLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : selectedClient && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedClient.client.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={selectedClient.client.status === "active" ? "default" : "secondary"}>
                      {selectedClient.client.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Signed Up</p>
                    <p className="font-medium">{format(new Date(selectedClient.client.created_at), "MMM d, yyyy")}</p>
                  </div>
                </div>

                {selectedClient.recentCalls.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Recent Calls</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Number</TableHead>
                          <TableHead>Outcome</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedClient.recentCalls.map((call) => (
                          <TableRow key={call.id}>
                            <TableCell>{call.to_number}</TableCell>
                            <TableCell>{call.outcome || "—"}</TableCell>
                            <TableCell>{call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : "—"}</TableCell>
                            <TableCell>{call.start_time ? format(new Date(call.start_time), "MMM d, HH:mm") : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {selectedClient.revenue.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Revenue Events</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedClient.revenue.map((rev) => (
                          <TableRow key={rev.id}>
                            <TableCell className="capitalize">{rev.type}</TableCell>
                            <TableCell>${Number(rev.amount).toFixed(2)}</TableCell>
                            <TableCell>{format(new Date(rev.created_at), "MMM d, yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </VoipLayout>
  );
}
