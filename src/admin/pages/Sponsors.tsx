import { useState } from "react"

const sponsors = [
  { id: "SPO-001", name: "Digicel Group", logo: "DG", contact: "partnerships@digicel.com", package: "Platinum", status: "Active", association: "All Sports Content", since: "Jan 2025", revenue: "$84,000" },
  { id: "SPO-002", name: "Grace Kennedy", logo: "GK", contact: "media@gracekennedy.com", package: "Gold", status: "Active", association: "Lifestyle & Culture", since: "Mar 2025", revenue: "$48,000" },
  { id: "SPO-003", name: "JMMB Group", logo: "JM", contact: "brand@jmmb.com", package: "Gold", status: "Active", association: "MGTV Awards 2026", since: "Jul 2025", revenue: "$48,000" },
  { id: "SPO-004", name: "Carib Brewery", logo: "CB", contact: "sponsorship@carib.tt", package: "Silver", status: "Active", association: "Sports Events", since: "Apr 2025", revenue: "$24,000" },
  { id: "SPO-005", name: "Flow / C&W", logo: "FL", contact: "ads@cwc.com", package: "Platinum", status: "Active", association: "Homepage Hero", since: "Jan 2025", revenue: "$84,000" },
  { id: "SPO-006", name: "Sagicor", logo: "SG", contact: "marketing@sagicor.com", package: "Silver", status: "Negotiating", association: "TBD", since: "—", revenue: "—" },
  { id: "SPO-007", name: "Tourism Board JA", logo: "TB", contact: "digital@visitjamaica.com", package: "Bronze", status: "Active", association: "News & Travel", since: "Jun 2025", revenue: "$12,000" },
]

const packages = [
  { name: "Platinum", price: "$84,000/yr", perks: ["Homepage Hero placement", "Pre-roll on all video", "Logo on Awards Night", "Dedicated segment"], color: "#f59e0b", count: 2 },
  { name: "Gold", price: "$48,000/yr", perks: ["Featured content placement", "Mid-roll advertising", "Logo on event streams", "Category sponsorship"], color: "#8b8f9a", count: 2 },
  { name: "Silver", price: "$24,000/yr", perks: ["Banner ads across platform", "Post-roll advertising", "Newsletter inclusion"], color: "#cd7f32", count: 2 },
  { name: "Bronze", price: "$12,000/yr", perks: ["Newsletter inclusion", "Social media mention", "Logo in credits"], color: "#a05c34", count: 1 },
]

const statusColors: Record<string, { c: string; bg: string }> = {
  Active: { c: "#22c55e", bg: "#22c55e18" },
  Negotiating: { c: "#f59e0b", bg: "#f59e0b18" },
  Inactive: { c: "#8b8f9a", bg: "#8b8f9a18" },
}

const packageColors: Record<string, string> = {
  Platinum: "#f59e0b",
  Gold: "#8b8f9a",
  Silver: "#cd7f32",
  Bronze: "#a05c34",
}

function StatusBadge({ s }: { s: string }) {
  const c = statusColors[s] ?? { c: "#8b8f9a", bg: "#8b8f9a18" }
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: c.c, background: c.bg, padding: "2px 7px", borderRadius: 4 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: c.c }} />{s}</span>
}

export default function Sponsors() {
  const [tab, setTab] = useState("sponsors")
  const activeRevenue = sponsors.filter((s) => s.revenue !== "—").reduce((a, s) => a + parseInt(s.revenue.replace(/[$,]/g, "")), 0)

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Active Sponsors", value: String(sponsors.filter((s) => s.status === "Active").length) },
          { label: "Annual Revenue", value: `$${(activeRevenue / 1000).toFixed(0)}K` },
          { label: "Platinum Sponsors", value: String(packages[0].count) },
          { label: "In Negotiation", value: String(sponsors.filter((s) => s.status === "Negotiating").length) },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "15px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-sans)", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {[{ id: "sponsors", label: "Sponsors" }, { id: "packages", label: "Packages" }].map((t) => {
          const active = tab === t.id
          return <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: active ? "var(--accent)" : "transparent", color: active ? "white" : "var(--text-secondary)", fontSize: 12.5, fontWeight: active ? 600 : 500, fontFamily: "var(--font-sans)", transition: "all 0.15s" }}>{t.label}</button>
        })}
        <button style={{ marginLeft: 8, padding: "6px 14px", background: "var(--accent)", border: "none", borderRadius: 6, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>+ Add Sponsor</button>
      </div>

      {tab === "sponsors" && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>{["Sponsor", "Package", "Contact", "Association", "Since", "Revenue", "Status", ""].map((h) => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>
              {sponsors.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < sponsors.length - 1 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 7, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", fontFamily: "var(--font-sans)", flexShrink: 0 }}>{s.logo}</div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{s.name}</div>
                        <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: packageColors[s.package] ?? "#8b8f9a", background: (packageColors[s.package] ?? "#8b8f9a") + "18", padding: "2px 7px", borderRadius: 4 }}>{s.package}</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 11.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{s.contact}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{s.association}</td>
                  <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{s.since}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{s.revenue}</td>
                  <td style={{ padding: "12px 14px" }}><StatusBadge s={s.status} /></td>
                  <td style={{ padding: "12px 14px" }}><button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "packages" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {packages.map((p) => (
            <div key={p.name} style={{ background: "var(--card)", border: `1px solid ${p.color}40`, borderRadius: 12, padding: "22px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: p.color }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: p.color, fontFamily: "var(--font-sans)" }}>{p.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginTop: 4 }}>{p.price}</div>
                </div>
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{p.count} active</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                {p.perks.map((perk) => (
                  <div key={perk} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
                    <span style={{ color: p.color, flexShrink: 0 }}>✓</span>{perk}
                  </div>
                ))}
              </div>
              <button style={{ width: "100%", padding: "8px", background: "transparent", border: `1px solid ${p.color}50`, borderRadius: 7, color: p.color, fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>Edit Package</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
