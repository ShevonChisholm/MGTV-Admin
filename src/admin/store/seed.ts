import type { ContentItem, HomepageSection, MediaAsset, MediaKind } from "./types"
import { emptyContent } from "./meta"

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&q=70&auto=format&fit=crop`
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString()
const center = { x: 50, y: 50 }
const ready = { status: "ready" as const, progress: 100, ticks: 0, willFail: false }

function asset(
  id: string,
  kind: MediaKind,
  name: string,
  sizeLabel: string,
  extra: Partial<MediaAsset> = {},
): MediaAsset {
  return {
    id,
    kind,
    name,
    sizeLabel,
    createdAt: iso(10),
    captions: [],
    focal: { portrait: center, landscape: center, square: center },
    ...ready,
    ...extra,
  }
}

export const seedMedia: MediaAsset[] = [
  asset("med_img_nightshift", "image", "night-shift-key-art.jpg", "3.1 MB", { url: U("1517328894681-0f5dfabd463c"), dimensions: "4800 × 6000", focal: { portrait: { x: 50, y: 40 }, landscape: { x: 50, y: 35 }, square: center } }),
  asset("med_img_citywide", "image", "night-shift-wide.jpg", "2.4 MB", { url: U("1535391879778-3bae11d29a24"), dimensions: "5860 × 3907" }),
  asset("med_img_harbor", "image", "harbor-lights-poster.jpg", "2.9 MB", { url: U("1675726205553-4e348f24da2c"), dimensions: "4000 × 6000", focal: { portrait: { x: 50, y: 30 }, landscape: { x: 50, y: 25 }, square: center } }),
  asset("med_img_harbor_wide", "image", "harbor-lights-wide.jpg", "2.2 MB", { url: U("1603793510575-a8cf24361baa"), dimensions: "6000 × 4000" }),
  asset("med_img_broadcast", "image", "last-broadcast-poster.jpg", "3.4 MB", { url: U("1532171875345-9712d9d4f65a"), dimensions: "2509 × 3512" }),
  asset("med_img_broadcast_wide", "image", "last-broadcast-wide.jpg", "2.6 MB", { url: U("1722851152653-1182e178a81f"), dimensions: "6000 × 4000" }),
  asset("med_img_golden", "image", "golden-hour-wide.jpg", "2.0 MB", { url: U("1569169507605-f91e088ce91a"), dimensions: "7952 × 5304" }),
  asset("med_img_golden_poster", "image", "golden-hour-poster.jpg", "1.9 MB", { url: U("1554103577-c0d26e9b90e0"), dimensions: "4032 × 3024", focal: { portrait: { x: 40, y: 50 }, landscape: center, square: center } }),
  asset("med_img_concert", "image", "rooftop-sessions-wide.jpg", "2.8 MB", { url: U("1459749411175-04bf5292ceea"), dimensions: "5184 × 3456" }),
  asset("med_img_crowd", "image", "neon-static-still.jpg", "2.5 MB", { url: U("1470229722913-7c0e2dbbafd3"), dimensions: "5506 × 3671" }),
  asset("med_img_cover", "image", "midnight-frequencies-cover.jpg", "1.7 MB", { url: U("1654765437547-6b572f52ee1a"), dimensions: "3888 × 3888" }),
  asset("med_img_archive", "image", "archive-feature.jpg", "2.1 MB", { url: U("1533174072545-7a4b6ad7a6c3"), dimensions: "5760 × 3844" }),
  asset("med_vid_ns101", "video", "night-shift-s01e01.mp4", "1.8 GB", { duration: "47:12", url: U("1517328894681-0f5dfabd463c"), captions: [{ id: "cap_ns101_en", language: "English", format: "vtt", fileName: "night-shift-s01e01.en.vtt" }] }),
  asset("med_vid_ns102", "video", "night-shift-s01e02.mp4", "1.7 GB", { duration: "45:30", url: U("1535391879778-3bae11d29a24") }),
  asset("med_vid_ns201", "video", "night-shift-s02e01.mp4", "2.0 GB", { duration: "49:05", url: U("1722851152653-1182e178a81f") }),
  asset("med_vid_harbor1", "video", "harbor-lights-pilot.mp4", "2.2 GB", { duration: "52:40", url: U("1603793510575-a8cf24361baa"), status: "processing", progress: 100, ticks: -1 }),
  asset("med_vid_broadcast", "video", "the-last-broadcast-feature.mp4", "6.4 GB", { duration: "1:54:10", url: U("1532171875345-9712d9d4f65a"), captions: [{ id: "cap_lb_en", language: "English", format: "srt", fileName: "last-broadcast.en.srt" }] }),
  asset("med_vid_golden", "video", "golden-hour-feature.mp4", "5.1 GB", { duration: "1:41:22", url: U("1569169507605-f91e088ce91a") }),
  asset("med_vid_neon", "video", "neon-static-official.mp4", "820 MB", { duration: "3:48", url: U("1470229722913-7c0e2dbbafd3") }),
  asset("med_vid_corrupt", "video", "rooftop-rehearsal-raw.mov", "3.7 GB", { status: "failed", progress: 100, failReason: "Simulated: unsupported container metadata. Retry or choose another file." }),
  asset("med_aud_midnight", "audio", "midnight-frequencies.wav", "48 MB", { duration: "4:21" }),
  asset("med_aud_interview", "audio", "archive-interview-ep4.mp3", "22 MB", { duration: "31:08" }),
]

function ep(id: string, title: string, synopsis: string, durationMin: number, mediaId: string | null) {
  return { id, title, synopsis, durationMin, mediaId }
}

const base = (o: Partial<ContentItem> & Pick<ContentItem, "type" | "id" | "title">): ContentItem => ({ ...emptyContent(o.type), ...o })

export const seedContent: ContentItem[] = [
  base({
    id: "shw_nightshift", type: "show", title: "Night Shift", status: "published",
    synopsis: "Three dispatchers, one city that never sleeps. A slow-burn drama about the voices on the other end of the line.",
    genre: "Drama", rating: "TV-MA", year: 2025, posterId: "med_img_nightshift", landscapeId: "med_img_citywide",
    createdAt: iso(40), updatedAt: iso(6), publishedAt: iso(30),
    seasons: [
      { id: "seas_ns1", number: 1, title: "Season 1", episodes: [
        ep("ep_ns101", "Dead Air", "A silent call on the first night shakes the new hire.", 47, "med_vid_ns101"),
        ep("ep_ns102", "Handoff", "The night crew inherits a case nobody wants.", 45, "med_vid_ns102"),
      ] },
      { id: "seas_ns2", number: 2, title: "Season 2", episodes: [
        ep("ep_ns201", "Second Wind", "Winter arrives and the calls get stranger.", 49, "med_vid_ns201"),
      ] },
    ],
  }),
  base({
    id: "shw_harbor", type: "show", title: "Harbor Lights", status: "draft",
    synopsis: "A port town lighthouse keeper uncovers the secrets of every ship that passes.",
    genre: "Thriller", rating: "TV-14", year: 2026, posterId: "med_img_harbor", landscapeId: "med_img_harbor_wide",
    createdAt: iso(5), updatedAt: iso(1),
    seasons: [{ id: "seas_h1", number: 1, title: "Season 1", episodes: [
      ep("ep_h101", "Pilot", "The keeper receives a message in a bottle.", 52, "med_vid_harbor1"),
    ] }],
  }),
  base({
    id: "mov_lastbroadcast", type: "movie", title: "The Last Broadcast", status: "published",
    synopsis: "On the night a radio station goes dark for good, its final host has one story left to tell.",
    genre: "Drama", rating: "PG-13", year: 2024, runtimeMin: 114, director: "Amara Osei", cast: "Lena Ford, Marcus Hale, Dee Okafor",
    posterId: "med_img_broadcast", landscapeId: "med_img_broadcast_wide", mediaId: "med_vid_broadcast",
    createdAt: iso(60), updatedAt: iso(12), publishedAt: iso(45),
  }),
  base({
    id: "mov_goldenhour", type: "movie", title: "Golden Hour", status: "scheduled",
    synopsis: "Two strangers share the final sixty minutes of daylight on a long coastal drive.",
    genre: "Drama", rating: "PG", year: 2026, runtimeMin: 101, director: "Tomás Rey", cast: "Ines Calder, Jo Varga",
    posterId: "med_img_golden_poster", landscapeId: "med_img_golden", mediaId: "med_vid_golden",
    scheduledAt: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: iso(14), updatedAt: iso(2),
  }),
  base({
    id: "mov_static", type: "movie", title: "Static", status: "archived",
    synopsis: "A cult sci-fi short retired from the catalog after its license window ended.",
    genre: "Sci-Fi", rating: "PG-13", year: 2019, runtimeMin: 88, director: "Priya Nandan",
    createdAt: iso(300), updatedAt: iso(90), publishedAt: iso(280),
  }),
  base({
    id: "mvd_neonstatic", type: "music_video", title: "Neon Static", status: "published",
    synopsis: "The official video for the Halcyon Drive single, shot in one night across three rooftops.",
    genre: "Music", year: 2026, artist: "Halcyon Drive", credits: "Dir. Wen Li · DP Kasper Dahl",
    landscapeId: "med_img_crowd", mediaId: "med_vid_neon", createdAt: iso(20), updatedAt: iso(8), publishedAt: iso(15),
  }),
  base({
    id: "aud_midnight", type: "audio_track", title: "Midnight Frequencies", status: "published",
    synopsis: "A late-night instrumental built from old broadcast static and warm analog synth.",
    genre: "Music", artist: "Halcyon Drive", album: "Signal & Noise", squareId: "med_img_cover", mediaId: "med_aud_midnight",
    createdAt: iso(25), updatedAt: iso(9), publishedAt: iso(20),
  }),
  base({
    id: "art_archive", type: "article", title: "Inside the MGTV Archive", status: "draft",
    genre: "Culture", byline: "Jordan Rivera", landscapeId: "med_img_archive",
    body: "We spent a week in the vault with the preservation team to find out how thirty years of broadcast history gets saved.",
    createdAt: iso(3), updatedAt: iso(1),
  }),
  base({
    id: "evt_rooftop", type: "event", title: "MGTV Live: Rooftop Sessions", status: "draft",
    genre: "Music", venue: "Skyline Terrace, Downtown", eventDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
    landscapeId: "med_img_concert", synopsis: "An evening of live sets streamed from the roof.",
    createdAt: iso(2), updatedAt: iso(2),
  }),
]

export const seedHomepage: HomepageSection[] = [
  { id: "hp_hero", label: "Featured hero", kind: "editorial", layout: "hero", itemIds: ["shw_nightshift", "mov_lastbroadcast"] },
  { id: "hp_new", label: "New this week", kind: "editorial", layout: "rail", itemIds: ["mov_goldenhour", "shw_nightshift", "mvd_neonstatic"] },
  { id: "hp_music", label: "Music & audio", kind: "editorial", layout: "rail", itemIds: ["mvd_neonstatic", "aud_midnight"] },
  { id: "hp_trending", label: "Trending now", kind: "collection", layout: "rail", itemIds: [] },
]
