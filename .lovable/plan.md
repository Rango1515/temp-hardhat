

# Web-Based VoIP Dialer for Hardhat Hosting

## Overview
Build a complete VoIP dialer web application integrated into the existing Hardhat Hosting website with client/admin dashboards, authentication, phone number management, call tracking, and analytics.

---

## Architecture Approach

Since you want to use MariaDB with Lovable Cloud, we'll implement a **hybrid architecture**:

```text
+------------------+       +-------------------+       +------------------+
|   React Frontend | <---> | Edge Functions    | <---> | Your MariaDB     |
|   (Lovable)      |       | (API Layer)       |       | (External Host)  |
+------------------+       +-------------------+       +------------------+
                                    |
                                    v
                           +-------------------+
                           | VoIP Provider     |
                           | (Mock Mode First) |
                           +-------------------+
```

**Edge Functions** will act as a secure proxy to your MariaDB database, handling:
- Authentication (JWT token generation/validation)
- Database queries via MySQL client
- VoIP API calls (when ready)
- Rate limiting and security

---

## Phase 1: MariaDB Schema

### SQL Table Creation Scripts

```sql
-- 1. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'client') DEFAULT 'client',
    status ENUM('active', 'suspended', 'pending') DEFAULT 'pending',
    signup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. API Keys Table
CREATE TABLE api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    key_name VARCHAR(100) DEFAULT 'Default Key',
    api_key VARCHAR(64) NOT NULL UNIQUE,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP NULL,
    status ENUM('active', 'revoked', 'expired') DEFAULT 'active',
    last_used TIMESTAMP NULL,
    usage_count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_api_key (api_key),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Phone Numbers Table
CREATE TABLE phone_numbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    friendly_name VARCHAR(100),
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_country VARCHAR(50) DEFAULT 'US',
    owner_id INT NULL,
    status ENUM('available', 'assigned', 'pending', 'suspended') DEFAULT 'available',
    number_type ENUM('local', 'toll_free', 'mobile') DEFAULT 'local',
    monthly_cost DECIMAL(10,2) DEFAULT 0.00,
    provider VARCHAR(50) DEFAULT 'mock',
    provider_sid VARCHAR(100) NULL,
    assigned_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_owner (owner_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Calls Table
CREATE TABLE calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    direction ENUM('outbound', 'inbound') DEFAULT 'outbound',
    duration_seconds INT DEFAULT 0,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status ENUM('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'busy', 'no_answer') DEFAULT 'initiated',
    call_sid VARCHAR(100) NULL,
    recording_url VARCHAR(500) NULL,
    cost DECIMAL(10,4) DEFAULT 0.0000,
    notes TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Analytics Table (Aggregated per user)
CREATE TABLE user_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    total_calls INT DEFAULT 0,
    successful_calls INT DEFAULT 0,
    failed_calls INT DEFAULT 0,
    total_duration_seconds INT DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    last_call_date TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Number Requests Table (for client requests)
CREATE TABLE number_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    area_code VARCHAR(10) NULL,
    city_preference VARCHAR(100) NULL,
    number_type ENUM('local', 'toll_free', 'mobile') DEFAULT 'local',
    business_name VARCHAR(200) NULL,
    business_website VARCHAR(255) NULL,
    reason TEXT NULL,
    status ENUM('pending', 'approved', 'denied', 'fulfilled') DEFAULT 'pending',
    admin_notes TEXT NULL,
    assigned_number_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_number_id) REFERENCES phone_numbers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Activity Logs Table (for audit trail)
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id INT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create initial admin user (password: Admin123! - change after first login)
INSERT INTO users (name, email, password_hash, role, status) VALUES 
('Admin', 'admin@hardhathosting.work', '$2b$10$HASH_HERE', 'admin', 'active');
```

---

## Phase 2: Backend Edge Functions

### 2.1 Edge Function Structure

```text
supabase/functions/
  voip-auth/
    index.ts          # Login, signup, token refresh
  voip-users/
    index.ts          # User CRUD, role management
  voip-numbers/
    index.ts          # Phone number management
  voip-calls/
    index.ts          # Call logging, history, dialer
  voip-analytics/
    index.ts          # Analytics queries
  voip-admin/
    index.ts          # Admin-only operations
  _shared/
    db.ts             # MariaDB connection helper
    auth.ts           # JWT validation helper
    cors.ts           # CORS headers
```

### 2.2 Key Edge Functions

**Authentication Edge Function (`voip-auth`):**
- POST `/voip-auth?action=login` - Email/password login, returns JWT
- POST `/voip-auth?action=signup` - User registration with validation
- POST `/voip-auth?action=refresh` - Token refresh
- POST `/voip-auth?action=logout` - Invalidate session

**Calls Edge Function (`voip-calls`):**
- GET `/voip-calls` - Get user's call history (paginated)
- POST `/voip-calls` - Initiate new call (mock mode)
- PATCH `/voip-calls?id=X` - Update call status
- GET `/voip-calls/stats` - Get call statistics

**Admin Edge Function (`voip-admin`):**
- GET `/voip-admin/users` - List all users
- PATCH `/voip-admin/users/:id` - Update user role/status
- GET `/voip-admin/numbers` - Manage all numbers
- POST `/voip-admin/numbers` - Create/assign numbers
- GET `/voip-admin/analytics` - System-wide analytics

---

## Phase 3: Frontend Architecture

### 3.1 New Pages & Routes

```text
src/pages/
  voip/
    Auth.tsx               # Login/Signup page
    ClientDashboard.tsx    # Client main dashboard
    AdminDashboard.tsx     # Admin main dashboard
    Dialer.tsx             # Softphone dialer interface
    CallHistory.tsx        # Call logs with filters
    MyNumbers.tsx          # Client's assigned numbers
    RequestNumber.tsx      # Number request form
    ApiKeys.tsx            # API key management
    Settings.tsx           # Account settings
    admin/
      Users.tsx            # User management
      Numbers.tsx          # Number inventory
      Analytics.tsx        # System analytics
      Requests.tsx         # Number requests queue
```

### 3.2 Updated App.tsx Routes

```typescript
// New routes to add
<Route path="/voip/auth" element={<VoipAuth />} />
<Route path="/voip/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
<Route path="/voip/dialer" element={<ProtectedRoute><Dialer /></ProtectedRoute>} />
<Route path="/voip/calls" element={<ProtectedRoute><CallHistory /></ProtectedRoute>} />
<Route path="/voip/numbers" element={<ProtectedRoute><MyNumbers /></ProtectedRoute>} />
<Route path="/voip/request-number" element={<ProtectedRoute><RequestNumber /></ProtectedRoute>} />
<Route path="/voip/api-keys" element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
<Route path="/voip/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

// Admin routes
<Route path="/voip/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
<Route path="/voip/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
<Route path="/voip/admin/numbers" element={<AdminRoute><AdminNumbers /></AdminRoute>} />
<Route path="/voip/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
<Route path="/voip/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
```

### 3.3 Component Structure

```text
src/components/voip/
  layout/
    VoipHeader.tsx         # Dashboard header with user menu
    VoipSidebar.tsx        # Navigation sidebar
    VoipLayout.tsx         # Layout wrapper
  auth/
    LoginForm.tsx          # Email/password login
    SignupForm.tsx         # Registration form
    ProtectedRoute.tsx     # Auth guard
    AdminRoute.tsx         # Admin role guard
  dialer/
    DialPad.tsx            # Numeric keypad
    CallDisplay.tsx        # Current call info
    CallControls.tsx       # Mute, hold, end buttons
    CallTimer.tsx          # Duration counter
  dashboard/
    StatCard.tsx           # Metric display card
    RecentCalls.tsx        # Recent activity list
    QuickActions.tsx       # Common action buttons
  numbers/
    NumberCard.tsx         # Phone number display
    RequestForm.tsx        # Number request form
  admin/
    UserTable.tsx          # User management table
    NumberTable.tsx        # Number inventory table
    AnalyticsCharts.tsx    # Charts for admin view
```

---

## Phase 4: UI Design Specifications

### 4.1 Dialer Interface (Client)

```text
+------------------------------------------+
|  [Logo]  VoIP Dialer        [User Menu]  |
+------------------------------------------+
|          |                               |
|  [Nav]   |   +-------------------+       |
|  - Home  |   |   909-687-4971    |       |
|  - Dial  |   +-------------------+       |
|  - Calls |   | 1 | 2 | 3 |               |
|  - Nums  |   | 4 | 5 | 6 |               |
|  - Keys  |   | 7 | 8 | 9 |               |
|          |   | * | 0 | # |               |
|          |   +-------------------+       |
|          |   [    CALL    ]              |
|          |                               |
|          |   Recent Calls:               |
|          |   - 909-xxx-xxxx (2m 34s)     |
|          |   - 951-xxx-xxxx (failed)     |
+------------------------------------------+
```

### 4.2 Admin Dashboard

```text
+------------------------------------------+
|  [Logo]  Admin Dashboard    [User Menu]  |
+------------------------------------------+
|          |   +-------+ +-------+ +------+|
|  [Nav]   |   | Users | | Calls | | Nums ||
|  - Dash  |   |  142  | | 1,234 | |  56  ||
|  - Users |   +-------+ +-------+ +------+|
|  - Nums  |                               |
|  - Anlyt |   [Call Volume Chart]         |
|  - Reqs  |   ████████████████████        |
|          |                               |
|          |   Recent Activity             |
|          |   +-------------------------+ |
|          |   | User signup: john@...   | |
|          |   | New call: 909-xxx       | |
|          |   | Number assigned: ...    | |
|          |   +-------------------------+ |
+------------------------------------------+
```

### 4.3 Color Scheme & Styling

- Maintains existing Hardhat Hosting brand colors
- Primary: Orange/amber accent (construction theme)
- Dashboard uses dark mode (slate-900 background)
- Cards with glass morphism effect
- Green indicators for active/success states
- Red for errors/failed calls

---

## Phase 5: Security Implementation

### 5.1 Authentication Flow

1. User submits email/password to `/voip-auth?action=login`
2. Edge function validates against MariaDB (bcrypt compare)
3. Returns JWT token (1hr expiry) + refresh token (7 days)
4. Frontend stores in httpOnly-like secure storage
5. All subsequent requests include `Authorization: Bearer <token>`
6. Edge functions validate JWT before processing

### 5.2 Input Validation

```typescript
// Using zod for all forms
const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100)
});

const signupSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
});

const phoneSchema = z.string().regex(/^\+?[1-9]\d{9,14}$/);
```

### 5.3 Rate Limiting

- Login: 5 attempts per 15 minutes per IP
- API calls: 100 requests per minute per user
- Call initiation: 10 per minute per user

---

## Phase 6: Mock VoIP Mode

Since we're starting with demo mode, calls will be simulated:

```typescript
// Mock call flow
const mockCall = async (toNumber: string) => {
  // 1. Create call record with 'initiated' status
  // 2. After 2s, update to 'ringing'
  // 3. After random 3-8s, either:
  //    - 'in_progress' (80% chance) - run timer
  //    - 'no_answer' (10% chance)
  //    - 'failed' (10% chance)
  // 4. After random 30-180s, 'completed'
  // 5. Update analytics
};
```

---

## Phase 7: Files Summary

### New Files to Create

| Category | File | Purpose |
|----------|------|---------|
| Pages | `src/pages/voip/Auth.tsx` | Login/signup page |
| Pages | `src/pages/voip/ClientDashboard.tsx` | Client home |
| Pages | `src/pages/voip/AdminDashboard.tsx` | Admin home |
| Pages | `src/pages/voip/Dialer.tsx` | Softphone UI |
| Pages | `src/pages/voip/CallHistory.tsx` | Call logs |
| Pages | `src/pages/voip/MyNumbers.tsx` | User's numbers |
| Pages | `src/pages/voip/RequestNumber.tsx` | Request form |
| Pages | `src/pages/voip/ApiKeys.tsx` | Key management |
| Pages | `src/pages/voip/Settings.tsx` | Account settings |
| Pages | `src/pages/voip/admin/Users.tsx` | User management |
| Pages | `src/pages/voip/admin/Numbers.tsx` | Number inventory |
| Pages | `src/pages/voip/admin/Analytics.tsx` | System stats |
| Pages | `src/pages/voip/admin/Requests.tsx` | Pending requests |
| Components | `src/components/voip/layout/*` | Layout components |
| Components | `src/components/voip/auth/*` | Auth components |
| Components | `src/components/voip/dialer/*` | Dialer components |
| Components | `src/components/voip/dashboard/*` | Dashboard widgets |
| Hooks | `src/hooks/useVoipAuth.ts` | Auth state hook |
| Hooks | `src/hooks/useVoipApi.ts` | API wrapper hook |
| Context | `src/contexts/VoipAuthContext.tsx` | Auth context |
| Edge Fn | `supabase/functions/voip-auth/index.ts` | Auth API |
| Edge Fn | `supabase/functions/voip-calls/index.ts` | Calls API |
| Edge Fn | `supabase/functions/voip-numbers/index.ts` | Numbers API |
| Edge Fn | `supabase/functions/voip-admin/index.ts` | Admin API |
| Edge Fn | `supabase/functions/voip-analytics/index.ts` | Stats API |
| Shared | `supabase/functions/_shared/db.ts` | MariaDB helper |
| Shared | `supabase/functions/_shared/auth.ts` | JWT helper |

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add all VoIP routes |
| `src/components/Header.tsx` | Add "Client Portal" login link |

---

## Phase 8: Required Secrets

Before implementation, you'll need to provide:

| Secret Name | Purpose |
|-------------|---------|
| `MARIADB_HOST` | Your MariaDB server hostname |
| `MARIADB_PORT` | Database port (usually 3306) |
| `MARIADB_USER` | Database username |
| `MARIADB_PASSWORD` | Database password |
| `MARIADB_DATABASE` | Database name |
| `JWT_SECRET` | Secret for signing JWT tokens |

---

## Implementation Order

1. **Database Setup** - Run SQL scripts on your MariaDB server
2. **Secrets Configuration** - Add MariaDB connection secrets
3. **Shared Edge Functions** - Create database and auth helpers
4. **Auth System** - Login/signup edge functions + frontend
5. **Client Dashboard** - Basic dashboard with stats
6. **Dialer** - Mock dialer interface
7. **Call History** - Call logs and filtering
8. **Numbers Management** - View and request numbers
9. **API Keys** - Key generation and management
10. **Admin Dashboard** - Admin-only features
11. **Analytics** - Charts and reporting

---

## Suggested Enhancements (Future)

- **Real-time Notifications**: WebSocket for incoming calls
- **Call Recording**: Store and playback recordings
- **SMS Support**: Send/receive text messages
- **Voicemail**: Missed call voicemail system
- **IVR Builder**: Create automated phone menus
- **Export Reports**: PDF/CSV call reports
- **Webhooks**: Notify external systems of events
- **Mobile PWA**: Progressive web app for mobile use

