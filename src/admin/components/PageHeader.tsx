interface PageHeaderProps {
  breadcrumb: string[]
  title: string
  description: string
}

export default function PageHeader({ breadcrumb, title, description }: PageHeaderProps) {
  return (
    <div
      style={{
        padding: "24px 28px 22px",
        borderBottom: "1px solid var(--border)",
        background: "var(--sidebar)",
        flexShrink: 0,
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
        {breadcrumb.map((crumb, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: i === breadcrumb.length - 1 ? "var(--accent)" : "var(--text-muted)",
                fontWeight: i === breadcrumb.length - 1 ? 500 : 400,
                letterSpacing: "0.02em",
              }}
            >
              {crumb}
            </span>
            {i < breadcrumb.length - 1 && (
              <span style={{ color: "var(--text-muted)", fontSize: 10 }}>›</span>
            )}
          </span>
        ))}
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "var(--font-sans)",
          letterSpacing: "-0.02em",
          margin: "0 0 6px",
        }}
      >
        {title}
      </h1>

      {/* Description */}
      <p
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          fontFamily: "var(--font-sans)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
    </div>
  )
}
