import React from "react"
import { useOps } from "../store/ops/ops"
import { StatusPill } from "../ui/ops"
import { CAMPAIGN_STATUS, LIFECYCLE, ORG_STATUS, REPORT_OUTCOME, VOTING } from "./opsMeta"

export interface Header {
  breadcrumb: { label: string; to?: string }[]
  title: string
  description: string
  badge?: React.ReactNode
}

const P = { label: "Portal" }

/** Header for detail routes of the operational sections. Returns null for list pages. */
export function useOpsHeader(page: string, parts: string[]): Header | null {
  const o = useOps()
  const [a, b] = parts
  switch (page) {
    case "sponsors": {
      if (!a) return null
      const s = a === "new" ? undefined : o.sponsors.find((x) => x.id === a)
      return {
        breadcrumb: [P, { label: "Partners & Events" }, { label: "Sponsors", to: "/admin/sponsors" }, { label: a === "new" ? "New sponsor" : s?.name ?? "Not found" }],
        title: a === "new" ? "Add sponsor" : s ? s.name : "Sponsor not found",
        description: a === "new" ? "Create the organization first. Contacts, brand assets and associations are added after it is saved." : s ? "Organization profile, contacts, brand assets, associations and history." : "This sponsor does not exist in the local prototype.",
        badge: s ? <StatusPill map={ORG_STATUS} value={s.status} /> : undefined,
      }
    }
    case "advertising": {
      const tab = a ?? "campaigns"
      if (!b) return null
      if (tab === "campaigns") {
        const c = b === "new" ? undefined : o.campaigns.find((x) => x.id === b)
        return {
          breadcrumb: [P, { label: "Partners & Events" }, { label: "Advertising", to: "/admin/advertising" }, { label: c?.name ?? (b === "new" ? "New campaign" : "Not found") }],
          title: b === "new" ? "Create campaign" : c ? c.name : "Campaign not found",
          description: c ? "Placements, creative, dates, preview and review outcome." : "Choose an advertiser, placements and creative, then submit for review.",
          badge: c ? <StatusPill map={CAMPAIGN_STATUS} value={c.status} /> : undefined,
        }
      }
      const adv = b === "new" ? undefined : o.advertisers.find((x) => x.id === b)
      return {
        breadcrumb: [P, { label: "Partners & Events" }, { label: "Advertising", to: "/admin/advertising/advertisers" }, { label: adv?.name ?? (b === "new" ? "New advertiser" : "Not found") }],
        title: b === "new" ? "Add advertiser" : adv ? adv.name : "Advertiser not found",
        description: "Organization details, contacts and activity.",
        badge: adv ? <StatusPill map={ORG_STATUS} value={adv.status} /> : undefined,
      }
    }
    case "events": {
      if (!a) return null
      const e = a === "new" ? undefined : o.events.find((x) => x.id === a)
      return {
        breadcrumb: [P, { label: "Partners & Events" }, { label: "Events", to: "/admin/events" }, { label: a === "new" ? "New event" : e?.title ?? "Not found" }],
        title: a === "new" ? "Create event" : e ? e.title : "Event not found",
        description: e ? "Event details, schedule and media. Lifecycle and broadcast are tracked separately." : "Add details, timezone and schedule. Save a draft at any time.",
        badge: e ? <StatusPill map={LIFECYCLE} value={e.lifecycle} /> : undefined,
      }
    }
    case "awards": {
      if (!a) return null
      const w = a === "new" ? undefined : o.awards.find((x) => x.id === a)
      return {
        breadcrumb: [P, { label: "Partners & Events" }, { label: "Awards", to: "/admin/awards" }, { label: a === "new" ? "New program" : w?.name ?? "Not found" }],
        title: a === "new" ? "Create award program" : w ? w.name : "Award program not found",
        description: w ? "Categories, nominees, voting window and results release." : "Name the program and set the voting window. Categories come next.",
        badge: w ? <StatusPill map={VOTING} value={w.voting} /> : undefined,
      }
    }
    case "moderation": {
      if (!a) return null
      const r = o.reports.find((x) => x.id === a)
      return {
        breadcrumb: [P, { label: "Audience" }, { label: "Moderation", to: "/admin/moderation" }, { label: r ? r.id.toUpperCase() : "Not found" }],
        title: r ? `Report: ${r.targetTitle}` : "Report not found",
        description: r ? `${r.type} reported for ${r.category.toLowerCase()}.` : "This report does not exist in the local prototype.",
        badge: r ? (r.status === "open" ? <StatusPill map={{ open: { label: "Open", color: "#fbbf24" } }} value="open" /> : <StatusPill map={REPORT_OUTCOME} value={r.outcome ?? "approved"} />) : undefined,
      }
    }
    case "notifications": {
      if (!a || a === "templates" || a === "history") return null
      const n = a === "new" ? undefined : o.notifications.find((x) => x.id === a)
      return {
        breadcrumb: [P, { label: "Audience" }, { label: "Notifications", to: "/admin/notifications" }, { label: a === "new" ? "New message" : n?.title ?? "Not found" }],
        title: a === "new" ? "Compose message" : n ? "Message" : "Message not found",
        description: "Compose, choose audience and channel, preview, test locally, then schedule or send. Delivery here is simulated.",
      }
    }
  }
  return null
}
