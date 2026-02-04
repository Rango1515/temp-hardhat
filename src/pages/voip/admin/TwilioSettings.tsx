import { useState, useEffect } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Phone, Loader2, Save, TestTube, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TwilioConfig {
  account_sid: string;
  auth_token: string;
  outbound_number: string;
  is_active: boolean;
}

export default function TwilioSettings() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [config, setConfig] = useState<TwilioConfig>({
    account_sid: "",
    auth_token: "",
    outbound_number: "",
    is_active: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testNumber, setTestNumber] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const result = await apiCall<{ config: TwilioConfig }>("voip-twilio", {
        params: { action: "config" },
      });
      if (result.data?.config) {
        setConfig(result.data.config);
      }
      setIsLoading(false);
    };
    fetchConfig();
  }, [apiCall]);

  const handleChange = (field: keyof TwilioConfig, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await apiCall("voip-twilio", {
      method: "POST",
      params: { action: "config" },
      body: config,
    });

    if (result.error) {
      toast({
        title: "Save Failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Settings Saved",
        description: "Twilio configuration has been updated",
      });
      setHasChanges(false);
    }
    setIsSaving(false);
  };

  const handleTestCall = async () => {
    if (!testNumber || testNumber.length < 10) {
      toast({
        title: "Invalid Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    const result = await apiCall<{ success: boolean; message: string }>("voip-twilio", {
      method: "POST",
      params: { action: "test-call" },
      body: { toNumber: testNumber },
    });

    if (result.error) {
      toast({
        title: "Test Call Failed",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Test Call Initiated",
        description: result.data?.message || "Check your phone for an incoming call",
      });
    }
    setIsTesting(false);
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
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Twilio Settings</h1>
          <p className="text-muted-foreground">Configure Twilio for real phone calls</p>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Twilio Configuration
            </CardTitle>
            <CardDescription>
              Enter your Twilio credentials to enable real phone calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Twilio</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle to enable or disable Twilio integration
                </p>
              </div>
              <Switch
                checked={config.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account_sid">Account SID</Label>
                <Input
                  id="account_sid"
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={config.account_sid}
                  onChange={(e) => handleChange("account_sid", e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth_token">Auth Token</Label>
                <Input
                  id="auth_token"
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={config.auth_token}
                  onChange={(e) => handleChange("auth_token", e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Your auth token is encrypted and stored securely
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outbound_number">Outbound Number</Label>
                <Input
                  id="outbound_number"
                  type="tel"
                  placeholder="+15551234567"
                  value={config.outbound_number}
                  onChange={(e) => handleChange("outbound_number", e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  The phone number that will appear as the caller ID
                </p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Call */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Test Call
            </CardTitle>
            <CardDescription>
              Make a test call to verify your Twilio configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!config.is_active || !config.account_sid ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-muted text-muted-foreground">
                <Phone className="w-5 h-5" />
                <span>Configure and enable Twilio to make test calls</span>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="Enter phone number to call"
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    className="max-w-xs font-mono"
                  />
                  <Button onClick={handleTestCall} disabled={isTesting}>
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calling...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Make Test Call
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will initiate a real phone call to verify your configuration
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle
                  className={`w-5 h-5 ${config.account_sid ? "text-green-600" : "text-muted-foreground"}`}
                />
                <span className={config.account_sid ? "" : "text-muted-foreground"}>
                  Account SID configured
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle
                  className={`w-5 h-5 ${config.auth_token ? "text-green-600" : "text-muted-foreground"}`}
                />
                <span className={config.auth_token ? "" : "text-muted-foreground"}>
                  Auth Token configured
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle
                  className={`w-5 h-5 ${config.outbound_number ? "text-green-600" : "text-muted-foreground"}`}
                />
                <span className={config.outbound_number ? "" : "text-muted-foreground"}>
                  Outbound number configured
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle
                  className={`w-5 h-5 ${config.is_active ? "text-green-600" : "text-muted-foreground"}`}
                />
                <span className={config.is_active ? "" : "text-muted-foreground"}>
                  Twilio enabled
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </VoipLayout>
  );
}
