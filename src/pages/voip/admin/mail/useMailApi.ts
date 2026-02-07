import { useCallback, useRef, useState } from "react";
import { useVoipApi } from "@/hooks/useVoipApi";
import { useToast } from "@/hooks/use-toast";
import type { MailFolder, MailHeader, FullMessage, DebugLogEntry } from "./types";

const MESSAGE_CACHE = new Map<string, FullMessage>();
const CACHE_MAX = 50;

function cacheKey(folder: string, uid: number) {
  return `${folder}:${uid}`;
}

function cacheSet(folder: string, uid: number, msg: FullMessage) {
  const key = cacheKey(folder, uid);
  if (MESSAGE_CACHE.size >= CACHE_MAX) {
    const first = MESSAGE_CACHE.keys().next().value;
    if (first) MESSAGE_CACHE.delete(first);
  }
  MESSAGE_CACHE.set(key, msg);
}

function cacheGet(folder: string, uid: number): FullMessage | undefined {
  return MESSAGE_CACHE.get(cacheKey(folder, uid));
}

export function useMailApi() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const readAbortRef = useRef<AbortController | null>(null);
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);

  const addDebugLog = useCallback((type: DebugLogEntry["type"], action: string, data?: unknown) => {
    setDebugLogs((prev) => {
      const next = [...prev, { timestamp: new Date(), type, action, data }];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, []);

  const loadFolders = useCallback(async (): Promise<MailFolder[] | null> => {
    addDebugLog("request", "folders");
    const result = await apiCall<{ folders: MailFolder[] }>("voip-mail", {
      params: { action: "folders" },
    });
    if (result.data?.folders) {
      addDebugLog("response", "folders", { count: result.data.folders.length });
      return result.data.folders;
    }
    if (result.error) {
      addDebugLog("error", "folders", result.error);
      toast({ title: "Failed to load folders", description: result.error, variant: "destructive" });
    }
    return null;
  }, [apiCall, toast, addDebugLog]);

  const loadMessages = useCallback(async (
    folder: string,
    page: number
  ): Promise<{ messages: MailHeader[]; total: number; hasMore: boolean } | null> => {
    addDebugLog("request", "list", { folder, page });
    const result = await apiCall<{ messages: MailHeader[]; total: number; page: number; hasMore: boolean }>(
      "voip-mail",
      { params: { action: "list", folder, page: page.toString() } }
    );
    if (result.data) {
      addDebugLog("response", "list", { count: result.data.messages.length, total: result.data.total });
      return { messages: result.data.messages, total: result.data.total, hasMore: result.data.hasMore };
    }
    if (result.error) {
      addDebugLog("error", "list", result.error);
    }
    return null;
  }, [apiCall, addDebugLog]);

  const loadMessage = useCallback(async (
    folder: string,
    uid: number
  ): Promise<FullMessage | null> => {
    // Check cache first
    const cached = cacheGet(folder, uid);
    if (cached) {
      addDebugLog("response", "read (cached)", { uid });
      return cached;
    }

    // Cancel any in-flight read request
    if (readAbortRef.current) {
      readAbortRef.current.abort();
    }
    const abortController = new AbortController();
    readAbortRef.current = abortController;

    addDebugLog("request", "read", { folder, uid });

    try {
      const currentToken = localStorage.getItem("voip_token");
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-mail`);
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

      if (abortController.signal.aborted) return null;

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error || `Request failed (${response.status})`;
        addDebugLog("error", "read", { status: response.status, error: errMsg });
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (abortController.signal.aborted) return null;

      if (data?.message) {
        addDebugLog("response", "read", {
          uid,
          htmlLen: data.message.html?.length || 0,
          textLen: data.message.text?.length || 0,
          attachments: data.message.attachments?.length || 0,
          truncated: data.message.truncated,
        });
        cacheSet(folder, uid, data.message);
        return data.message;
      }
      return null;
    } catch (err: any) {
      if (err?.name === "AbortError") return null;
      addDebugLog("error", "read", err?.message);
      throw err;
    }
  }, [addDebugLog]);

  const searchMessages = useCallback(async (
    folder: string,
    query: string
  ): Promise<{ messages: MailHeader[]; total: number } | null> => {
    addDebugLog("request", "search", { folder, query });
    const result = await apiCall<{ messages: MailHeader[]; total: number }>("voip-mail", {
      params: { action: "search", folder, query },
    });
    if (result.data) {
      addDebugLog("response", "search", { count: result.data.messages.length });
      return result.data;
    }
    if (result.error) {
      addDebugLog("error", "search", result.error);
    }
    return null;
  }, [apiCall, addDebugLog]);

  const sendEmail = useCallback(async (body: {
    to: string; cc?: string; subject: string; body: string; inReplyTo?: string;
  }): Promise<boolean> => {
    addDebugLog("request", "send", { to: body.to, subject: body.subject });
    const result = await apiCall("voip-mail", {
      method: "POST",
      params: { action: "send" },
      body,
    });
    if (result.error) {
      addDebugLog("error", "send", result.error);
      toast({ title: "Failed to send", description: result.error, variant: "destructive" });
      return false;
    }
    addDebugLog("response", "send", { success: true });
    toast({ title: "Email sent successfully" });
    return true;
  }, [apiCall, toast, addDebugLog]);

  const saveDraft = useCallback(async (body: {
    to: string; cc?: string; subject: string; body: string; inReplyTo?: string;
  }): Promise<boolean> => {
    addDebugLog("request", "save-draft", { subject: body.subject });
    const result = await apiCall("voip-mail", {
      method: "POST",
      params: { action: "save-draft" },
      body: { ...body, subject: body.subject || "(No Subject)" },
    });
    if (result.error) {
      addDebugLog("error", "save-draft", result.error);
      toast({ title: "Failed to save draft", description: result.error, variant: "destructive" });
      return false;
    }
    addDebugLog("response", "save-draft", { success: true });
    toast({ title: "Draft saved" });
    return true;
  }, [apiCall, toast, addDebugLog]);

  const markMessage = useCallback(async (folder: string, uid: number, flag: "seen" | "unseen"): Promise<boolean> => {
    const result = await apiCall("voip-mail", {
      method: "POST",
      params: { action: "mark" },
      body: { folder, uid, flag },
    });
    return !result.error;
  }, [apiCall]);

  const moveMessage = useCallback(async (folder: string, uid: number, destination: string): Promise<boolean> => {
    const result = await apiCall("voip-mail", {
      method: "POST",
      params: { action: "move" },
      body: { folder, uid, destination },
    });
    if (result.error) {
      toast({ title: "Failed to move", description: result.error, variant: "destructive" });
      return false;
    }
    return true;
  }, [apiCall, toast]);

  const deleteMessage = useCallback(async (folder: string, uid: number): Promise<boolean> => {
    const result = await apiCall("voip-mail", {
      method: "POST",
      params: { action: "delete" },
      body: { folder, uid },
    });
    if (result.error) {
      toast({ title: "Failed to delete", description: result.error, variant: "destructive" });
      return false;
    }
    return true;
  }, [apiCall, toast]);

  const clearFolder = useCallback(async (folder: string): Promise<number> => {
    const result = await apiCall<{ deleted: number }>("voip-mail", {
      method: "POST",
      params: { action: "clear" },
      body: { folder },
    });
    if (result.error) {
      toast({ title: "Failed to clear inbox", description: result.error, variant: "destructive" });
      return -1;
    }
    const count = result.data?.deleted || 0;
    toast({ title: `Cleared ${count} message${count !== 1 ? "s" : ""}` });
    return count;
  }, [apiCall, toast]);

  const downloadAttachment = useCallback(async (
    folder: string, uid: number, index: number, filename: string
  ): Promise<void> => {
    const result = await apiCall<{ data: string; contentType: string; filename: string }>("voip-mail", {
      params: {
        action: "attachment",
        folder,
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
  }, [apiCall, toast]);

  return {
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
  };
}
