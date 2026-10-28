import { ContentGrid, ContentGridSkeleton } from "../components/ContentVisual";
import MediaIcon from "../components/MediaIcon";
import React, { useEffect, useState } from "react";
import { useRouter, Link } from "../router";
import { api } from "../api/client";
import { Card } from "../ui";
import ConnectedEditorial from "./ConnectedEditorial";
function Children({
  record,
  path,
  canWrite,
}: {
  record: any;
  path: string;
  canWrite: boolean;
}) {
  const child = record.kind === "show" ? "seasons" : "episodes";
  const [items, setItems] = useState<any[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void api(
      "/admin/" +
        (record.kind === "show" ? "shows" : "seasons") +
        "/" +
        record.id +
        "/" +
        child,
    )
      .then((page) => {
        if (active) setItems(page.items);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [record.id, record.version, revision]);
  return (
    <div style={{ marginTop: 24 }}>
      <Card title={child === "seasons" ? "Seasons & episodes" : "Episodes"}>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
          Publish each parent before its children. Hiding this parent also hides
          its published descendants. Numbers are unique within this parent and
          stay fixed.
        </p>
        {canWrite && (
          <Link className="btn btn-primary" to={path + "/" + child + "/new"}>
            <MediaIcon name="plus" size={16} /> Add{" "}
            {child === "seasons" ? "season" : "episode"}
          </Link>
        )}
        {loading && <ContentGridSkeleton />}
        {error && (
          <div role="alert">
            {error}{" "}
            <button className="btn" onClick={() => setRevision((x) => x + 1)}>
              Try again
            </button>
          </div>
        )}
        {!loading && !error && !items.length && (
          <p style={{ marginTop: 16 }}>No {child} yet.</p>
        )}
        {!loading && !error && !!items.length && (
          <ContentGrid
            items={items}
            entity={child}
            basePath={path + "/" + child}
          />
        )}
      </Card>
    </div>
  );
}
export default function ConnectedShows() {
  const { route } = useRouter();
  const p = route.parts;
  const entity =
    p[4] === "episodes" ? "episodes" : p[2] === "seasons" ? "seasons" : "shows";
  const id = entity === "episodes" ? p[5] : entity === "seasons" ? p[3] : p[1];
  const basePath =
    "/admin/content/shows" +
    (entity === "episodes"
      ? "/" + p[1] + "/seasons/" + p[3] + "/episodes"
      : entity === "seasons"
        ? "/" + p[1] + "/seasons"
        : "");
  const parent =
    entity === "episodes" ? p[3] : entity === "seasons" ? p[1] : undefined;
  // Child editors return to the existing parent rather than an unscoped child list.
  const returnPath =
    entity === "episodes"
      ? "/admin/content/shows/" + p[1] + "/seasons/" + p[3]
      : entity === "seasons"
        ? "/admin/content/shows/" + p[1]
        : "/admin/content/shows";
  return (
    <>
      <ConnectedEditorial
        key={entity + ":" + id}
        id={id}
        entity={entity}
        basePath={basePath}
        parentId={parent}
        listPath={returnPath}
        childrenFor={(record, canWrite) =>
          entity === "episodes" ? null : (
            <Children
              record={record}
              path={basePath + "/" + record.id}
              canWrite={canWrite}
            />
          )
        }
      />
      {entity !== "shows" && (
        <div className="page-pad">
          <Link className="btn" to={returnPath}>
            Back to {entity === "episodes" ? "season" : "show"}
          </Link>
        </div>
      )}
    </>
  );
}
