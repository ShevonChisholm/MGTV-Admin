import { useState } from "react"

const sections = [
  {
    id: "hero",
    label: "Homepage Hero",
    type: "Banner",
    item: "Blood & Chrome — Season 2",
    status: "Live",
    start: "Sep 1, 2026",
    end: "Sep 22, 2026",
    thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=72&h=44&fit=crop&auto=format",
  },
  {
    id: "feat-shows",
    label: "Featured Shows",
    type: "Carousel",
    item: "6 shows selected",
    status: "Live",
    start: "Sep 1, 2026",
    end: "Ongoing",
    thumb: null,
  },
  {
    id: "feat-movies",
    label: "Featured Movies",
    type: "Carousel",
    item: "4 movies selected",
    status: "Live",
    start: "Sep 8, 2026",
    end: "Ongoing",
    thumb: null,
  },
  {
    id: "feat-music",
    label: "Featured Music",
    type: "Spotlight",
    item: "Kaya Monroe — Versailles",
    status: "Live",
    start: "Sep 5, 2026",
    end: "Sep 19, 2026",
    thumb: null,
  },
  {
    id: "feat-sports",
    label: "Featured Sports",
    type: "Carousel",
    item: "3 events selected",
    status: "Live",
    start: "Sep 9, 2026",
    end: "Ongoing",
    thumb: null,
  },
  {
    id: "feat-news",
    label: "Featured News",
    type: "Grid",
    item: "5 articles selected",
    status: "Live",
    start: "Sep 1, 2026",
    end: "Ongoing",
    thumb: null,
  },
  {
    id: "feat-events",
    label: "Featured Events",
    type: "Carousel",
    item: "TropicFest, Caribbean Cup",
    status: "Live",
    start: "Sep 6, 2026",
    end: "Sep 20, 2026",
    thumb: null,
  },
  {
    id: "mgtv-plus",
    label: "MGTV+ Featured",
    type: "Banner",
    item: "Sunfall — Exclusive Premiere",
    status: "Scheduled",
    start: "Sep 20, 2026",
    end: "Oct 5, 2026",
    thumb: "https://images.unsplash.com/photo-1512070679279-8988d32161be?w=72&h=44&fit=crop&auto=format",
  },
  {
    id: "trending",
    label: "Trending Content",
    type: "Auto",
    item: "Algorithm-driven (top 10)",
    status: "Live",
    start: "Continuous",
    end: "Continuous",
    thumb: null,
  },
  {
    id: "lifestyle-feat",
    label: "Featured Lifestyle & Culture",
    type: "Spotlight",
    item: "Island Fashion Week 2026",
    status: "Live",
    start: "Sep 10, 2026",
    end: "Sep 17, 2026",
    thumb: null,
  },
  {
    id: "promo-banner",
    label: "Promotional Banner",
    type: "Banner",
    item: "MGTV+ Free Trial — 30 days",
    status: "Draft",
    start: "—",
    end: "—",
    thumb: null,
  },
]

const statusColors: Record<string, { c: string; bg: string }> = {
  Live: { c: "#22c55e", bg: "#22c55e18" },
  Scheduled: { c: "#3b82f6", bg: "#3b82f618" },
  Draft: { c: "#8b8f9a", bg: "#8b8f9a18" },
  Paused: { c: "#f59e0b", bg: "#f59e0b18" },
}

function StatusBadge({ s }: { s: string }) {
  const c = statusColors[s] ?? { c: "#8b8f9a", bg: "#8b8f9a18" }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: c.c, background: c.bg, padding: "2px 7px", borderRadius: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.c }} />{s}
    </span>
  )
}

const typeTag = (t: string) => (
  <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)", background: "var(--border)", padding: "2px 6px", borderRadius: 3 }}>{t}</span>
)

export default function Homepage() {
  const [sections_state, setSections] = useState(sections)

  const moveUp = (idx: number) => {
    if (idx === 0) return
    setSections((prev) => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  const moveDown = (idx: number) => {
    setSections((prev) => {
      if (idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  return (
    <div style={{ padding: "28px", maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-sans)" }}>
          Control what appears in every section of the customer homepage. Drag rows to reorder sections.
        </p>
        <button style={{ padding: "7px 16px", background: "var(--accent)", border: "none", borderRadius: 7, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Section
        </button>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "10px 14px", width: 36 }} />
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Section</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Type</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Current Content</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Start</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>End</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Status</th>
              <th style={{ padding: "10px 14px" }} />
            </tr>
          </thead>
          <tbody>
            {sections_state.map((row, i) => (
              <tr
                key={row.id}
                style={{ borderBottom: i < sections_state.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <button onClick={() => moveUp(i)} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "var(--text-muted)" : "var(--text-secondary)", padding: 0, lineHeight: 1 }}>▲</button>
                    <button onClick={() => moveDown(i)} disabled={i === sections_state.length - 1} style={{ background: "none", border: "none", cursor: i === sections_state.length - 1 ? "default" : "pointer", color: i === sections_state.length - 1 ? "var(--text-muted)" : "var(--text-secondary)", padding: 0, lineHeight: 1 }}>▼</button>
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {row.thumb && <img src={row.thumb} alt="" style={{ width: 60, height: 38, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />}
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{row.label}</div>
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>Position {i + 1}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}>{typeTag(row.type)}</td>
                <td style={{ padding: "12px 14px", fontSize: 12.5, color: "var(--text-secondary)", fontFamily: "var(--font-sans)", maxWidth: 200 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.item}</div>
                </td>
                <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.start}</td>
                <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{row.end}</td>
                <td style={{ padding: "12px 14px" }}><StatusBadge s={row.status} /></td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit</button>
                    {row.status === "Live" ? (
                      <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "#f59e0b", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Pause</button>
                    ) : (
                      <button style={{ background: "none", border: "1px solid #22c55e40", borderRadius: 4, padding: "3px 9px", color: "#22c55e", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Publish</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
