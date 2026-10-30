import MediaAttachmentPreview from "./MediaAttachmentPreview";
import MediaIcon from "./MediaIcon";
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
  thumbnailUrl?: string | null;
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
    [metadata, setMetadata] = useState<{
      value: string | null | undefined;
      item: MediaItem | null;
      error: string;
      loading: boolean;
    }>({ value: null, item: null, error: "", loading: false }),
    [refresh, setRefresh] = useState(0);
  const item = canRead && metadata.value === value ? metadata.item : null;
  const loading =
    !!value && canRead && (metadata.value !== value || metadata.loading);
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
    setMetadata({ value, item: null, error: "", loading: !!value && canRead });
    setProgress("");
    if (value && canRead)
      void api("/admin/media?" + new URLSearchParams({ versionId: value }))
        .then((p) => {
          if (!current) return;
          const found = p.items.find(
            (candidate: MediaItem) => candidate.versionId === value,
          );
          setMetadata({
            value,
            item: found ?? null,
            loading: false,
            error: found
              ? ""
              : "This selected version is no longer available. Keep it for review, choose a replacement or remove the selection.",
          });
        })
        .catch(() => {
          if (current)
            setMetadata({
              value,
              item: null,
              loading: false,
              error:
                "We couldn't load this file's details. Your selection is unchanged.",
            });
        });
    return () => {
      current = false;
    };
  }, [value, canRead, refresh]);
  function select(item: MediaItem) {
    if (item.state !== "ready" || (kind !== "any" && item.kind !== kind)) {
      setError(`Choose a processed ${kind} file.`);
      return;
    }
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
    setMetadata({ value: item.versionId, item, loading: false, error: "" });
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
    <section aria-label={label} className="ma-attachment">
      <div className="ma-heading">
        <MediaIcon name={kind === "any" ? "file" : kind} size={18} />
        <strong>{label}</strong>
      </div>
      {loading ? (
        <div className="ma-placeholder" role="status" aria-busy="true">
          <MediaIcon name="clock" />
          Loading selected file...
        </div>
      ) : item ? (
        <MediaAttachmentPreview key={item.versionId} item={item} />
      ) : (
        <div className="ma-placeholder">
          <MediaIcon
            name={value ? "lock" : kind === "any" ? "file" : kind}
            size={28}
          />
          <span>
            {value
              ? canRead
                ? "Selected version unavailable"
                : "Attachment selected · private details"
              : "Choose the file behind this story"}
          </span>
        </div>
      )}
      {value && canRead && metadata.value === value && metadata.error && (
        <div className="ma-message" role="alert">
          <p>{metadata.error}</p>
          <button
            type="button"
            className="btn btn-sm"
            disabled={loading}
            onClick={() => setRefresh((n) => n + 1)}
          >
            <MediaIcon name="refresh" size={14} />
            Retry file details
          </button>
        </div>
      )}
      <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
        {selectionHint ??
          "Save this entity to apply attachment changes. Replacing or removing a selection does not delete the library file."}
      </p>
      <label
        className="ma-upload"
        data-disabled={disabled || busy || !canUpload}
      >
        <MediaIcon name="plus" size={18} />
        <span>
          <strong>Upload {kind === "any" ? "a file" : kind}</strong>
          <br />
          Choose a new file from your device
        </span>
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
      <div className="ma-actions">
        {value && canRead && item && (
          <button
            type="button"
            className="btn btn-sm"
            disabled={busy || loading}
            onClick={() => setRefresh((n) => n + 1)}
          >
            <MediaIcon name="refresh" size={15} />
            Refresh file details
          </button>
        )}
        <button
          type="button"
          className="btn btn-sm"
          disabled={disabled || busy || !canRead}
          onClick={() => setOpen(true)}
        >
          <MediaIcon name="grid" size={15} />
          Choose existing file
        </button>
        {value && (
          <button
            type="button"
            className="btn btn-sm"
            disabled={disabled || busy}
            onClick={() => {
              onChange(null);
              setMetadata({
                value: null,
                item: null,
                loading: false,
                error: "",
              });
              setError("");
              setProgress("");
            }}
          >
            <MediaIcon name="minus" size={15} />
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
      {open && canRead && !disabled && !busy && (
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
