import { useEffect, useState } from "react"
import { Link } from "../router"
import { useOps } from "../store/ops/ops"

const groups = [
  {
    label: "Platform",
    items: [
      { id: "dashboard", label: "Dashboard", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "content", label: "Content Library", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
      { id: "media", label: "Media Library", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20"/><path d="M3 6.5h4"/><path d="M3 12h4"/><path d="M3 17.5h4"/><path d="M17 8l-5 4 5 4V8z"/></svg> },
      { id: "homepage", label: "Homepage & Featured", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
      { id: "discovery", label: "Categories & Discovery", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    ],
  },
  {
    label: "Audience",
    items: [
      { id: "customers", label: "Customers", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
      { id: "notifications", label: "Notifications", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
      { id: "moderation", label: "Moderation", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
    ],
  },
  {
    label: "Partners & Events",
    items: [
      { id: "subscriptions", label: "MGTV+ & Subscriptions", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
      { id: "events", label: "Events", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
      { id: "awards", label: "Awards & Voting", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
      { id: "sponsors", label: "Sponsors", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 11l-4 4-2-2"/></svg> },
      { id: "advertising", label: "Advertising", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "analytics", label: "Analytics & Reports", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg> },
      { id: "users", label: "Admin Users", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
      { id: "settings", label: "Platform Settings", badge: null, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    ],
  },
]

interface SidebarProps {
  active: string
  open: boolean
  onClose: () => void
}

const KEY = "mgtv-admin-nav-v1"
interface NavPrefs {
  collapsed: boolean
  groups: Record<string, boolean>
}

function loadPrefs(): NavPrefs {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "")
    return { collapsed: !!p.collapsed, groups: p.groups ?? {} }
  } catch {
    return { collapsed: false, groups: {} }
  }
}

const chevron = (rot: number) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: `rotate(${rot}deg)`, transition: "transform .15s ease", flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
)

export default function Sidebar({ active, open, onClose }: SidebarProps) {
  const [prefs, setPrefs] = useState<NavPrefs>(loadPrefs)
  const { reports } = useOps()
  const openReports = reports.filter((r) => r.status === "open").length
  const { collapsed, groups: closed } = prefs

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      /* storage unavailable */
    }
  }, [prefs])

  useEffect(() => {
    const g = groups.find((x) => x.items.some((i) => i.id === active))
    if (!collapsed && g && closed[g.label]) setPrefs((p) => ({ ...p, groups: { ...p.groups, [g.label]: false } }))
  }, [active, collapsed])

  const toggleRail = () => setPrefs((p) => ({ ...p, collapsed: !p.collapsed }))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t.closest("input, textarea, select, [contenteditable='true']")) return
      toggleRail()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <aside
      aria-label="Primary"
      className={`app-sidebar${open ? " open" : ""}${collapsed ? " collapsed" : ""}`}
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        fontFamily: "var(--font-sans)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Logo */}
      <div className="sb-head" style={{ padding: "20px 16px 12px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, background: "var(--accent)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#14110a"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <div className="sb-hide" style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.04em" }}>MGTV</div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Admin Portal</div>
        </div>
      </div>
      <div className="sidebar-collapse-btn" style={{ padding: "0 8px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm sb-toggle"
          onClick={toggleRail}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={`${collapsed ? "Expand" : "Collapse"} sidebar ([)`}
          style={{ width: "100%", justifyContent: "flex-start", gap: 8 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: collapsed ? "rotate(180deg)" : undefined, flexShrink: 0 }}><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></svg>
          <span className="sb-hide">Collapse</span>
        </button>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: "10px 8px 16px", display: "flex", flexDirection: "column", gap: 0 }}>
        {groups.map((group) => {
          const isClosed = !!closed[group.label]
          const gid = `nav-group-${group.label}`
          return (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <button
              type="button"
              className="sb-group-btn"
              aria-expanded={!isClosed}
              aria-controls={gid}
              onClick={() => setPrefs((p) => ({ ...p, groups: { ...p.groups, [group.label]: !p.groups[group.label] } }))}
              style={{ all: "unset", boxSizing: "border-box", width: "100%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "10px 10px 4px", fontFamily: "var(--font-sans)" }}
            >
              {group.label}
              {chevron(isClosed ? -90 : 0)}
            </button>
            <div className="sb-divider" aria-hidden />
            <div id={gid} className="sb-items" hidden={isClosed && !collapsed}>
            {group.items.map((item) => {
              const isActive = active === item.id
              const badge = item.id === "moderation" ? openReports || null : item.badge
              return (
                <Link
                  key={item.id}
                  to={`/admin/${item.id}`}
                  onClick={onClose}
                  className="sb-link"
                  aria-label={collapsed ? item.label : undefined}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 9, textDecoration: "none",
                    padding: "9px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: isActive ? "var(--accent-dim)" : "transparent",
                    color: isActive ? "var(--accent-hover)" : "var(--text-secondary)",
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    fontFamily: "var(--font-sans)", letterSpacing: "0.01em",
                    textAlign: "left", width: "100%", transition: "all 0.12s ease", position: "relative",
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--text-primary)" } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" } }}
                >
                  {isActive && <span style={{ position: "absolute", left: 0, top: 5, bottom: 5, width: 2.5, background: "var(--accent)", borderRadius: "0 2px 2px 0" }} />}
                  <span style={{ flexShrink: 0, position: "relative", display: "inline-flex" }}>
                    {item.icon}
                    {badge && <span className="sb-dot" aria-hidden />}
                  </span>
                  <span className="sb-hide" style={{ flex: 1, lineHeight: 1.2 }}>{item.label}</span>
                  {badge && (
                    <span className="sb-hide" style={{ background: "var(--accent)", color: "var(--on-accent)", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 8, fontFamily: "var(--font-mono)" }}>
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
            </div>
          </div>
          )
        })}
      </nav>

      {/* Associate info */}
      <div className="sb-user" style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #7A6430)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--on-accent)", flexShrink: 0 }}>JR</div>
        <div className="sb-hide" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Jordan Rivera</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Super Admin</div>
        </div>
      </div>
    </aside>
  )
}
