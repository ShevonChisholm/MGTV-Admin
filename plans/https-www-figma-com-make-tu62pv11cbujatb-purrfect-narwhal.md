# Associate Administration Portal — MGTV WEB

## Context

The customer-facing MGTV web app needs a companion back-office tool for associates (staff/moderators). This portal lets associates manage content, users, analytics, and moderation — all in one place. It lives in the same repo as a separate route tree (`/admin/*`) so the customer app is untouched.

## Aesthetic Stance

**Swiss / editorial dark** — precise grid, deep charcoal ground, single accent (sharp red-orange consistent with a media brand), neo-grotesque sans throughout, mono for data labels. Authoritative and functional, no decorative flourishes.

- **Display font**: Instrument Sans (Google Fonts) — clean, wide, professional
- **Body font**: Inter (Google Fonts) — high readability in dense tables
- **Mono font**: JetBrains Mono — status tags, IDs, timestamps
- **Ground**: near-black `#0d0e10`, sidebar `#111318`, card `#181b21`
- **Accent**: `#e8441a` (warm red-orange — media brand energy)
- **Border**: `#2a2d35` hairline

## Architecture

All admin UI lives under `src/admin/`. The existing `src/App.tsx` gains a route check: if URL starts with `/admin`, render `AdminApp`; otherwise render the existing customer app (blank div currently). This avoids any router dependency.

```
src/
  admin/
    AdminApp.tsx          — shell: sidebar + outlet
    components/
      Sidebar.tsx
      TopBar.tsx
      StatCard.tsx
      DataTable.tsx
    pages/
      Dashboard.tsx       — KPI cards + charts (recharts)
      Content.tsx         — shows/episodes table with filters
      Users.tsx           — associate/viewer user table
      Moderation.tsx      — flagged content queue
      Analytics.tsx       — viewership charts
      Settings.tsx        — portal settings
  App.tsx                 — updated with /admin branch
  index.css               — Google Fonts imports added at top
```

## Implementation Steps

1. **Fonts + tokens** — Prepend Google Fonts `@import` for Instrument Sans, Inter, JetBrains Mono to `src/index.css`. Add CSS custom properties for the dark palette under `:root`.

2. **App.tsx routing** — Add a simple `window.location.pathname.startsWith('/admin')` branch to render `AdminApp` vs the customer shell. No react-router needed for this self-contained admin.

3. **AdminApp.tsx** — Fixed sidebar (240px) + main content area. Sidebar has logo, nav items with icons (SVG inline), active state with accent underline. TopBar shows page title + associate avatar/name.

4. **Sidebar.tsx** — Nav items: Dashboard, Content, Users, Moderation, Analytics, Settings. Active item gets accent-colored left border + slightly lighter bg.

5. **Dashboard.tsx** — 4 stat cards (Total Views, Active Users, Content Items, Flagged Items), then a 2-col layout: line chart (weekly views via recharts) + bar chart (content category breakdown).

6. **Content.tsx** — Searchable, filterable table of shows/episodes. Columns: Thumbnail, Title, Category, Status (badge), Published Date, Views, Actions. Realistic mock data (15+ rows). Row hover state.

7. **Users.tsx** — Table of associates/viewers. Columns: Name, Role, Email, Status, Last Active, Actions. Role badges (Admin, Moderator, Viewer) in distinct colors.

8. **Moderation.tsx** — Queue of flagged content reports. Columns: Content Title, Reporter, Reason, Date, Priority, Actions (Approve / Remove). Priority badges.

9. **Analytics.tsx** — Full-width charts: area chart for daily active users, pie chart for device breakdown, bar chart for top content. All recharts with dark theme.

10. **Settings.tsx** — Form sections: Portal preferences, notification settings, API key display (mono), save button.

## Dependencies

- `recharts` — install via pnpm for charts (Dashboard + Analytics pages)

## Verification

- Navigate to `/admin` in the preview — admin shell renders, sidebar visible
- Click each nav item — page content updates
- Charts render on Dashboard and Analytics pages
- Tables show realistic mock data with working search/filter on Content page
- Customer app still renders at `/` (blank div — unchanged)
