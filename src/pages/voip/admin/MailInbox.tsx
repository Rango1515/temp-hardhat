import { useState, useEffect, useCallback, useRef } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Mail,
  RefreshCw,
  Search,
  Send,
  Trash2,
  MailOpen,
  MailX,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Download,
  Reply,
  FolderInput,
  Loader2,
  Inbox,
  PenSquare,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface MailFolder {
  name: string;
  path: string;
  unread: number;
  total: number;
  specialUse?: string;
}

interface MailHeader {
  uid: number;
  from: string;
  fromAddress: string;
  subject: string;
  date: string;
  read: boolean;
  hasAttachments: boolean;
}

interface FullMessage {
  uid: number;
  from: string;
  fromAddress: string;
  to: string;
  cc: string;
  subject: string;
  date: string;
  html: string;
  text: string;
  read: boolean;
  attachments: { index: number; filename: string; contentType: string; size: number }[];
  messageId: string;
  inReplyTo: string;
}

interface ComposeData {
  to: string;
  cc: string;
  subject: string;
  body: string;
  inReplyTo: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function MailInbox() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();

  // State
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState("INBOX");
  const [messages, setMessages] = useState<MailHeader[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<FullMessage | null>(null);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Loading states
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Compose
  const [isComposing, setIsComposing] = useState(false);
  const [compose, setCompose] = useState<ComposeData>({
    to: "",
    cc: "",
    subject: "",
    body: "",
    inReplyTo: "",
  });

  // Clearing inbox
  const [clearingInbox, setClearingInbox] = useState(false);

  // Mobile reading pane toggle
  const [showReadingPane, setShowReadingPane] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const readAbortRef = useRef<AbortController | null>(null);

  // ─── Data Loading ───────────────────────────────────────────────────────────
  const loadFolders = useCallback(async () => {
    setLoadingFolders(true);
    const result = await apiCall<{ folders: MailFolder[] }>("voip-mail", {
      params: { action: "folders" },
    });
    if (result.data?.folders) {
      setFolders(result.data.folders);
    } else if (result.error) {
      toast({ title: "Failed to load folders", description: result.error, variant: "destructive" });
    }
    setLoadingFolders(false);
  }, [apiCall, toast]);

  const loadMessages = useCallback(async (folder: string, p: number) => {
    setLoadingMessages(true);
    const result = await apiCall<{ messages: MailHeader[]; total: number; page: number; hasMore: boolean }>(
      "voip-mail",
      { params: { action: "list", folder, page: p.toString() } }
    );
    if (result.data) {
      setMessages(result.data.messages);
      setTotalMessages(result.data.total);
      setHasMore(result.data.hasMore);
    } else if (result.error) {
      toast({ title: "Failed to load messages", description: result.error, variant: "destructive" });
    }
    setLoadingMessages(false);
  }, [apiCall, toast]);

  const loadMessage = useCallback(async (folder: string, uid: number) => {
    // Ignore if already loading this message
    if (selectedUid === uid && loadingMessage) return;

    // Cancel any in-flight read request
    if (readAbortRef.current) {
      readAbortRef.current.abort();
    }
    const abortController = new AbortController();
    readAbortRef.current = abortController;

    setLoadingMessage(true);
    setSelectedUid(uid);
    setShowReadingPane(true);
    setSelectedMessage(null);

    // Optimistically mark as read immediately (removes orange dot)
    setMessages((prev) =>
      prev.map((m) => (m.uid === uid ? { ...m, read: true } : m))
    );

    try {
      const currentToken = localStorage.getItem("voip_token");
      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-mail`
      );
      url.searchParams.set("action", "read");
      url.searchParams.set("folder", folder);
      url.searchParams.set("uid", uid.toString());

      const response = await fetch(url.href, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        signal: abortController.signal,
      });

      // Check if this request was cancelled
      if (abortController.signal.aborted) return;

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      const data = await response.json();
      if (abortController.signal.aborted) return;

      if (data?.message) {
        setSelectedMessage(data.message);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return; // Cancelled — ignore
      const isTimeout = err?.message?.includes("Failed to fetch") || err?.message?.includes("timed out");
      toast({
        title: "Failed to load message",
        description: isTimeout
          ? "The server took too long. Please try again."
          : err?.message || "Unknown error",
        variant: "destructive",
      });
      setShowReadingPane(false);
      setSelectedUid(null);
    } finally {
      if (!abortController.signal.aborted) {
        setLoadingMessage(false);
      }
    }
  }, [selectedUid, loadingMessage, toast]);

  const searchMessages = useCallback(async (folder: string, query: string) => {
    setLoadingMessages(true);
    setIsSearchActive(true);
    const result = await apiCall<{ messages: MailHeader[]; total: number }>("voip-mail", {
      params: { action: "search", folder, query },
    });
    if (result.data) {
      setMessages(result.data.messages);
      setTotalMessages(result.data.total);
      setHasMore(false);
    }
    setLoadingMessages(false);
  }, [apiCall]);

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    if (!isSearchActive) {
      loadMessages(activeFolder, page);
    }
  }, [activeFolder, page, loadMessages, isSearchActive]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectFolder = (folderPath: string) => {
    setActiveFolder(folderPath);
    setPage(1);
    setSelectedMessage(null);
    setSelectedUid(null);
    setSearchQuery("");
    setIsSearchActive(false);
    setShowReadingPane(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setIsSearchActive(false);
      loadMessages(activeFolder, page);
      return;
    }
    searchTimeout.current = setTimeout(() => {
      searchMessages(activeFolder, query);
    }, 500);
  };

  const handleClearInbox = async () => {
    setClearingInbox(true);
    const result = await apiCall<{ deleted: number }>("voip-mail", {
      method: "POST",
      params: { action: "clear" },
      body: { folder: activeFolder },
    });
    if (result.error) {
      toast({ title: "Failed to clear inbox", description: result.error, variant: "destructive" });
    } else {
      const count = result.data?.deleted || 0;
      toast({ title: `Cleared ${count} message${count !== 1 ? "s" : ""}` });
      setMessages([]);
      setTotalMessages(0);
      setSelectedMessage(null);
      setSelectedUid(null);
      setShowReadingPane(false);
      loadFolders();
    }
    setClearingInbox(false);
  };

  const handleRefresh = () => {
    loadFolders();
    if (isSearchActive && searchQuery) {
      searchMessages(activeFolder, searchQuery);
    } else {
      loadMessages(activeFolder, page);
    }
  };

  const handleSend = async () => {
    if (!compose.to || !compose.subject) {
      toast({ title: "Missing fields", description: "To and Subject are required", variant: "destructive" });
      return;
    }
    setSendingEmail(true);
    const result = await apiCall("voip-mail", {
      method: "POST",
      params: { action: "send" },
      body: {
        to: compose.to,
        cc: compose.cc || undefined,
        subject: compose.subject,
        body: compose.body,
        inReplyTo: compose.inReplyTo || undefined,
      },
    });
    if (result.error) {
      toast({ title: "Failed to send", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Email sent successfully" });
      setIsComposing(false);
      setCompose({ to: "", cc: "", subject: "", body: "", inReplyTo: "" });
    }
    setSendingEmail(false);
  };

  const handleMarkUnread = async (uid: number) => {
    await apiCall("voip-mail", {
      method: "POST",
      params: { action: "mark" },
      body: { folder: activeFolder, uid, flag: "unseen" },
    });
    setMessages((prev) => prev.map((m) => (m.uid === uid ? { ...m, read: false } : m)));
    if (selectedMessage?.uid === uid) {
      setSelectedMessage(null);
      setSelectedUid(null);
    }
    toast({ title: "Marked as unread" });
  };

  const handleMoveToTrash = async (uid: number) => {
    const trashFolder = folders.find(
      (f) => f.specialUse === "\\Trash" || f.name.toLowerCase() === "trash"
    );
    const destination = trashFolder?.path || "Trash";
    const result = await apiCall("voip-mail", {
      method: "POST",
      params: { action: "move" },
      body: { folder: activeFolder, uid, destination },
    });
    if (result.error) {
      toast({ title: "Failed to move", description: result.error, variant: "destructive" });
    } else {
      setMessages((prev) => prev.filter((m) => m.uid !== uid));
      if (selectedMessage?.uid === uid) {
        setSelectedMessage(null);
        setSelectedUid(null);
        setShowReadingPane(false);
      }
      toast({ title: "Moved to Trash" });
    }
  };

  const handleDelete = async (uid: number) => {
    const result = await apiCall("voip-mail", {
      method: "POST",
      params: { action: "delete" },
      body: { folder: activeFolder, uid },
    });
    if (result.error) {
      toast({ title: "Failed to delete", description: result.error, variant: "destructive" });
    } else {
      setMessages((prev) => prev.filter((m) => m.uid !== uid));
      if (selectedMessage?.uid === uid) {
        setSelectedMessage(null);
        setSelectedUid(null);
        setShowReadingPane(false);
      }
      toast({ title: "Message deleted" });
    }
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    setCompose({
      to: selectedMessage.fromAddress,
      cc: "",
      subject: selectedMessage.subject.startsWith("Re:")
        ? selectedMessage.subject
        : `Re: ${selectedMessage.subject}`,
      body: `<br/><br/>--- Original Message ---<br/>From: ${selectedMessage.from}<br/>Date: ${selectedMessage.date}<br/><br/>${selectedMessage.html || selectedMessage.text}`,
      inReplyTo: selectedMessage.messageId,
    });
    setIsComposing(true);
  };

  const handleDownloadAttachment = async (uid: number, index: number, filename: string) => {
    const result = await apiCall<{ data: string; contentType: string; filename: string }>("voip-mail", {
      params: {
        action: "attachment",
        folder: activeFolder,
        uid: uid.toString(),
        index: index.toString(),
      },
    });
    if (result.data?.data) {
      const byteChars = atob(result.data.data);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: result.data.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast({ title: "Failed to download attachment", variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return format(d, "h:mm a");
      }
      if (d.getFullYear() === now.getFullYear()) {
        return format(d, "MMM d");
      }
      return format(d, "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFolderIcon = (folder: MailFolder) => {
    const name = folder.name.toLowerCase();
    if (folder.path === "INBOX" || name === "inbox") return <Inbox className="w-4 h-4" />;
    if (name === "sent" || folder.specialUse === "\\Sent") return <Send className="w-4 h-4" />;
    if (name === "trash" || folder.specialUse === "\\Trash") return <Trash2 className="w-4 h-4" />;
    if (name === "drafts" || folder.specialUse === "\\Drafts") return <PenSquare className="w-4 h-4" />;
    return <Mail className="w-4 h-4" />;
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <VoipLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-card rounded-t-lg">
          <Button size="sm" onClick={() => { setCompose({ to: "", cc: "", subject: "", body: "", inReplyTo: "" }); setIsComposing(true); }}>
            <PenSquare className="w-4 h-4 mr-1" /> Compose
          </Button>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={clearingInbox || messages.length === 0}>
                {clearingInbox ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                Clear {activeFolder === "INBOX" ? "Inbox" : activeFolder}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all messages?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {totalMessages} message{totalMessages !== 1 ? "s" : ""} in <strong>{activeFolder}</strong>. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearInbox} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search subject or sender..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Mobile folder dropdown */}
          <div className="md:hidden">
            <Select value={activeFolder} onValueChange={handleSelectFolder}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {folders.map((f) => (
                  <SelectItem key={f.path} value={f.path}>
                    {f.name} {f.unread > 0 && `(${f.unread})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isSearchActive && (
            <span className="text-xs text-muted-foreground">
              {totalMessages} result{totalMessages !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Main Layout */}
        <div className="flex flex-1 min-h-0 bg-card rounded-b-lg border border-t-0 border-border">
          {/* ─── Folder Sidebar (desktop) ──────────────────────────────────── */}
          <div className="hidden md:flex md:flex-col w-48 lg:w-52 border-r border-border overflow-y-auto">
            {loadingFolders ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <nav className="p-2 space-y-0.5">
                {folders.map((folder) => (
                  <button
                    key={folder.path}
                    onClick={() => handleSelectFolder(folder.path)}
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
            )}
          </div>

          {/* ─── Message List ─────────────────────────────────────────────── */}
          <div
            className={cn(
              "flex flex-col border-r border-border overflow-hidden",
              "w-full md:w-80 lg:w-96",
              showReadingPane && "hidden md:flex"
            )}
          >
            {loadingMessages ? (
              <div className="p-3 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Mail className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>{isSearchActive ? "No messages found" : "No messages"}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                  {messages.map((msg) => (
                    <button
                      key={msg.uid}
                      onClick={() => loadMessage(activeFolder, msg.uid)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 transition-colors",
                        selectedUid === msg.uid
                          ? "bg-primary/10"
                          : "hover:bg-muted/50",
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
                          {msg.from}
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
                          {msg.subject}
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
                {!isSearchActive && (
                  <div className="flex items-center justify-between px-3 py-2 border-t border-border text-sm text-muted-foreground">
                    <span>
                      {(page - 1) * 25 + 1}–{Math.min(page * 25, totalMessages)} of {totalMessages}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!hasMore}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ─── Reading Pane ─────────────────────────────────────────────── */}
          <div
            className={cn(
              "flex-1 flex flex-col overflow-hidden",
              !showReadingPane && "hidden md:flex"
            )}
          >
            {loadingMessage ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-64 w-full mt-4" />
              </div>
            ) : selectedMessage ? (
              <>
                {/* Message header */}
                <div className="p-4 border-b border-border space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 md:hidden">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setShowReadingPane(false); setSelectedMessage(null); setSelectedUid(null); }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    <h2 className="text-lg font-semibold flex-1 break-words">
                      {selectedMessage.subject}
                    </h2>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>
                      <span className="font-medium text-foreground">From:</span> {selectedMessage.from}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">To:</span> {selectedMessage.to}
                    </p>
                    {selectedMessage.cc && (
                      <p>
                        <span className="font-medium text-foreground">CC:</span> {selectedMessage.cc}
                      </p>
                    )}
                    <p>
                      <span className="font-medium text-foreground">Date:</span>{" "}
                      {format(new Date(selectedMessage.date), "PPp")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button size="sm" variant="outline" onClick={handleReply}>
                      <Reply className="w-4 h-4 mr-1" /> Reply
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleMarkUnread(selectedMessage.uid)}>
                      <MailX className="w-4 h-4 mr-1" /> Mark Unread
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleMoveToTrash(selectedMessage.uid)}>
                      <FolderInput className="w-4 h-4 mr-1" /> Trash
                    </Button>
                    {activeFolder.toLowerCase().includes("trash") && (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedMessage.uid)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Delete Forever
                      </Button>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                {selectedMessage.attachments.length > 0 && (
                  <div className="px-4 py-2 border-b border-border">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5">
                      <Paperclip className="w-4 h-4" />
                      <span>{selectedMessage.attachments.length} attachment{selectedMessage.attachments.length > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedMessage.attachments.map((att) => (
                        <button
                          key={att.index}
                          onClick={() => handleDownloadAttachment(selectedMessage.uid, att.index, att.filename)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-muted/50 hover:bg-muted transition-colors text-sm"
                        >
                          <Download className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{att.filename}</span>
                          <span className="text-muted-foreground text-xs">({formatSize(att.size)})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message body */}
                <div className="flex-1 overflow-auto">
                  {selectedMessage.html ? (
                    <iframe
                      srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#333;margin:16px;line-height:1.5;word-wrap:break-word}img{max-width:100%;height:auto}a{color:#2563eb}pre{overflow-x:auto;background:#f5f5f5;padding:8px;border-radius:4px}</style></head><body>${selectedMessage.html}</body></html>`}
                      sandbox="allow-same-origin"
                      className="w-full h-full border-0"
                      title="Email content"
                    />
                  ) : (
                    <div className="p-4 whitespace-pre-wrap text-sm">
                      {selectedMessage.text}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MailOpen className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p className="text-lg">Select a message to read</p>
                  <p className="text-sm mt-1">Choose a message from the list on the left</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Compose Modal ──────────────────────────────────────────────────── */}
      <Dialog open={isComposing} onOpenChange={setIsComposing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">To</label>
              <Input
                placeholder="recipient@example.com"
                value={compose.to}
                onChange={(e) => setCompose((c) => ({ ...c, to: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">CC</label>
              <Input
                placeholder="cc@example.com (optional)"
                value={compose.cc}
                onChange={(e) => setCompose((c) => ({ ...c, cc: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Subject</label>
              <Input
                placeholder="Subject"
                value={compose.subject}
                onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Message</label>
              <Textarea
                placeholder="Write your message..."
                value={compose.body}
                onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))}
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposing(false)} disabled={sendingEmail}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sendingEmail}>
              {sendingEmail ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-1" /> Send</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </VoipLayout>
  );
}
