import { useState, useEffect, useCallback, useRef } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Search,
  Trash2,
  PenSquare,
  X,
  Loader2,
  Bug,
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

import type { MailFolder, MailHeader, FullMessage, ComposeData } from "./mail/types";
import { useMailApi } from "./mail/useMailApi";
import { FolderSidebar } from "./mail/FolderSidebar";
import { MessageList } from "./mail/MessageList";
import { ReadingPane } from "./mail/ReadingPane";
import { ComposeModal } from "./mail/ComposeModal";
import { DebugPanel } from "./mail/DebugPanel";

const EMPTY_COMPOSE: ComposeData = { to: "", cc: "", subject: "", body: "", inReplyTo: "" };

export default function MailInbox() {
  const { toast } = useToast();
  const {
    loadFolders,
    loadMessages,
    loadMessage,
    searchMessages,
    sendEmail,
    saveDraft,
    markMessage,
    moveMessage,
    deleteMessage,
    clearFolder,
    downloadAttachment,
    debugLogs,
  } = useMailApi();

  // ─── State ──────────────────────────────────────────────────────────────────
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

  // Loading / error states
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [messageLoadError, setMessageLoadError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [clearingInbox, setClearingInbox] = useState(false);

  // Compose
  const [isComposing, setIsComposing] = useState(false);
  const [compose, setCompose] = useState<ComposeData>(EMPTY_COMPOSE);

  // UI toggles
  const [showReadingPane, setShowReadingPane] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const initialLoadDone = useRef(false);
  const prevFolderPage = useRef({ folder: "INBOX", page: 1 });

  // ─── Data Loading ───────────────────────────────────────────────────────────
  const refreshFolders = useCallback(async () => {
    setLoadingFolders(true);
    const result = await loadFolders();
    if (result) setFolders(result);
    setLoadingFolders(false);
  }, [loadFolders]);

  const refreshMessages = useCallback(async (folder: string, p: number) => {
    setLoadingMessages(true);
    setListError(null);
    const result = await loadMessages(folder, p);
    if (result) {
      setMessages(result.messages);
      setTotalMessages(result.total);
      setHasMore(result.hasMore);
    } else {
      setListError("Failed to load messages. Check your connection.");
    }
    setLoadingMessages(false);
  }, [loadMessages]);

  const handleSelectMessage = useCallback(async (uid: number) => {
    if (selectedUid === uid && loadingMessage) return;

    setLoadingMessage(true);
    setSelectedUid(uid);
    setShowReadingPane(true);
    setSelectedMessage(null);
    setMessageLoadError(null);

    // Optimistically mark as read
    setMessages((prev) => prev.map((m) => (m.uid === uid ? { ...m, read: true } : m)));

    try {
      const msg = await loadMessage(activeFolder, uid);
      if (msg) {
        setSelectedMessage(msg);
      }
    } catch (err: any) {
      const isTimeout = err?.message?.includes("Failed to fetch") || err?.message?.includes("timed out");
      setMessageLoadError(
        isTimeout ? "The server took too long. Try again." : (err?.message || "Unknown error")
      );
    } finally {
      setLoadingMessage(false);
    }
  }, [selectedUid, loadingMessage, loadMessage, activeFolder]);

  // ─── Effects ────────────────────────────────────────────────────────────────
  // Initial load - runs once
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      refreshFolders();
      refreshMessages("INBOX", 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch only when folder/page ACTUALLY changes (skip initial values)
  useEffect(() => {
    if (!initialLoadDone.current) return;
    // Skip if folder+page haven't actually changed
    if (prevFolderPage.current.folder === activeFolder && prevFolderPage.current.page === page) return;
    prevFolderPage.current = { folder: activeFolder, page };
    if (!isSearchActive) {
      refreshMessages(activeFolder, page);
    }
  }, [activeFolder, page, isSearchActive, refreshMessages]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectFolder = (folderPath: string) => {
    setActiveFolder(folderPath);
    setPage(1);
    prevFolderPage.current = { folder: folderPath, page: 1 };
    setSelectedMessage(null);
    setSelectedUid(null);
    setSearchQuery("");
    setIsSearchActive(false);
    setShowReadingPane(false);
    setListError(null);
    setMessageLoadError(null);
    // Fetch immediately for the new folder
    refreshMessages(folderPath, 1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setIsSearchActive(false);
      refreshMessages(activeFolder, page);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setLoadingMessages(true);
      setIsSearchActive(true);
      setListError(null);
      const result = await searchMessages(activeFolder, query);
      if (result) {
        setMessages(result.messages);
        setTotalMessages(result.total);
        setHasMore(false);
      } else {
        setListError("Search failed");
      }
      setLoadingMessages(false);
    }, 400);
  };

  const handleRefresh = () => {
    refreshFolders();
    if (isSearchActive && searchQuery) {
      searchMessages(activeFolder, searchQuery).then((r) => {
        if (r) {
          setMessages(r.messages);
          setTotalMessages(r.total);
        }
      });
    } else {
      refreshMessages(activeFolder, page);
    }
  };

  const handleClearInbox = async () => {
    setClearingInbox(true);
    const count = await clearFolder(activeFolder);
    if (count >= 0) {
      setMessages([]);
      setTotalMessages(0);
      setSelectedMessage(null);
      setSelectedUid(null);
      setShowReadingPane(false);
      refreshFolders();
    }
    setClearingInbox(false);
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    setCompose({
      to: selectedMessage.fromAddress,
      cc: "",
      subject: selectedMessage.subject?.startsWith("Re:")
        ? selectedMessage.subject
        : `Re: ${selectedMessage.subject || "(No Subject)"}`,
      body: `<br/><br/>--- Original Message ---<br/>From: ${selectedMessage.from || "Unknown"}<br/>Date: ${selectedMessage.date}<br/><br/>${selectedMessage.html || selectedMessage.text || ""}`,
      inReplyTo: selectedMessage.messageId,
    });
    setIsComposing(true);
  };

  const handleForward = () => {
    if (!selectedMessage) return;
    setCompose({
      to: "",
      cc: "",
      subject: selectedMessage.subject?.startsWith("Fwd:")
        ? selectedMessage.subject
        : `Fwd: ${selectedMessage.subject || "(No Subject)"}`,
      body: `<br/><br/>--- Forwarded Message ---<br/>From: ${selectedMessage.from || "Unknown"}<br/>Date: ${selectedMessage.date}<br/>Subject: ${selectedMessage.subject || "(No Subject)"}<br/><br/>${selectedMessage.html || selectedMessage.text || ""}`,
      inReplyTo: "",
    });
    setIsComposing(true);
  };

  const handleMarkUnread = async (uid: number) => {
    await markMessage(activeFolder, uid, "unseen");
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
    const success = await moveMessage(activeFolder, uid, destination);
    if (success) {
      setMessages((prev) => prev.filter((m) => m.uid !== uid));
      if (selectedMessage?.uid === uid) {
        setSelectedMessage(null);
        setSelectedUid(null);
        setShowReadingPane(false);
      }
      toast({ title: "Moved to Trash" });
    }
  };

  const handleDeleteForever = async (uid: number) => {
    const success = await deleteMessage(activeFolder, uid);
    if (success) {
      setMessages((prev) => prev.filter((m) => m.uid !== uid));
      if (selectedMessage?.uid === uid) {
        setSelectedMessage(null);
        setSelectedUid(null);
        setShowReadingPane(false);
      }
      toast({ title: "Message deleted" });
    }
  };

  const handleSend = async () => {
    if (!compose.to || !compose.subject) {
      toast({ title: "Missing fields", description: "To and Subject are required", variant: "destructive" });
      return;
    }
    const success = await sendEmail({
      to: compose.to,
      cc: compose.cc || undefined,
      subject: compose.subject,
      body: compose.body,
      inReplyTo: compose.inReplyTo || undefined,
    });
    if (success) {
      setIsComposing(false);
      setCompose(EMPTY_COMPOSE);
      refreshFolders();
      if (activeFolder.toLowerCase().includes("sent")) refreshMessages(activeFolder, page);
    }
  };

  const handleSaveDraft = async () => {
    if (!compose.subject && !compose.body && !compose.to) {
      toast({ title: "Nothing to save", description: "Add content before saving", variant: "destructive" });
      return;
    }
    const success = await saveDraft({
      to: compose.to,
      cc: compose.cc || undefined,
      subject: compose.subject,
      body: compose.body,
      inReplyTo: compose.inReplyTo || undefined,
    });
    if (success) {
      setIsComposing(false);
      setCompose(EMPTY_COMPOSE);
      refreshFolders();
      if (activeFolder.toLowerCase().includes("draft")) refreshMessages(activeFolder, page);
    }
  };

  const handleDownloadAttachment = async (uid: number, index: number, filename: string) => {
    await downloadAttachment(activeFolder, uid, index, filename);
  };

  const handleRetryList = () => {
    refreshMessages(activeFolder, page);
  };

  const handleRetryMessage = () => {
    if (selectedUid) {
      handleSelectMessage(selectedUid);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <VoipLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-card rounded-t-lg">
          <Button size="sm" onClick={() => { setCompose(EMPTY_COMPOSE); setIsComposing(true); }}>
            <PenSquare className="w-4 h-4 mr-1" /> Compose
          </Button>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={clearingInbox || messages.length === 0}>
                {clearingInbox ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all messages?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {totalMessages} message{totalMessages !== 1 ? "s" : ""} in <strong>{activeFolder}</strong>.
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

          <div className="relative flex-1 min-w-[180px] max-w-sm">
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

          {/* Debug toggle (rightmost) */}
          <Button
            size="sm"
            variant={debugMode ? "secondary" : "ghost"}
            onClick={() => {
              setDebugMode(!debugMode);
              if (!debugMode) setDebugPanelOpen(true);
            }}
            className="ml-auto"
            title="Toggle debug mode"
          >
            <Bug className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Layout */}
        <div className="flex flex-1 min-h-0 bg-card rounded-b-lg border border-t-0 border-border">
          {/* Folder Sidebar (desktop) */}
          <div className="hidden md:flex md:flex-col w-48 lg:w-52 border-r border-border overflow-y-auto">
            <FolderSidebar
              folders={folders}
              activeFolder={activeFolder}
              loading={loadingFolders}
              onSelectFolder={handleSelectFolder}
            />
          </div>

          {/* Message List */}
          <div
            className={cn(
              "flex flex-col border-r border-border overflow-hidden",
              "w-full md:w-80 lg:w-96",
              showReadingPane && "hidden md:flex"
            )}
          >
            <MessageList
              messages={messages}
              selectedUid={selectedUid}
              loading={loadingMessages}
              error={listError}
              isSearchActive={isSearchActive}
              page={page}
              totalMessages={totalMessages}
              hasMore={hasMore}
              onSelectMessage={handleSelectMessage}
              onPageChange={setPage}
              onRetry={handleRetryList}
            />
          </div>

          {/* Reading Pane */}
          <div
            className={cn(
              "flex-1 flex flex-col overflow-hidden",
              !showReadingPane && "hidden md:flex"
            )}
          >
            <ReadingPane
              message={selectedMessage}
              loading={loadingMessage}
              loadError={messageLoadError}
              folders={folders}
              activeFolder={activeFolder}
              onReply={handleReply}
              onForward={handleForward}
              onMarkUnread={handleMarkUnread}
              onMoveToTrash={handleMoveToTrash}
              onDeleteForever={handleDeleteForever}
              onDownloadAttachment={handleDownloadAttachment}
              onBack={() => { setShowReadingPane(false); setSelectedMessage(null); setSelectedUid(null); }}
              onRetryLoad={handleRetryMessage}
              debugMode={debugMode}
            />
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal
        open={isComposing}
        onOpenChange={setIsComposing}
        compose={compose}
        onComposeChange={setCompose}
        onSend={handleSend}
        onSaveDraft={handleSaveDraft}
      />

      {/* Debug Panel */}
      {debugMode && (
        <DebugPanel
          logs={debugLogs}
          open={debugPanelOpen}
          onClose={() => setDebugPanelOpen(false)}
        />
      )}
    </VoipLayout>
  );
}
