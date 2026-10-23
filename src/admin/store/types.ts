export type ContentType = "show" | "movie" | "music_video" | "audio_track" | "article" | "event"
export type ContentStatus = "draft" | "scheduled" | "published" | "unpublished" | "archived"
export type MediaKind = "video" | "image" | "audio" | "caption"
export type MediaStatus = "uploading" | "processing" | "ready" | "failed"
export type CropName = "portrait" | "landscape" | "square"
export type TransitionAction = "publish" | "schedule" | "unpublish" | "archive" | "restore"

export interface PipelineState {
  status: MediaStatus
  progress: number
  ticks: number
  willFail: boolean
  failReason?: string
}

export interface Caption {
  id: string
  language: string
  format: "vtt" | "srt"
  fileName: string
}

export interface Replacement extends PipelineState {
  name: string
  sizeLabel: string
  url?: string
  duration?: string
}

export interface MediaAsset extends PipelineState {
  id: string
  kind: MediaKind
  name: string
  sizeLabel: string
  duration?: string
  url?: string
  dimensions?: string
  createdAt: string
  captions: Caption[]
  focal: Record<CropName, { x: number; y: number }>
  replacement?: Replacement
}

export interface Episode {
  id: string
  title: string
  synopsis: string
  durationMin: number | ""
  mediaId: string | null
}

export interface Season {
  id: string
  number: number
  title: string
  episodes: Episode[]
}

export interface ContentItem {
  id: string
  type: ContentType
  title: string
  status: ContentStatus
  synopsis: string
  genre: string
  rating: string
  year: number | ""
  posterId: string | null
  landscapeId: string | null
  squareId: string | null
  mediaId: string | null
  scheduledAt: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  // show
  seasons: Season[]
  // movie
  runtimeMin: number | ""
  director: string
  cast: string
  // music video / audio
  artist: string
  album: string
  credits: string
  // article
  byline: string
  body: string
  // event
  venue: string
  eventDate: string
}

export interface HomepageSection {
  id: string
  label: string
  kind: "editorial" | "collection"
  itemIds: string[]
  layout: "hero" | "rail"
}

export interface Toast {
  id: string
  tone: "success" | "error" | "info"
  text: string
}
