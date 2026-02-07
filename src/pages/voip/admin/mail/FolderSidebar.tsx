import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Mail,
  Send,
  Trash2,
  Inbox,
  PenSquare,
  AlertTriangle,
} from "lucide-react";
import type { MailFolder } from "./types";

interface FolderSidebarProps {
  folders: MailFolder[];
  activeFolder: string;
  loading: boolean;
  onSelectFolder: (path: string) => void;
}

function getFolderIcon(folder: MailFolder) {
  const name = folder.name.toLowerCase();
  if (folder.path === "INBOX" || name === "inbox") return <Inbox className="w-4 h-4" />;
  if (name === "sent" || folder.specialUse === "\\Sent") return <Send className="w-4 h-4" />;
  if (name === "trash" || folder.specialUse === "\\Trash") return <Trash2 className="w-4 h-4" />;
  if (name === "drafts" || folder.specialUse === "\\Drafts") return <PenSquare className="w-4 h-4" />;
  if (name === "spam" || name === "junk" || folder.specialUse === "\\Junk") return <AlertTriangle className="w-4 h-4" />;
  return <Mail className="w-4 h-4" />;
}

export function FolderSidebar({ folders, activeFolder, loading, onSelectFolder }: FolderSidebarProps) {
  if (loading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return (
    <nav className="p-2 space-y-0.5">
      {folders.map((folder) => (
        <button
          key={folder.path}
          onClick={() => onSelectFolder(folder.path)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
            activeFolder === folder.path
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {getFolderIcon(folder)}
          <span className="truncate flex-1">{folder.name}</span>
          {folder.unread > 0 && (
            <span
              className={cn(
                "text-xs font-medium min-w-5 text-center rounded-full px-1.5 py-0.5",
                activeFolder === folder.path
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              {folder.unread}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
