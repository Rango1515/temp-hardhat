import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Phone, CheckCircle, AlertTriangle, MessageSquare, Target, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FULL_SCRIPT = `Cold Call Script — Hardhat Hosting

INTRO
"Hey, is this the owner? Perfect — my name's ___ with Hardhat Hosting. I'll be quick."

REASON
"I noticed your business online and wanted to see if you're currently happy with your website / online presence."

VALUE
"We build and manage contractor websites that bring in more calls — hosting, updates, and support included."

HOOK QUESTION
"Are you getting enough calls/leads from your current setup?"

OFFER
"If you're open to it, I can show you a quick demo and pricing — takes 10 minutes on Zoom."

CLOSE
"What day works better, today or tomorrow?"

OBJECTION HANDLING

"Not interested"
→ "Totally fair — are you against improving the website, or just busy right now?"

"Too expensive"
→ "What are you currently spending on marketing? This is usually less than 1 missed job."

"We already have a website"
→ "Nice — is it generating calls consistently? If not, we can improve it."

GOAL: Book appointment, not sell on phone.
Always be respectful and follow DNC rules.`;

export default function HowTo() {
  const { toast } = useToast();

  const copyScript = () => {
    navigator.clipboard.writeText(FULL_SCRIPT);
    toast({
      title: "Script Copied!",
      description: "The full cold call script has been copied to your clipboard.",
    });
  };

  return (
    <VoipLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Phone className="w-7 h-7" />
            How To Call
          </h1>
          <p className="text-muted-foreground">Your guide to making effective cold calls</p>
        </div>

        {/* Quick Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Before You Call
            </CardTitle>
            <CardDescription>Quick checklist for every call</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                Select your lead type and click <strong>Request Next Lead</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                Click <strong>Copy Number</strong> and paste into TextNow
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                Follow the script below — keep it natural
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                Log the <strong>outcome</strong> when the call is done
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">5</span>
                If interested → <strong>book an appointment</strong>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Cold Call Script */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Cold Call Script
                </CardTitle>
                <CardDescription>Follow this structure — adapt to your style</CardDescription>
              </div>
              <Button onClick={copyScript} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy Script
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-2">Intro</Badge>
              <p className="text-sm italic bg-muted/50 p-3 rounded-lg">
                "Hey, is this the owner? Perfect — my name's ___ with Hardhat Hosting. I'll be quick."
              </p>
            </div>

            <div>
              <Badge variant="outline" className="mb-2">Reason</Badge>
              <p className="text-sm italic bg-muted/50 p-3 rounded-lg">
                "I noticed your business online and wanted to see if you're currently happy with your website / online presence."
              </p>
            </div>

            <div>
              <Badge variant="outline" className="mb-2">Value</Badge>
              <p className="text-sm italic bg-muted/50 p-3 rounded-lg">
                "We build and manage contractor websites that bring in more calls — hosting, updates, and support included."
              </p>
            </div>

            <div>
              <Badge variant="outline" className="mb-2">Hook Question</Badge>
              <p className="text-sm italic bg-muted/50 p-3 rounded-lg">
                "Are you getting enough calls/leads from your current setup?"
              </p>
            </div>

            <div>
              <Badge variant="outline" className="mb-2">Offer</Badge>
              <p className="text-sm italic bg-muted/50 p-3 rounded-lg">
                "If you're open to it, I can show you a quick demo and pricing — takes 10 minutes on Zoom."
              </p>
            </div>

            <div>
              <Badge variant="outline" className="mb-2">Close</Badge>
              <p className="text-sm italic bg-muted/50 p-3 rounded-lg">
                "What day works better, today or tomorrow?"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Objection Handling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Objection Handling
            </CardTitle>
            <CardDescription>Common pushbacks and how to respond</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg border">
              <p className="text-sm font-medium text-destructive">"Not interested"</p>
              <p className="text-sm text-muted-foreground mt-1 italic">
                → "Totally fair — are you against improving the website, or just busy right now?"
              </p>
            </div>

            <div className="p-3 rounded-lg border">
              <p className="text-sm font-medium text-destructive">"Too expensive"</p>
              <p className="text-sm text-muted-foreground mt-1 italic">
                → "What are you currently spending on marketing? This is usually less than 1 missed job."
              </p>
            </div>

            <div className="p-3 rounded-lg border">
              <p className="text-sm font-medium text-destructive">"We already have a website"</p>
              <p className="text-sm text-muted-foreground mt-1 italic">
                → "Nice — is it generating calls consistently? If not, we can improve it."
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Pitch Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Pricing Pitch Guide
            </CardTitle>
            <CardDescription>Talking points for pricing conversations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Key Talking Points</p>
              <div className="space-y-1.5">
                <div className="p-3 rounded-lg bg-muted/50 text-sm italic">
                  "Our basic plan is $25/mo — includes hosting + support"
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm italic">
                  "If you want more pages or functionality, we offer $30/mo"
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm italic">
                  "For fully custom sites with ongoing support it's $50/mo"
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Pricing Objection Handlers</p>
              <div className="p-3 rounded-lg border">
                <p className="text-sm font-medium text-destructive">"Too cheap?"</p>
                <p className="text-sm text-muted-foreground mt-1 italic">
                  → "We keep prices low by focusing on great service and scalable hosting."
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-sm font-medium text-destructive">"Too expensive?"</p>
                <p className="text-sm text-muted-foreground mt-1 italic">
                  → "Compare to average $79/mo retainers — ours is cheaper with same support."
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm">
                <strong>Market Context:</strong> Industry average for monthly website maintenance is $29–$79/mo. Our pricing is at the low end with full support included.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Goal + DNC */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Remember
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong>Goal:</strong> Book the appointment, not sell on the phone. Get them on Zoom.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong>DNC Rules:</strong> Always be respectful. If they say "Do Not Call," mark as DNC immediately and move on.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </VoipLayout>
  );
}
