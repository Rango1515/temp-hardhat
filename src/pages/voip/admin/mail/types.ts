// ─── Mail Types ──────────────────────────────────────────────────────────────────

export interface MailFolder {
  name: string;
  path: string;
  unread: number;
  total: number;
  specialUse?: string;
}

export interface MailHeader {
  uid: number;
  from: string;
  fromAddress: string;
  subject: string;
  date: string;
  read: boolean;
  hasAttachments: boolean;
}

export interface FullMessage {
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
  truncated?: boolean;
  attachments: AttachmentInfo[];
  messageId: string;
  inReplyTo: string;
}

export interface AttachmentInfo {
  index: number;
  filename: string;
  contentType: string;
  size: number;
}

export interface ComposeData {
  to: string;
  cc: string;
  subject: string;
  body: string;
  inReplyTo: string;
}

export interface MailState {
  folders: MailFolder[];
  activeFolder: string;
  messages: MailHeader[];
  selectedMessage: FullMessage | null;
  selectedUid: number | null;
  page: number;
  totalMessages: number;
  hasMore: boolean;
  searchQuery: string;
  isSearchActive: boolean;
  loadingFolders: boolean;
  loadingMessages: boolean;
  loadingMessage: boolean;
  fetchError: string | null;
  showReadingPane: boolean;
  debugMode: boolean;
  debugLogs: DebugLogEntry[];
  messageCache: Map<string, FullMessage>;
}

export interface DebugLogEntry {
  timestamp: Date;
  type: "request" | "response" | "error";
  action: string;
  data?: unknown;
}
