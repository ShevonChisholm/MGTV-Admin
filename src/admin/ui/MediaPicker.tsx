import React, { useState } from "react"
import { Modal, MediaThumb, Badge, KIND_LABEL, MEDIA_STATUS_COLOR, EmptyState } from "./index"
import { useStore } from "../store/store"
import { Link } from "../router"
import type { CropName, MediaKind } from "../store/types"

export default function MediaPicker({ kind, value, crop, onSelect, onClose }: { kind: MediaKind; value: string | null; crop?: CropName; onSelect: (id: string) => void; onClose: () => void }) {
  const { media } = useStore()
  const [q, setQ] = useState("")
  const list = media.filter((m) => m.kind === kind && m.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <Modal title={`Choose ${KIND_LABEL[kind].toLowerCase()} from media library`} onClose={onClose} width={760}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "end", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <label htmlFor="picker-q" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
            Search {KIND_LABEL[kind].toLowerCase()} files
          </label>
          <input id="picker-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="File name" />
        </div>
        <Link to="/admin/media" className="btn btn-sm" style={{ textDecoration: "none" }}>Open media library</Link>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "0 0 12px" }}>
        Files that are not Ready can be attached but will block publishing until processing completes.
      </p>
      {list.length === 0 ? (
        <EmptyState title={`No ${KIND_LABEL[kind].toLowerCase()} files found`} body="Upload a file in the Media Library, then come back to attach it." />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {list.map((m) => {
            const sel = m.id === value
            return (
              <li key={m.id}>
                <button
                  onClick={() => onSelect(m.id)}
                  aria-pressed={sel}
                  style={{ width: "100%", textAlign: "left", background: sel ? "var(--accent-dim)" : "var(--card)", border: `1px solid ${sel ? "var(--accent)" : "var(--border-light)"}`, borderRadius: 8, padding: 8, cursor: "pointer", color: "var(--text-primary)", display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <MediaThumb asset={m} crop={crop ?? "landscape"} style={{ maxHeight: 150 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, wordBreak: "break-all" }}>{m.name}</span>
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "center", fontSize: 11.5, color: "var(--text-secondary)" }}>
                    <Badge color={MEDIA_STATUS_COLOR[m.status]}>{m.status[0].toUpperCase() + m.status.slice(1)}</Badge>
                    <span>{m.duration ?? m.dimensions ?? m.sizeLabel}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
