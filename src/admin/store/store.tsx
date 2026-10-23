import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react"
import type { ContentItem, HomepageSection, MediaAsset, PipelineState, Replacement, Toast } from "./types"
import { seedContent, seedHomepage, seedMedia } from "./seed"
import { genId } from "./meta"

const KEY = "mgtv-admin-proto-v1"

interface State {
  content: ContentItem[]
  media: MediaAsset[]
  homepage: HomepageSection[]
  toasts: Toast[]
}

type Action =
  | { type: "saveContent"; item: ContentItem }
  | { type: "addMedia"; asset: MediaAsset }
  | { type: "patchMedia"; id: string; patch: Partial<MediaAsset> }
  | { type: "deleteMedia"; id: string }
  | { type: "retryMedia"; id: string }
  | { type: "finishMedia"; id: string }
  | { type: "setReplacement"; id: string; replacement: Replacement | undefined }
  | { type: "retryReplacement"; id: string }
  | { type: "swapReplacement"; id: string }
  | { type: "applyHomepage"; sections: HomepageSection[] }
  | { type: "tick" }
  | { type: "toast"; toast: Toast }
  | { type: "dismissToast"; id: string }
  | { type: "reset" }

function step<T extends PipelineState>(p: T): T {
  if (p.status === "uploading") {
    const progress = Math.min(100, p.progress + 18)
    return progress >= 100 ? { ...p, progress: 100, status: "processing", ticks: 0 } : { ...p, progress }
  }
  if (p.status === "processing" && p.ticks >= 0) {
    const ticks = p.ticks + 1
    if (ticks < 6) return { ...p, ticks }
    return p.willFail
      ? { ...p, ticks, status: "failed", failReason: "Simulated processing error: unsupported audio track layout. Retry or choose another file." }
      : { ...p, ticks, status: "ready" }
  }
  return p
}

const restart = <T extends PipelineState>(p: T): T => ({ ...p, status: "uploading", progress: 0, ticks: 0, willFail: false, failReason: undefined })

function isActive(p: PipelineState) {
  return p.status === "uploading" || (p.status === "processing" && p.ticks >= 0)
}

function hasActive(media: MediaAsset[]) {
  return media.some((m) => isActive(m) || (m.replacement && isActive(m.replacement)))
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "saveContent": {
      const exists = s.content.some((c) => c.id === a.item.id)
      return { ...s, content: exists ? s.content.map((c) => (c.id === a.item.id ? a.item : c)) : [a.item, ...s.content] }
    }
    case "addMedia":
      return { ...s, media: [a.asset, ...s.media] }
    case "patchMedia":
      return { ...s, media: s.media.map((m) => (m.id === a.id ? { ...m, ...a.patch } : m)) }
    case "deleteMedia":
      return { ...s, media: s.media.filter((m) => m.id !== a.id) }
    case "retryMedia":
      return { ...s, media: s.media.map((m) => (m.id === a.id ? restart(m) : m)) }
    case "finishMedia":
      return { ...s, media: s.media.map((m) => (m.id === a.id ? { ...m, status: "ready", ticks: 0, progress: 100 } : m)) }
    case "setReplacement":
      return { ...s, media: s.media.map((m) => (m.id === a.id ? { ...m, replacement: a.replacement } : m)) }
    case "retryReplacement":
      return { ...s, media: s.media.map((m) => (m.id === a.id && m.replacement ? { ...m, replacement: restart(m.replacement) } : m)) }
    case "swapReplacement":
      return {
        ...s,
        media: s.media.map((m) => {
          if (m.id !== a.id || !m.replacement || m.replacement.status !== "ready") return m
          const r = m.replacement
          return { ...m, name: r.name, sizeLabel: r.sizeLabel, url: r.url ?? m.url, duration: r.duration ?? m.duration, replacement: undefined }
        }),
      }
    case "applyHomepage":
      return { ...s, homepage: a.sections }
    case "tick":
      return { ...s, media: s.media.map((m) => ({ ...step(m), replacement: m.replacement ? step(m.replacement) : undefined })) }
    case "toast":
      return { ...s, toasts: [...s.toasts.slice(-3), a.toast] }
    case "dismissToast":
      return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) }
    case "reset":
      return { content: seedContent, media: seedMedia, homepage: seedHomepage, toasts: [] }
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw)
      const fix = <T extends PipelineState>(x: T): T =>
        isActive(x) ? { ...x, status: "failed", failReason: "Simulated: interrupted by page reload. Retry to run it again." } : x
      return {
        content: p.content,
        homepage: p.homepage,
        toasts: [],
        media: (p.media as MediaAsset[]).map((m) => ({ ...fix(m), replacement: m.replacement ? fix(m.replacement) : undefined })),
      }
    }
  } catch {
    /* fall through to seed */
  }
  return { content: seedContent, media: seedMedia, homepage: seedHomepage, toasts: [] }
}

export interface Usage {
  item: ContentItem
  role: string
}

export function mediaUsage(assetId: string, content: ContentItem[]): Usage[] {
  const out: Usage[] = []
  content.forEach((c) => {
    if (c.posterId === assetId) out.push({ item: c, role: "Portrait artwork" })
    if (c.landscapeId === assetId) out.push({ item: c, role: "Landscape artwork" })
    if (c.squareId === assetId) out.push({ item: c, role: "Square artwork" })
    if (c.mediaId === assetId) out.push({ item: c, role: "Main media" })
    c.seasons.forEach((s) =>
      s.episodes.forEach((e) => {
        if (e.mediaId === assetId) out.push({ item: c, role: `S${s.number} · ${e.title || "Untitled episode"}` })
      }),
    )
  })
  return out
}

export function homepageUsage(contentId: string, sections: HomepageSection[]) {
  return sections.filter((s) => s.itemIds.includes(contentId))
}

interface Api {
  content: ContentItem[]
  media: MediaAsset[]
  assets: Record<string, MediaAsset>
  homepage: HomepageSection[]
  toasts: Toast[]
  getContent: (id: string) => ContentItem | undefined
  saveContent: (item: ContentItem) => void
  startUpload: (input: { name: string; kind: MediaAsset["kind"]; sizeLabel: string; url?: string; duration?: string; simulateFail: boolean }) => string
  patchMedia: (id: string, patch: Partial<MediaAsset>) => void
  deleteMedia: (id: string) => void
  retryMedia: (id: string) => void
  finishMedia: (id: string) => void
  startReplacement: (id: string, input: { name: string; sizeLabel: string; url?: string; duration?: string; simulateFail: boolean }) => void
  cancelReplacement: (id: string) => void
  retryReplacement: (id: string) => void
  swapReplacement: (id: string) => void
  applyHomepage: (sections: HomepageSection[]) => void
  toast: (tone: Toast["tone"], text: string) => void
  dismissToast: (id: string) => void
  resetDemo: () => void
}

const Ctx = createContext<Api | null>(null)

const defaultFocal = { portrait: { x: 50, y: 50 }, landscape: { x: 50, y: 50 }, square: { x: 50, y: 50 } }

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    const { content, media, homepage } = state
    try {
      localStorage.setItem(KEY, JSON.stringify({ content, media, homepage }))
    } catch {
      /* storage unavailable: prototype keeps working in memory */
    }
  }, [state.content, state.media, state.homepage])

  const active = hasActive(state.media)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => dispatch({ type: "tick" }), 350)
    return () => clearInterval(t)
  }, [active])

  const toast = useCallback((tone: Toast["tone"], text: string) => dispatch({ type: "toast", toast: { id: genId("t"), tone, text } }), [])

  const api = useMemo<Api>(
    () => ({
      content: state.content,
      media: state.media,
      assets: Object.fromEntries(state.media.map((m) => [m.id, m])),
      homepage: state.homepage,
      toasts: state.toasts,
      getContent: (id) => state.content.find((c) => c.id === id),
      saveContent: (item) => dispatch({ type: "saveContent", item }),
      startUpload: ({ name, kind, sizeLabel, url, duration, simulateFail }) => {
        const id = genId("med")
        dispatch({
          type: "addMedia",
          asset: {
            id, kind, name, sizeLabel, url, duration,
            createdAt: new Date().toISOString(),
            captions: [], focal: defaultFocal,
            status: "uploading", progress: 0, ticks: 0, willFail: simulateFail,
          },
        })
        return id
      },
      patchMedia: (id, patch) => dispatch({ type: "patchMedia", id, patch }),
      deleteMedia: (id) => dispatch({ type: "deleteMedia", id }),
      retryMedia: (id) => dispatch({ type: "retryMedia", id }),
      finishMedia: (id) => dispatch({ type: "finishMedia", id }),
      startReplacement: (id, input) =>
        dispatch({
          type: "setReplacement", id,
          replacement: { ...input, status: "uploading", progress: 0, ticks: 0, willFail: input.simulateFail },
        }),
      cancelReplacement: (id) => dispatch({ type: "setReplacement", id, replacement: undefined }),
      retryReplacement: (id) => dispatch({ type: "retryReplacement", id }),
      swapReplacement: (id) => dispatch({ type: "swapReplacement", id }),
      applyHomepage: (sections) => dispatch({ type: "applyHomepage", sections }),
      toast,
      dismissToast: (id) => dispatch({ type: "dismissToast", id }),
      resetDemo: () => dispatch({ type: "reset" }),
    }),
    [state, toast],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error("StoreProvider missing")
  return c
}
