import ConnectedHomepage from "./ConnectedHomepage";
import {connected} from "../api/client";
import React, { useRef, useState } from "react"
import { PageActions } from "../components/PageHeader"
import { useDirtyGuard } from "../router"
import { useStore } from "../store/store"
import { Badge, Card, EmptyState, MediaThumb, Modal } from "../ui"
import { STATUS_META, TYPE_META, genId } from "../store/meta"
import type { ContentItem, HomepageSection } from "../store/types"
import { CustomerCard } from "./content/Preview"

function move<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d
  if (j < 0 || j >= arr.length) return arr
  const n = arr.slice()
  ;[n[i], n[j]] = [n[j], n[i]]
  return n
}

function Picker({ section, onToggle, onClose }: { section: HomepageSection; onToggle: (id: string) => void; onClose: () => void }) {
  const { content, assets } = useStore()
  const [q, setQ] = useState("")
  const list = content.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()))
  return (
    <Modal title={`Choose content for "${section.label}"`} onClose={onClose} width={640} footer={<button className="btn btn-primary" onClick={onClose}>Done</button>}>
      <label htmlFor="hp-q" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Search content</label>
      <input id="hp-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title" style={{ marginBottom: 12 }} />
      <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--text-secondary)" }}>Only Published content is visible to customers. Other items can be selected but will appear as unavailable.</p>
      {list.length === 0 ? (
        <EmptyState title="No content found" body="Create content in the Content Library first." />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
          {list.map((c) => {
            const on = section.itemIds.includes(c.id)
            const art = assets[c.landscapeId ?? ""] ?? assets[c.posterId ?? ""] ?? null
            return (
              <li key={c.id}>
                <label style={{ display: "flex", gap: 12, alignItems: "center", padding: 8, border: `1px solid ${on ? "var(--accent)" : "var(--border-light)"}`, borderRadius: 8, background: on ? "var(--accent-dim)" : "var(--card)", cursor: "pointer" }}>
                  <input type="checkbox" checked={on} onChange={() => onToggle(c.id)} />
                  <div style={{ width: 56 }}><MediaThumb asset={art} crop="landscape" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.title || "Untitled"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{TYPE_META[c.type].label}</div>
                  </div>
                  <Badge color={STATUS_META[c.status].color}>{STATUS_META[c.status].label}</Badge>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}

export default function Homepage(){return connected?<ConnectedHomepage/>:<PrototypeHomepage/>;}
function PrototypeHomepage() {
  const { homepage, content, applyHomepage, toast } = useStore()
  const [draft, setDraft] = useState<HomepageSection[]>(homepage)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const appliedRef = useRef(homepage)
  appliedRef.current = homepage
  const dirty = JSON.stringify(draft) !== JSON.stringify(homepage)
  useDirtyGuard(() => JSON.stringify(draftRef.current) !== JSON.stringify(appliedRef.current))
  const [picking, setPicking] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)

  const byId = (id: string): ContentItem | undefined => content.find((c) => c.id === id)
  const patch = (id: string, p: Partial<HomepageSection>) => setDraft((d) => d.map((s) => (s.id === id ? { ...s, ...p } : s)))
  const pickSection = draft.find((s) => s.id === picking)

  const apply = () => {
    const empty = draft.filter((s) => s.kind === "editorial" && s.itemIds.length === 0)
    const blank = draft.filter((s) => !s.label.trim())
    if (blank.length) return toast("error", "Every section needs a label before applying.")
    applyHomepage(draft)
    toast("success", `Homepage layout applied to the local prototype${empty.length ? ` (${empty.length} editorial section${empty.length === 1 ? " is" : "s are"} empty and will be hidden)` : ""}.`)
  }

  const addSection = () => {
    const id = genId("sec")
    setDraft((d) => [...d, { id, label: "New editorial section", kind: "editorial", itemIds: [], layout: "rail" }])
    setFocusId(id)
  }

  return (
    <div className="page-pad">
      <PageActions>
        {dirty && <span role="status" style={{ fontSize: 12.5, color: "var(--yellow)", fontWeight: 600 }}>Unapplied changes</span>}
        <button className="btn" disabled={!dirty} onClick={() => setDraft(homepage)}>Discard changes</button>
        <button className="btn btn-primary" disabled={!dirty} onClick={apply}>Apply to prototype</button>
      </PageActions>

      <p role="note" style={{ margin: "0 0 18px", fontSize: 13, color: "var(--text-secondary)", maxWidth: 720 }}>
        Editorial sections are lists you choose by hand, shown in the order you set. Applying updates this local prototype only; it does not change the customer app.
      </p>

      <div className="editor-layout" style={{ alignItems: "start" }}>
        <div>
          <h2 style={{ fontSize: 16, margin: "0 0 12px", fontFamily: "var(--font-sans)" }}>Sections</h2>
          {draft.length === 0 && <EmptyState title="The homepage has no sections" body="Add an editorial section and choose content for it." action={<button className="btn btn-primary" onClick={addSection}>Add editorial section</button>} />}
          <div style={{ display: "grid", gap: 14 }}>
            {draft.map((s, i) => (
              <Card
                key={s.id}
                title={
                  <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{i + 1}</span>
                    {s.kind === "editorial" ? <Badge color="#C9A84C">Editorial selection</Badge> : <Badge color="#60a5fa">Data-driven collection (future, not connected)</Badge>}
                  </span>
                }
                aside={
                  <span style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm" disabled={i === 0} aria-label={`Move ${s.label} up`} onClick={() => setDraft(move(draft, i, -1))}>Up</button>
                    <button className="btn btn-sm" disabled={i === draft.length - 1} aria-label={`Move ${s.label} down`} onClick={() => setDraft(move(draft, i, 1))}>Down</button>
                  </span>
                }
              >
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label htmlFor={`lbl-${s.id}`} style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Section label</label>
                    <input id={`lbl-${s.id}`} className="input" value={s.label} autoFocus={focusId === s.id} onChange={(e) => patch(s.id, { label: e.target.value })} aria-invalid={!s.label.trim()} />
                  </div>
                  {s.kind === "collection" ? (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                      Placeholder for a future data-driven collection. It has no content source in this prototype, so nothing is selected or shown here.
                    </p>
                  ) : s.itemIds.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>No content selected yet. This section will be hidden until it has items.</p>
                  ) : (
                    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                      {s.itemIds.map((cid, k) => {
                        const c = byId(cid)
                        return (
                          <li key={cid} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)" }}>
                            <span style={{ flex: 1, fontSize: 13.5, minWidth: 0 }}>
                              {c ? c.title : <em>Missing content ({cid})</em>}
                              {c && <span style={{ color: "var(--text-muted)" }}> · {TYPE_META[c.type].label}</span>}
                              {c && c.status !== "published" && <span style={{ color: "var(--yellow)" }}> · {STATUS_META[c.status].label}, hidden from customers</span>}
                            </span>
                            <button className="btn btn-sm" disabled={k === 0} aria-label={`Move ${c?.title ?? cid} earlier`} onClick={() => patch(s.id, { itemIds: move(s.itemIds, k, -1) })}>Up</button>
                            <button className="btn btn-sm" disabled={k === s.itemIds.length - 1} aria-label={`Move ${c?.title ?? cid} later`} onClick={() => patch(s.id, { itemIds: move(s.itemIds, k, 1) })}>Down</button>
                            <button className="btn btn-sm" aria-label={`Remove ${c?.title ?? cid} from ${s.label}`} onClick={() => patch(s.id, { itemIds: s.itemIds.filter((x) => x !== cid) })}>Remove from section</button>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {s.kind === "editorial" && <button className="btn btn-sm" onClick={() => setPicking(s.id)}>Choose content</button>}
                    <button className="btn btn-sm btn-danger" onClick={() => setDraft(draft.filter((x) => x.id !== s.id))}>Remove section from homepage</button>
                  </div>
                  <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Removing only changes the homepage layout. Content stays in the Content Library.</span>
                </div>
              </Card>
            ))}
          </div>
          {draft.length > 0 && <button className="btn" style={{ marginTop: 14 }} onClick={addSection}>Add editorial section</button>}
        </div>

        <div>
          <h2 style={{ fontSize: 16, margin: "0 0 4px", fontFamily: "var(--font-sans)" }}>Customer layout preview</h2>
          <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--text-secondary)" }}>Reflects your unapplied edits. Prototype only.</p>
          <div style={{ background: "#0b0c0e", border: "1px solid var(--border-light)", borderRadius: 10, padding: 16, display: "grid", gap: 22 }}>
            {draft.map((s) => {
              const items = s.itemIds.map(byId).filter((c): c is ContentItem => !!c)
              if (s.kind === "collection") {
                return (
                  <section key={s.id} aria-label={s.label}>
                    <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>{s.label}</h3>
                    <div style={{ border: "1px dashed var(--border-light)", borderRadius: 8, padding: 14, fontSize: 12.5, color: "var(--text-secondary)" }}>Future data-driven collection. Not connected, so no items are shown.</div>
                  </section>
                )
              }
              if (items.length === 0) return null
              return (
                <section key={s.id} aria-label={s.label}>
                  <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>{s.label || "Untitled section"}</h3>
                  <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
                    {items.map((c) => (
                      <CustomerCard key={c.id} item={c} crop={s.layout === "hero" ? "landscape" : undefined} width={s.layout === "hero" ? 300 : 150} unavailable={c.status !== "published"} />
                    ))}
                  </div>
                </section>
              )
            })}
            {draft.every((s) => s.kind === "collection" || s.itemIds.length === 0) && <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Nothing to show yet. Choose content for a section.</div>}
          </div>
        </div>
      </div>

      {pickSection && (
        <Picker
          section={pickSection}
          onClose={() => setPicking(null)}
          onToggle={(id) => patch(pickSection.id, { itemIds: pickSection.itemIds.includes(id) ? pickSection.itemIds.filter((x) => x !== id) : [...pickSection.itemIds, id] })}
        />
      )}
    </div>
  )
}
