import React, { useState } from "react"

const tabs = [
  { id: "categories", label: "Categories" },
  { id: "genres", label: "Genres" },
  { id: "tags", label: "Tags" },
  { id: "ratings", label: "Age Ratings" },
  { id: "regions", label: "Regions & Languages" },
]

const categories = [
  { id: "CAT-01", name: "Shows", slug: "shows", items: 241, active: true },
  { id: "CAT-02", name: "Movies", slug: "movies", items: 88, active: true },
  { id: "CAT-03", name: "Music", slug: "music", items: 412, active: true },
  { id: "CAT-04", name: "Sports", slug: "sports", items: 156, active: true },
  { id: "CAT-05", name: "News", slug: "news", items: 834, active: true },
  { id: "CAT-06", name: "Lifestyle & Culture", slug: "lifestyle", items: 290, active: true },
  { id: "CAT-07", name: "MGTV+", slug: "mgtv-plus", items: 44, active: true },
  { id: "CAT-08", name: "Events", slug: "events", items: 38, active: true },
]

const genres = [
  { id: "GEN-01", name: "Drama", category: "Shows", items: 82 },
  { id: "GEN-02", name: "Action", category: "Shows/Movies", items: 66 },
  { id: "GEN-03", name: "Sci-Fi", category: "Shows/Movies", items: 44 },
  { id: "GEN-04", name: "Comedy", category: "Shows", items: 38 },
  { id: "GEN-05", name: "Documentary", category: "Movies/News", items: 52 },
  { id: "GEN-06", name: "Reality", category: "Shows", items: 29 },
  { id: "GEN-07", name: "Thriller", category: "Movies", items: 31 },
  { id: "GEN-08", name: "R&B", category: "Music", items: 114 },
  { id: "GEN-09", name: "Afrobeats", category: "Music", items: 98 },
  { id: "GEN-10", name: "Dancehall", category: "Music", items: 76 },
  { id: "GEN-11", name: "Soca", category: "Music", items: 61 },
  { id: "GEN-12", name: "Alternative", category: "Music", items: 43 },
  { id: "GEN-13", name: "Football", category: "Sports", items: 48 },
  { id: "GEN-14", name: "Cricket", category: "Sports", items: 34 },
]

const tags = [
  { id: "TAG-01", name: "Trending", uses: 94, type: "Automatic" },
  { id: "TAG-02", name: "New Release", uses: 62, type: "Manual" },
  { id: "TAG-03", name: "MGTV Exclusive", uses: 44, type: "Manual" },
  { id: "TAG-04", name: "Award Nominee", uses: 28, type: "Manual" },
  { id: "TAG-05", name: "Live Now", uses: 3, type: "Automatic" },
  { id: "TAG-06", name: "Family Friendly", uses: 118, type: "Manual" },
  { id: "TAG-07", name: "Regional Pick", uses: 56, type: "Manual" },
  { id: "TAG-08", name: "Staff Pick", uses: 22, type: "Manual" },
]

const ratings = [
  { code: "G", label: "General — All audiences", color: "#22c55e", items: 312 },
  { code: "PG", label: "Parental Guidance suggested", color: "#3b82f6", items: 488 },
  { code: "PG-13", label: "Parents cautioned — under 13", color: "#f59e0b", items: 274 },
  { code: "R", label: "Restricted — under 17 requires adult", color: "#C9A84C", items: 119 },
  { code: "NR", label: "Not Rated / Pending review", color: "#8b8f9a", items: 38 },
]

const regions = [
  { name: "Jamaica", code: "JM", language: "English", items: 1240, active: true },
  { name: "Trinidad & Tobago", code: "TT", language: "English", items: 890, active: true },
  { name: "Barbados", code: "BB", language: "English", items: 641, active: true },
  { name: "Guyana", code: "GY", language: "English", items: 510, active: true },
  { name: "Saint Lucia", code: "LC", language: "English/French Creole", items: 420, active: true },
  { name: "Antigua & Barbuda", code: "AG", language: "English", items: 310, active: true },
  { name: "Dominica", code: "DM", language: "English/French Creole", items: 280, active: false },
  { name: "Grenada", code: "GD", language: "English", items: 260, active: true },
]

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} style={{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", background: on ? "var(--accent)" : "var(--border)", position: "relative", transition: "background 0.2s" }}>
    <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
  </button>
)

const TH = ({ children }: { children: React.ReactNode }) => <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{children}</th>

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table>
    </div>
  )
}

function CategoriesTab() {
  const [cats, setCats] = useState(categories)
  const toggle = (id: string) => setCats((p) => p.map((c) => c.id === id ? { ...c, active: !c.active } : c))
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button style={{ padding: "6px 14px", background: "var(--accent)", border: "none", borderRadius: 7, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>+ Add Category</button>
      </div>
      <TableWrapper>
        <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><TH>Category</TH><TH>Slug</TH><TH>Items</TH><TH>Active</TH><TH></TH></tr></thead>
        <tbody>
          {cats.map((c, i) => (
            <tr key={c.id} style={{ borderBottom: i < cats.length - 1 ? "1px solid var(--border)" : "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{c.name}</td>
              <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>/{c.slug}</td>
              <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{c.items}</td>
              <td style={{ padding: "11px 14px" }}><Toggle on={c.active} onToggle={() => toggle(c.id)} /></td>
              <td style={{ padding: "11px 14px" }}><button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </>
  )
}

function GenresTab() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button style={{ padding: "6px 14px", background: "var(--accent)", border: "none", borderRadius: 7, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>+ Add Genre</button>
      </div>
      <TableWrapper>
        <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><TH>Genre</TH><TH>Applies To</TH><TH>Content Items</TH><TH></TH></tr></thead>
        <tbody>
          {genres.map((g, i) => (
            <tr key={g.id} style={{ borderBottom: i < genres.length - 1 ? "1px solid var(--border)" : "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{g.name}</td>
              <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{g.category}</td>
              <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{g.items}</td>
              <td style={{ padding: "11px 14px" }}><button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </>
  )
}

function TagsTab() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button style={{ padding: "6px 14px", background: "var(--accent)", border: "none", borderRadius: 7, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>+ Add Tag</button>
      </div>
      <TableWrapper>
        <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><TH>Tag</TH><TH>Type</TH><TH>Content Uses</TH><TH></TH></tr></thead>
        <tbody>
          {tags.map((t, i) => (
            <tr key={t.id} style={{ borderBottom: i < tags.length - 1 ? "1px solid var(--border)" : "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
                <span style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent)30", borderRadius: 12, padding: "2px 10px", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-sans)" }}>#{t.name}</span>
              </td>
              <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
                <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: t.type === "Automatic" ? "#3b82f6" : "#a855f7", background: t.type === "Automatic" ? "#3b82f618" : "#a855f718", padding: "2px 6px", borderRadius: 3 }}>{t.type}</span>
              </td>
              <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{t.uses}</td>
              <td style={{ padding: "11px 14px" }}><button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </>
  )
}

function RatingsTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {ratings.map((r) => (
        <div key={r.code} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: r.color + "20", border: `2px solid ${r.color}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: r.color, fontFamily: "var(--font-sans)" }}>{r.code}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{r.label}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{r.items} content items</div>
          </div>
          <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 14px", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Configure</button>
        </div>
      ))}
    </div>
  )
}

function RegionsTab() {
  const [regs, setRegs] = useState(regions)
  const toggle = (code: string) => setRegs((p) => p.map((r) => r.code === code ? { ...r, active: !r.active } : r))
  return (
    <TableWrapper>
      <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><TH>Region</TH><TH>Code</TH><TH>Language(s)</TH><TH>Content Items</TH><TH>Active</TH></tr></thead>
      <tbody>
        {regs.map((r, i) => (
          <tr key={r.code} style={{ borderBottom: i < regs.length - 1 ? "1px solid var(--border)" : "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{r.name}</td>
            <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{r.code}</td>
            <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{r.language}</td>
            <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{r.items.toLocaleString()}</td>
            <td style={{ padding: "11px 14px" }}><Toggle on={r.active} onToggle={() => toggle(r.code)} /></td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  )
}

const tabContent: Record<string, React.ReactNode> = {
  categories: <CategoriesTab />,
  genres: <GenresTab />,
  tags: <TagsTab />,
  ratings: <RatingsTab />,
  regions: <RegionsTab />,
}

export default function Discovery() {
  const [active, setActive] = useState("categories")
  return (
    <div style={{ padding: "28px" }}>
      <div style={{ display: "flex", gap: 2, marginBottom: 22, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {tabs.map((t) => {
          const isActive = active === t.id
          return (
            <button key={t.id} onClick={() => setActive(t.id)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", background: isActive ? "var(--accent)" : "transparent", color: isActive ? "white" : "var(--text-secondary)", fontSize: 12.5, fontWeight: isActive ? 600 : 500, fontFamily: "var(--font-sans)", transition: "all 0.15s" }}>{t.label}</button>
          )
        })}
      </div>
      {tabContent[active]}
    </div>
  )
}
