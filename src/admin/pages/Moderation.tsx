import { useState } from "react"

const initialFlags = [
  { id: "RPT-2201", content: "User Upload #8821", reporter: "AutoMod", reason: "Explicit Content", date: "Sep 12, 2026 09:14", priority: "High", type: "Video" },
  { id: "RPT-2200", content: "Comment #44893", reporter: "Leila M.", reason: "Hate Speech", date: "Sep 12, 2026 08:02", priority: "High", type: "Comment" },
  { id: "RPT-2199", content: "Review on Iron Meridian", reporter: "AutoMod", reason: "Spam", date: "Sep 11, 2026 22:45", priority: "Low", type: "Review" },
  { id: "RPT-2198", content: "User Upload #8804", reporter: "James K.", reason: "Copyright Claim", date: "Sep 11, 2026 17:30", priority: "Medium", type: "Video" },
  { id: "RPT-2197", content: "Comment #44120", reporter: "AutoMod", reason: "Misinformation", date: "Sep 11, 2026 14:08", priority: "Medium", type: "Comment" },
  { id: "RPT-2196", content: "Profile — @darkvibes99", reporter: "User Report", reason: "Harassment", date: "Sep 11, 2026 11:55", priority: "High", type: "Profile" },
  { id: "RPT-2195", content: "Blood & Chrome thumbnail", reporter: "AutoMod", reason: "Inappropriate Image", date: "Sep 10, 2026 20:00", priority: "Medium", type: "Image" },
  { id: "RPT-2194", content: "Comment #43910", reporter: "Tanya F.", reason: "Spam", date: "Sep 10, 2026 15:22", priority: "Low", type: "Comment" },
  { id: "RPT-2193", content: "User Upload #8799", reporter: "AutoMod", reason: "Violence", date: "Sep 10, 2026 10:10", priority: "High", type: "Video" },
  { id: "RPT-2192", content: "Series proposal: Shadowland", reporter: "User Report", reason: "Duplicate Content", date: "Sep 9, 2026 09:30", priority: "Low", type: "Video" },
  { id: "RPT-2191", content: "Comment #43788", reporter: "AutoMod", reason: "Spam", date: "Sep 9, 2026 07:15", priority: "Low", type: "Comment" },
  { id: "RPT-2190", content: "Profile — @nswrider", reporter: "User Report", reason: "Impersonation", date: "Sep 8, 2026 19:44", priority: "Medium", type: "Profile" },
]

const priorityColors: Record<string, { color: string; bg: string }> = {
  High: { color: "#ef4444", bg: "#ef444420" },
  Medium: { color: "#f59e0b", bg: "#f59e0b20" },
  Low: { color: "#8b8f9a", bg: "#8b8f9a18" },
}

function PriorityBadge({ priority }: { priority: string }) {
  const c = priorityColors[priority] ?? { color: "#8b8f9a", bg: "#8b8f9a18" }
  return (
    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)", color: c.color, background: c.bg, padding: "3px 8px", borderRadius: 4 }}>
      {priority}
    </span>
  )
}

const typeIcon: Record<string, string> = {
  Video: "▶",
  Comment: "💬",
  Review: "★",
  Image: "🖼",
  Profile: "👤",
}

export default function Moderation() {
  const [flags, setFlags] = useState(initialFlags)
  const [filter, setFilter] = useState("All")

  const priorities = ["All", "High", "Medium", "Low"]
  const filtered = filter === "All" ? flags : flags.filter((f) => f.priority === filter)

  const dismiss = (id: string) => setFlags((prev) => prev.filter((f) => f.id !== id))

  return (
    <div style={{ padding: "28px" }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "High Priority", count: flags.filter((f) => f.priority === "High").length, color: "#ef4444" },
          { label: "Medium Priority", count: flags.filter((f) => f.priority === "Medium").length, color: "#f59e0b" },
          { label: "Low Priority", count: flags.filter((f) => f.priority === "Low").length, color: "#8b8f9a" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{s.label}</span>
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-sans)", color: s.color }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {priorities.map((p) => {
          const active = filter === p
          return (
            <button
              key={p}
              onClick={() => setFilter(p)}
              style={{
                padding: "5px 14px", borderRadius: 6,
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                background: active ? "var(--accent-dim)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                fontSize: 12, fontFamily: "var(--font-sans)", fontWeight: 500, cursor: "pointer",
              }}
            >{p}</button>
          )
        })}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", alignSelf: "center" }}>
          {filtered.length} items in queue
        </span>
      </div>

      {/* Queue */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Type", "Content", "Reporter", "Reason", "Date", "Priority", "Actions"].map((h) => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={row.id}
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{typeIcon[row.type] ?? "?"}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{row.content}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{row.id}</div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{row.reporter}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{row.reason}</td>
                <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.date}</td>
                <td style={{ padding: "12px 16px" }}><PriorityBadge priority={row.priority} /></td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => dismiss(row.id)}
                      style={{ background: "#22c55e18", border: "1px solid #22c55e40", borderRadius: 5, padding: "4px 10px", color: "#22c55e", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500 }}
                    >Approve</button>
                    <button
                      onClick={() => dismiss(row.id)}
                      style={{ background: "#ef444418", border: "1px solid #ef444440", borderRadius: 5, padding: "4px 10px", color: "#ef4444", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500 }}
                    >Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 14 }}>
            Queue is clear for this priority level.
          </div>
        )}
      </div>
    </div>
  )
}
