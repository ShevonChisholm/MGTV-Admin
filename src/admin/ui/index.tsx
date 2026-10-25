import React, { useEffect, useId, useRef } from "react"
import { useStore } from "../store/store"
import type { CropName, MediaAsset } from "../store/types"

/* ---------- Badges ---------- */
export function Badge({ color, children, title }: { color: string; children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999,
        fontSize: 11.5, fontWeight: 600, fontFamily: "var(--font-sans)", color,
        background: color + "1f", border: `1px solid ${color}55`, whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {children}
    </span>
  )
}

/* ---------- Cards ---------- */
export function Card({ title, aside, children, id }: { title?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode; id?: string }) {
  return (
    <section className="ui-card" id={id} style={{ minWidth:0, maxWidth:"100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 16 }}>
      {title && (
        <header style={{ display: "flex", flexWrap:"wrap", minWidth:0, alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 18px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}>{title}</h2>
          {aside}
        </header>
      )}
      <div style={{ padding: 18 }}>{children}</div>
    </section>
  )
}

/* ---------- Form fields ---------- */
interface FieldShell {
  label: string
  error?: string
  hint?: string
  required?: boolean
  fieldId?: string
}

function Shell({ label, error, hint, required, id, children }: FieldShell & { id: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <label htmlFor={id} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
        {label}
        {required && <span style={{ color: "var(--accent)" }}> *</span>}
      </label>
      {children}
      {hint && !error && <span id={id + "-d"} style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint}</span>}
      {error && (
        <span id={id + "-d"} role="alert" style={{ fontSize: 12, color: "var(--red)", fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  )
}

export function TextField({ label, error, hint, required, fieldId, multiline, ...rest }: FieldShell & { multiline?: boolean } & (React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>)) {
  const auto = useId()
  const id = fieldId ?? auto
  const common = { id, className: "input", "aria-invalid": !!error, "aria-describedby": error || hint ? id + "-d" : undefined, "aria-required": required }
  return (
    <Shell label={label} error={error} hint={hint} required={required} id={id}>
      {multiline ? <textarea {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} {...common} /> : <input {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} {...common} />}
    </Shell>
  )
}

export function SelectField({ label, error, hint, required, fieldId, options, placeholder, ...rest }: FieldShell & { options: string[]; placeholder?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId()
  const id = fieldId ?? auto
  return (
    <Shell label={label} error={error} hint={hint} required={required} id={id}>
      <select {...rest} id={id} className="input" aria-invalid={!!error} aria-describedby={error || hint ? id + "-d" : undefined} aria-required={required}>
        <option value="">{placeholder ?? "Select…"}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Shell>
  )
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string; count?: number }[]; value: T; onChange: (id: T) => void; label: string }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const onKey = (e: React.KeyboardEvent, i: number) => {
    let n = i
    if (e.key === "ArrowRight") n = (i + 1) % items.length
    else if (e.key === "ArrowLeft") n = (i - 1 + items.length) % items.length
    else if (e.key === "Home") n = 0
    else if (e.key === "End") n = items.length - 1
    else return
    e.preventDefault()
    onChange(items[n].id)
    refs.current[items[n].id]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
      {items.map((t, i) => {
        const on = t.id === value
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[t.id] = el }}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            style={{
              padding: "10px 14px", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
              borderBottom: `2px solid ${on ? "var(--accent)" : "transparent"}`, marginBottom: -1,
              color: on ? "var(--accent-hover)" : "var(--text-secondary)", fontWeight: on ? 700 : 500,
              fontSize: 13, fontFamily: "var(--font-sans)",
            }}
          >
            {t.label}
            {t.count !== undefined && <span style={{ marginLeft: 7, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Modal / Drawer ---------- */
export function Modal({ title, onClose, children, footer, side, width = 560, labelledBy }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; side?: boolean; width?: number; labelledBy?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const el = box.current!
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter((x) => !x.hasAttribute("disabled"))
    ;(focusables()[1] ?? focusables()[0] ?? el).focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      } else if (e.key === "Tab") {
        const f = focusables()
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener("keydown", onKey, true)
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey, true)
      document.body.style.overflow = overflow
      prev?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 100, display: "flex", justifyContent: side ? "flex-end" : "center", alignItems: side ? "stretch" : "center", padding: side ? 0 : 16 }}
    >
      <div
        ref={box}
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? titleId}
        tabIndex={-1}
        style={{
          background: "var(--sidebar)", border: "1px solid var(--border-light)", borderRadius: side ? 0 : 12,
          width: "100%", maxWidth: width, maxHeight: side ? "100%" : "92vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,.6)",
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--border)", gap: 10 }}>
          <h2 id={titleId} style={{ minWidth:0,overflowWrap:"anywhere",margin: 0, fontSize: 16, fontFamily: "var(--font-sans)", fontWeight: 700 }}>{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close dialog">Close</button>
        </header>
        <div style={{ padding: 18, overflowY: "auto", flex: 1, minHeight:0,minWidth:0,maxWidth:"100%" }}>{children}</div>
        {footer && <footer style={{ padding: "12px 18px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>{footer}</footer>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ title, children, confirmLabel, cancelLabel = "Cancel", danger, onConfirm, onCancel }: { title: string; children: React.ReactNode; confirmLabel: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      width={460}
      footer={
        <>
          <button className="btn" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-secondary)" }}>{children}</div>
    </Modal>
  )
}

/* ---------- Toasts ---------- */
function ToastItem({ id, tone, text }: { id: string; tone: string; text: string }) {
  const { dismissToast } = useStore()
  useEffect(() => {
    const t = setTimeout(() => dismissToast(id), tone === "error" ? 8000 : 4500)
    return () => clearTimeout(t)
  }, [id, tone, dismissToast])
  const color = tone === "success" ? "var(--green)" : tone === "error" ? "var(--red)" : "var(--blue)"
  return (
    <div style={{ background: "var(--card-hover)", border: `1px solid ${color}`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, display: "flex", gap: 12, alignItems: "flex-start", boxShadow: "0 8px 30px rgba(0,0,0,.5)" }}>
      <span style={{ flex: 1, lineHeight: 1.45 }}>{text}</span>
      <button className="btn btn-ghost btn-sm" style={{ minHeight: 22, padding: "0 6px" }} onClick={() => dismissToast(id)} aria-label="Dismiss message">×</button>
    </div>
  )
}

export function ToastHost() {
  const { toasts } = useStore()
  return (
    <div role="status" aria-live="polite" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 200, display: "flex", flexDirection: "column", gap: 8, width: "min(380px, calc(100vw - 32px))" }}>
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  )
}

/* ---------- Empty / progress ---------- */
export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px", border: "1px dashed var(--border-light)", borderRadius: 10, background: "var(--card)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-sans)", marginBottom: 6 }}>{title}</div>
      <p style={{ margin: "0 auto 16px", maxWidth: 420, fontSize: 13, lineHeight: 1.55, color: "var(--text-secondary)" }}>{body}</p>
      {action}
    </div>
  )
}

export function ProgressBar({ value, label, color = "var(--accent)" }: { value: number; label: string; color?: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, transition: "width .3s" }} />
    </div>
  )
}

/* ---------- Media ---------- */
export const CROP_RATIO: Record<CropName, string> = { portrait: "2 / 3", landscape: "16 / 9", square: "1 / 1" }

const KIND_GLYPH: Record<string, string> = { video: "▶", image: "▣", audio: "♪", caption: "CC" }

export function MediaThumb({ asset, crop = "landscape", style, label }: { asset?: MediaAsset | null; crop?: CropName; style?: React.CSSProperties; label?: string }) {
  const [broken, setBroken] = React.useState(false)
  const showImg = asset?.url && !broken && asset.kind !== "audio"
  const f = asset?.focal[crop] ?? { x: 50, y: 50 }
  return (
    <div
      role={showImg ? "img" : undefined}
      aria-label={showImg ? label ?? asset?.name : undefined}
      style={{
        aspectRatio: CROP_RATIO[crop], width: "100%", overflow: "hidden", position: "relative",
        background: "linear-gradient(135deg, #23262e, #14161b)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 22, ...style,
      }}
    >
      {showImg ? (
        <img src={asset!.url} alt="" onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${f.x}% ${f.y}%` }} />
      ) : (
        <span aria-hidden>{asset ? KIND_GLYPH[asset.kind] : "—"}</span>
      )}
    </div>
  )
}

export const KIND_LABEL: Record<string, string> = { video: "Video", image: "Image", audio: "Audio", caption: "Caption" }
export const MEDIA_STATUS_COLOR: Record<string, string> = { uploading: "#60a5fa", processing: "#fbbf24", ready: "#34d399", failed: "#f87171" }
