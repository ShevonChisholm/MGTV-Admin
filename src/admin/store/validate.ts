import type { ContentItem, MediaAsset, TransitionAction, ContentStatus } from "./types"

export interface Issue {
  field: string
  message: string
}

const ART_FIELD = { portrait: "posterId", landscape: "landscapeId", square: "squareId" } as const

function mediaIssue(id: string | null, assets: Record<string, MediaAsset>, field: string, label: string, kind: string): Issue | null {
  if (!id) return { field, message: `${label}: choose a ${kind} from the media library.` }
  const a = assets[id]
  if (!a) return { field, message: `${label}: the referenced media no longer exists.` }
  if (a.status !== "ready") return { field, message: `${label}: "${a.name}" is ${a.status}, not ready. Wait for it to finish or pick another file.` }
  return null
}

export function validateDraft(c: ContentItem): Issue[] {
  return c.title.trim() ? [] : [{ field: "title", message: "Title is required, even for a draft." }]
}

export function validateForPublish(c: ContentItem, assets: Record<string, MediaAsset>): Issue[] {
  const out: Issue[] = []
  const push = (i: Issue | null) => i && out.push(i)
  const req = (ok: boolean, field: string, message: string) => !ok && out.push({ field, message })

  req(!!c.title.trim(), "title", "Title is required.")
  if (c.type !== "article" && c.type !== "event") req(c.synopsis.trim().length >= 20, "synopsis", "Synopsis is required (at least 20 characters).")
  if (c.type !== "event") req(!!c.genre, "genre", "Choose a genre.")

  switch (c.type) {
    case "show":
      req(!!c.rating, "rating", "Choose an age rating.")
      req(!!c.year, "year", "Release year is required.")
      req(c.seasons.length > 0, "seasons", "Add at least one season.")
      c.seasons.forEach((s) => {
        req(s.episodes.length > 0, `season-${s.id}`, `Season ${s.number} needs at least one episode.`)
        s.episodes.forEach((e) => {
          const tag = `S${s.number} · ${e.title || "Untitled episode"}`
          req(!!e.title.trim(), `ep-${e.id}-title`, `${tag}: episode title is required.`)
          req(e.synopsis.trim().length >= 10, `ep-${e.id}-synopsis`, `${tag}: episode synopsis is required.`)
          req(Number(e.durationMin) > 0, `ep-${e.id}-duration`, `${tag}: duration in minutes is required.`)
          push(mediaIssue(e.mediaId, assets, `ep-${e.id}-media`, tag, "video"))
        })
      })
      break
    case "movie":
      req(!!c.rating, "rating", "Choose an age rating.")
      req(!!c.year, "year", "Release year is required.")
      req(Number(c.runtimeMin) > 0, "runtime", "Runtime in minutes is required.")
      req(!!c.director.trim(), "director", "Director is required.")
      push(mediaIssue(c.mediaId, assets, "media", "Feature video", "video"))
      break
    case "music_video":
      req(!!c.artist.trim(), "artist", "Artist is required.")
      req(!!c.year, "year", "Release year is required.")
      push(mediaIssue(c.mediaId, assets, "media", "Video file", "video"))
      break
    case "audio_track":
      req(!!c.artist.trim(), "artist", "Artist is required.")
      req(!!c.album.trim(), "album", "Album or release is required.")
      push(mediaIssue(c.mediaId, assets, "media", "Audio file", "audio"))
      break
    case "article":
      req(!!c.byline.trim(), "byline", "Byline is required.")
      req(c.body.trim().length >= 40, "body", "Article body is required (at least 40 characters).")
      break
    case "event":
      req(!!c.venue.trim(), "venue", "Venue is required.")
      req(!!c.eventDate, "eventDate", "Event date is required.")
      break
  }

  const needs: Record<string, ("portrait" | "landscape" | "square")[]> = {
    show: ["portrait", "landscape"],
    movie: ["portrait", "landscape"],
    music_video: ["landscape"],
    audio_track: ["square"],
    article: ["landscape"],
    event: ["landscape"],
  }
  needs[c.type].forEach((crop) => {
    const field = ART_FIELD[crop]
    push(mediaIssue((c as unknown as Record<string, string | null>)[field], assets, field, `${crop[0].toUpperCase() + crop.slice(1)} artwork`, "image"))
  })

  return out
}

export function validateSchedule(c: ContentItem, assets: Record<string, MediaAsset>): Issue[] {
  const out = validateForPublish(c, assets)
  if (!c.scheduledAt) out.push({ field: "scheduledAt", message: "Pick a publish date and time to schedule." })
  else if (new Date(c.scheduledAt).getTime() <= Date.now()) out.push({ field: "scheduledAt", message: "Scheduled time must be in the future." })
  return out
}

const ALLOWED: Record<TransitionAction, ContentStatus[]> = {
  publish: ["draft", "scheduled", "unpublished"],
  schedule: ["draft", "unpublished", "scheduled"],
  unpublish: ["published"],
  archive: ["draft", "scheduled", "published", "unpublished"],
  restore: ["archived"],
}

export function allowedActions(status: ContentStatus): TransitionAction[] {
  return (Object.keys(ALLOWED) as TransitionAction[]).filter((a) => ALLOWED[a].includes(status))
}

const NEXT: Record<TransitionAction, ContentStatus> = {
  publish: "published",
  schedule: "scheduled",
  unpublish: "unpublished",
  archive: "archived",
  restore: "draft",
}

export const TRANSITION_TOAST: Record<TransitionAction, (t: string) => string> = {
  publish: (t) => `"${t}" is now Published in the prototype.`,
  schedule: (t) => `"${t}" is Scheduled.`,
  unpublish: (t) => `"${t}" was Unpublished and is no longer visible.`,
  archive: (t) => `"${t}" was Archived.`,
  restore: (t) => `"${t}" was restored to Draft.`,
}

export type TransitionResult = { ok: true; item: ContentItem } | { ok: false; issues: Issue[] }

export function transition(c: ContentItem, action: TransitionAction, assets: Record<string, MediaAsset>): TransitionResult {
  if (!ALLOWED[action].includes(c.status)) return { ok: false, issues: [{ field: "status", message: `Cannot ${action} content that is ${c.status}.` }] }
  if (action === "publish") {
    const issues = validateForPublish(c, assets)
    if (issues.length) return { ok: false, issues }
  }
  if (action === "schedule") {
    const issues = validateSchedule(c, assets)
    if (issues.length) return { ok: false, issues }
  }
  const now = new Date().toISOString()
  return {
    ok: true,
    item: {
      ...c,
      status: NEXT[action],
      updatedAt: now,
      publishedAt: action === "publish" ? now : c.publishedAt,
      scheduledAt: action === "schedule" ? c.scheduledAt : action === "publish" || action === "restore" ? null : c.scheduledAt,
    },
  }
}
