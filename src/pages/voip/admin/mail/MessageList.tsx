import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Mail,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { MailHeader } from "./types";
import { formatDate, safeSubject, safeSender } from "./utils";

interface MessageListProps {
  messages: MailHeader[];
  selectedUid: number | null;
  loading: boolean;
  error: string | null;
  isSearchActive: boolean;
  page: number;
  totalMessages: number;
  hasMore: boolean;
  onSelectMessage: (uid: number) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

function MessageListSkeleton() {
  return (
    <div className="p-3 space-y-1">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="py-2.5 px-3 space-y-1.5 rounded-md">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-14 ml-auto" />
          </div>
          <Skeleton className="h-3.5 w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ isSearch }: { isSearch: boolean }) {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center px-6">
        <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="font-medium">{isSearch ? "No messages found" : "No messages yet"}</p>
        <p className="text-sm mt-1 text-muted-foreground/70">
          {isSearch ? "Try a different search term" : "This folder is empty"}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center px-6 max-w-xs">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive/60" />
        <p className="font-medium text-foreground mb-1">Failed to load messages</p>
        <p className="text-sm text-muted-foreground/70 mb-4">{error}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1" /> Retry
        </Button>
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  selectedUid,
  loading,
  error,
  isSearchActive,
  page,
  totalMessages,
  hasMore,
  onSelectMessage,
  onPageChange,
  onRetry,
}: MessageListProps) {
  if (loading) return <MessageListSkeleton />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (messages.length === 0) return <EmptyState isSearch={isSearchActive} />;

  return (
    <>
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {messages.map((msg) => (
          <button
            key={msg.uid}
            onClick={() => onSelectMessage(msg.uid)}
            className={cn(
              "w-full text-left px-3 py-2.5 transition-colors",
              selectedUid === msg.uid ? "bg-primary/10" : "hover:bg-muted/50",
              !msg.read && "bg-primary/5"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm truncate flex-1",
                  !msg.read && "font-semibold text-foreground"
                )}
              >
                {safeSender(msg.from)}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(msg.date)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={cn(
                  "text-sm truncate flex-1",
                  !msg.read ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {safeSubject(msg.subject)}
              </span>
              {msg.hasAttachments && (
                <Paperclip className="w-3 h-3 text-muted-foreground shrink-0" />
              )}
              {!msg.read && (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {!isSearchActive && totalMessages > 0 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border text-sm text-muted-foreground">
          <span>
            {(page - 1) * 25 + 1}–{Math.min(page * 25, totalMessages)} of {totalMessages}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!hasMore}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
