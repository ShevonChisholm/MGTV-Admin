import { useState } from "react"

const mediaItems = [
  { id: "MED-4421", name: "blood-chrome-s2e01.mp4", type: "Video", size: "4.2 GB", duration: "48:22", status: "Ready", quality: ["4K", "1080p", "720p", "480p"], linked: "Blood & Chrome S2E01", uploaded: "Sep 10, 2026" },
  { id: "MED-4420", name: "echoes-s1-trailer.mp4", type: "Video", size: "820 MB", duration: "2:14", status: "Ready", quality: ["1080p", "720p"], linked: "Echoes of Tomorrow — Trailer", uploaded: "Sep 9, 2026" },
  { id: "MED-4419", name: "island-fashion-hero.jpg", type: "Image", size: "3.8 MB", duration: "—", status: "Ready", quality: ["4K"], linked: "Island Fashion Week Recap", uploaded: "Sep 9, 2026" },
  { id: "MED-4418", name: "sunfall-movie-4k.mp4", type: "Video", size: "12.1 GB", duration: "1:54:08", status: "Processing", quality: [], linked: "Sunfall", uploaded: "Sep 8, 2026" },
  { id: "MED-4417", name: "carib-cup-m7-highlights.mp4", type: "Video", size: "1.9 GB", duration: "18:44", status: "Ready", quality: ["1080p", "720p", "480p"], linked: "Caribbean Cup Highlights — Matchday 7", uploaded: "Sep 8, 2026" },
  { id: "MED-4416", name: "versailles-live-kaya.mp4", type: "Video", size: "2.3 GB", duration: "31:05", status: "Ready", quality: ["1080p", "720p"], linked: "Versailles (Live) — Kaya Monroe", uploaded: "Sep 7, 2026" },
  { id: "MED-4415", name: "ironmeridian-poster.jpg", type: "Image", size: "1.2 MB", duration: "—", status: "Ready", quality: ["HD"], linked: "Iron Meridian", uploaded: "Sep 6, 2026" },
  { id: "MED-4414", name: "live-tropicfest-stream.m3u8", type: "Live Stream", size: "—", duration: "Live", status: "Configured", quality: ["1080p", "720p", "480p"], linked: "MGTV Spotlight: TropicFest", uploaded: "Sep 5, 2026" },
  { id: "MED-4413", name: "user-upload-8821.mp4", type: "Video", size: "340 MB", duration: "6:18", status: "Flagged", quality: [], linked: "User Upload #8821", uploaded: "Sep 12, 2026" },
  { id: "MED-4412", name: "mgtv-awards-backdrop.jpg", type: "Image", size: "5.1 MB", duration: "—", status: "Ready", quality: ["4K"], linked: "MGTV Awards 2026", uploaded: "Sep 3, 2026" },
]

const statusColors: Record<string, { color: string; bg: string }> = {
  Ready: { color: "#22c55e", bg: "#22c55e18" },
  Processing: { color: "#f59e0b", bg: "#f59e0b18" },
  Configured: { color: "#3b82f6", bg: "#3b82f618" },
  Flagged: { color: "#ef4444", bg: "#ef444418" },
}

const typeIcon: Record<string, string> = {
  Video: "▶",
  Image: "🖼",
  "Live Stream": "🔴",
}

function StatusBadge({ s }: { s: string }) {
  const c = statusColors[s] ?? { color: "#8b8f9a", bg: "#8b8f9a18" }
  return <span style={{ fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: c.color, background: c.bg, padding: "2px 7px", borderRadius: 4 }}>{s}</span>
}

export default function Media() {
  const [typeFilter, setTypeFilter] = useState("All")
  const types = ["All", "Video", "Image", "Live Stream"]

  const filtered = typeFilter === "All" ? mediaItems : mediaItems.filter((m) => m.type === typeFilter)

  return (
    <div style={{ padding: "28px" }}>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Assets", value: "2,841", sub: "Across all content" },
          { label: "Storage Used", value: "18.4 TB", sub: "of 50 TB allocated" },
          { label: "Processing", value: "3", sub: "Currently encoding" },
          { label: "Live Streams", value: "1", sub: "Configured & ready" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-sans)", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Storage bar */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>Storage Utilization</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>18.4 TB / 50 TB</span>
          </div>
          <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "36.8%", background: "var(--accent)", borderRadius: 3 }} />
          </div>
        </div>
        <button style={{ padding: "7px 16px", background: "var(--accent)", border: "none", borderRadius: 7, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Upload Media
        </button>
        <button style={{ padding: "7px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-secondary)", fontSize: 12.5, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
          Configure Live Stream
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {types.map((t) => {
          const active = typeFilter === t
          return (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent-dim)" : "transparent", color: active ? "var(--accent)" : "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-sans)", cursor: "pointer" }}>{t}</button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["", "File / Asset", "Type", "Size", "Duration", "Quality Versions", "Linked To", "Status", ""].map((h, i) => (
                <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
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
                <td style={{ padding: "11px 14px", fontSize: 16, width: 36 }}>{typeIcon[row.type] ?? "📄"}</td>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{row.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{row.id}</div>
                </td>
                <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{row.type}</td>
                <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{row.size}</td>
                <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{row.duration}</td>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {row.quality.map((q) => (
                      <span key={q} style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)", background: "var(--border)", padding: "1px 5px", borderRadius: 3 }}>{q}</span>
                    ))}
                    {row.quality.length === 0 && row.status === "Processing" && (
                      <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "#f59e0b" }}>Encoding…</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)", maxWidth: 180 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.linked}</div>
                </td>
                <td style={{ padding: "11px 14px" }}><StatusBadge s={row.status} /></td>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Replace</button>
                    <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "#ef4444", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Delete</button>
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
