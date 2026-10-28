import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { Link, useRouter } from "../router";
import CaptionManager, { ReviewVideo } from "./CaptionManager";
import LoadingState, { ErrorState } from "./LoadingState";
import MediaIcon from "./MediaIcon";
import "./MediaLibraryView.css";
export type LibraryItem = {
  id: string;
  versionId: string;
  filename: string;
  kind: string;
  state: string;
  byteSize: number;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  version?: number;
  usageCount?: number;
  thumbnailUrl?: string | null;
};
const size = (n: number) =>
  n < 1048576
    ? (n / 1024).toFixed(0) + " KB"
    : (n / 1048576).toFixed(1) + " MB";
const duration = (n: number | null) =>
  n == null
    ? "—"
    : Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0");
function IconButton({
  name,
  label,
  onClick,
  disabled = false,
}: {
  name: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="ml-icon-button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <MediaIcon name={name} />
    </button>
  );
}
function Artwork({ item }: { item: LibraryItem }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.id, item.thumbnailUrl]);
  return (
    <div className={"ml-art ml-art--" + item.kind}>
      {item.thumbnailUrl && !failed ? (
        <img
          src={item.thumbnailUrl}
          alt=""
          loading="lazy"
          referrerPolicy="same-origin"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="ml-art-fallback">
          <MediaIcon name={item.kind} size={44} />
          <span>
            {item.kind === "audio"
              ? "Audio track"
              : failed
                ? "Preview unavailable"
                : item.kind === "video"
                  ? "Video file"
                  : "Image file"}
          </span>
        </div>
      )}
      <span className={"ml-status ml-status--" + item.state}>
        <MediaIcon
          name={
            item.state === "ready"
              ? "check"
              : item.state === "failed"
                ? "alert"
                : "clock"
          }
          size={13}
        />
        {item.state.replace(/_/g, " ")}
      </span>
      <span className="ml-type" title={item.kind}>
        <MediaIcon name={item.kind} size={18} />
        <span className="ml-sr-only">{item.kind}</span>
      </span>
    </div>
  );
}
export function MediaLibraryGrid({
  kind,
  onSelect,
}: {
  kind?: string;
  onSelect?: (item: LibraryItem) => void;
}) {
  const [q, setQ] = useState(""),
    [query, setQuery] = useState(""),
    [type, setType] = useState(kind ?? ""),
    [state, setState] = useState(""),
    [limit, setLimit] = useState(24),
    [history, setHistory] = useState<(string | null)[]>([null]),
    [page, setPage] = useState(0),
    [items, setItems] = useState<LibraryItem[]>([]),
    [next, setNext] = useState<string | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    setType(kind ?? "");
    setPage(0);
    setHistory([null]);
  }, [kind]);
  useEffect(() => {
    const serial = ++generation.current;
    setBusy(true);
    setError("");
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      ...(type ? { kind: type } : {}),
      ...((onSelect ? "ready" : state)
        ? { state: onSelect ? "ready" : state }
        : {}),
      ...(history[page] ? { cursor: history[page]! } : {}),
    });
    api("/admin/media?" + params)
      .then((p) => {
        if (serial === generation.current) {
          setItems(p.items);
          setNext(p.nextCursor);
        }
      })
      .catch((e) => {
        if (serial === generation.current) setError(e.message);
      })
      .finally(() => {
        if (serial === generation.current) setBusy(false);
      });
    return () => {
      generation.current++;
    };
  }, [query, type, state, limit, page, revision, !!onSelect]);
  function reset() {
    setPage(0);
    setHistory([null]);
  }
  return (
    <section
      className="ml-library"
      aria-label={onSelect ? "Choose a media file" : "Media library files"}
    >
      <form
        className="ml-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          reset();
          setQuery(q.trim());
          setRevision((v) => v + 1);
        }}
      >
        <label className="ml-search">
          <span className="ml-sr-only">Search file names</span>
          <MediaIcon name="search" />
          <input
            className="input"
            placeholder="Find a file…"
            aria-label="Search file names"
            value={q}
            maxLength={200}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          Search
        </button>
        <label>
          <span className="ml-sr-only">Media type</span>
          <select
            className="input"
            aria-label="Media type"
            value={type}
            disabled={!!kind}
            onChange={(e) => {
              reset();
              setType(e.target.value);
            }}
          >
            <option value="">All media</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
          </select>
        </label>
        {!onSelect && (
          <label>
            <span className="ml-sr-only">Processing status</span>
            <select
              className="input"
              aria-label="Processing status"
              value={state}
              onChange={(e) => {
                reset();
                setState(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              <option value="ready">Ready</option>
              <option value="processing">Processing</option>
              <option value="pending_upload">Awaiting upload</option>
              <option value="uploaded">Uploaded</option>
              <option value="failed">Failed</option>
            </select>
          </label>
        )}
        <IconButton
          name="refresh"
          label="Refresh media library"
          onClick={() => setRevision((v) => v + 1)}
          disabled={busy}
        />
      </form>
      <div className="ml-result-bar">
        <span>
          <MediaIcon name="grid" size={16} />
          {busy ? "Loading files…" : items.length + " files on this page"}
        </span>
        <small>
          {onSelect
            ? "Choose a ready file. Saving the entity attaches it."
            : "Reference counts include saved historical revisions."}
        </small>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={() => setRevision((v) => v + 1)} />
      ) : busy ? (
        <div className="ml-grid" aria-label="Loading media files">
          {Array.from({ length: Math.min(limit, 8) }, (_, i) => (
            <div className="ml-card ml-skeleton" key={i}>
              <div className="ml-art" />
              <div style={{ height: 120 }} />
            </div>
          ))}
        </div>
      ) : !items.length ? (
        <div className="ml-empty">
          <MediaIcon name="search" size={36} />
          <h2>No files in this view</h2>
          <p>Try another file name, media type or processing status.</p>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setQ("");
              setQuery("");
              setType(kind ?? "");
              setState("");
              reset();
              setRevision((v) => v + 1);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="ml-grid">
          {items.map((item) => (
            <li key={item.id} className="ml-card">
              {onSelect ? (
                <button
                  className="ml-card-target"
                  type="button"
                  onClick={() => onSelect(item)}
                  aria-label={"Use " + item.filename}
                >
                  <Artwork item={item} />
                  <div className="ml-card-body">
                    <h3>{item.filename}</h3>
                    <div className="ml-card-meta">
                      <span>{size(item.byteSize)}</span>
                      <span>
                        {item.kind === "image"
                          ? `${item.width ?? "—"} × ${item.height ?? "—"}`
                          : duration(item.durationSeconds)}
                      </span>
                    </div>
                    <span className="ml-card-open">
                      Use file <MediaIcon name="check" size={16} />
                    </span>
                  </div>
                </button>
              ) : (
                <Link
                  className="ml-card-target"
                  to={"/admin/media/" + item.id}
                  aria-label={"Open " + item.filename}
                >
                  <Artwork item={item} />
                  <div className="ml-card-body">
                    <h3>{item.filename}</h3>
                    <div className="ml-card-meta">
                      <span>{size(item.byteSize)}</span>
                      <span>
                        {item.kind === "image"
                          ? `${item.width ?? "—"} × ${item.height ?? "—"}`
                          : duration(item.durationSeconds)}
                      </span>
                    </div>
                    <div className="ml-card-bottom">
                      <span
                        className="ml-count"
                        title="Saved references, including historical revisions"
                        aria-label={
                          typeof item.usageCount === "number"
                            ? `${item.usageCount} saved references including historical revisions`
                            : "Reference count unavailable"
                        }
                      >
                        <MediaIcon name="link" size={18} />
                        <strong>{item.usageCount ?? "—"}</strong>
                      </span>
                      <span className="ml-card-open">
                        <span className="ml-sr-only">Open asset</span>
                        <MediaIcon name="arrow" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="ml-pagination">
        <label>
          Files per page{" "}
          <select
            aria-label="Files per page"
            className="input"
            value={limit}
            onChange={(e) => {
              reset();
              setLimit(Number(e.target.value));
            }}
          >
            {[12, 24, 48].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <nav aria-label="Media library pagination">
          <IconButton
            name="back"
            label="Previous media page"
            disabled={busy || page === 0}
            onClick={() => setPage((v) => v - 1)}
          />
          <span aria-live="polite">Page {page + 1}</span>
          <IconButton
            name="arrow"
            label="Next media page"
            disabled={busy || !next || !!error}
            onClick={() => {
              setHistory((v) => [...v.slice(0, page + 1), next]);
              setPage((v) => v + 1);
            }}
          />
        </nav>
      </div>
    </section>
  );
}
export function MediaAssetDetail({ id }: { id: string }) {
  const [item, setItem] = useState<LibraryItem | null>(null),
    [usage, setUsage] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [retained, setRetained] = useState(false),
    [error, setError] = useState(""),
    [usageError, setUsageError] = useState(""),
    [revision, setRevision] = useState(0),
    [loadingMore, setLoadingMore] = useState(false),
    [usageLoading, setUsageLoading] = useState(true),
    [tab, setTab] = useState("overview");
  const generation = useRef(0);
  useEffect(() => {
    const serial = ++generation.current;
    setItem(null);
    setError("");
    setUsageError("");
    setUsage([]);
    setUsageLoading(true);
    setCursor(null);
    setRetained(false);
    setTab("overview");
    api("/admin/media/" + id)
      .then((p) => {
        if (serial === generation.current)
          setItem({
            ...p,
            ...p.versions[0],
            id: p.id,
            versionId: p.versions[0].id,
            filename: p.filename,
          });
      })
      .catch((e) => {
        if (serial === generation.current) setError(e.message);
      });
    api(`/admin/media/${id}/usage?limit=24`)
      .then((p) => {
        if (serial === generation.current) {
          setUsage(p.items);
          setCursor(p.nextCursor);
          setRetained(p.brandingRetained);
        }
      })
      .catch((e) => {
        if (serial === generation.current) setUsageError(e.message);
      })
      .finally(() => {
        if (serial === generation.current) setUsageLoading(false);
      });
    return () => {
      generation.current++;
    };
  }, [id, revision]);
  async function more() {
    const serial = generation.current;
    setLoadingMore(true);
    setUsageError("");
    try {
      const p = await api(
        `/admin/media/${id}/usage?` +
          new URLSearchParams({ cursor: cursor!, limit: "24" }),
      );
      if (serial === generation.current) {
        setUsage((v) => [...v, ...p.items]);
        setCursor(p.nextCursor);
      }
    } catch (e) {
      if (serial === generation.current)
        setUsageError(
          e instanceof Error ? e.message : "Unable to load references.",
        );
    } finally {
      if (serial === generation.current) setLoadingMore(false);
    }
  }
  if (error)
    return (
      <div className="page-pad">
        <Link className="btn" to="/admin/media">
          Back to library
        </Link>
        <ErrorState message={error} onRetry={() => setRevision((v) => v + 1)} />
      </div>
    );
  if (!item)
    return (
      <div className="page-pad">
        <LoadingState label="Loading media details…" variant="form" />
      </div>
    );
  return (
    <div className="page-pad ml-detail">
      <div className="ml-detail-heading">
        <Link className="btn btn-sm" to="/admin/media">
          <MediaIcon name="back" />
          Library
        </Link>
        <IconButton
          name="refresh"
          label="Refresh asset details"
          onClick={() => setRevision((v) => v + 1)}
        />
      </div>
      <div className="ml-detail-grid">
        <section className="ml-preview">
          <div className="ml-detail-title">
            <MediaIcon name={item.kind} />
            <span>
              {item.kind} · {item.state.replace(/_/g, " ")}
            </span>
          </div>
          {item.state !== "ready" ? (
            <div className="ml-empty">
              <MediaIcon
                name={item.state === "failed" ? "alert" : "clock"}
                size={44}
              />
              <h2>
                {item.state === "failed"
                  ? "This file needs attention"
                  : "Your file is getting ready"}
              </h2>
              <p>
                {item.state === "failed"
                  ? "The upload or processing failed. Upload a replacement from its entity editor."
                  : "Refresh to check processing. Pending files cannot be attached as ready media."}
              </p>
            </div>
          ) : item.kind === "video" ? (
            <ReviewVideo key={id} mediaId={id} text="" />
          ) : item.kind === "image" ? (
            <img
              className="ml-detail-image"
              src={item.thumbnailUrl ?? `/api/v1/admin/media/${id}/preview`}
              alt={item.filename}
            />
          ) : (
            <div className="ml-audio-preview">
              <MediaIcon name="audio" size={72} />
              <audio
                aria-label={"Preview " + item.filename}
                controls
                preload="none"
                src={`/api/v1/admin/media/${id}/preview`}
              />
            </div>
          )}
        </section>
        <aside className="ml-info">
          <p className="ml-eyebrow">THE FILE BEHIND THE STORY</p>
          <h2>{item.filename}</h2>
          <dl>
            <div>
              <dt>File size</dt>
              <dd>{size(item.byteSize)}</dd>
            </div>
            <div>
              <dt>{item.kind === "image" ? "Dimensions" : "Duration"}</dt>
              <dd>
                {item.kind === "image"
                  ? `${item.width ?? "—"} × ${item.height ?? "—"}`
                  : duration(item.durationSeconds)}
              </dd>
            </div>
            {item.kind === "video" && (
              <div>
                <dt>Resolution</dt>
                <dd>
                  {item.width ?? "—"} × {item.height ?? "—"}
                </dd>
              </div>
            )}
            <div>
              <dt>Version</dt>
              <dd>{item.versionId}</dd>
            </div>
          </dl>
          <p className="ml-note">
            <MediaIcon name="link" />
            An upload stays separate from publication. Attach it in an entity
            editor and save the draft.
          </p>
        </aside>
      </div>
      <div className="ml-tabs" role="group" aria-label="Asset information">
        <button
          type="button"
          id="media-usage-tab"
          aria-controls="media-usage-panel"
          aria-pressed={tab === "overview"}
          onClick={() => setTab("overview")}
        >
          <MediaIcon name="link" />
          Used by
        </button>
        {item.kind === "video" && item.state === "ready" && (
          <button
            type="button"
            id="media-captions-tab"
            aria-controls="media-captions-panel"
            aria-pressed={tab === "captions"}
            onClick={() => setTab("captions")}
          >
            <MediaIcon name="captions" />
            Captions
          </button>
        )}
      </div>
      {tab === "captions" ? (
        <section
          role="region"
          id="media-captions-panel"
          aria-labelledby="media-captions-tab"
        >
          <CaptionManager key={id} mediaId={id} />
        </section>
      ) : (
        <section
          role="region"
          id="media-usage-panel"
          aria-labelledby="media-usage-tab"
          className="ml-usage"
        >
          <h2>Saved connections</h2>
          <p>
            Includes historical revisions. This is not a list of currently
            published appearances.
          </p>
          {retained && (
            <p className="ml-note">
              <MediaIcon name="check" />
              Retained for an immutable branding review.
            </p>
          )}
          {usageError && (
            <ErrorState
              message={usageError}
              onRetry={() => setRevision((v) => v + 1)}
            />
          )}
          {usageLoading && (
            <LoadingState label="Loading saved references…" variant="cards" />
          )}
          <ul>
            {usage.map((u, i) => (
              <li key={u.revisionId + ":" + i}>
                <span className="ml-usage-icon">
                  <MediaIcon name="link" />
                </span>
                <div>
                  <strong>{u.label}</strong>
                  <small>{u.resourceType} · Saved revision</small>
                </div>
              </li>
            ))}
          </ul>
          {!usageLoading && !usage.length && !usageError && (
            <div className="ml-empty">
              <MediaIcon name="link" size={32} />
              <p>
                No saved content references. Unsaved editor selections are not
                included.
              </p>
            </div>
          )}
          {cursor && (
            <button
              className="btn"
              type="button"
              disabled={loadingMore}
              onClick={() => void more()}
            >
              {loadingMore ? "Loading…" : "More saved references"}
              <MediaIcon name="arrow" size={16} />
            </button>
          )}
        </section>
      )}
    </div>
  );
}
export default function MediaLibraryView() {
  const { route } = useRouter(),
    id = route.parts[0];
  const [visited, setVisited] = useState(!id);
  useEffect(() => {
    if (!id) setVisited(true);
  }, [id]);
  return (
    <>
      <div hidden={!!id}>
        {visited && (
          <div className="page-pad">
            <div className="ml-intro">
              <span className="ml-intro-icon">
                <MediaIcon name="grid" size={28} />
              </span>
              <div>
                <p className="ml-eyebrow">THE MGTV MEDIA ROOM</p>
                <h2>Every file. A place in the story.</h2>
                <p>
                  Upload through an entity editor, then save its draft to attach
                  the file. Explore the library to review media and its saved
                  connections.
                </p>
              </div>
            </div>
            <MediaLibraryGrid />
          </div>
        )}
      </div>
      {id && <MediaAssetDetail id={id} />}
    </>
  );
}
