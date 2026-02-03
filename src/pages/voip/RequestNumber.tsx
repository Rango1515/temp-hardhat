import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RequestNumber() {
  const navigate = useNavigate();
  const { apiCall } = useVoipApi();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    areaCode: "",
    cityPreference: "",
    numberType: "local",
    businessName: "",
    businessWebsite: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName.trim()) {
      toast({
        title: "Business Name Required",
        description: "Please enter your business name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const result = await apiCall("voip-numbers", {
      method: "POST",
      params: { action: "request" },
      body: formData,
    });

    if (result.error) {
      toast({
        title: "Request Failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request Submitted",
        description: "We'll review your request and get back to you soon",
      });
      navigate("/voip/numbers");
    }

    setIsLoading(false);
  };

  return (
    <VoipLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Request a Phone Number</CardTitle>
            <CardDescription>
              Fill out this form to request a new phone number for your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Your Business Inc."
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessWebsite">Business Website</Label>
                  <Input
                    id="businessWebsite"
                    type="url"
                    placeholder="https://yourbusiness.com"
                    value={formData.businessWebsite}
                    onChange={(e) => setFormData({ ...formData, businessWebsite: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="numberType">Number Type</Label>
                  <Select
                    value={formData.numberType}
                    onValueChange={(value) => setFormData({ ...formData, numberType: value })}
                    disabled={isLoading}
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
                  <Label htmlFor="areaCode">Preferred Area Code</Label>
                  <Input
                    id="areaCode"
                    placeholder="909"
                    maxLength={3}
                    value={formData.areaCode}
                    onChange={(e) => setFormData({ ...formData, areaCode: e.target.value.replace(/\D/g, "") })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cityPreference">City Preference</Label>
                  <Input
                    id="cityPreference"
                    placeholder="Rancho Cucamonga"
                    value={formData.cityPreference}
                    onChange={(e) => setFormData({ ...formData, cityPreference: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Why do you need this number?</Label>
                <Textarea
                  id="reason"
                  placeholder="Tell us about your business and how you plan to use this number..."
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </VoipLayout>
  );
}
