import React, { useRef, useState } from "react"
import { PageActions } from "../components/PageHeader"
import { Link } from "../router"
import { opsMediaUsage, useOps } from "../store/ops/ops"
import { homepageUsage, mediaUsage, useStore } from "../store/store"
import { Badge, Card, ConfirmDialog, EmptyState, KIND_LABEL, MEDIA_STATUS_COLOR, MediaThumb, Modal, ProgressBar, Tabs } from "../ui"
import type { CropName, MediaAsset, MediaKind, PipelineState } from "../store/types"
import { TYPE_META } from "../store/meta"

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

const DEMO_FILES: { name: string; kind: MediaKind; sizeLabel: string; duration?: string; url?: string }[] = [
  { name: "behind-the-scenes-cut.mp4", kind: "video", sizeLabel: "612 MB", duration: "08:42" },
  { name: "tower-at-dusk.jpg", kind: "image", sizeLabel: "3.4 MB", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&h=600&fit=crop&auto=format" },
  { name: "studio-session-master.wav", kind: "audio", sizeLabel: "48 MB", duration: "03:58" },
]

function kindFromFile(f: File): MediaKind {
  if (f.type.startsWith("video/")) return "video"
  if (f.type.startsWith("image/")) return "image"
  if (f.type.startsWith("audio/")) return "audio"
  return "video"
}

const fmtSize = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

function PipelineView({ p, onRetry }: { p: PipelineState; onRetry?: () => void }) {
  if (p.status === "ready") return <span style={{ color: "var(--green)", fontSize: 13, fontWeight: 600 }}>Ready</span>
  if (p.status === "failed")
    return (
      <div role="alert" style={{ fontSize: 13 }}>
        <div style={{ color: "var(--red)", fontWeight: 600 }}>Failed</div>
        <div style={{ color: "var(--text-secondary)", margin: "2px 0 8px" }}>{p.failReason}</div>
        {onRetry && <button className="btn btn-sm" onClick={onRetry}>Retry</button>}
      </div>
    )
  if (p.status === "uploading") return <ProgressBar value={p.progress} label={`Uploading (simulated) ${p.progress}%`} />
  return (
    <div style={{ fontSize: 13, color: "var(--yellow)" }} role="status">
      {p.ticks < 0 ? "Processing is waiting (held for demo)" : "Processing (simulated)…"}
    </div>
  )
}

function UploadModal({ onClose }: { onClose: () => void }) {
  const { startUpload, toast } = useStore()
  const [fail, setFail] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const [picked, setPicked] = useState<File | null>(null)
  const [demo, setDemo] = useState(0)
  const [mode, setMode] = useState<"local" | "demo">("demo")

  const go = () => {
    if (mode === "local") {
      if (!picked) return toast("error", "Choose a file first, or switch to a demo file.")
      const kind = kindFromFile(picked)
      startUpload({ name: picked.name, kind, sizeLabel: fmtSize(picked.size), simulateFail: fail })
    } else {
      const d = DEMO_FILES[demo]
      startUpload({ ...d, simulateFail: fail })
    }
    toast("info", "Simulated upload started. Nothing leaves this browser.")
    onClose()
  }

  return (
    <Modal
      title="Upload media (simulation)"
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={go}>Start simulated upload</button></>}
    >
      <p role="note" style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-secondary)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "8px 12px" }}>
        This is a local demonstration. Only the file name and size are read; the file is not uploaded anywhere and nothing is actually encoded.
      </p>
      <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
        <legend style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Source</legend>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, fontSize: 13.5 }}>
          <input type="radio" name="src" checked={mode === "demo"} onChange={() => setMode("demo")} /> Use a demo file
        </label>
        {mode === "demo" && (
          <select aria-label="Demo file" className="input" value={demo} onChange={(e) => setDemo(Number(e.target.value))} style={{ marginBottom: 8 }}>
            {DEMO_FILES.map((d, i) => (
              <option key={d.name} value={i}>{d.name} ({KIND_LABEL[d.kind]}, {d.sizeLabel})</option>
            ))}
          </select>
        )}
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>
          <input type="radio" name="src" checked={mode === "local"} onChange={() => setMode("local")} /> Choose a local file
        </label>
        {mode === "local" && (
          <div style={{ marginTop: 8 }}>
            <label htmlFor="local-file" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Local file</label>
            <input id="local-file" ref={file} type="file" accept="video/*,image/*,audio/*" onChange={(e) => setPicked(e.target.files?.[0] ?? null)} style={{ fontSize: 13 }} />
          </div>
        )}
      </fieldset>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>
        <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} /> Simulate a processing failure (to try Retry)
      </label>
    </Modal>
  )
}

function ReplaceModal({ asset, onClose }: { asset: MediaAsset; onClose: () => void }) {
  const { content, homepage, startReplacement, cancelReplacement, retryReplacement, swapReplacement, assets, toast } = useStore()
  const live = assets[asset.id] ?? asset
  const rep = live.replacement
  const usage = mediaUsage(asset.id, content)
  const sections = [...new Set(usage.flatMap((u) => homepageUsage(u.item.id, homepage).map((s) => s.label)))]
  const [name, setName] = useState(asset.kind === "image" ? "replacement-artwork.jpg" : asset.kind === "audio" ? "replacement-master.wav" : "replacement-cut.mp4")
  const [fail, setFail] = useState(false)
  const items = [...new Map(usage.map((u) => [u.item.id, u.item])).values()]

  return (
    <Modal
      title={`Replace ${live.name}`}
      onClose={onClose}
      footer={
        rep ? (
          <>
            <button className="btn" onClick={() => { cancelReplacement(asset.id); onClose() }}>Cancel replacement</button>
            <button className="btn btn-primary" disabled={rep.status !== "ready"} onClick={() => { swapReplacement(asset.id); toast("success", `"${live.name}" replaced. ${items.length} item${items.length === 1 ? "" : "s"} now use the new file.`); onClose() }}>Swap in replacement</button>
          </>
        ) : (
          <>
            <button className="btn" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={() => startReplacement(asset.id, { name, sizeLabel: "—", simulateFail: fail, duration: live.duration, url: live.kind === "image" ? live.url : undefined })}>Start simulated upload</button>
          </>
        )
      }
    >
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)" }}>
        The original stays in use until the replacement is Ready and you confirm the swap. The asset ID ({live.id}) is kept, so content keeps its reference. This is a local simulation.
      </p>
      <div style={{ border: "1px solid var(--border-light)", borderRadius: 8, padding: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Affected content ({items.length})</div>
        {items.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Nothing uses this file yet.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
            {usage.map((u, i) => (<li key={i}>{u.item.title || "Untitled"} <span style={{ color: "var(--text-muted)" }}>({TYPE_META[u.item.type].label}, {u.role})</span></li>))}
          </ul>
        )}
        {sections.length > 0 && <div style={{ fontSize: 13, marginTop: 8 }}>Homepage sections showing it: <strong>{sections.join(", ")}</strong></div>}
      </div>
      {rep ? (
        <div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Replacement: <strong>{rep.name}</strong></div>
          <PipelineView p={rep} onRetry={() => retryReplacement(asset.id)} />
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <label htmlFor="rep-name" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Replacement file name (demo)</label>
            <input id="rep-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5 }}>
            <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} /> Simulate a processing failure
          </label>
        </div>
      )}
    </Modal>
  )
}

function CaptionAttach({ asset }: { asset: MediaAsset }) {
  const { patchMedia, toast } = useStore()
  const [lang, setLang] = useState("English")
  const [fmt, setFmt] = useState<"vtt" | "srt">("vtt")
  const [fileName, setFileName] = useState("")
  const add = () => {
    if (!fileName.trim()) return toast("error", "Choose a caption file first.")
    patchMedia(asset.id, { captions: [...asset.captions, { id: `cap_${Date.now().toString(36)}`, language: lang, format: fmt, fileName: fileName.trim() }] })
    setFileName("")
    toast("success", `${lang} captions attached (name only, file not stored).`)
  }
  return (
    <Card title="Captions">
      {asset.captions.length === 0 ? (
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)" }}>No captions attached. Customers would see this video without subtitles.</p>
      ) : (
        <ul style={{ margin: "0 0 12px", padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
          {asset.captions.map((c) => (
            <li key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, alignItems: "center" }}>
              <span>{c.language} <span style={{ color: "var(--text-muted)" }}>· {c.format.toUpperCase()} · {c.fileName}</span></span>
              <button className="btn btn-sm" aria-label={`Detach ${c.language} captions`} onClick={() => patchMedia(asset.id, { captions: asset.captions.filter((x) => x.id !== c.id) })}>Detach</button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        <div className="grid-2">
          <div>
            <label htmlFor="cap-lang" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Language</label>
            <select id="cap-lang" className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
              {["English", "Spanish", "French", "German", "Portuguese"].map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cap-fmt" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Format</label>
            <select id="cap-fmt" className="input" value={fmt} onChange={(e) => setFmt(e.target.value as "vtt" | "srt")}>
              <option value="vtt">WebVTT (.vtt)</option>
              <option value="srt">SubRip (.srt)</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="cap-file" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Caption file</label>
          <input id="cap-file" type="file" accept=".vtt,.srt" style={{ fontSize: 13 }} onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) {
              setFileName(f.name)
              setFmt(f.name.toLowerCase().endsWith(".srt") ? "srt" : "vtt")
            }
          }} />
        </div>
        <button className="btn" onClick={add} style={{ justifySelf: "start" }}>Attach captions</button>
      </div>
    </Card>
  )
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const { assets, content, homepage, patchMedia, deleteMedia, retryMedia, finishMedia, toast } = useStore()
  const ops = useOps()
  const a = assets[id]
  const [crop, setCrop] = useState<CropName>("landscape")
  const [replace, setReplace] = useState(false)
  const [del, setDel] = useState(false)
  if (!a) return null
  const usage = mediaUsage(a.id, content)
  const opsUse = opsMediaUsage(a.id, ops)
  const total = usage.length + opsUse.length
  const sections = [...new Set(usage.flatMap((u) => homepageUsage(u.item.id, homepage).map((s) => s.label)))]
  const focal = a.focal[crop]

  return (
    <Modal title={a.name} onClose={onClose} side width={560}>
      <div style={{ display: "grid", gap: 14 }}>
        {a.kind === "image" && (
          <>
            <Tabs label="Crop preview" value={crop} onChange={setCrop} items={[{ id: "portrait", label: "Portrait 2:3" }, { id: "landscape", label: "Landscape 16:9" }, { id: "square", label: "Square 1:1" }]} />
            <div style={{ maxWidth: crop === "portrait" ? 240 : 420 }}>
              <MediaThumb asset={a} crop={crop} />
            </div>
            <div className="grid-2">
              {(["x", "y"] as const).map((ax) => (
                <div key={ax}>
                  <label htmlFor={`focal-${ax}`} style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Focal point {ax.toUpperCase()} ({focal[ax]}%)</label>
                  <input id={`focal-${ax}`} type="range" min={0} max={100} value={focal[ax]} style={{ width: "100%" }} onChange={(e) => patchMedia(a.id, { focal: { ...a.focal, [crop]: { ...focal, [ax]: Number(e.target.value) } } })} />
                </div>
              ))}
            </div>
          </>
        )}
        {a.kind !== "image" && <div style={{ maxWidth: 360 }}><MediaThumb asset={a} crop={a.kind === "audio" ? "square" : "landscape"} /></div>}

        <Card title="Details">
          <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: 13 }}>
            <dt style={{ color: "var(--text-muted)" }}>ID</dt><dd style={{ margin: 0, fontFamily: "var(--font-mono)" }}>{a.id}</dd>
            <dt style={{ color: "var(--text-muted)" }}>Type</dt><dd style={{ margin: 0 }}>{KIND_LABEL[a.kind]}</dd>
            <dt style={{ color: "var(--text-muted)" }}>Size</dt><dd style={{ margin: 0 }}>{a.sizeLabel}</dd>
            {a.duration && (<><dt style={{ color: "var(--text-muted)" }}>Duration</dt><dd style={{ margin: 0 }}>{a.duration}</dd></>)}
            {a.dimensions && (<><dt style={{ color: "var(--text-muted)" }}>Dimensions</dt><dd style={{ margin: 0 }}>{a.dimensions}</dd></>)}
            <dt style={{ color: "var(--text-muted)" }}>Status</dt><dd style={{ margin: 0 }}><PipelineView p={a} onRetry={() => retryMedia(a.id)} /></dd>
          </dl>
          {a.status === "processing" && a.ticks < 0 && (
            <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => { finishMedia(a.id); toast("success", `${a.name} finished processing (demo).`) }}>Finish processing (demo)</button>
          )}
        </Card>

        {a.kind === "video" && <CaptionAttach asset={a} />}

        <Card title={`Used by (${total})`}>
          {total === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Not used by any content or record.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
              {opsUse.map((u, i) => (
                <li key={"o" + i}><Link to={u.to} onClick={onClose} style={{ color: "var(--accent-hover)" }}>{u.label}</Link></li>
              ))}
              {usage.map((u, i) => (
                <li key={i}><Link to={`/admin/content/${TYPE_META[u.item.type].tab}/${u.item.id}`} onClick={onClose} style={{ color: "var(--accent-hover)" }}>{u.item.title || "Untitled"}</Link> <span style={{ color: "var(--text-muted)" }}>· {u.role}</span></li>
              ))}
            </ul>
          )}
          {sections.length > 0 && <p style={{ margin: "8px 0 0", fontSize: 13 }}>Also on the homepage: {sections.join(", ")}</p>}
        </Card>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => setReplace(true)} disabled={a.status !== "ready"} title={a.status !== "ready" ? "Wait until this file is Ready" : undefined}>Replace file</button>
          <button className="btn btn-danger" onClick={() => setDel(true)}>Delete file</button>
        </div>
      </div>
      {replace && <ReplaceModal asset={a} onClose={() => setReplace(false)} />}
      {del && (total > 0 ? (
        <Modal title="Can't delete this file" onClose={() => setDel(false)} footer={<button className="btn" onClick={() => setDel(false)}>OK</button>}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>
            {a.name} is used by {total} place{total === 1 ? "" : "s"}. Remove or replace it in {[...usage.map((u) => u.item.title || "Untitled"), ...opsUse.map((u) => u.label)].filter((v, i, arr) => arr.indexOf(v) === i).join(", ")} first, or use Replace file to swap it safely.
          </p>
        </Modal>
      ) : (
        <ConfirmDialog title={`Delete ${a.name}?`} confirmLabel="Delete file" danger onCancel={() => setDel(false)} onConfirm={() => { deleteMedia(a.id); toast("success", `${a.name} deleted from the local library.`); onClose() }}>
          Nothing uses this file. It will be removed from the prototype library.
        </ConfirmDialog>
      ))}
    </Modal>
  )
}

export default function Media() {
  const { media, retryMedia } = useStore()
  const [kind, setKind] = useState<"all" | MediaKind>("all")
  const [q, setQ] = useState("")
  const [upload, setUpload] = useState(false)
  const [open, setOpen] = useState<string | null>(null)

  const count = (f: (m: MediaAsset) => boolean) => media.filter(f).length
  const rows = media.filter((m) => (kind === "all" || m.kind === kind) && m.name.toLowerCase().includes(q.toLowerCase()))
  const summary = [
    { label: "Total files", value: media.length },
    { label: "Ready", value: count((m) => m.status === "ready") },
    { label: "In progress", value: count((m) => m.status === "uploading" || m.status === "processing") },
    { label: "Failed", value: count((m) => m.status === "failed") },
  ]

  return (
    <div className="page-pad">
      <PageActions>
        <button className="btn" disabled title="Unavailable in this prototype" aria-describedby="live-note">Configure live stream</button>
        <button className="btn btn-primary" onClick={() => setUpload(true)}>Upload media</button>
      </PageActions>
      <p id="live-note" style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--text-muted)" }}>Live stream configuration is unavailable in this prototype.</p>

      <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 20 }}>
        {summary.map((s) => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-sans)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="scroll-x">
        <Tabs label="Media type" value={kind} onChange={setKind} items={[{ id: "all", label: "All", count: media.length }, ...(["video", "image", "audio", "caption"] as MediaKind[]).map((k) => ({ id: k, label: KIND_LABEL[k], count: count((m) => m.kind === k) }))]} />
      </div>

      <div style={{ margin: "16px 0", maxWidth: 360 }}>
        <label htmlFor="media-q" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Search files</label>
        <input id="media-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="File name" />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No files here" body={media.length ? "No files match this filter." : "Upload a file to start building the library."} action={<button className="btn btn-primary" onClick={() => setUpload(true)}>Upload media</button>} />
      ) : (
        <div className="scroll-x">
          <table className="tbl">
            <thead>
              <tr><th scope="col">File</th><th scope="col">Type</th><th scope="col">Size</th><th scope="col">Status</th><th scope="col">Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 220 }}>
                      <div style={{ width: 64, flex: "0 0 auto" }}><MediaThumb asset={m} crop="landscape" /></div>
                      <div>
                        <div style={{ fontWeight: 600, wordBreak: "break-all" }}>{m.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{m.duration ?? m.dimensions ?? ""}</div>
                      </div>
                    </div>
                  </td>
                  <td>{KIND_LABEL[m.kind]}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{m.sizeLabel}</td>
                  <td style={{ minWidth: 150 }}>
                    {m.status === "ready" || m.status === "failed" ? <Badge color={MEDIA_STATUS_COLOR[m.status]}>{cap(m.status)}</Badge> : <PipelineView p={m} />}
                    {m.replacement && <div style={{ fontSize: 11.5, color: "var(--yellow)", marginTop: 4 }}>Replacement {m.replacement.status}</div>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button className="btn btn-sm" onClick={() => setOpen(m.id)} aria-label={`Details for ${m.name}`}>Details</button>
                      {m.status === "failed" && <button className="btn btn-sm" onClick={() => retryMedia(m.id)} aria-label={`Retry ${m.name}`}>Retry</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {upload && <UploadModal onClose={() => setUpload(false)} />}
      {open && <Detail id={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
