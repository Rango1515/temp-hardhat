import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { getCategoryLabel } from "@/lib/leadCategories";
import { cn } from "@/lib/utils";

interface CategoryStat {
  category: string;
  totalCalls: number;
  interested: number;
  appointments: number;
  interestedRate: number;
  appointmentRate: number;
  conversionRate: number;
}

interface CategoryPerformanceProps {
  data: CategoryStat[];
}

export function CategoryPerformance({ data }: CategoryPerformanceProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Best Performing Lead Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">No category data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Best Performing Lead Categories
        </CardTitle>
        <CardDescription>Performance breakdown by lead category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Interested</TableHead>
                <TableHead className="text-right">Appointments</TableHead>
                <TableHead className="text-right">Interest Rate</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((cat) => (
                <TableRow key={cat.category}>
                  <TableCell className="font-medium">{getCategoryLabel(cat.category)}</TableCell>
                  <TableCell className="text-right">{cat.totalCalls}</TableCell>
                  <TableCell className="text-right">{cat.interested}</TableCell>
                  <TableCell className="text-right">{cat.appointments}</TableCell>
                  <TableCell className="text-right">{cat.interestedRate}%</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-bold",
                        cat.conversionRate >= 15
                          ? "border-green-500 text-green-600"
                          : cat.conversionRate >= 5
                          ? "border-yellow-500 text-yellow-600"
                          : "border-red-500 text-red-600"
                      )}
                    >
                      {cat.conversionRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}