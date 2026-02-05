import { useState, useEffect, useMemo } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, List, Loader2, Phone, User, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
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
}

export default function Appointments() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [processingId, setProcessingId] = useState<number | null>(null);
   const [showTrashed, setShowTrashed] = useState(false);
   const [selectedIds, setSelectedIds] = useState<number[]>([]);
   const [trashedCount, setTrashedCount] = useState(0);

  useEffect(() => {
    fetchAppointments();
  }, []);
 
   useEffect(() => {
     fetchTrashedCount();
   }, []);
 
   const fetchTrashedCount = async () => {
     const result = await apiCall<{ count: number }>("voip-leads", {
       params: { action: "trashed-count", entityType: "appointments" },
     });
     if (result.data) {
       setTrashedCount(result.data.count);
     }
   };

  const fetchAppointments = async () => {
    setIsLoading(true);
    const result = await apiCall<{ appointments: Appointment[] }>("voip-leads", {
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
 
   useEffect(() => {
     fetchAppointments();
   }, [showTrashed]);
 
   const handleTrash = async (ids: number[]): Promise<boolean> => {
     const result = await apiCall("voip-leads", {
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
     const result = await apiCall("voip-leads", {
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
     const result = await apiCall("voip-leads", {
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
     const result = await apiCall("voip-leads", {
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
    const result = await apiCall<{ success: boolean }>("voip-leads", {
      method: "POST",
      params: { action: "update-appointment" },
      body: { appointmentId: id, status },
    });

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
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

  // Group appointments by date for calendar view
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((apt) => {
      const dateKey = format(new Date(apt.scheduled_at), "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(apt);
    });
    return map;
  }, [appointments]);

  // Get appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return appointmentsByDate.get(dateKey) || [];
  }, [selectedDate, appointmentsByDate]);

  // Days with appointments for calendar highlighting
  const daysWithAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.status === "scheduled")
      .map((a) => new Date(a.scheduled_at));
  }, [appointments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-600">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case "interested":
        return <Badge className="bg-green-600">Interested</Badge>;
      case "followup":
        return <Badge className="bg-orange-500">Follow-up</Badge>;
      case "manual":
        return <Badge variant="outline">Manual</Badge>;
      default:
        return null;
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
              View and manage all scheduled appointments
            </p>
          </div>
          <Button variant="outline" onClick={fetchAppointments}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

         {/* Trash Manager */}
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">
                    {appointments.filter((a) => 
                      a.status === "scheduled" && isToday(new Date(a.scheduled_at))
                    ).length}
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
        </div>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "calendar" | "list")}>
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
              {/* Calendar */}
              <Card>
                <CardContent className="pt-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md pointer-events-auto"
                    modifiers={{
                      hasAppointment: daysWithAppointments,
                    }}
                    modifiersClassNames={{
                      hasAppointment: "bg-primary/20 font-bold",
                    }}
                  />
                </CardContent>
              </Card>

              {/* Selected Date Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a Date"}
                  </CardTitle>
                  <CardDescription>
                    {selectedDateAppointments.length} appointment(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDateAppointments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No appointments on this date
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateAppointments
                        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                        .map((apt) => (
                          <div
                            key={apt.id}
                            className={cn(
                              "p-4 rounded-lg border",
                              apt.status === "cancelled" && "opacity-50"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {format(new Date(apt.scheduled_at), "h:mm a")}
                                  </span>
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
                                {apt.notes && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {apt.notes}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Set by: {apt.created_by_name || "Unknown"}
                                </p>
                              </div>
                              {apt.status === "scheduled" && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateStatus(apt.id, "completed")}
                                    disabled={processingId === apt.id}
                                  >
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateStatus(apt.id, "cancelled")}
                                    disabled={processingId === apt.id}
                                  >
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
                <CardDescription>
                  Sorted by date, most recent first
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Set By</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(apt.scheduled_at), "h:mm a")}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{apt.lead_name || "—"}</TableCell>
                              <TableCell className="font-mono">{apt.lead_phone}</TableCell>
                              <TableCell>{apt.created_by_name || "—"}</TableCell>
                              <TableCell>{getOutcomeBadge(apt.outcome)}</TableCell>
                              <TableCell>{getStatusBadge(apt.status)}</TableCell>
                              <TableCell className="text-right">
                                {apt.status === "scheduled" && (
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => updateStatus(apt.id, "completed")}
                                      disabled={processingId === apt.id}
                                    >
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => updateStatus(apt.id, "cancelled")}
                                      disabled={processingId === apt.id}
                                    >
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
        </Tabs>
      </div>
    </VoipLayout>
  );
}
