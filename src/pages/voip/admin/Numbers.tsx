import { useEffect, useState } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Plus, Loader2, Edit, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhoneNumber {
  id: number;
  phone_number: string;
  friendly_name: string | null;
  location_city: string | null;
  location_state: string | null;
  owner_id: number | null;
  owner_name: string | null;
  owner_email: string | null;
  status: string;
  number_type: string;
  monthly_cost: number;
}

interface UserOption {
  id: number;
  name: string;
  email: string;
}

export default function AdminNumbers() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newNumber, setNewNumber] = useState({
    phoneNumber: "",
    friendlyName: "",
    city: "",
    state: "",
    numberType: "local",
    monthlyCost: "0",
  });

  // Edit dialog
  const [editingNumber, setEditingNumber] = useState<PhoneNumber | null>(null);
  const [editOwnerId, setEditOwnerId] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);

    const params: Record<string, string> = { action: "numbers" };
    if (statusFilter !== "all") params.status = statusFilter;

    const [numbersRes, usersRes] = await Promise.all([
      apiCall<{ numbers: PhoneNumber[] }>("voip-admin", { params }),
      apiCall<{ users: UserOption[] }>("voip-admin", { params: { action: "users", limit: "100" } }),
    ]);

    if (numbersRes.data) setNumbers(numbersRes.data.numbers);
    if (usersRes.data) setUsers(usersRes.data.users);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [apiCall, statusFilter]);

  const handleCreate = async () => {
    if (!newNumber.phoneNumber) {
      toast({
        title: "Phone Number Required",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    const result = await apiCall("voip-admin", {
      method: "POST",
      params: { action: "numbers" },
      body: newNumber,
    });

    if (result.error) {
      toast({
        title: "Creation Failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Number Created",
        description: "Phone number has been added",
      });
      setCreateOpen(false);
      setNewNumber({
        phoneNumber: "",
        friendlyName: "",
        city: "",
        state: "",
        numberType: "local",
        monthlyCost: "0",
      });
      fetchData();
    }

    setIsCreating(false);
  };

  const handleEdit = (number: PhoneNumber) => {
    setEditingNumber(number);
    setEditOwnerId(number.owner_id?.toString() || "none");
    setEditStatus(number.status);
  };

  const handleSave = async () => {
    if (!editingNumber) return;

    setIsSaving(true);

    const result = await apiCall("voip-admin", {
      method: "PATCH",
      params: { action: "numbers", id: editingNumber.id.toString() },
      body: {
        ownerId: editOwnerId === "none" ? null : parseInt(editOwnerId),
        status: editStatus,
      },
    });

    if (result.error) {
      toast({
        title: "Update Failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Number Updated",
      });
      setEditingNumber(null);
      fetchData();
    }

    setIsSaving(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      available: "bg-primary/10 text-primary",
      assigned: "bg-blue-500/10 text-blue-600",
      pending: "bg-yellow-500/10 text-yellow-600",
      suspended: "bg-destructive/10 text-destructive",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-muted text-muted-foreground"}`}>
        {status}
      </span>
    );
  };

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Phone Numbers</h1>
            <p className="text-muted-foreground">Manage number inventory</p>
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Number
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Phone Number</DialogTitle>
                  <DialogDescription>Add a new phone number to inventory</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+19096874971"
                      value={newNumber.phoneNumber}
                      onChange={(e) => setNewNumber({ ...newNumber, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="friendlyName">Friendly Name</Label>
                    <Input
                      id="friendlyName"
                      placeholder="Main Office Line"
                      value={newNumber.friendlyName}
                      onChange={(e) => setNewNumber({ ...newNumber, friendlyName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Rancho Cucamonga"
                        value={newNumber.city}
                        onChange={(e) => setNewNumber({ ...newNumber, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="CA"
                        value={newNumber.state}
                        onChange={(e) => setNewNumber({ ...newNumber, state: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Number Type</Label>
                      <Select
                        value={newNumber.numberType}
                        onValueChange={(v) => setNewNumber({ ...newNumber, numberType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="toll_free">Toll Free</SelectItem>
                          <SelectItem value="mobile">Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost">Monthly Cost ($)</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={newNumber.monthlyCost}
                        onChange={(e) => setNewNumber({ ...newNumber, monthlyCost: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Number"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Number Inventory
            </CardTitle>
            <CardDescription>{numbers.length} numbers</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : numbers.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No phone numbers yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {numbers.map((number) => (
                      <TableRow key={number.id}>
                        <TableCell className="font-mono font-medium">
                          {number.phone_number}
                        </TableCell>
                        <TableCell>{number.friendly_name || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {number.location_city && number.location_state
                            ? `${number.location_city}, ${number.location_state}`
                            : "-"}
                        </TableCell>
                        <TableCell className="capitalize">{number.number_type}</TableCell>
                        <TableCell>{getStatusBadge(number.status)}</TableCell>
                        <TableCell>
                          {number.owner_name ? (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" />
                              <span className="text-sm">{number.owner_name}</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${number.monthly_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(number)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingNumber} onOpenChange={() => setEditingNumber(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Number</DialogTitle>
              <DialogDescription>{editingNumber?.phone_number}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Assign To User</Label>
                <Select value={editOwnerId} onValueChange={setEditOwnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingNumber(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </VoipLayout>
  );
}
