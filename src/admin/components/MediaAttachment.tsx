import CaptionManager from "./CaptionManager";
import React, { useEffect, useRef, useState } from "react";
import { api, upload } from "../api/client";
import { useDirtyGuard } from "../router";
import { Modal } from "../ui";
import LoadingState, { ErrorState } from "./LoadingState";
export type MediaItem = {
  id: string;
  versionId: string;
  filename: string;
  kind: string;
  state: string;
  byteSize: number;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
};
export function MediaLibraryList({
  kind,
  onSelect,
}: {
  kind?: string;
  onSelect?: (item: MediaItem) => void;
}) {
  const [q, setQ] = useState(""),
    [query, setQuery] = useState(""),
    [items, setItems] = useState<MediaItem[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const token = ++generation.current;
    setBusy(true);
    setError("");
    setItems([]);
    setCursor(null);
    api(
      "/admin/media?" +
        new URLSearchParams({
          q: query,
          ...(kind ? { kind } : {}),
          ...(onSelect ? { state: "ready" } : {}),
        }),
    )
      .then((page) => {
        if (token === generation.current) {
          setItems(page.items);
          setCursor(page.nextCursor);
        }
      })
      .catch((e) => {
        if (token === generation.current) setError(e.message);
      })
      .finally(() => {
        if (token === generation.current) setBusy(false);
      });
    return () => {
      generation.current++;
    };
  }, [query, kind, revision, !!onSelect]);
  async function more() {
    const token = generation.current;
    setBusy(true);
    setError("");
    try {
      const page = await api(
        "/admin/media?" +
          new URLSearchParams({
            q: query,
            ...(kind ? { kind } : {}),
            ...(onSelect ? { state: "ready" } : {}),
            cursor: cursor!,
          }),
      );
      if (token === generation.current) {
        setItems((v) => [...v, ...page.items]);
        setCursor(page.nextCursor);
      }
    } catch (e) {
      if (token === generation.current)
        setError(e instanceof Error ? e.message : "Unable to load files.");
    } finally {
      if (token === generation.current) setBusy(false);
    }
  }
  return (
    <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <label style={{ flex: "1 1 180px" }}>
          File name
          <input
            className="input"
            value={q}
            maxLength={200}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => {
            setQuery(q.trim());
            setRevision((v) => v + 1);
          }}
        >
          Search files
        </button>
      </div>
      {error && (
        <ErrorState message={error} onRetry={() => setRevision((v) => v + 1)} />
      )}
      {busy && !items.length ? (
        <LoadingState label="Loading media library…" variant="cards" />
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: 10,
          }}
        >
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 12,
                overflowWrap: "anywhere",
              }}
            >
              <strong>{item.filename}</strong>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                {item.kind} · {item.state.replace(/_/g, " ")} ·{" "}
                {(item.byteSize / 1048576).toFixed(1)} MB
                {item.durationSeconds != null
                  ? ` · ${item.durationSeconds}s`
                  : ""}
                {item.width ? ` · ${item.width} × ${item.height}` : ""}
              </p>
              {onSelect && (
                <button
                  type="button"
                  className="btn"
                  disabled={busy || item.state !== "ready"}
                  onClick={() => onSelect(item)}
                >
                  Use this file
                </button>
              )}
              {!onSelect && <MediaUsage id={item.id} />}
              {!onSelect && item.kind === "video" && item.state === "ready" && <CaptionManager mediaId={item.id} />}
            </li>
          ))}
        </ul>
      )}
      {!busy && !error && !items.length && (
        <p>
          No matching files. Upload from the intended entity’s editor, then save
          its draft to retain the attachment.
        </p>
      )}
      {cursor && (
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => void more()}
        >
          {busy ? "Loading…" : "Load more files"}
        </button>
      )}
    </div>
  );
}
function MediaUsage({ id }: { id: string }) {
  const [text, setText] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn btn-sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const page = await api(`/admin/media/${id}/usage`);
            setText(
              (page.brandingRetained ? "Retained for an immutable branding review. " : "") + (page.items.length
                ? page.items
                    .map((x: any) => `${x.resourceType}: ${x.label}`)
                    .join(" · ") +
                    (page.nextCursor ? " · More references exist." : "")
                : "No saved content references. Unsaved editor selections are not included."),
            );
          } catch (e) {
            setText(e instanceof Error ? e.message : "Unable to load usage.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Check saved usage
      </button>
      <p role="status" style={{ fontSize: 13 }}>
        {text}
      </p>
    </>
  );
}
export default function MediaAttachment({
  label,
  kind,
  value,
  onChange,
  disabled = false,
  canRead = false,
  canUpload = false,
  onBusyChange,
  maxDuration,
}: {
  label: string;
  kind: "image" | "video" | "audio" | "any";
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  canRead?: boolean;
  canUpload?: boolean;
  onBusyChange?: (busy: boolean) => void;
  maxDuration?: number;
}) {
  const [open, setOpen] = useState(false),
    [progress, setProgress] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [item, setItem] = useState<MediaItem | null>(null);
  const alive = useRef(true);
  useDirtyGuard(() => busy);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (busy) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [busy]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let current = true;
    setItem(null);
    setProgress("");
    if (value && canRead)
      void api("/admin/media?" + new URLSearchParams({ versionId: value }))
        .then((p) => {
          if (current) setItem(p.items[0] ?? null);
        })
        .catch(() => {});
    return () => {
      current = false;
    };
  }, [value, canRead]);
  function select(item: MediaItem) {
    if (
      maxDuration &&
      (item.durationSeconds == null ||
        item.durationSeconds > maxDuration ||
        item.durationSeconds <= 0)
    ) {
      setError(`Choose a clip lasting no more than ${maxDuration} seconds.`);
      return;
    }
    onChange(item.versionId);
    setItem(item);
    setError("");
    setOpen(false);
  }
  async function send(file?: File) {
    if (!file) return;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      const id = await upload(file, (s) => {
        if (alive.current) setProgress(s);
      });
      if (alive.current) {
        if (maxDuration) {
          const page = await api(
            "/admin/media?" + new URLSearchParams({ versionId: id }),
          );
          if (!page.items[0])
            throw Error(
              "Uploaded file cannot be verified. Choose it from the library after processing.",
            );
          select(page.items[0]);
        } else onChange(id);
      }
    } catch (e) {
      if (alive.current) {
        setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Upload interrupted. Check your connection, then select the same file to retry. Your previous selection is unchanged.");
        setProgress("");
      }
    } finally {
      if (alive.current) {
        setBusy(false);
        onBusyChange?.(false);
      }
    }
  }
  return (
    <section
      aria-label={label}
      style={{
        display: "grid",
        gap: 8,
        padding: 14,
        border: "1px solid var(--border)",
        borderRadius: 8,
        minWidth: 0,
      }}
    >
      <strong style={{ fontSize: 13 }}>{label}</strong>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          overflowWrap: "anywhere",
          color: "var(--text-secondary)",
        }}
      >
        {value
          ? `${item?.filename ?? "Selected media version"} · ${item?.state ?? "attachment selected"}`
          : "No file selected"}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
        Selection belongs to this draft only after you save. Replacing or
        removing it does not delete the library file.
      </p>
      <label style={{ fontSize: 13 }}>
        Upload {kind}
        <input
          type="file"
          aria-label={`Upload ${label}`}
          disabled={disabled || busy || !canUpload}
          accept={
            kind === "image"
              ? "image/png,image/jpeg,image/webp"
              : kind === "audio"
                ? "audio/mpeg"
                : kind === "any"
                  ? "image/png,image/jpeg,image/webp,audio/mpeg,video/mp4"
                  : "video/mp4"
          }
          onClick={(e) => {
            e.currentTarget.value = "";
          }}
          onChange={(e) => void send(e.target.files?.[0])}
        />
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-sm"
          disabled={disabled || busy || !canRead}
          onClick={() => setOpen(true)}
        >
          Choose existing file
        </button>
        {value && (
          <button
            type="button"
            className="btn btn-sm"
            disabled={disabled || busy}
            onClick={() => {
              onChange(null);
              setItem(null);
              setProgress("");
            }}
          >
            Remove selection
          </button>
        )}
      </div>
      {!canUpload && <small>Uploading requires media.upload permission.</small>}
      {!canRead && (
        <small>Library selection requires media.read permission.</small>
      )}
      {progress && (
        <p role="status" style={{ margin: 0, fontSize: 13 }}>
          {progress}
        </p>
      )}
      {error && (
        <p role="alert" style={{ color: "var(--red)", margin: 0 }}>
          {error}
        </p>
      )}
      {open && (
        <Modal
          title={`Choose ${label.toLowerCase()}`}
          onClose={() => setOpen(false)}
        >
          <p>
            Only processed {kind} files are shown. Saving and publication still
            validate this file’s purpose.
          </p>
          {error && <p role="alert">{error}</p>}
          <MediaLibraryList
            kind={kind === "any" ? undefined : kind}
            onSelect={select}
          />
        </Modal>
      )}
    </section>
  );
}
