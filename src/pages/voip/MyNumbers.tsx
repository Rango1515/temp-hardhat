import { useEffect, useState } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface PhoneNumber {
  id: number;
  phone_number: string;
  friendly_name: string | null;
  location_city: string | null;
  location_state: string | null;
  status: string;
  number_type: string;
  monthly_cost: number;
}

interface NumberRequest {
  id: number;
  area_code: string | null;
  city_preference: string | null;
  number_type: string;
  business_name: string;
  status: string;
  created_at: string;
}

export default function MyNumbers() {
  const { apiCall } = useVoipApi();
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [requests, setRequests] = useState<NumberRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const [numbersRes, requestsRes] = await Promise.all([
        apiCall<{ numbers: PhoneNumber[] }>("voip-numbers", { params: { action: "my-numbers" } }),
        apiCall<{ requests: NumberRequest[] }>("voip-numbers", { params: { action: "my-requests" } }),
      ]);

      if (numbersRes.data) setNumbers(numbersRes.data.numbers);
      if (requestsRes.data) setRequests(requestsRes.data.requests);
      
      setIsLoading(false);
    };

    fetchData();
  }, [apiCall]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      assigned: "bg-primary/10 text-primary",
      pending: "bg-yellow-500/10 text-yellow-600",
      approved: "bg-primary/10 text-primary",
      denied: "bg-destructive/10 text-destructive",
      fulfilled: "bg-primary/10 text-primary",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-muted text-muted-foreground"}`}>
        {status}
      </span>
    );
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Numbers</h1>
            <p className="text-muted-foreground">Manage your phone numbers</p>
          </div>
          <Button asChild>
            <Link to="/voip/request-number">
              <Plus className="w-4 h-4 mr-2" />
              Request Number
            </Link>
          </Button>
        </div>

        {/* Assigned Numbers */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Numbers</CardTitle>
            <CardDescription>Phone numbers assigned to your account</CardDescription>
          </CardHeader>
          <CardContent>
            {numbers.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No numbers assigned yet</p>
                <Button variant="outline" asChild>
                  <Link to="/voip/request-number">Request Your First Number</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {numbers.map((number) => (
                  <div
                    key={number.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-mono font-medium text-lg">{number.phone_number}</p>
                          {number.friendly_name && (
                            <p className="text-sm text-muted-foreground">{number.friendly_name}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(number.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {number.location_city && number.location_state
                          ? `${number.location_city}, ${number.location_state}`
                          : "Unknown location"}
                      </div>
                      <span className="capitalize">{number.number_type}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monthly</span>
                      <span className="font-medium">${number.monthly_cost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Number Requests */}
        {requests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Number Requests</CardTitle>
              <CardDescription>Your pending and past number requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{request.business_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.area_code ? `Area code: ${request.area_code}` : "Any area code"}
                        {request.city_preference && ` · ${request.city_preference}`}
                        {` · ${request.number_type}`}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </VoipLayout>
  );
}
