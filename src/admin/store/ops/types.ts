import { genId } from "../meta"

export const ACTOR = "Jordan Rivera"

export interface Activity {
  id: string
  at: string
  actor: string
  action: string
  reason?: string
}

export interface Logged {
  activity: Activity[]
}

/** Returns the entity with a new history entry at the top. */
export function logged<T extends Logged>(e: T, action: string, reason?: string): T {
  return { ...e, activity: [{ id: genId("act"), at: new Date().toISOString(), actor: ACTOR, action, reason: reason?.trim() || undefined }, ...e.activity] }
}

export function newLog(action: string): Activity[] {
  return [{ id: genId("act"), at: new Date().toISOString(), actor: ACTOR, action }]
}

export interface Contact {
  id: string
  name: string
  role: string
  email: string
  phone: string
}

/* ---------- Sponsors ---------- */
export type OrgStatus = "active" | "inactive"
export type BrandAssetKind = "Logo (light background)" | "Logo (dark background)" | "Brand mark"
export interface BrandAsset {
  id: string
  label: string
  kind: BrandAssetKind
  mediaId: string
}
export interface Sponsor extends Logged {
  id: string
  name: string
  description: string
  website: string
  status: OrgStatus
  contacts: Contact[]
  brandAssets: BrandAsset[]
  showIds: string[]
  eventIds: string[]
  createdAt: string
}

/* ---------- Advertising ---------- */
export interface Advertiser extends Logged {
  id: string
  name: string
  website: string
  notes: string
  status: OrgStatus
  contacts: Contact[]
  createdAt: string
}
export type CampaignStatus = "draft" | "in_review" | "approved" | "active" | "completed" | "rejected"
export interface Campaign extends Logged {
  id: string
  advertiserId: string
  name: string
  headline: string
  objective: string
  contentIds: string[]
  sectionIds: string[]
  creativeIds: string[]
  startDate: string
  endDate: string
  status: CampaignStatus
  review?: { decision: "approved" | "rejected"; reason: string; by: string; at: string }
  engagement: { impressions: number; clicks: number; completions: number }
  createdAt: string
}

/* ---------- Events ---------- */
export type EventFormat = "in_person" | "online" | "hybrid"
export type Lifecycle = "draft" | "scheduled" | "postponed" | "cancelled" | "completed"
export type Broadcast = "not_configured" | "scheduled" | "live" | "ended" | "replay_available"
export interface OpsEvent extends Logged {
  id: string
  title: string
  description: string
  format: EventFormat
  venue: string
  onlineUrl: string
  timezone: string
  start: string
  end: string
  lifecycle: Lifecycle
  broadcast: Broadcast
  statusReason?: string
  previousStart?: string
  posterId: string | null
  trailerId: string | null
  replayId: string | null
  ticketUrl: string
  createdAt: string
}

/* ---------- Awards ---------- */
export type VotingState = "not_open" | "open" | "closed"
export type ResultsState = "hidden" | "previewed" | "released" | "withdrawn"
export interface Nominee {
  id: string
  name: string
  note: string
  imageId: string | null
  contentId: string | null
}
export interface AwardCategory {
  id: string
  name: string
  archived: boolean
  nominees: Nominee[]
}
export interface Award extends Logged {
  id: string
  name: string
  year: number
  votingOpens: string
  votingCloses: string
  voting: VotingState
  results: ResultsState
  categories: AwardCategory[]
  createdAt: string
}

/* ---------- Moderation ---------- */
export type ReportOutcome = "approved" | "dismissed" | "removed"
export type ReportType = "Comment" | "Profile" | "Review" | "Video"
export interface Report extends Logged {
  id: string
  type: ReportType
  priority: "high" | "medium" | "low"
  targetKey: string
  targetTitle: string
  targetSnippet: string
  targetAuthor: string
  contentId: string | null
  reporter: string
  category: string
  detail: string
  createdAt: string
  status: "open" | "resolved"
  outcome?: ReportOutcome
  outcomeReason?: string
  resolvedAt?: string
  targetRemoved: boolean
}

/* ---------- Notifications ---------- */
export type Channel = "push" | "email" | "in_app"
export type NotificationStatus = "draft" | "scheduled" | "sent" | "cancelled"
export interface Notification extends Logged {
  id: string
  title: string
  body: string
  channels: Channel[]
  audienceId: string
  scheduleAt: string
  status: NotificationStatus
  testedAt?: string
  sentAt?: string
  result?: { delivered: number; opened: number; failed: number }
  createdAt: string
}
export interface Template {
  id: string
  name: string
  title: string
  body: string
  channels: Channel[]
}

/* ---------- Admin users & settings ---------- */
export type Role = "Viewer" | "Editor" | "Moderator" | "Admin"
export const ROLES: Role[] = ["Viewer", "Editor", "Moderator", "Admin"]
export interface AdminUser extends Logged {
  id: string
  name: string
  email: string
  role: Role
  status: "active" | "invited" | "suspended"
  lastActive: string
}
export interface Settings {
  orgName: string
  supportEmail: string
  defaultLanguage: string
  defaultTimezone: string
  alertReports: boolean
  alertCampaignReview: boolean
  weeklyDigest: boolean
  updatedAt: string
}

export type Capability = "records.edit" | "campaigns.review" | "moderation.act" | "notifications.send" | "awards.release" | "users.manage" | "settings.edit"
export const CAPABILITIES: { id: Capability; label: string }[] = [
  { id: "records.edit", label: "Edit sponsors, advertisers, campaigns, events, awards" },
  { id: "campaigns.review", label: "Approve or reject campaigns" },
  { id: "moderation.act", label: "Act on moderation reports" },
  { id: "notifications.send", label: "Send or schedule notifications" },
  { id: "awards.release", label: "Open/close voting and release results" },
  { id: "users.manage", label: "Invite and manage admin users" },
  { id: "settings.edit", label: "Change platform settings" },
]
/** Example only. The real matrix is not approved yet. */
export const EXAMPLE_MATRIX: Record<Role, Capability[]> = {
  Viewer: [],
  Editor: ["records.edit", "notifications.send"],
  Moderator: ["moderation.act", "records.edit"],
  Admin: ["records.edit", "campaigns.review", "moderation.act", "notifications.send", "awards.release", "users.manage", "settings.edit"],
}

export const SEGMENTS: { id: string; label: string; estimate: number }[] = [
  { id: "all", label: "All customers", estimate: 18400 },
  { id: "new", label: "New in the last 30 days", estimate: 1250 },
  { id: "lapsed", label: "Inactive for 60+ days", estimate: 3120 },
  { id: "events", label: "Opted in to event updates", estimate: 6780 },
  { id: "staff", label: "Internal test group", estimate: 6 },
]
