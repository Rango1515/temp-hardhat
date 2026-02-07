

# Admin Mail Inbox

## Overview
Build a fully functional email inbox for admin@hardhathosting.work inside the admin dashboard. The backend edge function handles all IMAP/SMTP communication server-side, and the frontend provides a Gmail-like interface with folders, message list, reading pane, and compose functionality.

## Step 1 -- Store Mail Server Secrets
Six secrets need to be securely stored before any code runs:
- IMAP_HOST (e.g., mail.hardhathosting.work)
- IMAP_PORT (typically 993)
- SMTP_HOST (same as IMAP host usually)
- SMTP_PORT (587 or 465)
- MAIL_USERNAME (admin@hardhathosting.work)
- MAIL_PASSWORD (the mailbox password)

## Step 2 -- Backend Edge Function (`voip-mail`)

A new edge function at `supabase/functions/voip-mail/index.ts` handles all email operations. It uses:
- `jsr:@bobbyg603/deno-imap` for IMAP (reading, searching, folder management)
- `npm:nodemailer` for SMTP (sending emails)

### Actions (via query param `?action=...`):

| Action | Method | Description |
|--------|--------|-------------|
| `folders` | GET | List all mailbox folders (INBOX, Sent, Trash, etc.) |
| `list` | GET | Fetch message headers from a folder, paginated (25/page). Params: `folder`, `page` |
| `read` | GET | Fetch full message body + attachments list by UID. Param: `folder`, `uid` |
| `attachment` | GET | Download a specific attachment. Params: `folder`, `uid`, `part` |
| `send` | POST | Compose and send email via SMTP. Body: `to`, `cc`, `bcc`, `subject`, `body` (HTML) |
| `mark` | POST | Mark message read/unread. Body: `folder`, `uid`, `flag` (`seen`/`unseen`) |
| `move` | POST | Move message to another folder (e.g., Trash). Body: `folder`, `uid`, `destination` |
| `delete` | POST | Permanently delete a message. Body: `folder`, `uid` |
| `search` | GET | Search by subject/from. Params: `folder`, `query` |

### Security built into the edge function:
- Admin-only: JWT verified, role must equal `admin`
- Rate limiting: In-memory counter (30 requests/minute per user ID), returns 429 if exceeded
- Audit logging: Writes to `voip_admin_audit_log` for open, send, delete actions
- All responses include CORS headers

### SMTP Port Consideration
Supabase's edge runtime may block standard SMTP ports (25, 465, 587). The function will attempt port 587 first. If that fails, a fallback note will be included. If your VPS supports SMTP on an alternative port (e.g., 2525), that can be configured via SMTP_PORT.

## Step 3 -- Frontend Page (`src/pages/voip/admin/MailInbox.tsx`)

A Gmail-inspired layout with three panels:

```text
+------------------+------------------------------+----------------------------+
|  Folder List     |  Message List                |  Reading Pane              |
|                  |                              |                            |
|  > INBOX (12)    |  From: John Smith            |  Subject: Quote Request    |
|    Sent          |  Subject: Quote Request      |  From: john@example.com    |
|    Drafts        |  Date: Feb 7, 2:30 PM    ●   |  Date: Feb 7, 2026         |
|    Trash         |                              |                            |
|    Spam          |  From: Jane Doe              |  Hello, I'd like to...     |
|                  |  Subject: Follow up          |                            |
|  [Compose]       |  Date: Feb 6, 11:00 AM       |  [Attachments: quote.pdf]  |
|                  |                              |  [Reply] [Delete] [Move]   |
+------------------+------------------------------+----------------------------+
```

### UI Components:
- **Folder sidebar**: Lists folders from IMAP with unread counts, highlights active folder
- **Message list**: Shows from, subject, date, bold for unread. Pagination controls at bottom (25 per page)
- **Reading pane**: Renders selected message HTML in a sandboxed iframe (using `srcdoc` with sanitized HTML). Shows attachments as downloadable links
- **Compose modal**: Dialog with To, CC, Subject, Body (textarea/rich text), Send button
- **Toolbar**: Refresh, Search input (debounced), Mark read/unread, Move to Trash buttons
- **Loading states**: Skeleton loaders while fetching

### Mobile responsive:
- On small screens, folder list collapses to a dropdown
- Reading pane stacks below message list

## Step 4 -- Routing and Navigation

- Add route: `/voip/admin/mail` wrapped in `AdminRoute`
- Add sidebar nav item with `Mail` icon in the admin section of `VoipSidebar.tsx`
- Lazy-load the `MailInbox` component in `App.tsx`

## Step 5 -- Config and Deployment

- Add `voip-mail` to `supabase/config.toml` with `verify_jwt = false` (JWT validated in code)
- Deploy the edge function automatically with the build

## Technical Details

### HTML Sanitization (Reading Pane)
Email HTML is rendered inside an iframe with `sandbox="allow-same-origin"` and `srcdoc`. Scripts, external resource loading, and form submissions are blocked by the sandbox attribute. This prevents XSS from malicious email content.

### Rate Limiting Implementation
```text
In-memory Map<string, {count, resetTime}>
- Key: admin user ID
- Window: 60 seconds
- Limit: 30 requests
- Returns HTTP 429 when exceeded
```

### Audit Log Entries
Actions logged to `voip_admin_audit_log`:
- `mail_message_opened` -- with subject in details
- `mail_message_sent` -- with recipient and subject
- `mail_message_deleted` -- with UID and folder
- `mail_message_moved` -- with source/destination folder

### Files to Create
- `supabase/functions/voip-mail/index.ts` -- Backend edge function
- `src/pages/voip/admin/MailInbox.tsx` -- Full inbox page component

### Files to Modify
- `src/App.tsx` -- Add lazy import and admin route
- `src/components/voip/layout/VoipSidebar.tsx` -- Add Mail nav item
- `supabase/config.toml` -- Add voip-mail function config

