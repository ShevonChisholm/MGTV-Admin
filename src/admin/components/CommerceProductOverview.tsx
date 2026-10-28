import { useState } from "react";
import CommerceArtwork from "./CommerceArtwork";
export default function CommerceProductOverview({
  product: p,
}: {
  product: any;
}) {
  const images = [
    {
      url: p.image_version_id
        ? `/api/v1/admin/commerce/products/${p.id}/cover`
        : undefined,
      label: "Front / cover",
      alt: p.name,
    },
    ...(p.gallery ?? []),
  ];
  const [index, setIndex] = useState(0);
  const current = images[Math.min(index, images.length - 1)];
  return (
    <section
      className="commerce-product-overview"
      aria-label="Product overview"
    >
      <div style={{ minWidth: 0 }}>
        <CommerceArtwork
          key={current.url}
          src={current.url}
          alt={current.alt}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            marginTop: 12,
          }}
        >
          <button
            className="btn btn-secondary btn-sm"
            aria-label="Previous product image"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            ←
          </button>
          <span
            aria-live="polite"
            style={{ color: "var(--text-secondary)", fontSize: 12 }}
          >
            {index + 1} / {images.length} · {current.label}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            aria-label="Next product image"
            disabled={index === images.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            →
          </button>
        </div>
        <div
          style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}
        >
          {images.map((image, i) => (
            <button
              key={image.url ?? i}
              type="button"
              aria-label={"Show " + image.label}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
              style={{
                width: 66,
                padding: 3,
                border:
                  "1px solid " +
                  (index === i ? "var(--accent)" : "var(--border)"),
                borderRadius: 8,
                background: "var(--card)",
                cursor: "pointer",
              }}
            >
              <CommerceArtwork key={image.url} src={image.url} alt="" />
            </button>
          ))}
        </div>
      </div>
      <div style={{ minWidth: 0, alignSelf: "center" }}>
        <p
          style={{
            color: "var(--accent)",
            letterSpacing: 2,
            fontSize: 11,
            textTransform: "uppercase",
          }}
        >
          {p.kind} · {p.category}
        </p>
        <h2
          style={{
            fontSize: "clamp(24px,3vw,38px)",
            lineHeight: 1.15,
            margin: "14px 0",
            overflowWrap: "anywhere",
          }}
        >
          {p.name}
        </h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
          {p.description}
        </p>
        <div
          style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}
        >
          {[
            ["Publication", p.status],
            ["Variants / slots", p.options.length],
            [
              "Available",
              p.options.reduce((n: number, o: any) => n + o.available, 0),
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "12px 16px",
                minWidth: 110,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  margin: "0 0 6px",
                }}
              >
                {label}
              </p>
              <strong style={{ fontSize: 17, textTransform: "capitalize" }}>
                {value}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
