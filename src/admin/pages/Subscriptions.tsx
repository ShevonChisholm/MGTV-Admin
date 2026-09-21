import { useState } from "react"

const plans = [
  { id: "PLN-001", name: "Free", price: "$0", period: "Forever", features: ["Ad-supported streaming", "SD quality", "1 profile", "Limited content library"], subscribers: 95226, color: "#8b8f9a" },
  { id: "PLN-002", name: "MGTV+ Monthly", price: "$7.99", period: "per month", features: ["Ad-free streaming", "Up to 4K quality", "5 profiles", "Full content library", "Offline downloads", "Exclusive MGTV+ content", "Early access to premieres"], subscribers: 64820, color: "#C9A84C" },
  { id: "PLN-003", name: "MGTV+ Annual", price: "$71.99", period: "per year", features: ["Everything in Monthly", "2 months free", "Priority customer support", "Annual subscriber badge"], subscribers: 26384, color: "#3b82f6" },
]

const recentSubs = [
  { id: "SUB-88441", customer: "Alicia Thompson", plan: "MGTV+ Annual", started: "Sep 12, 2026", renewsOn: "Sep 12, 2027", status: "Active", amount: "$71.99" },
  { id: "SUB-88440", customer: "Marcus Williams", plan: "MGTV+ Monthly", started: "Sep 11, 2026", renewsOn: "Oct 11, 2026", status: "Active", amount: "$7.99" },
  { id: "SUB-88439", customer: "Isabelle Dupont", plan: "MGTV+ Monthly", started: "Sep 10, 2026", renewsOn: "Oct 10, 2026", status: "Active", amount: "$7.99" },
  { id: "SUB-88438", customer: "Darius Beckford", plan: "MGTV+ Monthly", started: "Aug 14, 2026", renewsOn: "Sep 14, 2026", status: "Payment Failed", amount: "$7.99" },
  { id: "SUB-88437", customer: "Priscilla Martin", plan: "MGTV+ Annual", started: "Sep 12, 2025", renewsOn: "Sep 12, 2026", status: "Cancelled", amount: "$71.99" },
  { id: "SUB-88436", customer: "Jason Clarke", plan: "MGTV+ Annual", started: "Jun 1, 2024", renewsOn: "Jun 1, 2027", status: "Active", amount: "$71.99" },
  { id: "SUB-88435", customer: "Simone Laurent", plan: "MGTV+ Monthly", started: "Nov 8, 2024", renewsOn: "Oct 8, 2026", status: "Active", amount: "$7.99" },
]

const statusColors: Record<string, { c: string; bg: string }> = {
  Active: { c: "#22c55e", bg: "#22c55e18" },
  "Payment Failed": { c: "#ef4444", bg: "#ef444418" },
  Cancelled: { c: "#8b8f9a", bg: "#8b8f9a18" },
  "Free Trial": { c: "#f59e0b", bg: "#f59e0b18" },
}

function StatusBadge({ s }: { s: string }) {
  const c = statusColors[s] ?? { c: "#8b8f9a", bg: "#8b8f9a18" }
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: c.c, background: c.bg, padding: "2px 7px", borderRadius: 4 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: c.c }} />{s}</span>
}

export default function Subscriptions() {
  const [tab, setTab] = useState("overview")

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {[{ id: "overview", label: "Overview" }, { id: "plans", label: "Plans" }, { id: "subscribers", label: "Subscribers" }].map((t) => {
          const active = tab === t.id
          return <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: active ? "var(--accent)" : "transparent", color: active ? "white" : "var(--text-secondary)", fontSize: 12.5, fontWeight: active ? 600 : 500, fontFamily: "var(--font-sans)", transition: "all 0.15s" }}>{t.label}</button>
        })}
      </div>

      {tab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total Subscribers", value: "91,204", change: "+4,820", color: "var(--green)" },
              { label: "Monthly Revenue", value: "$524,820", change: "+8.2%", color: "var(--green)" },
              { label: "Annual Revenue", value: "$6.3M", change: "YTD 2026", color: "var(--text-muted)" },
              { label: "Churn Rate", value: "2.4%", change: "-0.3%", color: "var(--green)" },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-sans)", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, fontFamily: "var(--font-mono)", marginTop: 4 }}>{s.change}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 16 }}>Subscriber Mix</div>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ flex: 1 }}>
                {[
                  { label: "Free Tier", count: 95226, pct: 51.1, color: "#8b8f9a" },
                  { label: "MGTV+ Monthly", count: 64820, pct: 34.8, color: "#C9A84C" },
                  { label: "MGTV+ Annual", count: 26384, pct: 14.1, color: "#3b82f6" },
                ].map((r) => (
                  <div key={r.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{r.label}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{r.count.toLocaleString()} ({r.pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${r.pct}%`, background: r.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 16 }}>Recent Subscription Activity</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>{["Subscription ID", "Customer", "Plan", "Started", "Renews On", "Status", "Amount"].map((h) => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>
                {recentSubs.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < recentSubs.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{r.id}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{r.customer}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{r.plan}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{r.started}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{r.renewsOn}</td>
                    <td style={{ padding: "11px 14px" }}><StatusBadge s={r.status} /></td>
                    <td style={{ padding: "11px 14px", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "plans" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button style={{ padding: "7px 16px", background: "var(--accent)", border: "none", borderRadius: 7, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>+ Add Plan</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {plans.map((p) => (
              <div key={p.id} style={{ background: "var(--card)", border: `1px solid ${p.color}40`, borderRadius: 12, padding: "22px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: p.color }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 4 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: p.color, fontFamily: "var(--font-sans)" }}>{p.price}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>{p.period}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 16 }}>{p.subscribers.toLocaleString()} subscribers</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
                      <span style={{ color: p.color, fontSize: 12, flexShrink: 0 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <button style={{ width: "100%", padding: "8px", background: "transparent", border: `1px solid ${p.color}60`, borderRadius: 7, color: p.color, fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>Edit Plan</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "subscribers" && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>{["Subscription ID", "Customer", "Plan", "Started", "Renews On", "Status", "Amount"].map((h) => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>
              {recentSubs.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < recentSubs.length - 1 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{r.id}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{r.customer}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{r.plan}</td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{r.started}</td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{r.renewsOn}</td>
                  <td style={{ padding: "11px 14px" }}><StatusBadge s={r.status} /></td>
                  <td style={{ padding: "11px 14px", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
