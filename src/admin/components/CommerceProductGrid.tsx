import { Link } from "../router";
import CommerceArtwork from "./CommerceArtwork";
const money = (n: number) =>
  new Intl.NumberFormat("en-JM", { style: "currency", currency: "JMD" }).format(
    n / 100,
  );
export default function CommerceProductGrid({ items }: { items: any[] }) {
  return (
    <section aria-label="Product gallery">
      <div
        style={{
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              color: "var(--accent)",
              letterSpacing: 2,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            THE MGTV COLLECTION
          </p>
          <h2 style={{ margin: "6px 0", fontSize: 24 }}>
            Products, brought into focus
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            Choose a product to explore its gallery, inventory and publication
            details.
          </p>
        </div>
        <span style={{ color: "var(--text-secondary)" }}>
          {items.length} products
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,240px),1fr))",
          gap: 20,
        }}
      >
        {items.map((p) => {
          const prices = p.options.map((o: any) => o.price_minor),
            available = p.options.reduce(
              (n: number, o: any) => n + o.available,
              0,
            );
          return (
            <Link
              key={p.id}
              to={"/admin/commerce/products/" + p.id}
              className="commerce-product-card"
            >
              <CommerceArtwork
                key={p.image_version_id}
                src={
                  p.image_version_id
                    ? `/api/v1/admin/commerce/products/${p.id}/cover`
                    : undefined
                }
                alt={p.name}
              />
              <div style={{ padding: 16, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  <span style={{ color: "var(--accent)" }}>{p.kind}</span>
                  <span
                    style={{
                      color:
                        p.status === "published"
                          ? "var(--green)"
                          : "var(--text-secondary)",
                    }}
                  >
                    ● {p.status}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    lineHeight: 1.4,
                    margin: "10px 0 6px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {p.name}
                </h3>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    margin: "0 0 16px",
                  }}
                >
                  {p.category}
                </p>
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <strong>
                    {prices.length
                      ? (Math.min(...prices) !== Math.max(...prices)
                          ? "From "
                          : "") + money(Math.min(...prices))
                      : "No price set"}
                  </strong>
                  <span aria-hidden="true" style={{ color: "var(--accent)" }}>
                    ↗
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    marginTop: 8,
                  }}
                >
                  {p.options.length}{" "}
                  {p.options.length === 1 ? "option" : "options"} · {available}{" "}
                  available
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      {!items.length && (
        <p>No products yet. Add the first product to build your collection.</p>
      )}
    </section>
  );
}
