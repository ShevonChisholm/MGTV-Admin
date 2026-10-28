import { MediaLibraryGrid } from "./MediaLibraryView";
import React, { useEffect, useRef, useState } from "react";
import { api, upload } from "../api/client";
import { useDirtyGuard } from "../router";
import { Modal } from "../ui";
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
  return <MediaLibraryGrid kind={kind} onSelect={onSelect} />;
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
  selectionHint,
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
  selectionHint?: string;
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
        setError(
          e instanceof Error && e.message !== "Failed to fetch"
            ? e.message
            : "Upload interrupted. Check your connection, then select the same file to retry. Your previous selection is unchanged.",
        );
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
        {selectionHint ??
          "Selection belongs to this draft only after you save. Replacing or removing it does not delete the library file."}
      </p>
      <label style={{ fontSize: 13 }}>
        Upload {kind}
        <input
          type="file"
          aria-label={`Upload ${label}`}
          style={{
            display: "block",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
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
