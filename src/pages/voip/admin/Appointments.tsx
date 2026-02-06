import { useState, useEffect, useMemo, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, List, Loader2, Phone, User, Clock, CheckCircle, XCircle, RefreshCw, Bell, Trash2, DollarSign } from "lucide-react";
import { format, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TrashManager } from "@/components/voip/admin/TrashManager";

interface Appointment {
  id: number;
  lead_id: number | null;
  lead_name: string | null;
  lead_phone: string;
  scheduled_at: string;
  notes: string | null;
  created_by_name: string | null;
  outcome: string | null;
  status: string;
  created_at: string;
  deleted_at: string | null;
  selected_plan: string | null;
  negotiated_price: string | null;
}

interface FollowUp {
  id: number;
  lead_id: number;
  lead_name: string;
  lead_phone: string;
  lead_company: string;
  lead_email: string;
  lead_website: string;
  caller_name: string;
  followup_at: string;
  followup_priority: string | null;
  followup_notes: string | null;
}

export default function Appointments() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowupsLoading, setIsFollowupsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list" | "followups">("calendar");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showTrashed, setShowTrashed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [trashedCount, setTrashedCount] = useState(0);
  const [deletingFollowupId, setDeletingFollowupId] = useState<number | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchFollowups();
  }, []);

  useEffect(() => {
    fetchTrashedCount();
  }, []);

  const fetchTrashedCount = async () => {
    const result = await apiCall<{ count: number }>("voip-leads-ext", {
      params: { action: "trashed-count", entityType: "appointments" },
    });
    if (result.data) {
      setTrashedCount(result.data.count);
    }
  };

  const fetchAppointments = async () => {
    setIsLoading(true);
    const result = await apiCall<{ appointments: Appointment[] }>("voip-leads-ext", {
      params: { action: "appointments", showTrashed: showTrashed.toString() },
    });
    if (result.data?.appointments) {
      setAppointments(
        showTrashed
          ? result.data.appointments.filter((a) => a.deleted_at)
          : result.data.appointments.filter((a) => !a.deleted_at)
      );
    }
    setIsLoading(false);
    setSelectedIds([]);
  };

  const fetchFollowups = useCallback(async () => {
    setIsFollowupsLoading(true);
    const result = await apiCall<{ followups: FollowUp[] }>("voip-leads", {
      params: { action: "followups" },
    });
    if (result.data?.followups) {
      setFollowups(result.data.followups);
    }
    setIsFollowupsLoading(false);
  }, [apiCall]);

  useEffect(() => {
    fetchAppointments();
  }, [showTrashed]);

  const handleTrash = async (ids: number[]): Promise<boolean> => {
    const result = await apiCall("voip-leads-ext", {
      method: "POST",
      params: { action: "trash-items" },
      body: { entityType: "appointments", ids },
    });
    if (!result.error) {
      fetchAppointments();
      fetchTrashedCount();
      return true;
    }
    return false;
  };

  const handleRestore = async (ids: number[]): Promise<boolean> => {
    const result = await apiCall("voip-leads-ext", {
      method: "POST",
      params: { action: "restore-items" },
      body: { entityType: "appointments", ids },
    });
    if (!result.error) {
      fetchAppointments();
      fetchTrashedCount();
      return true;
    }
    return false;
  };

  const handlePermanentDelete = async (ids: number[]): Promise<boolean> => {
    const result = await apiCall("voip-leads-ext", {
      method: "POST",
      params: { action: "permanent-delete" },
      body: { entityType: "appointments", ids, confirmation: "DELETE" },
    });
    if (!result.error) {
      fetchAppointments();
      fetchTrashedCount();
      return true;
    }
    return false;
  };

  const handleBulkAction = async (action: "older-7" | "older-30" | "older-90" | "all"): Promise<boolean> => {
    const result = await apiCall("voip-leads-ext", {
      method: "POST",
      params: { action: "bulk-delete" },
      body: { entityType: "appointments", bulkAction: action, confirmation: "DELETE" },
    });
    if (!result.error) {
      fetchAppointments();
      fetchTrashedCount();
      return true;
    }
    return false;
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === appointments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(appointments.map((a) => a.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const updateStatus = async (id: number, status: "completed" | "cancelled") => {
    setProcessingId(id);
    const result = await apiCall<{ success: boolean }>("voip-leads-ext", {
      method: "POST",
      params: { action: "update-appointment" },
      body: { appointmentId: id, status },
    });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({
        title: status === "completed" ? "Marked Complete" : "Cancelled",
        description: "Appointment status updated",
      });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    }
    setProcessingId(null);
  };

  const handleDeleteFollowup = async (callId: number) => {
    setDeletingFollowupId(callId);
    const result = await apiCall("voip-leads", {
      method: "POST",
      params: { action: "delete-followup" },
      body: { callId },
    });
    if (result.error) {
      toast({ title: "Delete Failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Follow-up Removed", description: "Scheduled follow-up has been deleted" });
      setFollowups(prev => prev.filter(f => f.id !== callId));
    }
    setDeletingFollowupId(null);
  };

  const handleClearAllFollowups = async () => {
    setIsClearingAll(true);
    const result = await apiCall("voip-leads", {
      method: "POST",
      params: { action: "clear-all-followups" },
    });
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "All Cleared", description: "All follow-up notifications have been cleared" });
      setFollowups([]);
    }
    setIsClearingAll(false);
  };

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((apt) => {
      const dateKey = format(new Date(apt.scheduled_at), "yyyy-MM-dd");
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(apt);
    });
    return map;
  }, [appointments]);

  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return appointmentsByDate.get(dateKey) || [];
  }, [selectedDate, appointmentsByDate]);

  const daysWithAppointments = useMemo(() => {
    return appointments.filter((a) => a.status === "scheduled").map((a) => new Date(a.scheduled_at));
  }, [appointments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge className="bg-blue-600">Scheduled</Badge>;
      case "completed": return <Badge className="bg-green-600">Completed</Badge>;
      case "cancelled": return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case "interested": return <Badge className="bg-green-600">Interested</Badge>;
      case "followup": return <Badge className="bg-orange-500">Follow-up</Badge>;
      case "manual": return <Badge variant="outline">Manual</Badge>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case "high": return <Badge variant="destructive">High</Badge>;
      case "medium": return <Badge className="bg-orange-500">Medium</Badge>;
      case "low": return <Badge variant="secondary">Low</Badge>;
      default: return null;
    }
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

  const upcomingAppointments = appointments
    .filter((a) => a.status === "scheduled" && new Date(a.scheduled_at) >= new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground">
              View and manage all scheduled appointments and follow-ups
            </p>
          </div>
          <Button variant="outline" onClick={() => { fetchAppointments(); fetchFollowups(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <TrashManager
          entityType="appointments"
          selectedIds={selectedIds}
          showTrashed={showTrashed}
          onToggleTrashed={() => setShowTrashed(!showTrashed)}
          onTrash={handleTrash}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
          onBulkAction={handleBulkAction}
          trashedCount={trashedCount}
        />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">
                    {appointments.filter((a) => a.status === "scheduled" && isToday(new Date(a.scheduled_at))).length}
                  </p>
                </div>
                <CalendarDays className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">
                    {appointments.filter((a) => a.status === "completed").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Follow-ups</p>
                  <p className="text-2xl font-bold">{followups.length}</p>
                </div>
                <Bell className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "calendar" | "list" | "followups")}>
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="followups" className="flex items-center gap-2 relative">
              <Bell className="w-4 h-4" />
              Follow-ups
              {followups.length > 0 && (
                <span className="ml-1 min-w-5 h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5">
                  {followups.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
              <Card>
                <CardContent className="pt-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md pointer-events-auto"
                    modifiers={{ hasAppointment: daysWithAppointments }}
                    modifiersClassNames={{ hasAppointment: "bg-primary/20 font-bold" }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a Date"}
                  </CardTitle>
                  <CardDescription>{selectedDateAppointments.length} appointment(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDateAppointments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No appointments on this date</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateAppointments
                        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                        .map((apt) => (
                          <div key={apt.id} className={cn("p-4 rounded-lg border", apt.status === "cancelled" && "opacity-50")}>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{format(new Date(apt.scheduled_at), "h:mm a")}</span>
                                  {getStatusBadge(apt.status)}
                                  {getOutcomeBadge(apt.outcome)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span>{apt.lead_name || "Unknown"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-mono">{apt.lead_phone}</span>
                                </div>
                                {apt.selected_plan && (
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{apt.selected_plan}</span>
                                  </div>
                                )}
                                {apt.negotiated_price && (
                                  <p className="text-sm text-muted-foreground">
                                    Negotiated: {apt.negotiated_price}
                                  </p>
                                )}
                                {apt.notes && <p className="text-sm text-muted-foreground mt-2">{apt.notes}</p>}
                                <p className="text-xs text-muted-foreground">Set by: {apt.created_by_name || "Unknown"}</p>
                              </div>
                              {apt.status === "scheduled" && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => updateStatus(apt.id, "completed")} disabled={processingId === apt.id}>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => updateStatus(apt.id, "cancelled")} disabled={processingId === apt.id}>
                                    <XCircle className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
                <CardDescription>Sorted by date, most recent first</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Set By</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No appointments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        appointments
                          .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
                          .map((apt) => (
                            <TableRow key={apt.id} className={apt.status === "cancelled" ? "opacity-50" : ""}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{format(new Date(apt.scheduled_at), "MMM d, yyyy")}</p>
                                  <p className="text-sm text-muted-foreground">{format(new Date(apt.scheduled_at), "h:mm a")}</p>
                                </div>
                              </TableCell>
                              <TableCell>{apt.lead_name || "—"}</TableCell>
                              <TableCell className="font-mono">{apt.lead_phone}</TableCell>
                              <TableCell className="text-sm max-w-[150px] truncate">{apt.selected_plan || "—"}</TableCell>
                              <TableCell>{apt.created_by_name || "—"}</TableCell>
                              <TableCell>{getOutcomeBadge(apt.outcome)}</TableCell>
                              <TableCell>{getStatusBadge(apt.status)}</TableCell>
                              <TableCell className="text-right">
                                {apt.status === "scheduled" && (
                                  <div className="flex justify-end gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => updateStatus(apt.id, "completed")} disabled={processingId === apt.id}>
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => updateStatus(apt.id, "cancelled")} disabled={processingId === apt.id}>
                                      <XCircle className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followups" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-orange-500" />
                      Scheduled Follow-ups ({followups.length})
                    </CardTitle>
                    <CardDescription>Calls that need to be made</CardDescription>
                  </div>
                  {followups.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleClearAllFollowups} disabled={isClearingAll}>
                      {isClearingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isFollowupsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : followups.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No scheduled follow-ups</p>
                ) : (
                  <div className="space-y-3">
                    {followups.map((fu) => (
                      <div key={fu.id} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{fu.lead_name || "Unknown"}</span>
                              {getPriorityBadge(fu.followup_priority)}
                            </div>
                            {fu.lead_company && fu.lead_company !== "Unknown" && (
                              <p className="text-sm text-muted-foreground">Company: {fu.lead_company}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono text-sm">{fu.lead_phone}</span>
                            </div>
                            {fu.lead_email && fu.lead_email !== "Unknown" && (
                              <p className="text-sm text-muted-foreground">Email: {fu.lead_email}</p>
                            )}
                            {fu.lead_website && fu.lead_website !== "Unknown" && (
                              <p className="text-sm text-muted-foreground">Website: {fu.lead_website}</p>
                            )}
                            <p className="text-sm text-muted-foreground">Assigned by: {fu.caller_name}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{format(new Date(fu.followup_at), "MMM d, yyyy 'at' h:mm a")}</span>
                            </div>
                            {fu.followup_notes && (
                              <p className="text-sm text-muted-foreground mt-1 italic">"{fu.followup_notes}"</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFollowup(fu.id)}
                            disabled={deletingFollowupId === fu.id}
                            className="text-destructive hover:text-destructive shrink-0"
                          >
                            {deletingFollowupId === fu.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </VoipLayout>
  );
}
