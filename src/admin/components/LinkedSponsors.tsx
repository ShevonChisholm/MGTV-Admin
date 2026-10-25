import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../ui";
import { Link } from "../router";
export function LinkedSponsors({
  kind,
  id,
}: {
  kind: "shows" | "events";
  id: string;
}) {
  const [items, setItems] = useState<any[]>([]),
    [allowed, setAllowed] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setItems([]);
    setError("");
    setAllowed(false);
    api("/admin/session")
      .then(async (s) => {
        if (
          !s.permissions.includes("sponsors.read") ||
          !s.permissions.includes(`${kind}.read`)
        )
          return;
        if (active) setAllowed(true);
        const p = await api("/admin/sponsors/associations/" + kind + "/" + id);
        if (active) setItems(p.items);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [kind, id]);
  if (!allowed) return null;
  return (
    <Card title="Sponsors">
      {error ? (
        <p role="alert">{error}</p>
      ) : items.length ? (
        <ul>
          {items.map((s) => (
            <li key={s.id}>
              <Link to={"/admin/sponsors/" + s.id + "/associations"}>
                {s.name}
              </Link>{" "}
              · {s.status} · {s.publicationStatus}
            </li>
          ))}
        </ul>
      ) : (
        <p>No sponsor associations saved in the current drafts.</p>
      )}
      <Link className="btn btn-sm" to="/admin/sponsors">
        Manage sponsors
      </Link>
      <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
        Customer pages show approved branding from published sponsor revisions
        only. Credits stay with their linked content, including featured placements and series episodes; they are visible to every tier and do not change ad policy.
      </p>
    </Card>
  );
}
