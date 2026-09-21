import { useState } from "react"

const advertisers = [
  { id: "ADV-001", name: "Kingston Rum Co.", campaigns: 2, spend: "$18,400", status: "Active" },
  { id: "ADV-002", name: "Reel Tech Solutions", campaigns: 1, spend: "$9,200", status: "Active" },
  { id: "ADV-003", name: "SunBrite Skincare", campaigns: 3, spend: "$26,100", status: "Active" },
  { id: "ADV-004", name: "Island Air", campaigns: 1, spend: "$12,800", status: "Paused" },
  { id: "ADV-005", name: "CaribbeanChef App", campaigns: 2, spend: "$7,600", status: "Active" },
]

const campaigns = [
  { id: "CMP-0881", name: "Summer Rum Vibes", advertiser: "Kingston Rum Co.", placement: "Pre-roll Video", start: "Sep 1, 2026", end: "Sep 30, 2026", budget: "$10,000", spent: "$6,820", impressions: "1.4M", status: "Active" },
  { id: "CMP-0880", name: "SunBrite Glow — Back to School", advertiser: "SunBrite Skincare", placement: "Mid-roll + Banner", start: "Aug 25, 2026", end: "Sep 14, 2026", budget: "$14,000", spent: "$13,200", impressions: "2.8M", status: "Active" },
  { id: "CMP-0879", name: "Island Air — Fly Local", advertiser: "Island Air", placement: "Homepage Banner", start: "Sep 5, 2026", end: "Sep 12, 2026", budget: "$8,000", spent: "$8,000", impressions: "980K", status: "Paused" },
  { id: "CMP-0878", name: "CaribbeanChef October Launch", advertiser: "CaribbeanChef App", placement: "Lifestyle Pre-roll", start: "Oct 1, 2026", end: "Oct 31, 2026", budget: "$6,000", spent: "$0", impressions: "—", status: "Scheduled" },
  { id: "CMP-0877", name: "Reel Tech — Dev Tools 2026", advertiser: "Reel Tech Solutions", placement: "Mid-roll Sports", start: "Sep 10, 2026", end: "Sep 25, 2026", budget: "$9,200", spent: "$4,140", impressions: "640K", status: "Active" },
  { id: "CMP-0876", name: "SunBrite Holiday Season", advertiser: "SunBrite Skincare", placement: "Pre-roll + Post-roll", start: "Nov 1, 2026", end: "Dec 31, 2026", budget: "$22,000", spent: "$0", impressions: "—", status: "Draft" },
]

const statusColors: Record<string, { c: string; bg: string }> = {
  Active: { c: "#22c55e", bg: "#22c55e18" },
  Paused: { c: "#f59e0b", bg: "#f59e0b18" },
  Scheduled: { c: "#3b82f6", bg: "#3b82f618" },
  Draft: { c: "#8b8f9a", bg: "#8b8f9a18" },
  Completed: { c: "#555a66", bg: "#555a6618" },
}

function StatusBadge({ s }: { s: string }) {
  const c = statusColors[s] ?? { c: "#8b8f9a", bg: "#8b8f9a18" }
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: c.c, background: c.bg, padding: "2px 7px", borderRadius: 4 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: c.c }} />{s}</span>
}

export default function Advertising() {
  const [tab, setTab] = useState("campaigns")

  const totalBudget = campaigns.reduce((a, c) => a + parseInt(c.budget.replace(/[$,]/g, "")), 0)
  const totalSpent = campaigns.filter((c) => c.spent !== "$0").reduce((a, c) => a + parseInt(c.spent.replace(/[$,]/g, "")), 0)

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Active Campaigns", value: String(campaigns.filter((c) => c.status === "Active").length), color: "#22c55e" },
          { label: "Total Budget", value: `$${(totalBudget / 1000).toFixed(0)}K`, color: "var(--text-primary)" },
          { label: "Total Spent", value: `$${(totalSpent / 1000).toFixed(1)}K`, color: "var(--accent)" },
          { label: "Total Advertisers", value: String(advertisers.length), color: "#3b82f6" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "15px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-sans)", color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {[{ id: "campaigns", label: "Campaigns" }, { id: "advertisers", label: "Advertisers" }].map((t) => {
          const active = tab === t.id
          return <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: active ? "var(--accent)" : "transparent", color: active ? "white" : "var(--text-secondary)", fontSize: 12.5, fontWeight: active ? 600 : 500, fontFamily: "var(--font-sans)", transition: "all 0.15s" }}>{t.label}</button>
        })}
        <button style={{ marginLeft: 8, padding: "6px 14px", background: "var(--accent)", border: "none", borderRadius: 6, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>+ New Campaign</button>
      </div>

      {tab === "campaigns" && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>{["Campaign", "Advertiser", "Placement", "Dates", "Budget", "Spent", "Impressions", "Status", ""].map((h) => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>
              {campaigns.map((row, i) => {
                const spentNum = row.spent !== "$0" ? parseInt(row.spent.replace(/[$,]/g, "")) : 0
                const budgetNum = parseInt(row.budget.replace(/[$,]/g, ""))
                const pct = budgetNum > 0 ? spentNum / budgetNum : 0
                return (
                  <tr key={row.id} style={{ borderBottom: i < campaigns.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{row.name}</div>
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{row.id}</div>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{row.advertiser}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{row.placement}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.start} – {row.end}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{row.budget}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ fontSize: 12, color: "var(--text-primary)", fontFamily: "var(--font-mono)", marginBottom: pct > 0 ? 4 : 0 }}>{row.spent}</div>
                      {pct > 0 && (
                        <div style={{ width: 60, height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct * 100}%`, background: pct > 0.9 ? "var(--accent)" : "#22c55e", borderRadius: 2 }} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{row.impressions}</td>
                    <td style={{ padding: "11px 14px" }}><StatusBadge s={row.status} /></td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit</button>
                        {row.status === "Active" && <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "#f59e0b", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Pause</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "advertisers" && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>{["Advertiser", "Campaigns", "Total Spend", "Status", ""].map((h) => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>
              {advertisers.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < advertisers.length - 1 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{a.name}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{a.id}</div>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{a.campaigns}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{a.spend}</td>
                  <td style={{ padding: "11px 14px" }}><StatusBadge s={a.status} /></td>
                  <td style={{ padding: "11px 14px" }}><button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
