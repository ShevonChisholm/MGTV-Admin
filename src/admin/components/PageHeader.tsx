import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "../router"

interface Crumb {
  label: string
  to?: string
}

interface PageHeaderProps {
  breadcrumb: Crumb[]
  title: string
  description: string
  badge?: React.ReactNode
}

export const ACTIONS_ID = "page-header-actions"

export function PageActions({ children }: { children: React.ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null)
  useEffect(() => setEl(document.getElementById(ACTIONS_ID)), [])
  return el ? createPortal(children, el) : null
}

export default function PageHeader({ breadcrumb, title, description, badge }: PageHeaderProps) {
  return (
    <div style={{ padding: "22px 28px 20px", borderBottom: "1px solid var(--border)", background: "var(--sidebar)" }} className="page-header">
      <nav aria-label="Breadcrumb" style={{ marginBottom: 10 }}>
        <ol style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", listStyle: "none", margin: 0, padding: 0 }}>
          {breadcrumb.map((c, i) => {
            const last = i === breadcrumb.length - 1
            const style: React.CSSProperties = {
              fontSize: 12, fontFamily: "var(--font-mono)", letterSpacing: "0.02em",
              color: last ? "var(--accent-hover)" : "var(--text-secondary)", fontWeight: last ? 600 : 400, textDecoration: "none",
            }
            return (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {c.to && !last ? <Link to={c.to} style={style}>{c.label}</Link> : <span style={style} aria-current={last ? "page" : undefined}>{c.label}</span>}
                {!last && <span aria-hidden style={{ color: "var(--text-muted)", fontSize: 11 }}>›</span>}
              </li>
            )
          })}
        </ol>
      </nav>
      <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div className="page-header-copy" style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)", letterSpacing: "-0.02em", margin: "0 0 6px" }}>{title}</h1>
            {badge}
          </div>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: 0, lineHeight: 1.55, maxWidth: 720 }}>{description}</p>
        </div>
        <div id={ACTIONS_ID} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }} />
      </div>
    </div>
  )
}
