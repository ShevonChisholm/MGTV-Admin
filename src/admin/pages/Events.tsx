import { useState } from "react"

const events = [
  { id: "EVT-0441", title: "TropicFest Music Festival", type: "Festival", location: "Kingston, Jamaica", date: "Oct 4–6, 2026", tickets: "https://tropicfest.jm/tickets", status: "Upcoming", capacity: "12,000", sold: "9,840" },
  { id: "EVT-0440", title: "Caribbean Cup — Finals", type: "Sports Event", location: "National Stadium, JA", date: "Sep 28, 2026", tickets: "https://caribcup.org/finals", status: "Upcoming", capacity: "35,000", sold: "31,200" },
  { id: "EVT-0439", title: "MGTV Awards Night 2026", type: "Awards Ceremony", location: "The Grand Ballroom, Kingston", date: "Oct 15, 2026", tickets: "https://mgtvportal/awards", status: "Upcoming", capacity: "800", sold: "788" },
  { id: "EVT-0438", title: "Coastal Sessions Live", type: "Concert", location: "Ocho Rios Amphitheatre", date: "Sep 20, 2026", tickets: "—", status: "Live", capacity: "3,000", sold: "3,000" },
  { id: "EVT-0437", title: "Business Leadership Masterclass", type: "Workshop", location: "Online", date: "Sep 18, 2026", tickets: "—", status: "Upcoming", capacity: "500", sold: "312" },
  { id: "EVT-0436", title: "Island Theatre Collective: Echoes", type: "Theatre", location: "Little Little Theatre", date: "Sep 14–21, 2026", tickets: "https://itc.jm", status: "Ongoing", capacity: "220", sold: "198" },
  { id: "EVT-0435", title: "MGTV VIP Experience — S2 Premiere", type: "VIP Experience", location: "Private Venue, Kingston", date: "Sep 10, 2026", tickets: "Invite Only", status: "Completed", capacity: "80", sold: "80" },
  { id: "EVT-0434", title: "Kaya Monroe Meet & Greet", type: "Meet & Greet", location: "Portmore Galleria", date: "Sep 7, 2026", tickets: "https://mgtvportal/events/434", status: "Completed", capacity: "200", sold: "200" },
]

const typeColors: Record<string, string> = {
  Festival: "#a855f7",
  "Sports Event": "#C9A84C",
  "Awards Ceremony": "#f59e0b",
  Concert: "#22c55e",
  Workshop: "#3b82f6",
  Theatre: "#ec4899",
  "VIP Experience": "#C9A84C",
  "Meet & Greet": "#06b6d4",
}

const statusColors: Record<string, { c: string; bg: string }> = {
  Upcoming: { c: "#3b82f6", bg: "#3b82f618" },
  Live: { c: "#22c55e", bg: "#22c55e18" },
  Ongoing: { c: "#f59e0b", bg: "#f59e0b18" },
  Completed: { c: "#8b8f9a", bg: "#8b8f9a18" },
  Draft: { c: "#555a66", bg: "#555a6618" },
}

function StatusBadge({ s }: { s: string }) {
  const c = statusColors[s] ?? { c: "#8b8f9a", bg: "#8b8f9a18" }
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: c.c, background: c.bg, padding: "2px 7px", borderRadius: 4 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: c.c }} />{s}</span>
}

export default function Events() {
  const [filter, setFilter] = useState("All")
  const types = ["All", "Festival", "Concert", "Sports Event", "Awards Ceremony", "Workshop", "Theatre", "VIP Experience", "Meet & Greet"]
  const filtered = filter === "All" ? events : events.filter((e) => e.type === filter)

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Upcoming Events", value: String(events.filter((e) => e.status === "Upcoming").length), color: "#3b82f6" },
          { label: "Live Now", value: String(events.filter((e) => e.status === "Live").length), color: "#22c55e" },
          { label: "Total Tickets Sold", value: events.filter((e) => e.sold !== "—").reduce((a, e) => a + parseInt(e.sold.replace(/,/g, "")), 0).toLocaleString(), color: "var(--accent)" },
          { label: "Completed", value: String(events.filter((e) => e.status === "Completed").length), color: "#8b8f9a" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "15px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-sans)", color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {types.map((t) => {
            const active = filter === t
            return <button key={t} onClick={() => setFilter(t)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent-dim)" : "transparent", color: active ? "var(--accent)" : "var(--text-secondary)", fontSize: 11.5, fontFamily: "var(--font-sans)", cursor: "pointer" }}>{t}</button>
          })}
        </div>
        <button style={{ marginLeft: "auto", padding: "7px 16px", background: "var(--accent)", border: "none", borderRadius: 7, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Event
        </button>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Event", "Type", "Location", "Date", "Capacity", "Sold", "Status", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const typeColor = typeColors[row.type] ?? "#8b8f9a"
              const soldPct = row.sold !== "—" && row.capacity !== "—" ? parseInt(row.sold.replace(/,/g, "")) / parseInt(row.capacity.replace(/,/g, "")) : null
              return (
                <tr key={row.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{row.title}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{row.id}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 10.5, fontFamily: "var(--font-sans)", fontWeight: 600, color: typeColor, background: typeColor + "18", padding: "2px 7px", borderRadius: 4 }}>{row.type}</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{row.location}</td>
                  <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.date}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{row.capacity}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", marginBottom: soldPct ? 4 : 0 }}>{row.sold}</div>
                    {soldPct !== null && (
                      <div style={{ width: 60, height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${soldPct * 100}%`, background: soldPct > 0.9 ? "var(--accent)" : "#22c55e", borderRadius: 2 }} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 14px" }}><StatusBadge s={row.status} /></td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
