import { useState } from "react"

const awardCategories = [
  { id: "AWD-01", name: "Best Drama Series", type: "Entertainment", nominees: 5, votes: 48210, status: "Voting Open" },
  { id: "AWD-02", name: "Best Music Video", type: "Music", nominees: 6, votes: 62840, status: "Voting Open" },
  { id: "AWD-03", name: "People's Choice — Favourite Show", type: "People's Choice", nominees: 8, votes: 112480, status: "Voting Open" },
  { id: "AWD-04", name: "Outstanding Athlete of the Year", type: "Sports", nominees: 5, votes: 38920, status: "Voting Open" },
  { id: "AWD-05", name: "Youth Development Award", type: "Sports", nominees: 4, votes: 21040, status: "Voting Open" },
  { id: "AWD-06", name: "Community Service Award", type: "Sports", nominees: 4, votes: 18330, status: "Voting Open" },
  { id: "AWD-07", name: "Best Lifestyle Content Creator", type: "Lifestyle", nominees: 5, votes: 29110, status: "Voting Open" },
  { id: "AWD-08", name: "Best Documentary", type: "Entertainment", nominees: 4, votes: 14220, status: "Pending" },
  { id: "AWD-09", name: "Best Live Performance", type: "Music", nominees: 5, votes: 0, status: "Pending" },
]

const nominees = [
  { id: "NOM-01", award: "Best Drama Series", name: "The Last Protocol", votes: 18420, pct: 38.2, thumb: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=48&h=32&fit=crop&auto=format" },
  { id: "NOM-02", award: "Best Drama Series", name: "Midnight Frequency", votes: 14840, pct: 30.8, thumb: "https://images.unsplash.com/photo-1512070679279-8988d32161be?w=48&h=32&fit=crop&auto=format" },
  { id: "NOM-03", award: "Best Drama Series", name: "Echoes of Tomorrow", votes: 9210, pct: 19.1, thumb: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=48&h=32&fit=crop&auto=format" },
  { id: "NOM-04", award: "Best Drama Series", name: "Sundowner", votes: 3840, pct: 8.0, thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=48&h=32&fit=crop&auto=format" },
  { id: "NOM-05", award: "Best Drama Series", name: "Six Degrees", votes: 1900, pct: 3.9, thumb: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=48&h=32&fit=crop&auto=format" },
]

const typeColors: Record<string, string> = {
  Entertainment: "#a855f7",
  Music: "#C9A84C",
  "People's Choice": "#f59e0b",
  Sports: "#22c55e",
  Lifestyle: "#3b82f6",
}

const statusColors: Record<string, { c: string; bg: string }> = {
  "Voting Open": { c: "#22c55e", bg: "#22c55e18" },
  Pending: { c: "#8b8f9a", bg: "#8b8f9a18" },
  Closed: { c: "#C9A84C", bg: "#C9A84C18" },
}

function StatusBadge({ s }: { s: string }) {
  const c = statusColors[s] ?? { c: "#8b8f9a", bg: "#8b8f9a18" }
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: c.c, background: c.bg, padding: "2px 7px", borderRadius: 4 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: c.c }} />{s}</span>
}

export default function Awards() {
  const [tab, setTab] = useState("categories")
  const [selectedCat, setSelectedCat] = useState("Best Drama Series")

  const totalVotes = awardCategories.reduce((a, c) => a + c.votes, 0)

  return (
    <div style={{ padding: "28px" }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Award Categories", value: String(awardCategories.length), color: "#a855f7" },
          { label: "Voting Open", value: String(awardCategories.filter((c) => c.status === "Voting Open").length), color: "#22c55e" },
          { label: "Total Votes Cast", value: totalVotes.toLocaleString(), color: "var(--accent)" },
          { label: "Event Date", value: "Oct 15", color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "15px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-sans)", color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {[{ id: "categories", label: "Award Categories" }, { id: "voting", label: "Vote Monitoring" }].map((t) => {
          const active = tab === t.id
          return <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: active ? "var(--accent)" : "transparent", color: active ? "white" : "var(--text-secondary)", fontSize: 12.5, fontWeight: active ? 600 : 500, fontFamily: "var(--font-sans)", transition: "all 0.15s" }}>{t.label}</button>
        })}
      </div>

      {tab === "categories" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button style={{ padding: "7px 16px", background: "var(--accent)", border: "none", borderRadius: 7, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>+ Add Category</button>
          </div>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>{["Category", "Type", "Nominees", "Votes", "Status", ""].map((h) => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>
                {awardCategories.map((row, i) => (
                  <tr key={row.id} style={{ borderBottom: i < awardCategories.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{row.name}</div>
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{row.id}</div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 10.5, fontFamily: "var(--font-sans)", fontWeight: 600, color: typeColors[row.type] ?? "#8b8f9a", background: (typeColors[row.type] ?? "#8b8f9a") + "18", padding: "2px 7px", borderRadius: 4 }}>{row.type}</span>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{row.nominees}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{row.votes > 0 ? row.votes.toLocaleString() : "—"}</td>
                    <td style={{ padding: "11px 14px" }}><StatusBadge s={row.status} /></td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit</button>
                        <button onClick={() => { setSelectedCat(row.name); setTab("voting") }} style={{ background: "none", border: "1px solid #3b82f640", borderRadius: 4, padding: "3px 9px", color: "#3b82f6", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>View Votes</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "voting" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: 13, padding: "7px 12px", fontFamily: "var(--font-sans)", cursor: "pointer", outline: "none" }}>
              {awardCategories.map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {(awardCategories.find((c) => c.name === selectedCat)?.votes ?? 0).toLocaleString()} total votes
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {nominees.filter((n) => n.award === selectedCat).length > 0
              ? nominees.filter((n) => n.award === selectedCat).map((n, i) => (
                <div key={n.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: i === 0 ? "#f59e0b" : "var(--text-muted)", fontFamily: "var(--font-sans)", width: 28, textAlign: "center" }}>#{i + 1}</div>
                    <img src={n.thumb} alt={n.name} style={{ width: 52, height: 34, borderRadius: 4, objectFit: "cover" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{n.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{n.votes.toLocaleString()} votes · {n.pct}%</div>
                    </div>
                    {i === 0 && <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)", color: "#f59e0b", background: "#f59e0b18", padding: "3px 8px", borderRadius: 4 }}>Leading</span>}
                  </div>
                  <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${n.pct}%`, background: i === 0 ? "#f59e0b" : "var(--accent)", borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))
              : <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "40px", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 14 }}>No vote data available yet for this category.</div>
            }
          </div>
        </div>
      )}
    </div>
  )
}
