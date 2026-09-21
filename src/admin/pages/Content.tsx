import React, { useState } from "react"

const tabs = [
  { id: "shows", label: "Shows" },
  { id: "movies", label: "Movies" },
  { id: "music", label: "Music" },
  { id: "sports", label: "Sports" },
  { id: "news", label: "News" },
  { id: "lifestyle", label: "Lifestyle & Culture" },
]

// ── Shows ──────────────────────────────────────────────────────────────────────
const shows = [
  { id: "SHW-0881", title: "The Last Protocol", seasons: 2, episodes: 18, status: "Published", genre: "Drama", views: "4.2M", thumb: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=56&h=36&fit=crop&auto=format" },
  { id: "SHW-0880", title: "Echoes of Tomorrow", seasons: 1, episodes: 12, status: "Published", genre: "Sci-Fi", views: "3.8M", thumb: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=56&h=36&fit=crop&auto=format" },
  { id: "SHW-0879", title: "Iron Meridian", seasons: 1, episodes: 6, status: "Published", genre: "Action", views: "2.9M", thumb: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=56&h=36&fit=crop&auto=format" },
  { id: "SHW-0878", title: "Laugh Track Nation", seasons: 1, episodes: 3, status: "Draft", genre: "Comedy", views: "—", thumb: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=56&h=36&fit=crop&auto=format" },
  { id: "SHW-0877", title: "Wildcard Arena", seasons: 3, episodes: 30, status: "Scheduled", genre: "Reality", views: "—", thumb: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=56&h=36&fit=crop&auto=format" },
  { id: "SHW-0876", title: "Blood & Chrome", seasons: 2, episodes: 14, status: "Published", genre: "Action", views: "5.1M", thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=56&h=36&fit=crop&auto=format" },
]

// ── Movies ────────────────────────────────────────────────────────────────────
const movies = [
  { id: "MOV-0210", title: "Sunfall", genre: "Drama", duration: "1h 54m", status: "Published", rating: "PG-13", views: "2.1M", thumb: "https://images.unsplash.com/photo-1512070679279-8988d32161be?w=56&h=36&fit=crop&auto=format" },
  { id: "MOV-0209", title: "Project Horizon", genre: "Sci-Fi", duration: "2h 08m", status: "Published", rating: "PG", views: "3.4M", thumb: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=56&h=36&fit=crop&auto=format" },
  { id: "MOV-0208", title: "Ricochet", genre: "Action", duration: "1h 40m", status: "Draft", rating: "R", views: "—", thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=56&h=36&fit=crop&auto=format" },
  { id: "MOV-0207", title: "The Cartographers", genre: "Documentary", duration: "1h 22m", status: "Published", rating: "G", views: "980K", thumb: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=56&h=36&fit=crop&auto=format" },
  { id: "MOV-0206", title: "Neon Requiem", genre: "Thriller", duration: "1h 58m", status: "Scheduled", rating: "R", views: "—", thumb: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=56&h=36&fit=crop&auto=format" },
]

// ── Music ─────────────────────────────────────────────────────────────────────
const music = [
  { id: "MUS-0541", title: "Versailles (Live)", artist: "Kaya Monroe", type: "Live Performance", genre: "R&B", status: "Published", plays: "1.8M" },
  { id: "MUS-0540", title: "Street Gospel Vol. 3", artist: "DJ Orion", type: "Music Video", genre: "Afrobeats", status: "Published", plays: "2.4M" },
  { id: "MUS-0539", title: "Coastal Sessions EP", artist: "Indigo & The Wave", type: "Album", genre: "Soul", status: "Draft", plays: "—" },
  { id: "MUS-0538", title: "MGTV Spotlight: TropicFest", artist: "Various", type: "Live Performance", genre: "Dancehall", status: "Scheduled", plays: "—" },
  { id: "MUS-0537", title: "Midnight Revival", artist: "Lantern & Stone", type: "Music Video", genre: "Alternative", status: "Published", plays: "940K" },
]

// ── Sports ────────────────────────────────────────────────────────────────────
const sports = [
  { id: "SPT-0312", title: "Caribbean Cup Highlights — Matchday 7", sport: "Football", type: "Highlight", status: "Published", date: "Sep 11, 2026", views: "3.2M" },
  { id: "SPT-0311", title: "Track & Field National Championships", sport: "Athletics", type: "Live Event", status: "Scheduled", date: "Sep 18, 2026", views: "—" },
  { id: "SPT-0310", title: "Cricket: Islands Series R2", sport: "Cricket", type: "Live Event", status: "Published", date: "Sep 9, 2026", views: "1.9M" },
  { id: "SPT-0309", title: "Youth Basketball MGTV Cup — Finals", sport: "Basketball", type: "Full Event", status: "Published", date: "Sep 5, 2026", views: "870K" },
  { id: "SPT-0308", title: "Boxing Night: Hernandez vs. Cole", sport: "Boxing", type: "Full Event", status: "Draft", date: "Sep 25, 2026", views: "—" },
]

// ── News ──────────────────────────────────────────────────────────────────────
const news = [
  { id: "NWS-1882", title: "Caribbean Economy Surges Q3 2026", category: "Business/Economy", author: "Devon Walsh", status: "Published", date: "Sep 12, 2026", reads: "48K" },
  { id: "NWS-1881", title: "Regional Tourism Record Broken", category: "Tourism", author: "Priya Nair", status: "Published", date: "Sep 11, 2026", reads: "31K" },
  { id: "NWS-1880", title: "Environmental Summit — Full Coverage", category: "Environment", author: "Sam Tran", status: "Published", date: "Sep 10, 2026", reads: "22K" },
  { id: "NWS-1879", title: "Entertainment Awards Preview", category: "Entertainment", author: "Aisha Okonkwo", status: "Draft", date: "Sep 14, 2026", reads: "—" },
  { id: "NWS-1878", title: "Infrastructure Development Update", category: "Development", author: "Marcus Chen", status: "Published", date: "Sep 8, 2026", reads: "17K" },
]

// ── Lifestyle ─────────────────────────────────────────────────────────────────
const lifestyle = [
  { id: "LST-0290", title: "Island Fashion Week Recap", category: "Fashion & Beauty", author: "Cleo Fontaine", status: "Published", date: "Sep 11, 2026", reads: "62K" },
  { id: "LST-0289", title: "Healthy Living with Chef Ramos", category: "Food & Recipes", author: "Felix Huang", status: "Published", date: "Sep 9, 2026", reads: "41K" },
  { id: "LST-0288", title: "Mental Wellness in the Digital Age", category: "Health & Wellness", author: "Nina Bergstrom", status: "Draft", date: "Sep 15, 2026", reads: "—" },
  { id: "LST-0287", title: "Cultural Heritage: The Maroon Legacy", category: "Culture", author: "Omar Saleh", status: "Published", date: "Sep 7, 2026", reads: "28K" },
  { id: "LST-0286", title: "Creative Entrepreneurship Masterclass", category: "Classes", author: "Raj Patel", status: "Scheduled", date: "Sep 20, 2026", reads: "—" },
]

const statusColors: Record<string, string> = { Published: "#22c55e", Draft: "#8b8f9a", Scheduled: "#3b82f6", Review: "#f59e0b" }

function Badge({ s }: { s: string }) {
  const c = statusColors[s] ?? "#8b8f9a"
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: c, background: c + "18", padding: "2px 7px", borderRadius: 4, border: `1px solid ${c}30` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c }} />{s}
    </span>
  )
}

function ActionBtns() {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "var(--text-secondary)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Edit</button>
      <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 9px", color: "#ef4444", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Remove</button>
    </div>
  )
}

const TH = ({ children }: { children: React.ReactNode }) => (
  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{children}</th>
)

function TR({ children }: { children: React.ReactNode }) {
  return (
    <tr
      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >{children}</tr>
  )
}

const TD = ({ children, mono }: { children: React.ReactNode; mono?: boolean }) => (
  <td style={{ padding: "11px 14px", fontSize: 12.5, color: "var(--text-secondary)", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", verticalAlign: "middle" }}>{children}</td>
)

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table>
    </div>
  )
}

function AddBtn({ label }: { label: string }) {
  return (
    <button style={{ marginLeft: "auto", padding: "6px 14px", background: "var(--accent)", border: "none", borderRadius: 7, color: "white", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      {label}
    </button>
  )
}

function ShowsTab() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><AddBtn label="Add Show" /></div>
      <Table>
        <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><TH>Show</TH><TH>Seasons</TH><TH>Episodes</TH><TH>Genre</TH><TH>Status</TH><TH>Views</TH><TH></TH></tr></thead>
        <tbody>
          {shows.map((r) => (
            <TR key={r.id}>
              <TD>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={r.thumb} alt={r.title} style={{ width: 52, height: 33, borderRadius: 4, objectFit: "cover", background: "var(--border)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{r.title}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{r.id}</div>
                  </div>
                </div>
              </TD>
              <TD mono>{r.seasons}</TD>
              <TD mono>{r.episodes}</TD>
              <TD>{r.genre}</TD>
              <TD><Badge s={r.status} /></TD>
              <TD mono>{r.views}</TD>
              <TD><ActionBtns /></TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </>
  )
}

function MoviesTab() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><AddBtn label="Add Movie" /></div>
      <Table>
        <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><TH>Movie</TH><TH>Genre</TH><TH>Duration</TH><TH>Rating</TH><TH>Status</TH><TH>Views</TH><TH></TH></tr></thead>
        <tbody>
          {movies.map((r) => (
            <TR key={r.id}>
              <TD>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={r.thumb} alt={r.title} style={{ width: 52, height: 33, borderRadius: 4, objectFit: "cover", background: "var(--border)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{r.title}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{r.id}</div>
                  </div>
                </div>
              </TD>
              <TD>{r.genre}</TD>
              <TD mono>{r.duration}</TD>
              <TD><span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--text-muted)", background: "var(--border)", padding: "2px 6px", borderRadius: 3 }}>{r.rating}</span></TD>
              <TD><Badge s={r.status} /></TD>
              <TD mono>{r.views}</TD>
              <TD><ActionBtns /></TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </>
  )
}

function MusicTab() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><AddBtn label="Add Music" /></div>
      <Table>
        <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><TH>Title</TH><TH>Artist</TH><TH>Type</TH><TH>Genre</TH><TH>Status</TH><TH>Plays</TH><TH></TH></tr></thead>
        <tbody>
          {music.map((r) => (
            <TR key={r.id}>
              <TD>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{r.title}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{r.id}</div>
              </TD>
              <TD>{r.artist}</TD>
              <TD><span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--blue)", background: "#3b82f618", padding: "2px 6px", borderRadius: 3 }}>{r.type}</span></TD>
              <TD>{r.genre}</TD>
              <TD><Badge s={r.status} /></TD>
              <TD mono>{r.plays}</TD>
              <TD><ActionBtns /></TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </>
  )
}

function SportsTab() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><AddBtn label="Add Sports Content" /></div>
      <Table>
        <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><TH>Title</TH><TH>Sport</TH><TH>Type</TH><TH>Date</TH><TH>Status</TH><TH>Views</TH><TH></TH></tr></thead>
        <tbody>
          {sports.map((r) => (
            <TR key={r.id}>
              <TD>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{r.title}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{r.id}</div>
              </TD>
              <TD>{r.sport}</TD>
              <TD><span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "#f59e0b", background: "#f59e0b18", padding: "2px 6px", borderRadius: 3 }}>{r.type}</span></TD>
              <TD mono>{r.date}</TD>
              <TD><Badge s={r.status} /></TD>
              <TD mono>{r.views}</TD>
              <TD><ActionBtns /></TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </>
  )
}

function NewsTab() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><AddBtn label="Add Article" /></div>
      <Table>
        <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><TH>Title</TH><TH>Category</TH><TH>Author</TH><TH>Date</TH><TH>Status</TH><TH>Reads</TH><TH></TH></tr></thead>
        <tbody>
          {news.map((r) => (
            <TR key={r.id}>
              <TD>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{r.title}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{r.id}</div>
              </TD>
              <TD>{r.category}</TD>
              <TD>{r.author}</TD>
              <TD mono>{r.date}</TD>
              <TD><Badge s={r.status} /></TD>
              <TD mono>{r.reads}</TD>
              <TD><ActionBtns /></TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </>
  )
}

function LifestyleTab() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><AddBtn label="Add Story" /></div>
      <Table>
        <thead><tr style={{ borderBottom: "1px solid var(--border)" }}><TH>Title</TH><TH>Category</TH><TH>Author</TH><TH>Date</TH><TH>Status</TH><TH>Reads</TH><TH></TH></tr></thead>
        <tbody>
          {lifestyle.map((r) => (
            <TR key={r.id}>
              <TD>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{r.title}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{r.id}</div>
              </TD>
              <TD>{r.category}</TD>
              <TD>{r.author}</TD>
              <TD mono>{r.date}</TD>
              <TD><Badge s={r.status} /></TD>
              <TD mono>{r.reads}</TD>
              <TD><ActionBtns /></TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </>
  )
}

const tabComponents: Record<string, React.ReactNode> = {
  shows: <ShowsTab />,
  movies: <MoviesTab />,
  music: <MusicTab />,
  sports: <SportsTab />,
  news: <NewsTab />,
  lifestyle: <LifestyleTab />,
}

export default function Content() {
  const [activeTab, setActiveTab] = useState("shows")

  return (
    <div style={{ padding: "28px" }}>
      <div style={{ display: "flex", gap: 2, marginBottom: 22, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {tabs.map((t) => {
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                background: active ? "var(--accent)" : "transparent",
                color: active ? "white" : "var(--text-secondary)",
                fontSize: 12.5, fontWeight: active ? 600 : 500,
                fontFamily: "var(--font-sans)", transition: "all 0.15s",
              }}
            >{t.label}</button>
          )
        })}
      </div>
      {tabComponents[activeTab]}
    </div>
  )
}
