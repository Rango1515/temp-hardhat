import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Reply,
  Trash2,
  FolderInput,
  MailX,
  MailOpen,
  Paperclip,
  Download,
  ChevronLeft,
  AlertTriangle,
  Code,
  Forward,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { FullMessage, MailFolder } from "./types";
import { formatFullDate, formatSize, safeSubject, safeSender } from "./utils";
import { EmailBody } from "./EmailBody";

interface ReadingPaneProps {
  message: FullMessage | null;
  loading: boolean;
  loadError: string | null;
  folders: MailFolder[];
  activeFolder: string;
  onReply: () => void;
  onForward: () => void;
  onMarkUnread: (uid: number) => void;
  onMoveToTrash: (uid: number) => void;
  onDeleteForever: (uid: number) => void;
  onDownloadAttachment: (uid: number, index: number, filename: string) => void;
  onBack: () => void;
  onRetryLoad: () => void;
  debugMode: boolean;
}

function ReadingPaneSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3.5 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
      <div className="pt-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <div className="py-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="h-4 w-3/4" />
        <div className="py-2" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

function SelectMessagePlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <MailOpen className="w-16 h-16 mx-auto mb-3 opacity-15" />
        <p className="text-lg font-medium">Select a message to view</p>
        <p className="text-sm mt-1 text-muted-foreground/60">Choose a message from the list on the left</p>
      </div>
    </div>
  );
}

function LoadErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center px-6 max-w-sm">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive/60" />
        <p className="font-medium text-foreground mb-1">Failed to load email</p>
        <p className="text-sm text-muted-foreground/70 mb-4">{error}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1" /> Retry
        </Button>
      </div>
    </div>
  );
}

export function ReadingPane({
  message,
  loading,
  loadError,
  folders,
  activeFolder,
  onReply,
  onForward,
  onMarkUnread,
  onMoveToTrash,
  onDeleteForever,
  onDownloadAttachment,
  onBack,
  onRetryLoad,
  debugMode,
}: ReadingPaneProps) {
  const [showRawSource, setShowRawSource] = useState(false);
  const isTrashFolder = activeFolder.toLowerCase().includes("trash");

  if (loading) return <ReadingPaneSkeleton />;
  if (loadError) return <LoadErrorState error={loadError} onRetry={onRetryLoad} />;
  if (!message) return <SelectMessagePlaceholder />;

  const senderInitial = safeSender(message.from).charAt(0).toUpperCase();

  return (
    <>
      {/* Message header */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Mobile back button + subject */}
        <div className="flex items-start gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="md:hidden shrink-0 mt-0.5"
            onClick={onBack}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold flex-1 break-words leading-snug">
            {safeSubject(message.subject)}
          </h2>
        </div>

        {/* Sender info block */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            {senderInitial}
          </div>
          <div className="flex-1 min-w-0 text-sm">
            <p className="font-medium text-foreground truncate">{safeSender(message.from)}</p>
            <p className="text-muted-foreground text-xs">
              To: {message.to || "—"}
            </p>
            {message.cc && (
              <p className="text-muted-foreground text-xs">CC: {message.cc}</p>
            )}
            <p className="text-muted-foreground text-xs">
              {formatFullDate(message.date)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" onClick={onReply}>
            <Reply className="w-4 h-4 mr-1" /> Reply
          </Button>
          <Button size="sm" variant="outline" onClick={onForward}>
            <Forward className="w-4 h-4 mr-1" /> Forward
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMarkUnread(message.uid)}>
            <MailX className="w-4 h-4 mr-1" /> Unread
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMoveToTrash(message.uid)}>
            <FolderInput className="w-4 h-4 mr-1" /> Trash
          </Button>
          {isTrashFolder && (
            <Button size="sm" variant="destructive" onClick={() => onDeleteForever(message.uid)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete Forever
            </Button>
          )}
          {debugMode && (
            <Button
              size="sm"
              variant={showRawSource ? "secondary" : "ghost"}
              onClick={() => setShowRawSource(!showRawSource)}
              className="ml-auto"
            >
              <Code className="w-4 h-4 mr-1" /> {showRawSource ? "Hide Source" : "View Source"}
            </Button>
          )}
        </div>
      </div>

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <Paperclip className="w-4 h-4" />
            <span className="font-medium">{message.attachments.length} attachment{message.attachments.length > 1 ? "s" : ""}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <button
                key={att.index}
                onClick={() => onDownloadAttachment(message.uid, att.index, att.filename)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm group"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="truncate max-w-[150px] font-medium">{att.filename}</span>
                <span className="text-muted-foreground text-xs">({formatSize(att.size)})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Truncation warning */}
      {message.truncated && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-md bg-accent/50 border border-border text-muted-foreground text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-500" />
          <span>This email was too large to load fully. Some content may be truncated.</span>
        </div>
      )}

      {/* Message body */}
      <div className="flex-1 overflow-auto">
        <EmailBody message={message} showRawSource={showRawSource} />
      </div>
    </>
  );
}
