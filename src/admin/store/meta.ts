import type { ContentItem, ContentStatus, ContentType, CropName, MediaKind } from "./types"

export const TYPE_META: Record<
  ContentType,
  { label: string; plural: string; tab: string; cta: string; action: string; artwork: CropName[]; mediaKind: MediaKind | null }
> = {
  show: { label: "Show", plural: "Shows", tab: "shows", cta: "Add show", action: "Watch", artwork: ["portrait", "landscape"], mediaKind: null },
  movie: { label: "Movie", plural: "Movies", tab: "movies", cta: "Add movie", action: "Watch", artwork: ["portrait", "landscape"], mediaKind: "video" },
  music_video: { label: "Music video", plural: "Music videos", tab: "music-videos", cta: "Add music video", action: "Watch", artwork: ["landscape"], mediaKind: "video" },
  audio_track: { label: "Audio track", plural: "Audio tracks", tab: "audio", cta: "Add audio track", action: "Play", artwork: ["square"], mediaKind: "audio" },
  article: { label: "Article", plural: "Articles", tab: "articles", cta: "Add article", action: "Read", artwork: ["landscape"], mediaKind: null },
  event: { label: "Event", plural: "Events", tab: "events", cta: "Add event", action: "View event", artwork: ["landscape"], mediaKind: null },
}

export const TYPE_ORDER: ContentType[] = ["show", "movie", "music_video", "audio_track", "article", "event"]

export function typeFromTab(tab: string | undefined): ContentType {
  return TYPE_ORDER.find((t) => TYPE_META[t].tab === tab) ?? "show"
}

export const STATUS_META: Record<ContentStatus, { label: string; color: string; hint: string }> = {
  draft: { label: "Draft", color: "#b4b9c4", hint: "Not visible to customers" },
  scheduled: { label: "Scheduled", color: "#60a5fa", hint: "Goes live at the scheduled time" },
  published: { label: "Published", color: "#34d399", hint: "Visible to customers" },
  unpublished: { label: "Unpublished", color: "#fbbf24", hint: "Taken offline, can be republished" },
  archived: { label: "Archived", color: "#f87171", hint: "Retired, restore to draft to edit" },
}

export const GENRES = ["Drama", "Thriller", "Documentary", "Comedy", "Sci-Fi", "Music", "Culture", "Sport", "Lifestyle", "News"]
export const RATINGS = ["G", "PG", "PG-13", "TV-14", "TV-MA", "R"]

export function metaLine(c: ContentItem): string {
  switch (c.type) {
    case "show": {
      const eps = c.seasons.reduce((n, s) => n + s.episodes.length, 0)
      return [c.year, `${c.seasons.length} season${c.seasons.length === 1 ? "" : "s"}`, `${eps} ep.`, c.rating].filter(Boolean).join(" · ")
    }
    case "movie":
      return [c.year, c.runtimeMin ? `${c.runtimeMin} min` : "", c.rating, c.genre].filter(Boolean).join(" · ")
    case "music_video":
      return [c.artist, c.year, c.genre].filter(Boolean).join(" · ")
    case "audio_track":
      return [c.artist, c.album, c.genre].filter(Boolean).join(" · ")
    case "article":
      return [c.byline && `By ${c.byline}`, c.genre].filter(Boolean).join(" · ")
    case "event":
      return [c.eventDate && new Date(c.eventDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }), c.venue].filter(Boolean).join(" · ")
  }
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
}

export function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`
}

export function emptyContent(type: ContentType): ContentItem {
  const now = new Date().toISOString()
  const prefix = { show: "shw", movie: "mov", music_video: "mvd", audio_track: "aud", article: "art", event: "evt" }[type]
  return {
    id: genId(prefix),
    type,
    title: "",
    status: "draft",
    synopsis: "",
    genre: "",
    rating: "",
    year: "",
    posterId: null,
    landscapeId: null,
    squareId: null,
    mediaId: null,
    scheduledAt: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    seasons: [],
    runtimeMin: "",
    director: "",
    cast: "",
    artist: "",
    album: "",
    credits: "",
    byline: "",
    body: "",
    venue: "",
    eventDate: "",
  }
}
