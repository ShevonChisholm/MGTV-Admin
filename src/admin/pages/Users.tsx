import { useState } from "react"

const users = [
  { id: "USR-1042", name: "Jordan Rivera", email: "j.rivera@mgtv.com", role: "Admin", status: "Active", lastActive: "Just now", avatar: "JR" },
  { id: "USR-1041", name: "Marcus Chen", email: "m.chen@mgtv.com", role: "Moderator", status: "Active", lastActive: "12 min ago", avatar: "MC" },
  { id: "USR-1040", name: "Priya Nair", email: "p.nair@mgtv.com", role: "Moderator", status: "Active", lastActive: "1 hr ago", avatar: "PN" },
  { id: "USR-1039", name: "Devon Walsh", email: "d.walsh@mgtv.com", role: "Editor", status: "Active", lastActive: "2 hr ago", avatar: "DW" },
  { id: "USR-1038", name: "Aisha Okonkwo", email: "a.okonkwo@mgtv.com", role: "Editor", status: "Away", lastActive: "5 hr ago", avatar: "AO" },
  { id: "USR-1037", name: "Sam Tran", email: "s.tran@mgtv.com", role: "Viewer", status: "Active", lastActive: "1 day ago", avatar: "ST" },
  { id: "USR-1036", name: "Lena Kowalski", email: "l.kowalski@mgtv.com", role: "Moderator", status: "Inactive", lastActive: "3 days ago", avatar: "LK" },
  { id: "USR-1035", name: "Raj Patel", email: "r.patel@mgtv.com", role: "Editor", status: "Active", lastActive: "4 hr ago", avatar: "RP" },
  { id: "USR-1034", name: "Cleo Fontaine", email: "c.fontaine@mgtv.com", role: "Viewer", status: "Active", lastActive: "Just now", avatar: "CF" },
  { id: "USR-1033", name: "Omar Saleh", email: "o.saleh@mgtv.com", role: "Moderator", status: "Active", lastActive: "30 min ago", avatar: "OS" },
  { id: "USR-1032", name: "Nina Bergstrom", email: "n.bergstrom@mgtv.com", role: "Viewer", status: "Suspended", lastActive: "12 days ago", avatar: "NB" },
  { id: "USR-1031", name: "Felix Huang", email: "f.huang@mgtv.com", role: "Editor", status: "Active", lastActive: "Yesterday", avatar: "FH" },
]

const roleColors: Record<string, { bg: string; color: string }> = {
  Admin: { bg: "#C9A84C20", color: "#C9A84C" },
  Moderator: { bg: "#3b82f620", color: "#3b82f6" },
  Editor: { bg: "#a855f720", color: "#a855f7" },
  Viewer: { bg: "#8b8f9a20", color: "#8b8f9a" },
}

const statusColors: Record<string, string> = {
  Active: "#22c55e",
  Away: "#f59e0b",
  Inactive: "#555a66",
  Suspended: "#ef4444",
}

function RoleBadge({ role }: { role: string }) {
  const c = roleColors[role] ?? { bg: "#8b8f9a20", color: "#8b8f9a" }
  return (
    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)", color: c.color, background: c.bg, padding: "3px 8px", borderRadius: 4 }}>
      {role}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const color = statusColors[status] ?? "#8b8f9a"
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: status === "Active" ? `0 0 6px ${color}` : "none" }} />
      {status}
    </span>
  )
}

export default function Users() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")

  const roles = ["All", "Admin", "Moderator", "Editor", "Viewer"]
  const filtered = users.filter((u) => {
    const m = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search) || u.id.includes(search)
    const r = roleFilter === "All" || u.role === roleFilter
    return m && r
  })

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, padding: "7px 12px", flex: "0 0 240px",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--font-body)", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {roles.map((r) => {
            const active = roleFilter === r
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                style={{
                  padding: "5px 12px", borderRadius: 6,
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  background: active ? "var(--accent-dim)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 12, fontFamily: "var(--font-sans)", fontWeight: 500, cursor: "pointer",
                }}
              >{r}</button>
            )
          })}
        </div>

        <button
          style={{
            marginLeft: "auto", padding: "7px 16px", background: "var(--accent)",
            border: "none", borderRadius: 7, color: "white", fontSize: 13, fontWeight: 600,
            fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Invite Associate
        </button>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Associate", "Role", "Status", "Last Active", ""].map((h) => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr
                key={u.id}
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: "linear-gradient(135deg, #C9A84C33, #3b82f633)",
                      border: "1px solid var(--border-light)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", fontFamily: "var(--font-sans)", flexShrink: 0,
                    }}>{u.avatar}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}><RoleBadge role={u.role} /></td>
                <td style={{ padding: "12px 16px" }}><StatusDot status={u.status} /></td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{u.lastActive}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 5, padding: "4px 10px", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit</button>
                    {u.status !== "Suspended" && (
                      <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 5, padding: "4px 10px", color: "var(--yellow)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Suspend</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{filtered.length} associates</span>
        </div>
      </div>
    </div>
  )
}
