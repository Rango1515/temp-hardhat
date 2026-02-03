import { useEffect, useState } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface Call {
  id: number;
  from_number: string;
  to_number: string;
  direction: string;
  duration_seconds: number;
  start_time: string;
  status: string;
  cost: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CallHistory() {
  const { apiCall } = useVoipApi();
  const [calls, setCalls] = useState<Call[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCalls = async () => {
      setIsLoading(true);
      
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: "15",
      };
      
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const result = await apiCall<{ calls: Call[]; pagination: Pagination }>("voip-calls", {
        params,
      });

      if (result.data) {
        setCalls(result.data.calls);
        setPagination(result.data.pagination);
      }
      
      setIsLoading(false);
    };

    fetchCalls();
  }, [apiCall, currentPage, statusFilter]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusIcon = (status: string, direction: string) => {
    if (status === "completed") {
      return direction === "inbound" ? (
        <PhoneIncoming className="w-4 h-4 text-primary" />
      ) : (
        <PhoneOutgoing className="w-4 h-4 text-primary" />
      );
    }
    return <PhoneMissed className="w-4 h-4 text-destructive" />;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-primary/10 text-primary",
      failed: "bg-destructive/10 text-destructive",
      no_answer: "bg-muted text-muted-foreground",
      busy: "bg-muted text-muted-foreground",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.failed}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Call History</h1>
            <p className="text-muted-foreground">View your recent calls</p>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Calls</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="no_answer">No Answer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>
              {pagination ? `${pagination.total} total calls` : "Loading..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : calls.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No calls yet</p>
                <p className="text-sm text-muted-foreground">
                  Start dialing to see your call history
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map((call) => (
                        <TableRow key={call.id}>
                          <TableCell>
                            {getStatusIcon(call.status, call.direction)}
                          </TableCell>
                          <TableCell className="font-mono">
                            {call.direction === "outbound" ? call.to_number : call.from_number}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(call.start_time), "MMM d, yyyy h:mm a")}
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatDuration(call.duration_seconds)}
                          </TableCell>
                          <TableCell>{getStatusBadge(call.status)}</TableCell>
                          <TableCell className="text-right font-mono">
                            ${call.cost.toFixed(4)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= pagination.totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </VoipLayout>
  );
}
