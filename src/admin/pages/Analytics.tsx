const dauData = [142, 158, 163, 171, 149, 138, 160, 175, 182, 191, 178, 186, 194, 201, 189, 197, 204, 218, 211, 225, 215, 220, 233, 228, 239, 245, 238, 242, 251, 248]
const maxDau = Math.max(...dauData)

const topContent = [
  { title: "Blood & Chrome", views: 5.1, color: "#C9A84C" },
  { title: "The Last Protocol", views: 4.2, color: "#3b82f6" },
  { title: "Proxy War", views: 4.7, color: "#a855f7" },
  { title: "Echoes of Tomorrow", views: 3.8, color: "#22c55e" },
  { title: "Midnight Frequency", views: 3.3, color: "#f59e0b" },
  { title: "Iron Meridian", views: 2.9, color: "#06b6d4" },
  { title: "Six Degrees", views: 2.1, color: "#ec4899" },
]
const maxViews = Math.max(...topContent.map((t) => t.views))

const devices = [
  { label: "Smart TV", pct: 38, color: "#C9A84C" },
  { label: "Mobile", pct: 29, color: "#3b82f6" },
  { label: "Desktop", pct: 21, color: "#a855f7" },
  { label: "Tablet", pct: 12, color: "#22c55e" },
]

const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"]
const retentionData = [71, 68, 74, 72, 76, 79]

export default function Analytics() {
  const dauW = 600
  const dauH = 120
  const pad = 8
  const innerW = dauW - pad * 2
  const innerH = dauH - pad * 2

  const dauPoints = dauData.map((v, i) => {
    const x = pad + (i / (dauData.length - 1)) * innerW
    const y = pad + innerH - (v / maxDau) * innerH
    return `${x},${y}`
  })
  const dauLine = dauPoints.join(" ")
  const dauArea = `${pad},${dauH - pad} ${dauLine} ${dauW - pad},${dauH - pad}`

  const totalDau = "248K"
  const peakDau = "251K"

  // Donut chart
  const r = 60
  const cx = 80
  const cy = 80
  let offset = 0
  const circumference = 2 * Math.PI * r
  const donutSlices = devices.map((d) => {
    const dash = (d.pct / 100) * circumference
    const gap = circumference - dash
    const slice = { ...d, dash, gap, offset }
    offset += dash
    return slice
  })

  return (
    <div style={{ padding: "28px", maxWidth: 1200 }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Avg. Daily Active Users", value: "203K", change: "+7.2%" },
          { label: "Avg. Watch Time", value: "48 min", change: "+3.1%" },
          { label: "Content Completion Rate", value: "61.4%", change: "+1.8%" },
          { label: "Subscriber Growth", value: "+4,820", change: "this month" },
        ].map((k) => (
          <div key={k.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-sans)", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--green)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{k.change}</div>
          </div>
        ))}
      </div>

      {/* DAU chart */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>Daily Active Users — Last 30 days</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>Peak: {peakDau} &nbsp;·&nbsp; Current: {totalDau}</div>
          </div>
        </div>
        <svg viewBox={`0 0 ${dauW} ${dauH}`} width="100%" height={dauH} preserveAspectRatio="none">
          <defs>
            <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={dauArea} fill="url(#dauGrad)" />
          <polyline points={dauLine} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {["Aug 13", "Aug 18", "Aug 23", "Aug 28", "Sep 2", "Sep 7", "Sep 12"].map((d) => (
            <span key={d} style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{d}</span>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        {/* Top content bar chart */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 18 }}>Top Content by Views (M)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topContent.map((t) => (
              <div key={t.title}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{t.title}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{t.views}M</span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(t.views / maxViews) * 100}%`, background: t.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device breakdown donut */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 16 }}>Device Breakdown</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
            <svg width={160} height={160} viewBox="0 0 160 160">
              {donutSlices.map((s, i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={18}
                  strokeDasharray={`${s.dash} ${s.gap}`}
                  strokeDashoffset={-s.offset + circumference / 4}
                  style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
                />
              ))}
              <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="700" fontFamily="var(--font-sans)">38%</text>
              <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">Smart TV</text>
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {devices.map((d) => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: "inline-block" }} />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{d.label}</span>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Retention */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px", marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)", marginBottom: 18 }}>Monthly Retention Rate (%)</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 80 }}>
          {retentionData.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{v}%</span>
              <div style={{ width: "100%", height: `${(v / 100) * 60}px`, background: i === retentionData.length - 1 ? "var(--accent)" : "#3b82f6", borderRadius: "4px 4px 0 0", transition: "height 0.3s" }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{months[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
