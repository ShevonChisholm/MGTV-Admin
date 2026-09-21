const stats = [
  {
    label: "Total Views",
    value: "24.8M",
    change: "+12.4%",
    up: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
    color: "#3b82f6",
  },
  {
    label: "Active Users",
    value: "186,430",
    change: "+8.1%",
    up: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: "#22c55e",
  },
  {
    label: "Content Items",
    value: "3,741",
    change: "+2.3%",
    up: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
    color: "#a855f7",
  },
  {
    label: "Flagged Items",
    value: "12",
    change: "-33%",
    up: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: "#C9A84C",
  },
]

const weeklyData = [62, 78, 55, 91, 83, 110, 98, 130, 115, 142, 128, 156, 148, 172]
const maxWeekly = Math.max(...weeklyData)

const categories = [
  { label: "Drama", value: 34, color: "#3b82f6" },
  { label: "Action", value: 22, color: "#C9A84C" },
  { label: "Comedy", value: 18, color: "#22c55e" },
  { label: "Documentary", value: 14, color: "#a855f7" },
  { label: "Reality", value: 12, color: "#f59e0b" },
]

const recentActivity = [
  { user: "Marcus Chen", action: "Published new episode", title: "Echoes S2E04", time: "2 min ago" },
  { user: "System", action: "Auto-flagged content", title: "User upload #8821", time: "14 min ago" },
  { user: "Priya Nair", action: "Approved moderation", title: "Comment #44120", time: "31 min ago" },
  { user: "Devon Walsh", action: "Added series", title: "The Last Protocol S1", time: "1 hr ago" },
  { user: "System", action: "Scheduled maintenance", title: "CDN Region US-West", time: "2 hr ago" },
]

export default function Dashboard() {
  const chartH = 140
  const chartW = 420
  const padL = 8
  const padR = 8
  const padT = 10
  const padB = 4
  const innerW = chartW - padL - padR
  const innerH = chartH - padT - padB

  const points = weeklyData.map((v, i) => {
    const x = padL + (i / (weeklyData.length - 1)) * innerW
    const y = padT + innerH - (v / maxWeekly) * innerH
    return `${x},${y}`
  })
  const polyline = points.join(" ")
  const area = `${padL},${chartH - padB} ${polyline} ${chartW - padR},${chartH - padB}`

  return (
    <div style={{ padding: "28px 28px", maxWidth: 1200 }}>
      {/* Date range */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
          Sep 1 – Sep 12, 2026
        </p>
        <select
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--text-secondary)",
            fontSize: 12,
            padding: "5px 10px",
            fontFamily: "var(--font-mono)",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option>Last 14 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>
                {s.label}
              </span>
              <span style={{ color: s.color, opacity: 0.8 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)", letterSpacing: "-0.02em", marginBottom: 6 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: s.up ? "var(--green)" : "var(--accent)", fontFamily: "var(--font-mono)" }}>
              {s.change} <span style={{ color: "var(--text-muted)" }}>vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 28 }}>
        {/* Line chart */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px" }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>Weekly Views</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>Millions of streams</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}>172M</div>
          </div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height={chartH} style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={area} fill="url(#areaGrad)" />
            <polyline points={polyline} fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((pt, i) => {
              if (i !== weeklyData.length - 1) return null
              const [x, y] = pt.split(",").map(Number)
              return <circle key={i} cx={x} cy={y} r="4" fill="#C9A84C" />
            })}
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {["W1", "W2", "W3", "W4", "W5", "W6", "W7"].map((w) => (
              <span key={w} style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{w}</span>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 20 }}>Content by Category</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {categories.map((cat) => (
              <div key={cat.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{cat.label}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{cat.value}%</span>
                </div>
                <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${cat.value}%`, background: cat.color, borderRadius: 2, transition: "width 0.6s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 16 }}>Recent Activity</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recentActivity.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "11px 0",
                borderBottom: i < recentActivity.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: item.user === "System" ? "var(--border)" : "var(--accent-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: item.user === "System" ? "var(--text-muted)" : "var(--accent)",
                  flexShrink: 0,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {item.user === "System" ? "⚙" : item.user.split(" ").map((n) => n[0]).join("")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
                  <strong style={{ fontWeight: 600 }}>{item.user}</strong> {item.action} —{" "}
                  <span style={{ color: "var(--text-secondary)" }}>{item.title}</span>
                </span>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", flexShrink: 0 }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
