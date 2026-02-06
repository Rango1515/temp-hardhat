import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Loader2 } from "lucide-react";

interface UserPerf {
  userId: number;
  name: string;
  leadsRequested: number;
  leadsCompleted: number;
  completionRate: number;
  totalCalls: number;
  appointmentsCreated: number;
}

interface UserPerformanceTableProps {
  users: UserPerf[];
  isLoading: boolean;
}

export function UserPerformanceTable({ users, isLoading }: UserPerformanceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Performance
        </CardTitle>
        <CardDescription>Individual worker stats</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No user data yet</p>
        ) : (
          <div className="overflow-auto max-h-80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Leads Req.</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Appts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-right">{u.leadsRequested}</TableCell>
                    <TableCell className="text-right">{u.leadsCompleted}</TableCell>
                    <TableCell className="text-right">{u.completionRate}%</TableCell>
                    <TableCell className="text-right">{u.totalCalls}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">{u.appointmentsCreated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}