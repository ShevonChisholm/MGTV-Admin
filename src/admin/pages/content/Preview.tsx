import React, { useState } from "react"
import { Modal, Tabs, MediaThumb, CROP_RATIO } from "../../ui"
import { useStore } from "../../store/store"
import { TYPE_META, metaLine, STATUS_META } from "../../store/meta"
import type { ContentItem, CropName, MediaAsset } from "../../store/types"

function artFor(c: ContentItem, crop: CropName, assets: Record<string, MediaAsset>): MediaAsset | null {
  const id = crop === "portrait" ? c.posterId : crop === "square" ? c.squareId : c.landscapeId
  return id ? assets[id] ?? null : null
}

export function defaultCrop(c: ContentItem): CropName {
  return c.type === "show" || c.type === "movie" ? "portrait" : c.type === "audio_track" ? "square" : "landscape"
}

/** Customer-facing card as the prototype represents it. Not a live customer view. */
export function CustomerCard({ item, crop, width = 180, unavailable }: { item: ContentItem; crop?: CropName; width?: number; unavailable?: boolean }) {
  const { assets } = useStore()
  const c = crop ?? defaultCrop(item)
  const art = artFor(item, c, assets) ?? artFor(item, "landscape", assets) ?? artFor(item, "portrait", assets) ?? artFor(item, "square", assets)
  const meta = TYPE_META[item.type]
  return (
    <article style={{ width, flex: "0 0 auto", fontFamily: "var(--font-sans)" }} aria-label={`${meta.label}: ${item.title || "Untitled"}`}>
      <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: CROP_RATIO[c], background: "#1b1e25" }}>
        <MediaThumb asset={art} crop={c} style={{ borderRadius: 0, height: "100%", aspectRatio: "auto" }} />
        <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(13,14,16,.85)", color: "var(--accent-hover)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 7px", borderRadius: 4 }}>
          {meta.label}
        </span>
        {unavailable && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(13,14,16,.82)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 10, fontSize: 12, fontWeight: 600, color: "var(--yellow)" }}>
            Not visible to customers ({STATUS_META[item.status].label})
          </div>
        )}
      </div>
      <div style={{ padding: "9px 2px 0" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25 }}>{item.title || "Untitled"}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.4 }}>{metaLine(item) || "No details yet"}</div>
        <span style={{ display: "inline-block", marginTop: 8, background: "var(--accent)", color: "var(--on-accent)", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 5 }}>{meta.action}</span>
      </div>
    </article>
  )
}

function Detail({ item }: { item: ContentItem }) {
  const { assets } = useStore()
  const [season, setSeason] = useState(item.seasons[0]?.id ?? "")
  const hero = artFor(item, "landscape", assets) ?? artFor(item, "portrait", assets) ?? artFor(item, "square", assets)
  const meta = TYPE_META[item.type]
  const s = item.seasons.find((x) => x.id === season)
  return (
    <div style={{ border: "1px solid var(--border-light)", borderRadius: 10, overflow: "hidden", background: "#0b0c0e" }}>
      <div style={{ position: "relative" }}>
        <MediaThumb asset={hero} crop="landscape" style={{ borderRadius: 0, maxHeight: 260 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,12,14,0) 30%, #0b0c0e 100%)" }} />
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-hover)" }}>{meta.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-sans)", lineHeight: 1.1 }}>{item.title || "Untitled"}</div>
        </div>
      </div>
      <div style={{ padding: 20, display: "grid", gap: 14 }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{metaLine(item)}</div>
        {item.type === "audio_track" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
            <span style={{ background: "var(--accent)", color: "var(--on-accent)", fontWeight: 700, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden>▶</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5 }}>{assets[item.mediaId ?? ""]?.name ?? "No audio file attached"}</div>
              <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginTop: 8 }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{assets[item.mediaId ?? ""]?.duration ?? "--:--"}</span>
          </div>
        ) : (
          <span style={{ justifySelf: "start", background: "var(--accent)", color: "var(--on-accent)", fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 6 }}>{meta.action}</span>
        )}
        {item.type === "article" ? (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{item.body || "No article body yet."}</p>
        ) : (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65 }}>{item.synopsis || "No synopsis yet."}</p>
        )}
        {item.type === "movie" && (
          <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", fontSize: 13 }}>
            <dt style={{ color: "var(--text-muted)" }}>Director</dt><dd style={{ margin: 0 }}>{item.director || "—"}</dd>
            <dt style={{ color: "var(--text-muted)" }}>Cast</dt><dd style={{ margin: 0 }}>{item.cast || "—"}</dd>
          </dl>
        )}
        {item.type === "music_video" && item.credits && <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.credits}</div>}
        {item.type === "event" && (
          <div style={{ fontSize: 13 }}>
            <strong>{item.venue || "Venue TBC"}</strong>
            <div style={{ color: "var(--text-secondary)" }}>{item.eventDate ? new Date(item.eventDate).toLocaleString() : "Date TBC"}</div>
          </div>
        )}
        {item.type === "show" && (
          <div>
            {item.seasons.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>No seasons added yet.</div>
            ) : (
              <>
                <Tabs label="Seasons" items={item.seasons.map((x) => ({ id: x.id, label: `Season ${x.number}` }))} value={season} onChange={setSeason} />
                <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 8 }}>
                  {(s?.episodes ?? []).map((e, i) => (
                    <li key={e.id} style={{ display: "flex", gap: 12, padding: 10, border: "1px solid var(--border)", borderRadius: 8, background: "var(--card)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", width: 22 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.title || "Untitled episode"}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>{e.synopsis || "No synopsis"}</div>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{e.durationMin ? `${e.durationMin} min` : "—"}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ContentPreview({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const [tab, setTab] = useState<"card" | "detail">("card")
  const crops: CropName[] = ["portrait", "landscape", "square"]
  return (
    <Modal title={`Preview: ${item.title || "Untitled"}`} onClose={onClose} side width={720}>
      <p role="note" style={{ margin: "0 0 14px", fontSize: 12.5, color: "var(--text-secondary)", padding: "8px 12px", border: "1px solid var(--border-light)", borderRadius: 8 }}>
        Prototype preview of how this content could look to customers. It reflects your current edits, including unsaved ones, and is not connected to the customer app.
      </p>
      <Tabs label="Preview type" items={[{ id: "card", label: "Card" }, { id: "detail", label: "Detail page" }]} value={tab} onChange={setTab} />
      <div style={{ marginTop: 16 }}>
        {tab === "card" ? (
          <div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
              {crops.map((c) => (
                <div key={c}>
                  <div style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 8 }}>{c}{c === defaultCrop(item) ? " (default)" : ""}</div>
                  <CustomerCard item={item} crop={c} width={c === "landscape" ? 280 : 170} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Detail item={item} />
        )}
      </div>
    </Modal>
  )
}
