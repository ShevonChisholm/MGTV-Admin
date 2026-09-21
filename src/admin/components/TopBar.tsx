export default function TopBar({ page: _page }: { page: string }) {
  return (
    <header
      style={{
        height: 52,
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 20px",
        background: "var(--sidebar)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        flexShrink: 0,
        gap: 10,
      }}
    >
      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 7,
          padding: "5px 12px",
          width: 200,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          placeholder="Search platform..."
          style={{
            background: "none",
            border: "none",
            outline: "none",
            fontSize: 12.5,
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
            width: "100%",
          }}
        />
      </div>

      {/* Notifications */}
      <button
        style={{
          width: 34,
          height: 34,
          borderRadius: 7,
          border: "1px solid var(--border)",
          background: "var(--card)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          position: "relative",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span
          style={{
            position: "absolute",
            top: 7,
            right: 7,
            width: 6,
            height: 6,
            background: "var(--accent)",
            borderRadius: "50%",
            border: "1.5px solid var(--sidebar)",
          }}
        />
      </button>
    </header>
  )
}
