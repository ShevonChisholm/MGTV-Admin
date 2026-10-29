import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Link, useRouter } from "../router";
import MediaIcon from "./MediaIcon";
export default function PartnershipLinks() {
  const { route } = useRouter();
  const p = route.parts;
  let kind = "",
    id = "";
  if (route.section === "commerce" && p[0] === "products") {
    kind = "product";
    id = p[1];
  }
  if (route.section === "content") {
    if (p[4] === "episodes") {
      kind = "episode";
      id = p[5];
    } else if (p[0] === "shows" && !p[2]) {
      kind = "show";
      id = p[1];
    } else if (p[0] === "movies") {
      kind = "movie";
      id = p[1];
    } else if (["music", "audio", "music-videos"].includes(p[0])) {
      kind = "music";
      id = p[1];
    }
  }
  if (
    ["events", "sponsors", "podcasts"].includes(route.section) &&
    p.length === 1
  ) {
    kind =
      route.section === "events"
        ? "event"
        : route.section === "sponsors"
          ? "sponsor"
          : "podcast";
    id = p[0];
  }
  if (
    route.section === "music-library" &&
    ["artists", "albums"].includes(p[0])
  ) {
    kind = p[0] === "artists" ? "artist" : "album";
    id = p[1];
  }
  if (route.section === "advertising" && p[0] === "advertisers") {
    kind = "advertiser";
    id = p[1];
  }
  const [items, setItems] = useState<any[] | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setItems(null);
    setError("");
    if (!kind || !id || id === "new") return;
    void (async () => {
      const session = await api("/admin/session");
      if (!session.permissions.includes("partnerships.read")) return;
      const result = await api(
        "/admin/partnerships/related/" + kind + "/" + id,
      );
      if (active) setItems(result.items);
    })().catch((e) => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
    };
  }, [kind, id]);
  if (items === null && !error) return null;
  return (
    <section className="page-pad" style={{ paddingTop: 0 }}>
      <div className="card" style={{ padding: 22, minWidth: 0 }}>
        <h3 style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <MediaIcon name="link" />
          Partner agreements
        </h3>
        {error ? (
          <p role="alert">{error}</p>
        ) : items?.length ? (
          items.map((item) => (
            <div
              key={item.id + item.relationship}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                padding: "14px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                {item.name} · {item.relationship} · {item.status}
              </span>
              <Link
                className="btn"
                to={"/admin/partnerships/agreements/" + item.id}
              >
                Review agreement
              </Link>
            </div>
          ))
        ) : (
          <p style={{ marginTop: 12, color: "var(--text-secondary)" }}>
            No partnership agreement is linked to this item.
          </p>
        )}
      </div>
    </section>
  );
}
