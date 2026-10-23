import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react"
import type { AdminUser, Advertiser, Award, Campaign, Capability, Notification, OpsEvent, Report, Role, Settings, Sponsor, Template } from "./types"
import { EXAMPLE_MATRIX } from "./types"
import { seedAdvertisers, seedAwards, seedCampaigns, seedEvents, seedNotifications, seedReports, seedSettings, seedSponsors, seedTemplates, seedUsers } from "./seed"

const KEY = "mgtv-admin-ops-v1"

interface Collections {
  sponsors: Sponsor[]
  advertisers: Advertiser[]
  campaigns: Campaign[]
  events: OpsEvent[]
  awards: Award[]
  reports: Report[]
  notifications: Notification[]
  templates: Template[]
  users: AdminUser[]
}
export type Slice = keyof Collections
interface State extends Collections {
  settings: Settings
  actingRole: Role
}
type Item<K extends Slice> = Collections[K][number]

type Action =
  | { type: "upsert"; slice: Slice; entity: { id: string } }
  | { type: "remove"; slice: Slice; id: string }
  | { type: "settings"; settings: Settings }
  | { type: "role"; role: Role }
  | { type: "reset" }

const seed = (): State => ({
  sponsors: seedSponsors, advertisers: seedAdvertisers, campaigns: seedCampaigns, events: seedEvents, awards: seedAwards, reports: seedReports,
  notifications: seedNotifications, templates: seedTemplates, users: seedUsers, settings: seedSettings, actingRole: "Admin",
})

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "upsert": {
      const list = s[a.slice] as { id: string }[]
      const exists = list.some((x) => x.id === a.entity.id)
      const next = exists ? list.map((x) => (x.id === a.entity.id ? a.entity : x)) : [a.entity, ...list]
      return { ...s, [a.slice]: next }
    }
    case "remove":
      return { ...s, [a.slice]: (s[a.slice] as { id: string }[]).filter((x) => x.id !== a.id) }
    case "settings":
      return { ...s, settings: a.settings }
    case "role":
      return { ...s, actingRole: a.role }
    case "reset":
      return seed()
  }
}

function load(): State {
  const base = seed()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw)
      const out: State = { ...base }
      ;(Object.keys(base) as (keyof State)[]).forEach((k) => {
        if (p[k] !== undefined && p[k] !== null) (out as unknown as Record<string, unknown>)[k] = p[k]
      })
      return out
    }
  } catch {
    /* fall back to seed */
  }
  return base
}

interface Api extends State {
  upsert: <K extends Slice>(slice: K, entity: Item<K>) => void
  remove: (slice: Slice, id: string) => void
  saveSettings: (s: Settings) => void
  setActingRole: (r: Role) => void
  can: (c: Capability) => boolean
  resetOps: () => void
}

const Ctx = createContext<Api | null>(null)

export function OpsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* in-memory only */
    }
  }, [state])
  const api = useMemo<Api>(
    () => ({
      ...state,
      upsert: (slice, entity) => dispatch({ type: "upsert", slice, entity: entity as unknown as { id: string } }),
      remove: (slice, id) => dispatch({ type: "remove", slice, id }),
      saveSettings: (settings) => dispatch({ type: "settings", settings }),
      setActingRole: (role) => dispatch({ type: "role", role }),
      can: (c) => EXAMPLE_MATRIX[state.actingRole].includes(c),
      resetOps: () => dispatch({ type: "reset" }),
    }),
    [state],
  )
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useOps() {
  const c = useContext(Ctx)
  if (!c) throw new Error("OpsProvider missing")
  return c
}

/** Where a media asset is used by operational records. */
export function opsMediaUsage(assetId: string, o: Pick<State, "sponsors" | "campaigns" | "events" | "awards">): { label: string; to: string }[] {
  const out: { label: string; to: string }[] = []
  o.sponsors.forEach((s) => s.brandAssets.forEach((b) => b.mediaId === assetId && out.push({ label: `Sponsor ${s.name}: ${b.label}`, to: `/admin/sponsors/${s.id}/assets` })))
  o.campaigns.forEach((c) => c.creativeIds.includes(assetId) && out.push({ label: `Campaign creative: ${c.name}`, to: `/admin/advertising/campaigns/${c.id}` }))
  o.events.forEach((e) => {
    if (e.posterId === assetId) out.push({ label: `Event poster: ${e.title}`, to: `/admin/events/${e.id}` })
    if (e.trailerId === assetId) out.push({ label: `Event trailer: ${e.title}`, to: `/admin/events/${e.id}` })
    if (e.replayId === assetId) out.push({ label: `Event replay: ${e.title}`, to: `/admin/events/${e.id}` })
  })
  o.awards.forEach((a) => a.categories.forEach((c) => c.nominees.forEach((n) => n.imageId === assetId && out.push({ label: `Nominee ${n.name} (${a.name})`, to: `/admin/awards/${a.id}/nominees` }))))
  return out
}
