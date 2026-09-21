import React, { useState } from "react"

const tabs = [
  { id: "notifications", label: "Platform Notifications" },
  { id: "email", label: "Email / Newsletter" },
  { id: "templates", label: "Templates" },
  { id: "history", label: "History" },
]

const history = [
  { id: "MSG-1220", title: "MGTV Awards — Voting Now Open", type: "Push + Email", audience: "All Subscribers", sent: "Sep 10, 2026 09:00", delivered: "186,430", opened: "74,210 (39.8%)" },
  { id: "MSG-1219", title: "New Series: The Last Protocol S2", type: "Push", audience: "MGTV+ Subscribers", sent: "Sep 8, 2026 18:00", delivered: "91,204", opened: "44,900 (49.2%)" },
  { id: "MSG-1218", title: "September Newsletter", type: "Email", audience: "Newsletter List", sent: "Sep 1, 2026 08:30", delivered: "142,600", opened: "38,800 (27.2%)" },
  { id: "MSG-1217", title: "TropicFest Tickets On Sale", type: "Push + Email", audience: "Music Fans", sent: "Aug 28, 2026 12:00", delivered: "68,400", opened: "22,100 (32.3%)" },
  { id: "MSG-1216", title: "System Maintenance — Aug 30", type: "Push", audience: "All Users", sent: "Aug 27, 2026 16:00", delivered: "186,430", opened: "91,200 (48.9%)" },
]

const subscribers = [
  { segment: "All Users", count: 186430 },
  { segment: "MGTV+ Subscribers", count: 91204 },
  { segment: "Free Tier", count: 95226 },
  { segment: "Newsletter Opt-in", count: 142600 },
  { segment: "Sports Fans", count: 58900 },
  { segment: "Music Fans", count: 68400 },
]

const templates = [
  { id: "TPL-01", name: "New Content Alert", type: "Push", lastUsed: "Sep 8, 2026" },
  { id: "TPL-02", name: "Monthly Newsletter", type: "Email", lastUsed: "Sep 1, 2026" },
  { id: "TPL-03", name: "Event Reminder", type: "Push + Email", lastUsed: "Aug 28, 2026" },
  { id: "TPL-04", name: "Subscription Renewal", type: "Email", lastUsed: "Sep 9, 2026" },
  { id: "TPL-05", name: "System Maintenance", type: "Push", lastUsed: "Aug 27, 2026" },
  { id: "TPL-06", name: "Award Voting Open", type: "Push + Email", lastUsed: "Sep 10, 2026" },
]

const inputStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 7,
  padding: "8px 12px",
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "var(--font-body)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
}

function ComposerTab() {
  const [channel, setChannel] = useState<string[]>(["push"])
  const [audience, setAudience] = useState("All Users")

  const toggle = (c: string) => setChannel((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "flex-start" }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "22px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 18 }}>New Notification</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Title</label>
            <input style={inputStyle} placeholder="e.g. New Series Available Now" />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Message</label>
            <textarea style={{ ...inputStyle, height: 100, resize: "vertical" }} placeholder="Write your notification message..." />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Channel</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["push", "email", "in-app"].map((c) => {
                const active = channel.includes(c)
                return (
                  <button key={c} onClick={() => toggle(c)} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent-dim)" : "transparent", color: active ? "var(--accent)" : "var(--text-secondary)", fontSize: 12.5, fontFamily: "var(--font-sans)", cursor: "pointer", textTransform: "capitalize" }}>{c}</button>
                )
              })}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Audience Segment</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {subscribers.map((s) => <option key={s.segment}>{s.segment}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Schedule (optional)</label>
            <input type="datetime-local" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={{ padding: "9px 20px", background: "transparent", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", fontSize: 13, fontFamily: "var(--font-sans)", cursor: "pointer" }}>Save Draft</button>
            <button style={{ padding: "9px 22px", background: "var(--accent)", border: "none", borderRadius: 7, color: "white", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>Send Now</button>
          </div>
        </div>
      </div>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 14 }}>Audience Segments</div>
        {subscribers.map((s) => (
          <div key={s.segment} style={{ padding: "9px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: s.segment === audience ? "var(--accent)" : "var(--text-secondary)", fontFamily: "var(--font-sans)", fontWeight: s.segment === audience ? 600 : 400 }}>{s.segment}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{s.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoryTab() {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>{["Title", "Channel", "Audience", "Sent", "Delivered", "Opened"].map((h) => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
        <tbody>
          {history.map((row, i) => (
            <tr key={row.id} style={{ borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "11px 14px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{row.title}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{row.id}</div>
              </td>
              <td style={{ padding: "11px 14px", fontSize: 11, fontFamily: "var(--font-mono)", color: "#3b82f6", background: "transparent" }}>{row.type}</td>
              <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{row.audience}</td>
              <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{row.sent}</td>
              <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{row.delivered}</td>
              <td style={{ padding: "11px 14px", fontSize: 12, color: "#22c55e", fontFamily: "var(--font-mono)" }}>{row.opened}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TemplatesTab() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button style={{ padding: "7px 16px", background: "var(--accent)", border: "none", borderRadius: 7, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>+ New Template</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {templates.map((t) => (
          <div key={t.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 6 }}>{t.name}</div>
            <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "#3b82f6", background: "#3b82f618", padding: "2px 7px", borderRadius: 4, display: "inline-block", marginBottom: 12 }}>{t.type}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 14 }}>Last used: {t.lastUsed}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ flex: 1, padding: "6px", background: "transparent", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-sans)", cursor: "pointer" }}>Edit</button>
              <button style={{ flex: 1, padding: "6px", background: "var(--accent-dim)", border: "1px solid var(--accent)40", borderRadius: 6, color: "var(--accent)", fontSize: 12, fontFamily: "var(--font-sans)", cursor: "pointer" }}>Use</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default function Notifications() {
  const [active, setActive] = useState("notifications")

  const tabContent: Record<string, React.ReactNode> = {
    notifications: <ComposerTab />,
    email: <ComposerTab />,
    templates: <TemplatesTab />,
    history: <HistoryTab />,
  }

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ display: "flex", gap: 2, marginBottom: 22, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {tabs.map((t) => {
          const isActive = active === t.id
          return <button key={t.id} onClick={() => setActive(t.id)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: isActive ? "var(--accent)" : "transparent", color: isActive ? "white" : "var(--text-secondary)", fontSize: 12.5, fontWeight: isActive ? 600 : 500, fontFamily: "var(--font-sans)", transition: "all 0.15s" }}>{t.label}</button>
        })}
      </div>
      {tabContent[active]}
    </div>
  )
}
