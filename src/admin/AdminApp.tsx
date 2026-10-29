import ConnectedPodcasts from "./pages/ConnectedPodcasts";
import ScreenTransition from "./components/ScreenTransition";
import ConnectedCareers from "./pages/ConnectedCareers";
import ConnectedMedia from "./pages/ConnectedMedia";
import PageErrorBoundary from "./components/PageErrorBoundary";
import ConnectedOnboarding from "./pages/ConnectedOnboarding";
import ConnectedAccess from "./pages/ConnectedAccess";
import StaffSessionBoundary from "./components/StaffSessionBoundary";
import ConnectedCommunications from "./pages/ConnectedCommunications";
import ConnectedCommerce from "./pages/ConnectedCommerce";
import ConnectedLifestyle from "./pages/ConnectedLifestyle";
import ConnectedNews from './pages/ConnectedNews';
import ConnectedMusicLibrary from './pages/ConnectedMusicLibrary';
import StaffAuth from "./pages/StaffAuth";
import ConnectedSubscriptionTiers from "./pages/ConnectedSubscriptionTiers";
import React, { useCallback, useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import PageHeader from "./components/PageHeader";
import Dashboard from "./pages/Dashboard";
import Content from "./pages/Content";
import Media from "./pages/Media";
import Homepage from "./pages/Homepage";
import Discovery from "./pages/Discovery";
import Customers from "./pages/Customers";
import Notifications from "./pages/Notifications";
import Moderation from "./pages/Moderation";
import Subscriptions from "./pages/Subscriptions";
import Events from "./pages/Events";
import Awards from "./pages/Awards";
import Sponsors from "./pages/Sponsors";
import Advertising from "./pages/Advertising";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import { RouterProvider, useRouter } from "./router";
import { StoreProvider, useStore } from "./store/store";
import { OpsProvider } from "./store/ops/ops";
import { useOpsHeader } from "./pages/opsHeader";
import { connected } from "./api/client";
import ConnectedUsers from "./pages/ConnectedUsers";
import { ConfirmDialog, ToastHost, Badge } from "./ui";
import { STATUS_META, TYPE_META, typeFromTab, TYPE_ORDER } from "./store/meta";

interface PageMeta {
  breadcrumb: string[];
  title: string;
  description: string;
  component: React.ReactNode;
}

const pages: Record<string, PageMeta> = {
 podcasts:{breadcrumb:["Portal","Content","Podcasts"],title:"Podcasts",description:"Shape conversations, organize audio and video episodes, and publish with explicit permissions.",component:<ConnectedPodcasts/>},
 careers:{breadcrumb:["Portal","Operations","Careers"],title:"Careers",description:"Create opportunities, review saved vacancies and manage external applications.",component:<ConnectedCareers/>},
 onboarding:{breadcrumb:["Portal","Operations","Staff Onboarding"],title:"Staff Onboarding",description:"Guide staff through invitations, secure setup, orientation and explicit access review.",component:<ConnectedOnboarding/>},
 access:{breadcrumb:["Portal","Operations","Roles & Permissions"],title:"Roles, Permissions & Resources",description:"Manage registered capabilities, reusable roles and explicit staff access.",component:<ConnectedAccess/>},
 communications:{breadcrumb:["Portal","Audience","Contact & Newsletter"],title:"Contact & Newsletter",description:"Handle enquiries, subscriber consent and newsletter delivery.",component:<ConnectedCommunications/>},
 commerce:{breadcrumb:["Portal","Shop & Commerce"],title:"Shop & Commerce",description:"Manage products, inventory, dated availability and customer orders.",component:<ConnectedCommerce/>},
 lifestyle:{breadcrumb:["Portal","Content","Lifestyle & Culture"],title:"Lifestyle & Culture",description:"Create Caribbean lifestyle stories, review saved revisions and publish with explicit permissions.",component:<ConnectedLifestyle/>},
 news: {breadcrumb:["Portal","Content","News"],title:"News & Articles",description:"Craft stories, review saved revisions and publish with explicit permissions.",component:<ConnectedNews/>},
  "music-library": {breadcrumb:["Portal","Content","Music library"],title:"Artists, Albums & Playlists",description:"Shape artist profiles, album track lists and editorial playlists. Publish saved revisions with explicit permissions.",component:<ConnectedMusicLibrary/>},
  dashboard: {
    breadcrumb: ["Portal", "Dashboard"],
    title: "Dashboard",
    description:
      "Real-time overview of platform activity, content performance, and audience engagement.",
    component: <Dashboard />,
  },
  content: {
    breadcrumb: ["Portal", "Content", "Library"],
    title: "Content Library",
    description:
      "Create, edit and publish shows, movies, music videos, audio tracks, articles and events. Changes are kept in this browser only.",
    component: null,
  },
  media: {
    breadcrumb: ["Portal", "Content", "Media Library"],
    title: "Media Library",
    description:
      connected ? "Browse real uploads, processing states and saved entity references. Upload files from their intended editor." : "Add and replace video, image, audio and caption files. Uploads and processing here are simulated; nothing leaves this browser.",
    component: connected ? <ConnectedMedia /> : <Media />,
  },
  homepage: {
    breadcrumb: ["Portal", "Content", "Homepage & Featured"],
    title: "Homepage & Featured Content",
    description:
      "Choose the editorial selections shown on the customer homepage, order the sections, and preview the layout before applying it to the prototype.",
    component: <Homepage />,
  },
  discovery: {
    breadcrumb: ["Portal", "Content", "Discovery"],
    title: "Categories & Discovery",
    description:
      "Manage content categories, genres, tags, age ratings, and regional/language classifications that power search and browsing.",
    component: <Discovery />,
  },
  customers: {
    breadcrumb: ["Portal", "Audience", "Customers"],
    title: "Customers",
    description:
      "View and manage all registered customer accounts, profiles, subscription status, and account activity.",
    component: <Customers />,
  },
  notifications: {
    breadcrumb: ["Portal", "Audience", "Notifications"],
    title: "Notifications",
    description:
      "Compose, preview and test messages, then schedule or send them. Delivery is simulated in this prototype; nothing is sent to anyone.",
    component: <Notifications />,
  },
  moderation: {
    breadcrumb: ["Portal", "Audience", "Moderation"],
    title: "Moderation Queue",
    description:
      "Open a report, inspect its context, then approve the content, dismiss the report or remove the content. Every decision needs a reason.",
    component: <Moderation />,
  },
  subscriptions: {
    breadcrumb: ["Portal", "Partners & Events", "Subscriptions"],
    title: "MGTV+ & Subscriptions",
    description:
      "Configure subscription plans, manage subscriber records, track payment status, and monitor revenue performance.",
    component: <Subscriptions />,
  },
  events: {
    breadcrumb: ["Portal", "Partners & Events", "Events"],
    title: "Events",
    description:
      "Create events, set venue or online details and timezone, and track the event lifecycle separately from its broadcast.",
    component: <Events />,
  },
  awards: {
    breadcrumb: ["Portal", "Partners & Events", "Awards"],
    title: "Awards",
    description:
      "Manage categories, nominees and voting windows, and control when results are released. Voting rules are not final.",
    component: <Awards />,
  },
  sponsors: {
    breadcrumb: ["Portal", "Partners & Events", "Sponsors"],
    title: "Sponsors",
    description:
      "Manage sponsor organizations, contacts and brand assets, and associate them with shows and events.",
    component: <Sponsors />,
  },
  advertising: {
    breadcrumb: ["Portal", "Partners & Events", "Advertising"],
    title: "Advertising",
    description:
      "Manage advertisers and campaigns: placements, creative, dates, review decisions and engagement reporting (mock data).",
    component: <Advertising />,
  },
  analytics: {
    breadcrumb: ["Portal", "Operations", "Analytics"],
    title: "Analytics & Reports",
    description:
      "Platform-wide performance data covering viewership, subscribers, content, events, and revenue across all categories.",
    component: <Analytics />,
  },
  users: {
    breadcrumb: ["Portal", "Operations", "Admin Users"],
    title: "Admin Users",
    description:
      "Manage associate accounts, roles, and permissions for everyone with access to this administration portal.",
    component: <Users />,
  },
  settings: {
    breadcrumb: ["Portal", "Operations", "Settings"],
    title: "Platform Settings",
    description:
      "Organization details, defaults and alert preferences for this portal. Changes are kept in this browser only.",
    component: <Settings />,
  },
};

const WIRED = new Set([
  "podcasts",
 "careers",
 "onboarding",
 "access",
 "communications",
  "lifestyle",
  "news",
  "music-library",
  "content",
  "media",
  "homepage",
  "dashboard",
  "sponsors",
  "advertising",
  "events",
  "awards",
  "moderation",
  "notifications",
  "users",
  "settings",
]);

function Shell() {
  const { route, pending, resolvePending } = useRouter();
  const { getContent } = useStore();
  const [menu, setMenu] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);
  const page = route.section in pages ? route.section : "dashboard";
  const base = pages[page];
  const opsHeader = useOpsHeader(page, route.parts);

  let header: {
    breadcrumb: { label: string; to?: string }[];
    title: string;
    description: string;
    badge?: React.ReactNode;
  } = {
    breadcrumb: base.breadcrumb.map((label, i) => ({
      label,
      to:
        page === "content" && label === "Library"
          ? "/admin/content"
          : undefined,
    })),
    title: base.title,
    description: base.description,
  };

  if (page === "content" && route.parts[1]) {
    const type =
      TYPE_ORDER.find((t) => TYPE_META[t].tab === route.parts[0]) ??
      typeFromTab(route.parts[0]);
    const isNew = route.parts[1] === "new";
    const item = isNew ? undefined : getContent(route.parts[1]);
    header = {
      breadcrumb: [
        { label: "Portal" },
        { label: "Content" },
        { label: "Library", to: "/admin/content" },
        {
          label: TYPE_META[type].plural,
          to: `/admin/content/${TYPE_META[type].tab}`,
        },
        {
          label: isNew
            ? `New ${TYPE_META[type].label.toLowerCase()}`
            : item?.title || "Not found",
        },
      ],
      title: isNew
        ? `Add ${TYPE_META[type].label.toLowerCase()}`
        : item
          ? `Edit ${TYPE_META[type].label.toLowerCase()}`
          : "Content not found",
      description: isNew
        ? "Fill in the details, save a draft at any time, and publish once every requirement is met."
        : item
          ? `${item.title || "Untitled"} · ID ${item.id}`
          : "This item does not exist in the local prototype store.",
      badge: item ? (
        <Badge color={STATUS_META[item.status].color}>
          {STATUS_META[item.status].label}
        </Badge>
      ) : undefined,
    };
  }

  if (opsHeader) header = opsHeader;
  if(connected&&page==="settings")header={breadcrumb:[{label:"Portal"},{label:"Operations"},{label:"Platform Settings"}],title:"Platform Settings",description:"Manage organization defaults and saved staff alert preferences with explicit permissions, versioned changes and an audit history."};
  if(connected&&page==="analytics")header={breadcrumb:[{label:"Portal"},{label:"Operations"},{label:"Analytics"}],title:"Analytics & Reports",description:"Explore qualified playback, audience trends and returning viewers. Observed activity and synthetic development data are kept separate."};
  if(connected&&page==="dashboard")header={breadcrumb:[{label:"Portal"},{label:"Dashboard"}],title:"Dashboard",description:"Audience activity and current operational counts from the database, refreshed on request."};
  if(connected&&page==="homepage") header={breadcrumb:[{label:"Portal"},{label:"Homepage & Featured",to:"/admin/homepage"}],title:"Homepage & Featured Content",description:"Arrange editorial sections and featured picks, review saved revisions and publish with explicit permissions."};
  if(connected&&page==="moderation") header={breadcrumb:[{label:"Portal"},{label:"Audience"},{label:"Moderation",to:"/admin/moderation"}],title:"Moderation",description:"Review content reports, record decisions and take published items down with explicit permission."};
  if(connected&&page==="notifications") header={breadcrumb:[{label:"Portal"},{label:"Audience"},{label:"Notifications",to:"/admin/notifications"}],title:"Notifications",description:"Compose, preview and schedule customer updates. In-app delivery is connected; email stays in the private development inbox."};
  if(connected&&page==="discovery")header={breadcrumb:[{label:"Portal"},{label:"Categories & Discovery",to:"/admin/discovery"}],title:"Categories & Discovery",description:"Manage shared categories, genres and editorial tags, protected age-rating descriptions, and region/language reference labels."};
  if(connected&&page==="advertising") header={breadcrumb:[{label:"Portal"},{label:"Advertising",to:"/admin/advertising"}],title:"Advertising",description:"Manage advertisers, review campaign revisions and deliver approved creative with subscription-aware ad policies."};
  if (connected && page === "sponsors") header={breadcrumb:[{label:"Portal"},{label:"Sponsors",to:"/admin/sponsors"}],title:route.parts[0]?"Sponsor organization":"Sponsors",description:"Manage sponsor organizations, private contacts, approved branding and show/event associations."};
  if (connected && page === "awards") header={breadcrumb:[{label:"Portal"},{label:"Awards & Voting",to:"/admin/awards"}],title:route.parts[0]?"Award program":"Awards & Voting",description:"Celebrate Caribbean excellence with verified nominees, one final account vote per category and reviewed results."};
  if (connected && page === "events") header={breadcrumb:[{label:"Portal"},{label:"Events",to:"/admin/events"}],title:route.parts[0]?"Event editor":"Events",description:"Prepare event details and media. Publication, event lifecycle and broadcast availability are separate."};
  if(connected&&page==="content") { const section=route.parts[0]||"shows"; const label=section==="movies"?"Movies":section==="audio"?"Audio tracks":section==="sports"?"Sports":section==="music-videos"||section==="music"?"Music videos":"Shows"; header={breadcrumb:[{label:"Portal"},{label:"Content Library",to:"/admin/content"},{label,to:"/admin/content/"+section}],title:route.parts[1]?"Content workspace":"Content Library",description:"Explore artwork, shape saved drafts and review publication. Your changes are stored securely by the API."}; }
  if (connected && page === "content" && ["music","music-videos","audio"].includes(route.parts[0])) header={breadcrumb:[{label:"Portal"},{label:"Music",to:"/admin/content/music-videos"}],title:route.parts[1]?"Music workspace":route.parts[0] === "audio"?"Audio tracks":"Music videos",description:"Publish verified music videos and MP3 tracks with saved revisions and explicit permissions."};
  if (connected && page === "content" && route.parts[0] === "sports") header={breadcrumb:[{label:"Portal"},{label:"Sports",to:"/admin/content/sports"}],title:route.parts[1]?"Sports workspace":"Sports",description:"Prepare sporting highlights and replays, review saved revisions and publish with explicit permissions."};
  if (connected && page === "content" && route.parts[0] === "movies")
    header = {
      breadcrumb: [
        { label: "Portal" },
        { label: "Movies", to: "/admin/content/movies" },
      ],
      title: route.parts[1] ? "Movie workspace" : "Movies",
      description:
        "Create drafts, prepare media and publish with your assigned permissions.",
    };
  if (
    connected &&
    page === "content" &&
    (!route.parts[0] || route.parts[0] === "shows")
  )
    header = {
      breadcrumb: [
        { label: "Portal" },
        { label: "Shows", to: "/admin/content/shows" },
      ],
      title: route.parts[1] ? "Series workspace" : "Shows",
      description:
        "Manage shows, seasons and episodes with saved revisions and explicit publication permissions.",
    };
  if (connected && page === "subscriptions")
    header = {
      breadcrumb: [{ label: "Portal" }, { label: "Subscriptions" }],
      title: "MGTV+ & Subscriptions",
      description:
        "Roots, Rhythm and Gold viewing policies. Staff cannot grant subscription access.",
    };
  if (connected && (page === "users" || page === "customers"))
    header = {
      breadcrumb: [
        { label: "Portal" },
        {
          label: page === "users" ? "Staff" : "Customers",
          to: `/admin/${page}`,
        },
      ],
      title: page === "users" ? "Staff users" : "Customer users",
      description:
        page === "users"
          ? "Staff identities, account status and secure access. Staff authentication stays separate from customers."
          : "Customer households, profiles and viewing policies. Open an account for its full workspace.",
    };

  if (connected && route.section === "auth")
    return (
      <StaffAuth
        action={
          route.parts[0] as
            "accept-invite" | "forgot-password" | "reset-password"
        }
        onAuthenticated={async () => {
          window.location.assign("/admin/users");
        }}
      />
    );
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "var(--font-body)",
      }}
    >
      <Sidebar active={page} open={menu} onClose={closeMenu} />
      <div
        className={`sidebar-scrim${menu ? " open" : ""}`}
        onClick={closeMenu}
        aria-hidden
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <TopBar onMenu={() => setMenu(true)} menuOpen={menu} />
        <main className="admin-workspace" style={{ flex: 1, minWidth: 0 }}>
          <PageHeader {...header} />
          {!WIRED.has(page) &&
            !(
              connected &&
              (page === "customers" || page === "subscriptions" || page === "discovery" || page === "commerce" || page === "analytics" || page === "dashboard")
            ) && (
              <div
                role="note"
                style={{
                  margin: "16px 28px 0",
                  padding: "10px 14px",
                  border: "1px solid var(--border-light)",
                  borderLeft: "3px solid var(--yellow)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  background: "var(--card)",
                }}
              >
                Preview only. This section is out of scope for the current
                prototype pass, so its buttons do not change anything. Content,
                Media, Homepage, Sponsors, Advertising, Awards,
                Moderation, Notifications, Admin Users and Settings are
                interactive.
              </div>
            )}
          <ScreenTransition screenKey={route.path}>
          <PageErrorBoundary resetKey={route.path}>
          {connected && page === "subscriptions" ? (
            <ConnectedSubscriptionTiers />
          ) : connected && (page === "users" || page === "customers") ? (
            <ConnectedUsers
              key={`${page}:${route.parts[0] ?? "list"}`}
              kind={page === "users" ? "staff" : "customer"}
              id={route.parts[0]}
            />
          ) : page === "content" ? (
            <Content />
          ) : (
            base.component
          )}
          </PageErrorBoundary>
          </ScreenTransition>
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
          You have edits that have not been saved. Leaving now will lose them.
          Keep editing to save your changes before leaving.
        </ConfirmDialog>
      )}
      <ToastHost />
    </div>
  );
}

function StaffSessionBoundaryIfConnected({children}:{children:React.ReactNode}){return connected?<StaffSessionBoundary>{children}</StaffSessionBoundary>:<>{children}</>}

export default function AdminApp() {
  return (
    <RouterProvider>
      <StaffSessionBoundaryIfConnected>
      <StoreProvider>
        <OpsProvider>
          <Shell />
        </OpsProvider>
      </StoreProvider>
      </StaffSessionBoundaryIfConnected>
    </RouterProvider>
  );
}
