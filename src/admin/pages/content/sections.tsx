import React, { useState } from "react"
import { Badge, Card, ConfirmDialog, MediaThumb, MEDIA_STATUS_COLOR, SelectField, TextField } from "../../ui"
import MediaPicker from "../../ui/MediaPicker"
import { useStore } from "../../store/store"
import { GENRES, RATINGS, genId } from "../../store/meta"
import type { ContentItem, CropName, Episode, MediaKind, Season } from "../../store/types"

export type Errs = Record<string, string | undefined>
export type SetFn = (patch: Partial<ContentItem>) => void

const num = (v: string): number | "" => (v === "" ? "" : Number(v))

/* ---------- Media slot (artwork or file) ---------- */
export function MediaSlot({ label, kind, value, onChange, error, fieldId, crop, required }: { label: string; kind: MediaKind; value: string | null; onChange: (id: string | null) => void; error?: string; fieldId: string; crop?: CropName; required?: boolean }) {
  const { assets } = useStore()
  const [open, setOpen] = useState(false)
  const a = value ? assets[value] : undefined
  const w = crop === "portrait" ? 96 : crop === "square" ? 110 : kind === "image" ? 190 : 120
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
        {label}
        {required && <span style={{ color: "var(--accent)" }}> *</span>}
      </span>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 10, border: `1px solid ${error ? "var(--red)" : "var(--border-light)"}`, borderRadius: 8, background: "var(--bg)" }}>
        <div style={{ width: w, flex: "0 0 auto" }}>
          <MediaThumb asset={a} crop={crop ?? "landscape"} label={a?.name} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {a ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, wordBreak: "break-all" }}>{a.name}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12, color: "var(--text-secondary)" }}>
                <Badge color={MEDIA_STATUS_COLOR[a.status]}>{a.status[0].toUpperCase() + a.status.slice(1)}</Badge>
                <span>{a.duration ?? a.dimensions ?? a.sizeLabel}</span>
                {a.kind === "video" && <span>{a.captions.length ? `${a.captions.length} caption file${a.captions.length > 1 ? "s" : ""}` : "No captions"}</span>}
              </div>
              {a.status !== "ready" && <div style={{ fontSize: 12, color: "var(--yellow)" }}>Not ready, so this blocks publishing.</div>}
            </>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Nothing selected yet.</div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button id={fieldId} type="button" className="btn btn-sm" onClick={() => setOpen(true)} aria-describedby={error ? fieldId + "-e" : undefined}>
              {a ? "Change" : `Choose ${kind === "image" ? "image" : kind}`}
            </button>
            {a && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)}>Clear</button>}
          </div>
        </div>
      </div>
      {error && <span id={fieldId + "-e"} role="alert" style={{ fontSize: 12, color: "var(--red)", fontWeight: 500 }}>{error}</span>}
      {open && (
        <MediaPicker
          kind={kind}
          value={value}
          crop={crop}
          onClose={() => setOpen(false)}
          onSelect={(id) => {
            onChange(id)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

/* ---------- Artwork ---------- */
const ART: Record<CropName, { field: "posterId" | "landscapeId" | "squareId"; label: string }> = {
  portrait: { field: "posterId", label: "Portrait artwork (2:3)" },
  landscape: { field: "landscapeId", label: "Landscape artwork (16:9)" },
  square: { field: "squareId", label: "Square artwork (1:1)" },
}

export function ArtworkSection({ draft, set, errs, crops }: { draft: ContentItem; set: SetFn; errs: Errs; crops: CropName[] }) {
  return (
    <Card title="Artwork" id="sec-artwork">
      <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "var(--text-secondary)" }}>
        Choose images from the media library. Each format uses its own crop, so pick the right artwork for every slot.
      </p>
      <div className="grid-2">
        {crops.map((c) => (
          <MediaSlot key={c} label={ART[c].label} kind="image" crop={c} required fieldId={ART[c].field} error={errs[ART[c].field]} value={draft[ART[c].field]} onChange={(id) => set({ [ART[c].field]: id } as Partial<ContentItem>)} />
        ))}
      </div>
    </Card>
  )
}

/* ---------- Basics ---------- */
export function BasicsSection({ draft, set, errs }: { draft: ContentItem; set: SetFn; errs: Errs }) {
  const t = draft.type
  const synLabel = t === "article" ? "Standfirst (optional)" : t === "event" ? "Description (optional)" : "Synopsis"
  const synRequired = t !== "article" && t !== "event"
  return (
    <Card title="Basics" id="sec-basics">
      <div style={{ display: "grid", gap: 14 }}>
        <TextField label="Title" required fieldId="title" value={draft.title} onChange={(e) => set({ title: e.target.value })} error={errs.title} maxLength={120} autoComplete="off" />
        <TextField label={synLabel} required={synRequired} fieldId="synopsis" multiline value={draft.synopsis} onChange={(e) => set({ synopsis: e.target.value })} error={errs.synopsis} hint={synRequired ? "A short description shown on the detail page (at least 20 characters)." : undefined} />
        <div className="grid-3">
          {t !== "event" && <SelectField label="Genre" required fieldId="genre" value={draft.genre} onChange={(e) => set({ genre: e.target.value })} options={GENRES} error={errs.genre} />}
          {(t === "show" || t === "movie") && <SelectField label="Age rating" required fieldId="rating" value={draft.rating} onChange={(e) => set({ rating: e.target.value })} options={RATINGS} error={errs.rating} />}
          {(t === "show" || t === "movie" || t === "music_video") && (
            <TextField label="Release year" required fieldId="year" type="number" inputMode="numeric" min={1900} max={2100} value={draft.year} onChange={(e) => set({ year: num(e.target.value) })} error={errs.year} />
          )}
        </div>
      </div>
    </Card>
  )
}

/* ---------- Format specific ---------- */
export function MovieDetails({ draft, set, errs }: { draft: ContentItem; set: SetFn; errs: Errs }) {
  return (
    <Card title="Movie details" id="sec-details">
      <div style={{ display: "grid", gap: 14 }}>
        <div className="grid-2">
          <TextField label="Runtime (minutes)" required fieldId="runtime" type="number" inputMode="numeric" min={1} value={draft.runtimeMin} onChange={(e) => set({ runtimeMin: num(e.target.value) })} error={errs.runtime} />
          <TextField label="Director" required fieldId="director" value={draft.director} onChange={(e) => set({ director: e.target.value })} error={errs.director} />
        </div>
        <TextField label="Cast (comma separated)" fieldId="cast" value={draft.cast} onChange={(e) => set({ cast: e.target.value })} />
      </div>
    </Card>
  )
}

export function MusicVideoDetails({ draft, set, errs }: { draft: ContentItem; set: SetFn; errs: Errs }) {
  return (
    <Card title="Music video details" id="sec-details">
      <div className="grid-2">
        <TextField label="Artist" required fieldId="artist" value={draft.artist} onChange={(e) => set({ artist: e.target.value })} error={errs.artist} />
        <TextField label="Credits" fieldId="credits" value={draft.credits} onChange={(e) => set({ credits: e.target.value })} hint="Director, cinematographer, label…" />
      </div>
    </Card>
  )
}

export function AudioDetails({ draft, set, errs }: { draft: ContentItem; set: SetFn; errs: Errs }) {
  return (
    <Card title="Audio track details" id="sec-details">
      <div className="grid-2">
        <TextField label="Artist" required fieldId="artist" value={draft.artist} onChange={(e) => set({ artist: e.target.value })} error={errs.artist} />
        <TextField label="Album or release" required fieldId="album" value={draft.album} onChange={(e) => set({ album: e.target.value })} error={errs.album} />
      </div>
    </Card>
  )
}

export function ArticleDetails({ draft, set, errs }: { draft: ContentItem; set: SetFn; errs: Errs }) {
  return (
    <Card title="Article" id="sec-details">
      <div style={{ display: "grid", gap: 14 }}>
        <TextField label="Byline" required fieldId="byline" value={draft.byline} onChange={(e) => set({ byline: e.target.value })} error={errs.byline} />
        <TextField label="Body" required fieldId="body" multiline rows={9} value={draft.body} onChange={(e) => set({ body: e.target.value })} error={errs.body} hint="Plain text for the prototype (at least 40 characters)." />
      </div>
    </Card>
  )
}

export function EventDetails({ draft, set, errs }: { draft: ContentItem; set: SetFn; errs: Errs }) {
  return (
    <Card title="Event details" id="sec-details">
      <div className="grid-2">
        <TextField label="Venue" required fieldId="venue" value={draft.venue} onChange={(e) => set({ venue: e.target.value })} error={errs.venue} />
        <TextField label="Event date and time" required fieldId="eventDate" type="datetime-local" value={draft.eventDate} onChange={(e) => set({ eventDate: e.target.value })} error={errs.eventDate} />
      </div>
    </Card>
  )
}

/* ---------- Seasons & episodes ---------- */
function EpisodeEditor({ season, ep, index, count, errs, update, move, remove }: { season: Season; ep: Episode; index: number; count: number; errs: Errs; update: (p: Partial<Episode>) => void; move: (d: -1 | 1) => void; remove: () => void }) {
  return (
    <div style={{ border: "1px solid var(--border-light)", borderRadius: 8, padding: 14, background: "var(--bg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 13, fontFamily: "var(--font-sans)" }}>Episode {index + 1}</strong>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(-1)} disabled={index === 0} aria-label={`Move episode ${index + 1} up`}>Move up</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(1)} disabled={index === count - 1} aria-label={`Move episode ${index + 1} down`}>Move down</button>
          <button type="button" className="btn btn-danger btn-sm" onClick={remove} aria-label={`Delete episode ${index + 1} from season ${season.number}`}>Delete episode</button>
        </div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <div className="grid-2">
          <TextField label="Episode title" required fieldId={`ep-${ep.id}-title`} value={ep.title} onChange={(e) => update({ title: e.target.value })} error={errs[`ep-${ep.id}-title`]} />
          <TextField label="Duration (minutes)" required fieldId={`ep-${ep.id}-duration`} type="number" inputMode="numeric" min={1} value={ep.durationMin} onChange={(e) => update({ durationMin: num(e.target.value) })} error={errs[`ep-${ep.id}-duration`]} />
        </div>
        <TextField label="Episode synopsis" required fieldId={`ep-${ep.id}-synopsis`} multiline rows={2} value={ep.synopsis} onChange={(e) => update({ synopsis: e.target.value })} error={errs[`ep-${ep.id}-synopsis`]} />
        <MediaSlot label="Episode video" kind="video" required fieldId={`ep-${ep.id}-media`} value={ep.mediaId} onChange={(id) => update({ mediaId: id })} error={errs[`ep-${ep.id}-media`]} />
      </div>
    </div>
  )
}

export function SeasonsSection({ draft, set, errs }: { draft: ContentItem; set: SetFn; errs: Errs }) {
  const [del, setDel] = useState<{ kind: "season"; id: string } | { kind: "episode"; sid: string; eid: string } | null>(null)
  const seasons = draft.seasons

  const upSeason = (sid: string, fn: (s: Season) => Season) => set({ seasons: seasons.map((s) => (s.id === sid ? fn(s) : s)) })

  const addSeason = () => {
    const n = seasons.length + 1
    set({ seasons: [...seasons, { id: genId("seas"), number: n, title: `Season ${n}`, episodes: [] }] })
  }
  const addEpisode = (sid: string) => upSeason(sid, (s) => ({ ...s, episodes: [...s.episodes, { id: genId("ep"), title: "", synopsis: "", durationMin: "", mediaId: null }] }))

  const confirmDelete = () => {
    if (!del) return
    if (del.kind === "season") set({ seasons: seasons.filter((s) => s.id !== del.id).map((s, i) => ({ ...s, number: i + 1 })) })
    else upSeason(del.sid, (s) => ({ ...s, episodes: s.episodes.filter((e) => e.id !== del.eid) }))
    setDel(null)
  }
  const delSeason = del?.kind === "season" ? seasons.find((s) => s.id === del.id) : undefined

  return (
    <Card
      title="Seasons and episodes"
      id="sec-seasons"
      aside={<button type="button" className="btn btn-sm" onClick={addSeason}>Add season</button>}
    >
      {errs.seasons && <div id="seasons" role="alert" tabIndex={-1} style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>{errs.seasons}</div>}
      {seasons.length === 0 ? (
        <div style={{ padding: 22, textAlign: "center", border: "1px dashed var(--border-light)", borderRadius: 8, fontSize: 13, color: "var(--text-secondary)" }}>
          No seasons yet. A show needs at least one season with at least one episode before it can be published.
          <div style={{ marginTop: 12 }}><button type="button" className="btn btn-primary" onClick={addSeason}>Add season 1</button></div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {seasons.map((s) => (
            <div key={s.id} id={`season-${s.id}`} tabIndex={-1}>
              <div style={{ display: "flex", gap: 10, alignItems: "end", marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px" }}>
                  <TextField label={`Season ${s.number} name`} fieldId={`season-${s.id}-name`} value={s.title} onChange={(e) => upSeason(s.id, (x) => ({ ...x, title: e.target.value }))} />
                </div>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setDel({ kind: "season", id: s.id })}>Delete season</button>
              </div>
              {errs[`season-${s.id}`] && <div role="alert" style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 8 }}>{errs[`season-${s.id}`]}</div>}
              <div style={{ display: "grid", gap: 12 }}>
                {s.episodes.map((e, i) => (
                  <EpisodeEditor
                    key={e.id}
                    season={s}
                    ep={e}
                    index={i}
                    count={s.episodes.length}
                    errs={errs}
                    update={(p) => upSeason(s.id, (x) => ({ ...x, episodes: x.episodes.map((y) => (y.id === e.id ? { ...y, ...p } : y)) }))}
                    move={(d) =>
                      upSeason(s.id, (x) => {
                        const eps = [...x.episodes]
                        ;[eps[i], eps[i + d]] = [eps[i + d], eps[i]]
                        return { ...x, episodes: eps }
                      })
                    }
                    remove={() => setDel({ kind: "episode", sid: s.id, eid: e.id })}
                  />
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <button type="button" className="btn btn-sm" onClick={() => addEpisode(s.id)}>Add episode to season {s.number}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {del && (
        <ConfirmDialog
          title={del.kind === "season" ? `Delete season ${delSeason?.number ?? ""}?` : "Delete this episode?"}
          confirmLabel={del.kind === "season" ? "Delete season" : "Delete episode"}
          danger
          onCancel={() => setDel(null)}
          onConfirm={confirmDelete}
        >
          {del.kind === "season"
            ? `This removes the season and its ${delSeason?.episodes.length ?? 0} episode(s) from this show draft. Media files stay in the library. The change applies when you save.`
            : "This removes the episode from the season. Its media file stays in the library. The change applies when you save."}
        </ConfirmDialog>
      )}
    </Card>
  )
}
