import { useState, useEffect, useCallback } from "react";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PartnerSettings {
  id?: number;
  commission_rate: number;
  bonus_type: string;
  bonus_value: number;
  bonus_enabled: boolean;
  apply_bonus_once_per_client: boolean;
}

export function PartnerSettingsCard() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PartnerSettings>({
    commission_rate: 0.05,
    bonus_type: "flat_amount",
    bonus_value: 0,
    bonus_enabled: false,
    apply_bonus_once_per_client: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const result = await apiCall<PartnerSettings>("voip-partner-admin", {
      params: { action: "partner-settings" },
    });
    if (result.data && result.data.id) {
      setSettings(result.data);
    }
    setLoading(false);
  }, [apiCall]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    const result = await apiCall("voip-partner-admin", {
      method: "POST",
      params: { action: "partner-settings" },
      body: {
        commissionRate: settings.commission_rate,
        bonusType: settings.bonus_type,
        bonusValue: settings.bonus_value,
        bonusEnabled: settings.bonus_enabled,
        applyBonusOncePerClient: settings.apply_bonus_once_per_client,
      },
    });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Settings saved", description: "Partner program settings updated successfully" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Partner Program Settings</CardTitle>
            <CardDescription>Configure commission rates and bonus rules</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Commission Rate */}
        <div className="space-y-2">
          <Label>Commission Rate (%)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={(settings.commission_rate * 100).toFixed(1)}
              onChange={(e) => setSettings(s => ({ ...s, commission_rate: parseFloat(e.target.value) / 100 || 0 }))}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">
              Partners earn {(settings.commission_rate * 100).toFixed(1)}% on each revenue event
            </span>
          </div>
        </div>

        {/* Bonus Section */}
        <div className="border-t border-border pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Case-Close Bonus</Label>
              <p className="text-sm text-muted-foreground">Award a bonus when a partner's client closes their first case</p>
            </div>
            <Switch
              checked={settings.bonus_enabled}
              onCheckedChange={(v) => setSettings(s => ({ ...s, bonus_enabled: v }))}
            />
          </div>

          {settings.bonus_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label>Bonus Type</Label>
                <Select value={settings.bonus_type} onValueChange={(v) => setSettings(s => ({ ...s, bonus_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat_amount">Flat Amount ($)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bonus Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.bonus_value}
                  onChange={(e) => setSettings(s => ({ ...s, bonus_value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-2 col-span-full">
                <Switch
                  checked={settings.apply_bonus_once_per_client}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, apply_bonus_once_per_client: v }))}
                />
                <Label className="font-normal">Apply bonus only once per client</Label>
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
