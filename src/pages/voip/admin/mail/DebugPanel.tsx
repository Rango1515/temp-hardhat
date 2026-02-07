import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DebugLogEntry } from "./types";

interface DebugPanelProps {
  logs: DebugLogEntry[];
  open: boolean;
  onClose: () => void;
}

export function DebugPanel({ logs, open, onClose }: DebugPanelProps) {
  const [filter, setFilter] = useState<"all" | "request" | "response" | "error">("all");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (!open) return null;

  const filtered = filter === "all" ? logs : logs.filter((l) => l.type === filter);
  const recent = filtered.slice(-100).reverse();

  const toggleExpand = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-[480px] max-h-[50vh] bg-card border-t border-l border-border shadow-xl z-50 flex flex-col rounded-tl-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Debug Console</span>
          <span className="text-xs text-muted-foreground">({logs.length} entries)</span>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-3 py-1.5 border-b border-border">
        {(["all", "request", "response", "error"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs px-2 py-1 rounded transition-colors capitalize",
              filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono">
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No logs yet</p>
        ) : (
          recent.map((log, i) => (
            <div
              key={i}
              className={cn(
                "rounded px-2 py-1.5 border",
                log.type === "error" ? "border-destructive/30 bg-destructive/5" :
                log.type === "request" ? "border-primary/20 bg-primary/5" :
                "border-border bg-muted/20"
              )}
            >
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => log.data && toggleExpand(i)}
              >
              <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  log.type === "error" ? "bg-destructive" :
                  log.type === "request" ? "bg-primary" :
                  "bg-primary/60"
                )} />
                <span className="text-muted-foreground">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className="font-medium text-foreground">{log.action}</span>
                {log.data && (
                  <ChevronDown className={cn("w-3 h-3 ml-auto text-muted-foreground transition-transform", expanded.has(i) && "rotate-180")} />
                )}
              </div>
              {expanded.has(i) && log.data && (
                <pre className="mt-1.5 text-[10px] text-muted-foreground overflow-auto max-h-32 whitespace-pre-wrap break-all">
                  {typeof log.data === "string" ? log.data : JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
