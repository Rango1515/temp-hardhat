import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Send, PenSquare, Loader2 } from "lucide-react";
import type { ComposeData } from "./types";

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compose: ComposeData;
  onComposeChange: (data: ComposeData) => void;
  onSend: () => Promise<void>;
  onSaveDraft: () => Promise<void>;
}

export function ComposeModal({
  open,
  onOpenChange,
  compose,
  onComposeChange,
  onSend,
  onSaveDraft,
}: ComposeModalProps) {
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await onSend();
    setSending(false);
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    await onSaveDraft();
    setSavingDraft(false);
  };

  const busy = sending || savingDraft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">From</label>
            <Input value="admin@hardhathosting.work" disabled className="bg-muted text-muted-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">To</label>
            <Input
              placeholder="recipient@example.com"
              value={compose.to}
              onChange={(e) => onComposeChange({ ...compose, to: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">CC</label>
            <Input
              placeholder="cc@example.com (optional)"
              value={compose.cc}
              onChange={(e) => onComposeChange({ ...compose, cc: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Subject</label>
            <Input
              placeholder="Subject"
              value={compose.subject}
              onChange={(e) => onComposeChange({ ...compose, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Message</label>
            <Textarea
              placeholder="Write your message..."
              value={compose.body}
              onChange={(e) => onComposeChange({ ...compose, body: e.target.value })}
              className="min-h-[200px]"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleSaveDraft} disabled={busy}>
            {savingDraft ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</>
            ) : (
              <><PenSquare className="w-4 h-4 mr-1" /> Save Draft</>
            )}
          </Button>
          <Button onClick={handleSend} disabled={busy}>
            {sending ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4 mr-1" /> Send</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
