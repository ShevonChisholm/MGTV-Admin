type M = Record<string, { label: string; color: string }>

export const ORG_STATUS: M = { active: { label: "Active", color: "#34d399" }, inactive: { label: "Inactive", color: "#b4b9c4" } }

export const CAMPAIGN_STATUS: M = {
  draft: { label: "Draft", color: "#b4b9c4" },
  in_review: { label: "In review", color: "#fbbf24" },
  approved: { label: "Approved", color: "#60a5fa" },
  active: { label: "Active", color: "#34d399" },
  completed: { label: "Completed", color: "#a78bfa" },
  rejected: { label: "Rejected", color: "#f87171" },
}

export const LIFECYCLE: M = {
  draft: { label: "Draft", color: "#b4b9c4" },
  scheduled: { label: "Scheduled", color: "#60a5fa" },
  postponed: { label: "Postponed", color: "#fbbf24" },
  cancelled: { label: "Cancelled", color: "#f87171" },
  completed: { label: "Completed", color: "#a78bfa" },
}

export const BROADCAST: M = {
  not_configured: { label: "Not configured", color: "#b4b9c4" },
  scheduled: { label: "Broadcast scheduled", color: "#60a5fa" },
  live: { label: "Live now", color: "#f87171" },
  ended: { label: "Broadcast ended", color: "#a78bfa" },
  replay_available: { label: "Replay linked", color: "#34d399" },
}

export const VOTING: M = {
  not_open: { label: "Voting not open", color: "#b4b9c4" },
  open: { label: "Voting open", color: "#34d399" },
  closed: { label: "Voting closed", color: "#a78bfa" },
}

export const RESULTS: M = {
  hidden: { label: "Results hidden", color: "#b4b9c4" },
  previewed: { label: "Preview checked", color: "#60a5fa" },
  released: { label: "Results released", color: "#34d399" },
  withdrawn: { label: "Results withdrawn", color: "#fbbf24" },
}

export const REPORT_OUTCOME: M = {
  approved: { label: "Content approved", color: "#34d399" },
  dismissed: { label: "Report dismissed", color: "#60a5fa" },
  removed: { label: "Content removed", color: "#f87171" },
}

export const PRIORITY: M = { high: { label: "High", color: "#f87171" }, medium: { label: "Medium", color: "#fbbf24" }, low: { label: "Low", color: "#b4b9c4" } }

export const NOTIF_STATUS: M = {
  draft: { label: "Draft", color: "#b4b9c4" },
  scheduled: { label: "Scheduled (simulated)", color: "#60a5fa" },
  sent: { label: "Sent (simulated)", color: "#34d399" },
  cancelled: { label: "Cancelled", color: "#f87171" },
}

export const USER_STATUS: M = { active: { label: "Active", color: "#34d399" }, invited: { label: "Invitation pending", color: "#fbbf24" }, suspended: { label: "Suspended", color: "#f87171" } }

export const CHANNEL_LABEL = { push: "Push", email: "Email", in_app: "In-app" } as const
export const FORMAT_LABEL = { in_person: "In person", online: "Online", hybrid: "Hybrid" } as const
