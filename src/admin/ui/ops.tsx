import React, { useState } from "react"
import { Badge, ConfirmDialog, MediaThumb, Modal, Tabs, TextField } from "./index"
import MediaPicker from "./MediaPicker"
import { useStore } from "../store/store"
import { useOps } from "../store/ops/ops"
import { fmtDate } from "../store/meta"
import { useRouter } from "../router"
import type { MediaKind } from "../store/types"
import type { Activity, Capability } from "../store/ops/types"
import { CAPABILITIES } from "../store/ops/types"

export function Note({ tone = "info", children, title }: { tone?: "info" | "warn" | "mock" | "ok" | "bad"; children: React.ReactNode; title?: string }) {
  const color = { info: "var(--blue)", warn: "var(--yellow)", mock: "var(--accent)", ok: "var(--green)", bad: "var(--red)" }[tone]
  return (
    <div role={tone === "bad" ? "alert" : "note"} style={{ padding: "10px 14px", border: "1px solid var(--border-light)", borderLeft: `3px solid ${color}`, borderRadius: 8, fontSize: 13, lineHeight: 1.55, color: "var(--text-secondary)", background: "var(--card)", marginBottom: 14 }}>
      {title && <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: 2 }}>{title}</strong>}
      {children}
    </div>
  )
}

export function ProvisionalNote({ children }: { children?: React.ReactNode }) {
  return <Note tone="warn" title="Provisional">{children ?? "These are example roles. They are not final until the permission matrix is approved."}</Note>
}

export function MockNote({ children }: { children: React.ReactNode }) {
  return <Note tone="mock" title="Mock data">{children}</Note>
}

export function StatusPill({ map, value }: { map: Record<string, { label: string; color: string }>; value: string }) {
  const m = map[value] ?? { label: value, color: "#b4b9c4" }
  return <Badge color={m.color}>{m.label}</Badge>
}

export function ActivityLog({ items, empty = "No activity recorded yet." }: { items: Activity[]; empty?: string }) {
  if (!items.length) return <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{empty}</p>
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 0 }}>
      {items.map((a) => (
        <li key={a.id} style={{ display: "grid", gridTemplateColumns: "10px 1fr", gap: 12, paddingBottom: 14 }}>
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", marginTop: 6 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.action}</div>
            {a.reason && <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Reason: {a.reason}</div>}
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{a.actor} · {fmtDate(a.at)}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Confirm dialog that records a required reason. */
export function ReasonDialog({ title, children, confirmLabel, danger, reasonLabel = "Reason", required = true, onConfirm, onCancel }: { title: string; children: React.ReactNode; confirmLabel: string; danger?: boolean; reasonLabel?: string; required?: boolean; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("")
  const [err, setErr] = useState("")
  const go = () => {
    if (required && reason.trim().length < 5) return setErr("Enter a reason of at least 5 characters. It is saved in the activity history.")
    onConfirm(reason.trim())
  }
  return (
    <Modal
      title={title}
      onClose={onCancel}
      width={500}
      footer={
        <>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={go}>{confirmLabel}</button>
        </>
      }
    >
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: 14 }}>{children}</div>
      <TextField label={reasonLabel} required={required} multiline value={reason} onChange={(e) => { setReason(e.target.value); setErr("") }} error={err} />
    </Modal>
  )
}

export { ConfirmDialog }

export function Denied({ what, cap }: { what: string; cap: Capability }) {
  const { actingRole } = useOps()
  const label = CAPABILITIES.find((c) => c.id === cap)?.label
  return (
    <div className="page-pad">
      <div role="alert" style={{ maxWidth: 560, border: "1px solid var(--border-light)", borderLeft: "3px solid var(--red)", borderRadius: 10, padding: 22, background: "var(--card)" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 17, fontFamily: "var(--font-sans)" }}>Access denied</h2>
        <p style={{ margin: "0 0 8px", fontSize: 13.5, lineHeight: 1.6, color: "var(--text-secondary)" }}>
          Your current role ({actingRole}) can't open {what}. It requires: {label}.
        </p>
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)" }}>
          This is a demonstration using provisional example roles. Use "Viewing as" in the top bar to switch role.
        </p>
      </div>
    </div>
  )
}

export function ReadOnlyNote({ cap }: { cap: Capability }) {
  const { can, actingRole } = useOps()
  if (can(cap)) return null
  const label = CAPABILITIES.find((c) => c.id === cap)?.label
  return <Note tone="bad" title={`Read-only for ${actingRole}`}>Your role can't: {label}. Actions are disabled. Provisional example roles.</Note>
}

export function RouteTabs<T extends string>({ base, items, value, label }: { base: string; items: { id: T; label: string; count?: number }[]; value: T; label: string }) {
  const { navigate } = useRouter()
  return <Tabs label={label} items={items} value={value} onChange={(id) => navigate(`${base}/${id}`, { replace: true })} />
}

export function Stepper({ steps, current, onGo }: { steps: string[]; current: number; onGo?: (i: number) => void }) {
  return (
    <ol aria-label="Progress" style={{ display: "flex", gap: 8, listStyle: "none", margin: "0 0 18px", padding: 0, flexWrap: "wrap" }}>
      {steps.map((s, i) => {
        const on = i === current
        const done = i < current
        return (
          <li key={s} aria-current={on ? "step" : undefined}>
            <button
              className="btn btn-sm"
              disabled={!onGo || i > current}
              onClick={() => onGo?.(i)}
              style={{ borderColor: on ? "var(--accent)" : undefined, color: on ? "var(--accent-hover)" : done ? "var(--green)" : "var(--text-secondary)", background: on ? "var(--accent-dim)" : undefined }}
            >
              {i + 1}. {s}{done ? " (done)" : ""}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export function AssetSlot({ label, kind, value, onChange, disabled, crop = "landscape", hint }: { label: string; kind: MediaKind; value: string | null; onChange: (id: string | null) => void; disabled?: boolean; crop?: "landscape" | "square" | "portrait"; hint?: string }) {
  const { assets } = useStore()
  const [open, setOpen] = useState(false)
  const a = value ? assets[value] : undefined
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 120 }}><MediaThumb asset={a} crop={crop} /></div>
        <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 13, wordBreak: "break-all" }}>{a ? a.name : value ? "Missing file" : "Nothing attached"}</span>
          {a && a.status !== "ready" && <span style={{ fontSize: 12, color: "var(--yellow)" }}>Not ready ({a.status}). Wait for processing before submitting.</span>}
          {hint && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>}
          <span style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-sm" disabled={disabled} onClick={() => setOpen(true)}>{value ? "Change file" : "Choose file"}</button>
            {value && <button className="btn btn-sm btn-ghost" disabled={disabled} onClick={() => onChange(null)}>Detach</button>}
          </span>
        </div>
      </div>
      {open && <MediaPicker kind={kind} value={value} crop={crop} onSelect={(id) => { onChange(id); setOpen(false) }} onClose={() => setOpen(false)} />}
    </div>
  )
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 14 }}>{children}</div>
}

export function fmtDay(s: string) {
  if (!s) return "—"
  const d = new Date(s.length === 10 ? s + "T00:00" : s)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function fmtLocal(s: string, tz?: string) {
  if (!s) return "—"
  const d = new Date(s)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) + (tz ? ` (${tz})` : "")
}

export function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

export const TIMEZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Africa/Lagos", "Asia/Dubai", "Asia/Tokyo", "Australia/Sydney", "UTC"]
