 import { useState, useEffect, useCallback } from "react";
 import { VoipLayout } from "@/components/voip/layout/VoipLayout";
 import { useVoipAuth } from "@/contexts/VoipAuthContext";
 import { useVoipApi } from "@/hooks/useVoipApi";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Separator } from "@/components/ui/separator";
 import { Switch } from "@/components/ui/switch";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { User, Shield, Loader2, Palette, Bell } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 
 interface Preferences {
   theme: "dark" | "light" | "system";
   accent_color: string;
   notifications_enabled: boolean;
   sound_enabled: boolean;
 }
 
 export default function Settings() {
   const { user, logout } = useVoipAuth();
   const { apiCall } = useVoipApi();
   const { toast } = useToast();
   const [isLoading, setIsLoading] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
 
   const [preferences, setPreferences] = useState<Preferences>({
     theme: "dark",
     accent_color: "orange",
     notifications_enabled: true,
     sound_enabled: true,
   });
 
   const fetchPreferences = useCallback(async () => {
     setIsLoading(true);
     const result = await apiCall<{ preferences: Preferences }>("voip-preferences", {
       params: { action: "get" },
     });
 
     if (result.data) {
       setPreferences(result.data.preferences);
       // Apply theme immediately
       applyTheme(result.data.preferences.theme);
     }
     setIsLoading(false);
   }, [apiCall]);
 
   useEffect(() => {
     fetchPreferences();
   }, [fetchPreferences]);
 
   const applyTheme = (theme: string) => {
     const root = document.documentElement;
     if (theme === "light") {
       root.classList.add("light");
       root.classList.remove("dark");
     } else if (theme === "dark") {
       root.classList.add("dark");
       root.classList.remove("light");
     } else {
       // System preference
       if (window.matchMedia("(prefers-color-scheme: light)").matches) {
         root.classList.add("light");
         root.classList.remove("dark");
       } else {
         root.classList.add("dark");
         root.classList.remove("light");
       }
     }
   };
 
   const handleSavePreferences = async () => {
     setIsSaving(true);
 
     const result = await apiCall("voip-preferences", {
       method: "POST",
       params: { action: "save" },
       body: {
         theme: preferences.theme,
         accentColor: preferences.accent_color,
         notificationsEnabled: preferences.notifications_enabled,
         soundEnabled: preferences.sound_enabled,
       },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       toast({ title: "Settings Saved", description: "Your preferences have been updated" });
       applyTheme(preferences.theme);
     }
 
     setIsSaving(false);
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
       <div className="max-w-2xl mx-auto space-y-6">
         <div>
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
           <p className="text-muted-foreground">Manage your account settings</p>
         </div>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <User className="w-5 h-5" />
               Profile Information
             </CardTitle>
             <CardDescription>Your account details</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label>Full Name</Label>
               <Input value={user?.name || ""} disabled className="bg-muted" />
             </div>
 
             <div className="space-y-2">
               <Label>Email Address</Label>
               <Input value={user?.email || ""} disabled className="bg-muted" />
               <p className="text-xs text-muted-foreground">
                 Contact support to change your email address
               </p>
             </div>
 
             <div className="space-y-2">
               <Label>Role</Label>
               <Input value={user?.role || "client"} disabled className="bg-muted capitalize" />
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Palette className="w-5 h-5" />
               Appearance
             </CardTitle>
             <CardDescription>Customize how the app looks</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
               <div>
                 <Label>Theme</Label>
                 <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
               </div>
               <Select
                 value={preferences.theme}
                 onValueChange={(v) => {
                   setPreferences({ ...preferences, theme: v as Preferences["theme"] });
                   applyTheme(v);
                 }}
               >
                 <SelectTrigger className="w-32">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="dark">Dark</SelectItem>
                   <SelectItem value="light">Light</SelectItem>
                   <SelectItem value="system">System</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Bell className="w-5 h-5" />
               Notifications
             </CardTitle>
             <CardDescription>Manage notification preferences</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
               <div>
                 <Label>Push Notifications</Label>
                 <p className="text-sm text-muted-foreground">Receive notifications in browser</p>
               </div>
               <Switch
                 checked={preferences.notifications_enabled}
                 onCheckedChange={(v) =>
                   setPreferences({ ...preferences, notifications_enabled: v })
                 }
               />
             </div>
 
             <Separator />
 
             <div className="flex items-center justify-between">
               <div>
                 <Label>Sound Effects</Label>
                 <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
               </div>
               <Switch
                 checked={preferences.sound_enabled}
                 onCheckedChange={(v) => setPreferences({ ...preferences, sound_enabled: v })}
               />
             </div>
 
             <Button onClick={handleSavePreferences} disabled={isSaving} className="w-full">
               {isSaving ? (
                 <>
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   Saving...
                 </>
               ) : (
                 "Save Preferences"
               )}
             </Button>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Shield className="w-5 h-5" />
               Security
             </CardTitle>
             <CardDescription>Account security options</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium">Password</p>
                 <p className="text-sm text-muted-foreground">Contact support to change</p>
               </div>
               <Button variant="outline" disabled>
                 Change Password
               </Button>
             </div>
           </CardContent>
         </Card>
 
         <Card className="border-destructive/50">
           <CardHeader>
             <CardTitle className="text-destructive">Danger Zone</CardTitle>
             <CardDescription>Irreversible actions</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium">Sign Out</p>
                 <p className="text-sm text-muted-foreground">Sign out from all devices</p>
               </div>
               <Button variant="destructive" onClick={logout}>
                 Sign Out
               </Button>
             </div>
           </CardContent>
         </Card>
       </div>
     </VoipLayout>
   );
 }
