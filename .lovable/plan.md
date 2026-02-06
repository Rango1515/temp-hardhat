

# Dialer Upgrade: Pricing Card + Coaching Panel + Mobile/Performance Polish

## Overview

This plan adds three things to the Dialer and How-To pages, plus responsive/performance improvements across the VoIP section.

---

## 1. Pricing Card on the Dialer Page

Add a compact, always-visible pricing reference card on the Dialer page, placed directly above the "Request Next Lead" button (inside the left column card, before the category selector).

**Content:**
- Title: "Current Pricing (for calls)" with a DollarSign icon
- Three rows in a clean, compact format:
  - Standard Hosting / Landing Page -- $25/mo
  - Advanced Website + Hosting -- $30/mo
  - Full Custom Website + Hosting -- $50/mo
- Info tooltip icon next to the title that says: "These prices include hosting, updates, and support -- competitive with industry averages."

**Behavior:**
- Visible both before a lead is requested AND while a lead is active (always visible)
- Collapsible via a small toggle so callers can hide it if they already know pricing
- Starts expanded by default
- Responsive: stacks cleanly on mobile

**Implementation:**
- Create a new component `src/components/voip/dialer/PricingCard.tsx`
- Import and render it in `Dialer.tsx` above the lead card area (before the grid)

---

## 2. Call Coaching Panel in How-To Page

Add a new "Pricing Pitch" coaching section to the existing How-To page.

**Content -- new Card after "Objection Handling":**
- Title: "Pricing Pitch Guide" with a DollarSign icon
- Three talking points:
  - "Our basic plan is $25/mo -- includes hosting + support"
  - "If you want more pages or functionality, we offer $30/mo"
  - "For fully custom sites with ongoing support it's $50/mo"
- Extra objection handlers specific to pricing:
  - "Too cheap?" -> "We keep prices low by focusing on great service and scalable hosting."
  - "Too expensive?" -> "Compare to average $79/mo retainers -- ours is cheaper with same support."
- Market context box: "Industry average for monthly website maintenance is $29-$79/mo. Our pricing is at the low end with full support included."

**Implementation:**
- Edit `src/pages/voip/HowTo.tsx` to add the new card section

---

## 3. Mobile + Performance Optimization

### Responsive UI fixes (Dialer.tsx)
- Ensure the 2-column grid (`lg:grid-cols-2`) degrades to single column on mobile (already does via `grid-cols-1`)
- Make the pricing card wrap cleanly on narrow screens
- Ensure all buttons and dropdowns have adequate touch targets (min 44px)
- Radio group in Call Outcome: change from `lg:grid-cols-4` to `sm:grid-cols-2` for better mobile wrapping (already correct)

### Prevent double-click on "Request Next Lead"
- Already handled by `isLoadingLead` disable -- verified correct
- Add an additional guard: track a `requestInFlight` ref to prevent race conditions if the button is clicked rapidly before state updates

### Skeleton loaders
- Add skeleton placeholders while category counts are loading on the Dialer
- Show skeleton in the pricing card area if needed (static content, so minimal)

### Lazy loading for heavy pages
- The Dialer page itself is lightweight -- no charts to lazy load
- Admin Dashboard, Leaderboard, and Analytics already load data on mount -- wrap chart components in `React.lazy` + `Suspense` in `App.tsx` for those routes

**Implementation files:**
- Edit `src/pages/voip/Dialer.tsx` -- add race condition guard ref, skeleton for categories
- Edit `src/App.tsx` -- convert heavy VoIP page imports to `React.lazy`

---

## Technical Details

### Files to Create

| File | Description |
|------|-------------|
| `src/components/voip/dialer/PricingCard.tsx` | Compact collapsible pricing reference card |

### Files to Edit

| File | Changes |
|------|---------|
| `src/pages/voip/Dialer.tsx` | Import and render PricingCard above the grid, add request-in-flight ref guard, add category loading skeleton |
| `src/pages/voip/HowTo.tsx` | Add "Pricing Pitch Guide" card with talking points and pricing objection handlers |
| `src/App.tsx` | Wrap heavy VoIP routes (Leaderboard, AdminDashboard, CallHistory, MyAnalytics) in React.lazy + Suspense |

### PricingCard Component Structure

```text
Collapsible Card
  Header: "Current Pricing" + DollarSign icon + Info tooltip + collapse toggle
  Content:
    Row: Standard Hosting / Landing Page .......... $25/mo
    Row: Advanced Website + Hosting ................ $30/mo
    Row: Full Custom Website + Hosting ............. $50/mo
    Footer note: "Includes hosting, updates, and support"
```

### Race Condition Prevention

```text
const requestInFlightRef = useRef(false);

requestNextLead:
  if (requestInFlightRef.current) return;
  requestInFlightRef.current = true;
  try { ... } finally { requestInFlightRef.current = false; }
```

### Lazy Loading Pattern

```text
const Leaderboard = React.lazy(() => import("./pages/voip/Leaderboard"));
const AdminDashboard = React.lazy(() => import("./pages/voip/admin/AdminDashboard"));
// etc.

<Suspense fallback={<LoadingSpinner />}>
  <Route path="/voip/leaderboard" element={<Leaderboard />} />
</Suspense>
```

