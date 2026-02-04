import { useEffect, useState, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Search, Loader2, ChevronLeft, ChevronRight, Edit, ChevronDown, Phone, Clock, PhoneOutgoing } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface UserCall {
  id: number;
  to_number: string;
  from_number: string;
  start_time: string;
  duration_seconds: number | null;
  outcome: string | null;
  status: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export default function AdminUsers() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());
  const [userCalls, setUserCalls] = useState<Map<number, UserCall[]>>(new Map());
  const [loadingCalls, setLoadingCalls] = useState<Set<number>>(new Set());

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);

    const params: Record<string, string> = {
      action: "users",
      page: currentPage.toString(),
      limit: "15",
    };

    if (search) params.search = search;

    const result = await apiCall<{ users: User[]; pagination: Pagination }>("voip-admin", {
      params,
    });

    if (result.data) {
      setUsers(result.data.users);
      setPagination(result.data.pagination);
    }

    setIsLoading(false);
  }, [apiCall, currentPage, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUserCalls = async (userId: number) => {
    if (userCalls.has(userId)) return;
    
    setLoadingCalls(prev => new Set(prev).add(userId));
    
    const result = await apiCall<{ calls: UserCall[] }>("voip-calls", {
      params: { action: "user-calls", userId: userId.toString() },
    });
    
    if (result.data) {
      setUserCalls(prev => new Map(prev).set(userId, result.data!.calls));
    }
    
    setLoadingCalls(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  };

  const toggleExpanded = (userId: number) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        fetchUserCalls(userId);
      }
      return next;
    });
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    setIsSaving(true);

    const result = await apiCall("voip-admin", {
      method: "PATCH",
      params: { action: "users", id: editingUser.id.toString() },
      body: { role: editRole, status: editStatus },
    });

    if (result.error) {
      toast({
        title: "Update Failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "User Updated",
        description: "User settings have been saved",
      });
      setEditingUser(null);
      fetchUsers();
    }

    setIsSaving(false);
  };

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null || seconds === undefined) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatOutcome = (outcome: string | null): string => {
    if (!outcome) return "—";
    return outcome.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-primary/10 text-primary",
      suspended: "bg-destructive/10 text-destructive",
      pending: "bg-yellow-500/10 text-yellow-600",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-muted text-muted-foreground"}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
        role === "admin" ? "bg-purple-500/10 text-purple-600" : "bg-muted text-muted-foreground"
      }`}>
        {role}
      </span>
    );
  };

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage all users and their call activity</p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-64"
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Users
            </CardTitle>
            <CardDescription>
              {pagination ? `${pagination.total} total users` : "Loading..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {users.map((user) => (
                    <Collapsible
                      key={user.id}
                      open={expandedUsers.has(user.id)}
                      onOpenChange={() => toggleExpanded(user.id)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getRoleBadge(user.role)}
                                {getStatusBadge(user.status)}
                              </div>
                              <p className="text-sm text-muted-foreground hidden sm:block">
                                {user.created_at
                                  ? format(new Date(user.created_at), "MMM d, yyyy")
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(user);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <ChevronDown className={cn("w-4 h-4 transition-transform", expandedUsers.has(user.id) && "rotate-180")} />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t px-4 py-3 bg-muted/30">
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <PhoneOutgoing className="w-4 h-4" />
                              Call History
                            </h4>
                            {loadingCalls.has(user.id) ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : (userCalls.get(user.id)?.length || 0) === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">No calls made by this user yet.</p>
                            ) : (
                              <div className="overflow-auto max-h-64">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>To Number</TableHead>
                                      <TableHead>Duration</TableHead>
                                      <TableHead>Outcome</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Date</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {userCalls.get(user.id)?.slice(0, 10).map((call) => (
                                      <TableRow key={call.id}>
                                        <TableCell className="font-mono text-sm">{call.to_number}</TableCell>
                                        <TableCell>
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(call.duration_seconds)}
                                          </span>
                                        </TableCell>
                                        <TableCell>{formatOutcome(call.outcome)}</TableCell>
                                        <TableCell>
                                          <span className={cn(
                                            "px-2 py-1 rounded-full text-xs capitalize",
                                            call.status === "completed" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                                          )}>
                                            {call.status}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                          {call.start_time ? format(new Date(call.start_time), "MMM d, h:mm a") : "—"}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                {(userCalls.get(user.id)?.length || 0) > 10 && (
                                  <p className="text-xs text-muted-foreground text-center py-2">
                                    Showing 10 of {userCalls.get(user.id)?.length} calls
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>

                {pagination && Math.ceil(pagination.total / pagination.limit) > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
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
                        disabled={currentPage >= Math.ceil(pagination.total / pagination.limit)}
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

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update role and status for {editingUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </VoipLayout>
  );
}
