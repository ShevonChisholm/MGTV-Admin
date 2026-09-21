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

interface PageMeta {
  breadcrumb: string[]
  title: string
  description: string
  component: React.ReactNode
}

const pages: Record<string, PageMeta> = {
  dashboard: {
    breadcrumb: ["Portal", "Dashboard"],
    title: "Dashboard",
    description: "Real-time overview of platform activity, content performance, and audience engagement.",
    component: <Dashboard />,
  },
  content: {
    breadcrumb: ["Portal", "Content", "Library"],
    title: "Content Library",
    description: "Manage all shows, movies, music, sports coverage, news articles, and lifestyle stories published on MGTV.",
    component: <Content />,
  },
  media: {
    breadcrumb: ["Portal", "Content", "Media Library"],
    title: "Media Library",
    description: "Upload, replace, and manage all video files, images, and live stream configurations. Monitor encoding status and storage.",
    component: <Media />,
  },
  homepage: {
    breadcrumb: ["Portal", "Content", "Homepage & Featured"],
    title: "Homepage & Featured Content",
    description: "Control what appears in every section of the customer homepage — heroes, carousels, spotlights, and promotional banners.",
    component: <Homepage />,
  },
  discovery: {
    breadcrumb: ["Portal", "Content", "Discovery"],
    title: "Categories & Discovery",
    description: "Manage content categories, genres, tags, age ratings, and regional/language classifications that power search and browsing.",
    component: <Discovery />,
  },
  customers: {
    breadcrumb: ["Portal", "Audience", "Customers"],
    title: "Customers",
    description: "View and manage all registered customer accounts, profiles, subscription status, and account activity.",
    component: <Customers />,
  },
  notifications: {
    breadcrumb: ["Portal", "Audience", "Notifications"],
    title: "Notifications & Communications",
    description: "Send push notifications, emails, and in-app messages. Manage newsletter subscribers, templates, and communication history.",
    component: <Notifications />,
  },
  moderation: {
    breadcrumb: ["Portal", "Audience", "Moderation"],
    title: "Moderation Queue",
    description: "Review and action flagged content, user reports, and automated moderation alerts across the platform.",
    component: <Moderation />,
  },
  subscriptions: {
    breadcrumb: ["Portal", "Commerce", "Subscriptions"],
    title: "MGTV+ & Subscriptions",
    description: "Configure subscription plans, manage subscriber records, track payment status, and monitor revenue performance.",
    component: <Subscriptions />,
  },
  events: {
    breadcrumb: ["Portal", "Commerce", "Events"],
    title: "Events & Ticketing",
    description: "Create and publish events — concerts, festivals, sports, workshops, and VIP experiences — with ticket link integrations.",
    component: <Events />,
  },
  awards: {
    breadcrumb: ["Portal", "Commerce", "Awards"],
    title: "Awards & Voting",
    description: "Manage MGTV Award categories, nominees, and voting periods. Monitor live vote counts and configure results.",
    component: <Awards />,
  },
  sponsors: {
    breadcrumb: ["Portal", "Commerce", "Sponsors"],
    title: "Sponsors",
    description: "Manage sponsor profiles, brand assets, sponsorship packages, and their associations with content and events.",
    component: <Sponsors />,
  },
  advertising: {
    breadcrumb: ["Portal", "Commerce", "Advertising"],
    title: "Advertising",
    description: "Manage advertisers, campaign details, creative placements, budgets, and advertising performance reports.",
    component: <Advertising />,
  },
  analytics: {
    breadcrumb: ["Portal", "Operations", "Analytics"],
    title: "Analytics & Reports",
    description: "Platform-wide performance data covering viewership, subscribers, content, events, and revenue across all categories.",
    component: <Analytics />,
  },
  users: {
    breadcrumb: ["Portal", "Operations", "Admin Users"],
    title: "Admin Users",
    description: "Manage associate accounts, roles, and permissions for everyone with access to this administration portal.",
    component: <Users />,
  },
  settings: {
    breadcrumb: ["Portal", "Operations", "Settings"],
    title: "Platform Settings",
    description: "Configure global platform preferences, branding, regions, languages, payment, and API integrations.",
    component: <Settings />,
  },
}

function getInitialPage() {
  const path = window.location.pathname
  // Support /admin, /admin/, /admin/content, etc.
  const match = path.match(/^\/admin\/?([a-z]*)/)
  const id = match?.[1] ?? ""
  return id in pages ? id : "dashboard"
}

export default function AdminApp() {
  const [page, setPage] = useState(getInitialPage)

  const navigate = (id: string) => {
    setPage(id)
    window.history.pushState(null, "", `/admin/${id}`)
  }

  const meta = pages[page] ?? pages.dashboard

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <Sidebar active={page} onNavigate={navigate} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar page={page} />
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <PageHeader
            breadcrumb={meta.breadcrumb}
            title={meta.title}
            description={meta.description}
          />
          {meta.component}
        </main>
      </div>
    </div>
  )
}
