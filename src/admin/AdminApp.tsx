import React, { useState } from "react"
import Sidebar from "./components/Sidebar"
import TopBar from "./components/TopBar"
import PageHeader from "./components/PageHeader"
import Dashboard from "./pages/Dashboard"
import Content from "./pages/Content"
import Media from "./pages/Media"
import Homepage from "./pages/Homepage"
import Discovery from "./pages/Discovery"
import Customers from "./pages/Customers"
import Notifications from "./pages/Notifications"
import Moderation from "./pages/Moderation"
import Subscriptions from "./pages/Subscriptions"
import Events from "./pages/Events"
import Awards from "./pages/Awards"
import Sponsors from "./pages/Sponsors"
import Advertising from "./pages/Advertising"
import Analytics from "./pages/Analytics"
import Users from "./pages/Users"
import Settings from "./pages/Settings"
import { RouterProvider, useRouter } from "./router"
import { StoreProvider, useStore } from "./store/store"
import { OpsProvider } from "./store/ops/ops"
import { useOpsHeader } from "./pages/opsHeader"
import { ConfirmDialog, ToastHost, Badge } from "./ui"
import { STATUS_META, TYPE_META, typeFromTab, TYPE_ORDER } from "./store/meta"

interface PageMeta {
  breadcrumb: string[]
  title: string
  description: string
  component: React.ReactNode
}

const pages: Record<string, PageMeta> = {
  dashboard: { breadcrumb: ["Portal", "Dashboard"], title: "Dashboard", description: "Real-time overview of platform activity, content performance, and audience engagement.", component: <Dashboard /> },
  content: { breadcrumb: ["Portal", "Content", "Library"], title: "Content Library", description: "Create, edit and publish shows, movies, music videos, audio tracks, articles and events. Changes are kept in this browser only.", component: null },
  media: { breadcrumb: ["Portal", "Content", "Media Library"], title: "Media Library", description: "Add and replace video, image, audio and caption files. Uploads and processing here are simulated; nothing leaves this browser.", component: <Media /> },
  homepage: { breadcrumb: ["Portal", "Content", "Homepage & Featured"], title: "Homepage & Featured Content", description: "Choose the editorial selections shown on the customer homepage, order the sections, and preview the layout before applying it to the prototype.", component: <Homepage /> },
  discovery: { breadcrumb: ["Portal", "Content", "Discovery"], title: "Categories & Discovery", description: "Manage content categories, genres, tags, age ratings, and regional/language classifications that power search and browsing.", component: <Discovery /> },
  customers: { breadcrumb: ["Portal", "Audience", "Customers"], title: "Customers", description: "View and manage all registered customer accounts, profiles, subscription status, and account activity.", component: <Customers /> },
  notifications: { breadcrumb: ["Portal", "Audience", "Notifications"], title: "Notifications", description: "Compose, preview and test messages, then schedule or send them. Delivery is simulated in this prototype; nothing is sent to anyone.", component: <Notifications /> },
  moderation: { breadcrumb: ["Portal", "Audience", "Moderation"], title: "Moderation Queue", description: "Open a report, inspect its context, then approve the content, dismiss the report or remove the content. Every decision needs a reason.", component: <Moderation /> },
  subscriptions: { breadcrumb: ["Portal", "Partners & Events", "Subscriptions"], title: "MGTV+ & Subscriptions", description: "Configure subscription plans, manage subscriber records, track payment status, and monitor revenue performance.", component: <Subscriptions /> },
  events: { breadcrumb: ["Portal", "Partners & Events", "Events"], title: "Events", description: "Create events, set venue or online details and timezone, and track the event lifecycle separately from its broadcast.", component: <Events /> },
  awards: { breadcrumb: ["Portal", "Partners & Events", "Awards"], title: "Awards", description: "Manage categories, nominees and voting windows, and control when results are released. Voting rules are not final.", component: <Awards /> },
  sponsors: { breadcrumb: ["Portal", "Partners & Events", "Sponsors"], title: "Sponsors", description: "Manage sponsor organizations, contacts and brand assets, and associate them with shows and events.", component: <Sponsors /> },
  advertising: { breadcrumb: ["Portal", "Partners & Events", "Advertising"], title: "Advertising", description: "Manage advertisers and campaigns: placements, creative, dates, review decisions and engagement reporting (mock data).", component: <Advertising /> },
  analytics: { breadcrumb: ["Portal", "Operations", "Analytics"], title: "Analytics & Reports", description: "Platform-wide performance data covering viewership, subscribers, content, events, and revenue across all categories.", component: <Analytics /> },
  users: { breadcrumb: ["Portal", "Operations", "Admin Users"], title: "Admin Users", description: "Manage associate accounts, roles, and permissions for everyone with access to this administration portal.", component: <Users /> },
  settings: { breadcrumb: ["Portal", "Operations", "Settings"], title: "Platform Settings", description: "Organization details, defaults and alert preferences for this portal. Changes are kept in this browser only.", component: <Settings /> },
}

const WIRED = new Set(["content", "media", "homepage", "dashboard", "sponsors", "advertising", "events", "awards", "moderation", "notifications", "users", "settings"])

function Shell() {
  const { route, pending, resolvePending } = useRouter()
  const { getContent } = useStore()
  const [menu, setMenu] = useState(false)
  const page = route.section in pages ? route.section : "dashboard"
  const base = pages[page]
  const opsHeader = useOpsHeader(page, route.parts)

  let header: { breadcrumb: { label: string; to?: string }[]; title: string; description: string; badge?: React.ReactNode } = {
    breadcrumb: base.breadcrumb.map((label, i) => ({ label, to: page === "content" && label === "Library" ? "/admin/content" : undefined })),
    title: base.title,
    description: base.description,
  }

  if (page === "content" && route.parts[1]) {
    const type = TYPE_ORDER.find((t) => TYPE_META[t].tab === route.parts[0]) ?? typeFromTab(route.parts[0])
    const isNew = route.parts[1] === "new"
    const item = isNew ? undefined : getContent(route.parts[1])
    header = {
      breadcrumb: [
        { label: "Portal" },
        { label: "Content" },
        { label: "Library", to: "/admin/content" },
        { label: TYPE_META[type].plural, to: `/admin/content/${TYPE_META[type].tab}` },
        { label: isNew ? `New ${TYPE_META[type].label.toLowerCase()}` : item?.title || "Not found" },
      ],
      title: isNew ? `Add ${TYPE_META[type].label.toLowerCase()}` : item ? `Edit ${TYPE_META[type].label.toLowerCase()}` : "Content not found",
      description: isNew
        ? "Fill in the details, save a draft at any time, and publish once every requirement is met."
        : item
          ? `${item.title || "Untitled"} · ID ${item.id}`
          : "This item does not exist in the local prototype store.",
      badge: item ? <Badge color={STATUS_META[item.status].color}>{STATUS_META[item.status].label}</Badge> : undefined,
    }
  }

  if (opsHeader) header = opsHeader

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <Sidebar active={page} open={menu} onClose={() => setMenu(false)} />
      <div className={`sidebar-scrim${menu ? " open" : ""}`} onClick={() => setMenu(false)} aria-hidden />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar onMenu={() => setMenu(true)} />
        <main style={{ flex: 1, minWidth: 0 }}>
          <PageHeader {...header} />
          {!WIRED.has(page) && (
            <div role="note" style={{ margin: "16px 28px 0", padding: "10px 14px", border: "1px solid var(--border-light)", borderLeft: "3px solid var(--yellow)", borderRadius: 8, fontSize: 13, color: "var(--text-secondary)", background: "var(--card)" }}>
              Preview only. This section is out of scope for the current prototype pass, so its buttons do not change anything. Content, Media, Homepage, Sponsors, Advertising, Events, Awards, Moderation, Notifications, Admin Users and Settings are interactive.
            </div>
          )}
          {page === "content" ? <Content /> : base.component}
        </main>
      </div>
      {pending && (
        <ConfirmDialog
          title="Discard unsaved changes?"
          confirmLabel="Discard changes"
          cancelLabel="Keep editing"
          danger
          onCancel={() => resolvePending(false)}
          onConfirm={() => resolvePending(true)}
        >
          You have edits that have not been saved. Leaving now will lose them. To keep them, go back and choose Save draft or Apply to prototype.
        </ConfirmDialog>
      )}
      <ToastHost />
    </div>
  )
}

export default function AdminApp() {
  return (
    <RouterProvider>
      <StoreProvider>
        <OpsProvider>
          <Shell />
        </OpsProvider>
      </StoreProvider>
    </RouterProvider>
  )
}
