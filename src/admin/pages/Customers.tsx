import { useState } from "react"

const customers = [
  { id: "ACC-10042", name: "Alicia Thompson", email: "a.thompson@email.com", plan: "MGTV+", status: "Active", profiles: 3, joined: "Jan 14, 2025", lastActive: "Just now", spent: "$142.80" },
  { id: "ACC-10041", name: "Kwame Asante", email: "kwame.a@mail.com", plan: "Free", status: "Active", profiles: 1, joined: "Mar 2, 2025", lastActive: "2 hr ago", spent: "$0" },
  { id: "ACC-10040", name: "Simone Laurent", email: "simone.l@webmail.com", plan: "MGTV+", status: "Active", profiles: 5, joined: "Nov 8, 2024", lastActive: "Yesterday", spent: "$284.40" },
  { id: "ACC-10039", name: "Darius Beckford", email: "d.beckford@email.com", plan: "MGTV+", status: "Suspended", profiles: 2, joined: "Feb 19, 2025", lastActive: "14 days ago", spent: "$71.40" },
  { id: "ACC-10038", name: "Naomi Francis", email: "naomi.f@connect.tt", plan: "Free", status: "Active", profiles: 1, joined: "Apr 30, 2025", lastActive: "5 hr ago", spent: "$0" },
  { id: "ACC-10037", name: "Jason Clarke", email: "j.clarke@gmail.com", plan: "MGTV+", status: "Active", profiles: 4, joined: "Jun 1, 2024", lastActive: "3 days ago", spent: "$427.20" },
  { id: "ACC-10036", name: "Priscilla Martin", email: "p.martin@email.jm", plan: "MGTV+", status: "Cancelled", profiles: 2, joined: "Sep 12, 2024", lastActive: "1 month ago", spent: "$213.60" },
  { id: "ACC-10035", name: "Trevor Noel", email: "trevor.n@webmail.bb", plan: "Free", status: "Active", profiles: 1, joined: "Jul 22, 2025", lastActive: "Today", spent: "$0" },
  { id: "ACC-10034", name: "Isabelle Dupont", email: "isabelle.d@mail.lc", plan: "MGTV+", status: "Active", profiles: 3, joined: "Dec 15, 2024", lastActive: "1 hr ago", spent: "$178.50" },
  { id: "ACC-10033", name: "Marcus Williams", email: "m.williams@email.com", plan: "MGTV+", status: "Active", profiles: 2, joined: "Feb 28, 2025", lastActive: "Just now", spent: "$106.20" },
]

const planColors: Record<string, { c: string; bg: string }> = {
  "MGTV+": { c: "#C9A84C", bg: "#C9A84C18" },
  Free: { c: "#8b8f9a", bg: "#8b8f9a18" },
}
const statusColors: Record<string, string> = {
  Active: "#22c55e",
  Suspended: "#ef4444",
  Cancelled: "#8b8f9a",
}

function PlanBadge({ plan }: { plan: string }) {
  const c = planColors[plan] ?? { c: "#8b8f9a", bg: "#8b8f9a18" }
  return <span style={{ fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: c.c, background: c.bg, padding: "2px 7px", borderRadius: 4 }}>{plan}</span>
}

function StatusDot({ status }: { status: string }) {
  const color = statusColors[status] ?? "#8b8f9a"
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: status === "Active" ? `0 0 5px ${color}` : "none" }} />
      {status}
    </span>
  )
}

export default function Customers() {
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("All")
  const [selected, setSelected] = useState<string | null>(null)

  const plans = ["All", "MGTV+", "Free"]
  const filtered = customers.filter((c) => {
    const m = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.includes(search) || c.id.includes(search)
    const p = planFilter === "All" || c.plan === planFilter
    return m && p
  })

  const selectedCustomer = customers.find((c) => c.id === selected)

  return (
    <div style={{ padding: "28px", display: "flex", gap: 20, alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total Accounts", value: "186,430", sub: "+4,820 this month" },
            { label: "MGTV+ Subscribers", value: "91,204", sub: "48.9% of total" },
            { label: "Free Tier", value: "95,226", sub: "51.1% of total" },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "15px 18px" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-sans)", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--green)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, padding: "7px 12px", flex: "0 0 220px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--font-body)", width: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {plans.map((p) => {
              const active = planFilter === p
              return <button key={p} onClick={() => setPlanFilter(p)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent-dim)" : "transparent", color: active ? "var(--accent)" : "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-sans)", cursor: "pointer" }}>{p}</button>
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Customer", "Plan", "Status", "Profiles", "Joined", "Last Active", "Spent"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c.id === selected ? null : c.id)}
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", background: c.id === selected ? "var(--accent-dim)" : "transparent", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { if (c.id !== selected) e.currentTarget.style.background = "var(--card-hover)" }}
                  onMouseLeave={(e) => { if (c.id !== selected) e.currentTarget.style.background = "transparent" }}
                >
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C22, #3b82f622)", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", fontFamily: "var(--font-sans)", flexShrink: 0 }}>
                        {c.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{c.name}</div>
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px" }}><PlanBadge plan={c.plan} /></td>
                  <td style={{ padding: "11px 14px" }}><StatusDot status={c.status} /></td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{c.profiles}</td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{c.joined}</td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{c.lastActive}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{c.spent}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{filtered.length} accounts shown · click a row to view details</span>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedCustomer && (
        <div style={{ width: 280, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px", flexShrink: 0, position: "sticky", top: 80 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>Account Details</div>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #7A6430)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "white", marginBottom: 10 }}>
              {selectedCustomer.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)", textAlign: "center" }}>{selectedCustomer.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{selectedCustomer.email}</div>
          </div>
          {[
            { label: "Account ID", value: selectedCustomer.id },
            { label: "Plan", value: selectedCustomer.plan },
            { label: "Status", value: selectedCustomer.status },
            { label: "Profiles", value: String(selectedCustomer.profiles) },
            { label: "Member Since", value: selectedCustomer.joined },
            { label: "Last Active", value: selectedCustomer.lastActive },
            { label: "Total Spent", value: selectedCustomer.spent },
          ].map((f) => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>{f.label}</span>
              <span style={{ fontSize: 12, color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>{f.value}</span>
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
            <button style={{ padding: "8px", background: "transparent", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", fontSize: 12.5, fontFamily: "var(--font-sans)", cursor: "pointer" }}>View Activity Log</button>
            {selectedCustomer.status === "Active" ? (
              <button style={{ padding: "8px", background: "#ef444418", border: "1px solid #ef444440", borderRadius: 7, color: "#ef4444", fontSize: 12.5, fontFamily: "var(--font-sans)", cursor: "pointer" }}>Suspend Account</button>
            ) : (
              <button style={{ padding: "8px", background: "#22c55e18", border: "1px solid #22c55e40", borderRadius: 7, color: "#22c55e", fontSize: 12.5, fontFamily: "var(--font-sans)", cursor: "pointer" }}>Reactivate Account</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
