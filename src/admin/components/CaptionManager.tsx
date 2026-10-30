import "./CaptionManager.css";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { Modal } from "../ui";
import { useDirtyGuard } from "../router";
import LoadingState from "./LoadingState";
type Track = {
  id: string;
  language: string;
  label: string;
  kind: "captions" | "subtitles";
  version: number;
  text: string;
  publishedRevisionId: string | null;
  hasUnpublishedChanges: boolean;
  cueCount: number;
};
export function ReviewVideo({
  mediaId,
  text,
}: {
  mediaId: string;
  text: string;
}) {
  const node = useRef<HTMLVideoElement>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let disposed = false,
      hls: any;
    const abort = new AbortController();
    (async () => {
      try {
        const response = await fetch(`/api/v1/admin/media/${mediaId}/video`, {
          headers: { "X-MGTV-Playback": "descriptor" },
          credentials: "include",
          signal: abort.signal,
          cache: "no-store",
        });
        if (!response.ok) throw Error("Unable to authorize this review video.");
        const data = await response.json();
        if (disposed || !node.current) return;
        if (
          data.type === "hls" &&
          !node.current.canPlayType("application/vnd.apple.mpegurl")
        ) {
          const { default: Hls } = await import("hls.js");
          if (disposed) return;
          if (!Hls.isSupported())
            throw Error("Adaptive playback is unavailable in this browser.");
          hls = new Hls();
          hls.attachMedia(node.current!);
          hls.loadSource(data.url);
        } else node.current.src = data.url;
      } catch (e) {
        if (!disposed)
          setError(e instanceof Error ? e.message : "Video unavailable.");
      }
    })();
    return () => {
      disposed = true;
      abort.abort();
      hls?.destroy();
    };
  }, [mediaId]);
  useEffect(() => {
    const video = node.current;
    if (!video || !text) return;
    const url = URL.createObjectURL(new Blob([text], { type: "text/vtt" })),
      track = document.createElement("track");
    track.kind = "captions";
    track.label = "Draft review";
    track.srclang = "en";
    track.src = url;
    track.default = true;
    video.appendChild(track);
    track.track.mode = "showing";
    return () => {
      track.remove();
      URL.revokeObjectURL(url);
    };
  }, [text]);
  return (
    <div>
      {error && <p role="alert">{error}</p>}
      <video
        ref={node}
        controls
        preload="none"
        crossOrigin="anonymous"
        onError={() =>
          setError(
            "Video preview unavailable. Close and reopen the preview, or retry playback where available.",
          )
        }
        aria-label={text ? "Private caption review" : "Private media review"}
        style={{
          width: "100%",
          maxHeight: 280,
          background: "#000",
          borderRadius: 8,
        }}
      />
      <small>
        Private review. Check timing, dialogue, names and meaningful sounds
        before publishing.
      </small>
    </div>
  );
}
function JobReconciliation({
  base,
  id,
  disabled,
  onDone,
}: {
  base: string;
  id: string;
  disabled: boolean;
  onDone: () => Promise<void>;
}) {
  const [providerJobId, setProviderJobId] = useState(""),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <small>
        Request reference: {id}. Find the existing job in Mux; MGTV verifies its
        video, language and original reference before resuming it.
      </small>
      <label>
        Mux job ID
        <input
          className="input"
          value={providerJobId}
          disabled={disabled || busy}
          maxLength={200}
          onChange={(e) => setProviderJobId(e.target.value)}
        />
      </label>
      <label>
        Reconciliation reason
        <input
          className="input"
          value={reason}
          disabled={disabled || busy}
          maxLength={2000}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button
        className="btn btn-sm"
        disabled={disabled || busy || !providerJobId.trim() || !reason.trim()}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await api(base + "/jobs/" + id + "/reconcile", "POST", {
              providerJobId: providerJobId.trim(),
              reason: reason.trim(),
            });
            await onDone();
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "Unable to reconcile this request. Refresh its status before trying again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        Verify existing provider job
      </button>
    </div>
  );
}
export default function CaptionManager({ mediaId }: { mediaId: string }) {
  const [open, setOpen] = useState(false),
    [data, setData] = useState<any>(null),
    [permissions, setPermissions] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [selected, setSelected] = useState<Track | null>(null),
    [language, setLanguage] = useState("en"),
    [label, setLabel] = useState("English"),
    [kind, setKind] = useState<"captions" | "subtitles">("captions"),
    [text, setText] = useState(""),
    [saved, setSaved] = useState(""),
    [reviewText, setReviewText] = useState(""),
    [reason, setReason] = useState(""),
    [reviewed, setReviewed] = useState(false);
  const operation = useRef({ body: "", key: "" }),
    generation = useRef(0),
    close = useRef(() => {});
  const dirty = JSON.stringify({ text, label }) !== saved && !!text;
  useDirtyGuard(() => open && (dirty || busy));
  const can = (p: string) => permissions.includes(p),
    base = `/admin/media/${mediaId}/captions`;
  async function load() {
    const id = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const [page, session] = await Promise.all([
        api(base),
        api("/admin/session"),
      ]);
      if (id === generation.current) {
        setData(page);
        setPermissions(session.permissions);
      }
    } catch (e) {
      if (id === generation.current)
        setError(e instanceof Error ? e.message : "Unable to load captions.");
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (open) void load();
    return () => {
      generation.current++;
    };
  }, [open, mediaId]);
  function edit(t: Track | null) {
    if (dirty && !confirm("Discard unsaved caption changes?")) return;
    setSelected(t);
    setLanguage(t?.language ?? "en");
    setLabel(t?.label ?? "English");
    setKind(t?.kind ?? "captions");
    setText(t?.text ?? "");
    setSaved(
      JSON.stringify({ text: t?.text ?? "", label: t?.label ?? "English" }),
    );
    setReviewText(t?.text ?? "");
    setReviewed(false);
    setReason("");
    setError("");
  }
  async function perform(action: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const body =
        action === "save"
          ? { language, label, kind, text }
          : action === "generate"
            ? { language, label }
            : { reason, reviewed };
      const signature = JSON.stringify({
        action,
        body,
        id: selected?.id,
        version: selected?.version,
      });
      if (operation.current.body !== signature)
        operation.current = { body: signature, key: crypto.randomUUID() };
      const path =
        action === "save"
          ? selected
            ? base + "/" + selected.id
            : base
          : action === "generate"
            ? base + "/generate"
            : base + "/" + selected!.id + "/" + action;
      const result = await api(
        path,
        action === "save" && selected ? "PATCH" : "POST",
        body,
        selected?.version,
        operation.current.key,
      );
      operation.current = { body: "", key: "" };
      const page = await api(base);
      setData(page);
      if (action === "save") {
        const t = page.items.find((v: Track) => v.id === result.id);
        setSelected(t);
        setText(t.text);
        setSaved(JSON.stringify({ text: t.text, label: t.label }));
        setReviewText(t.text);
      } else if (selected)
        setSelected(
          page.items.find((t: Track) => t.id === selected.id) ?? null,
        );
      setReviewed(false);
      setNotice(
        action === "generate"
          ? "Transcription requested. Refresh its status below; the result will be a private draft."
          : action === "save"
            ? "Draft saved. Published captions have not changed."
            : action === "publish"
              ? "Reviewed captions published."
              : "Captions withdrawn.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update captions.");
    } finally {
      setBusy(false);
    }
  }
  close.current = () => {
    if (busy) return;
    if (dirty && !confirm("Discard unsaved caption changes?")) return;
    setOpen(false);
  };
  return (
    <>
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => setOpen(true)}
      >
        Captions
      </button>
      {open && (
        <Modal
          title="Captions & subtitles"
          width={920}
          onClose={() => close.current()}
        >
          <div
            className="caption-manager"
            style={{ display: "grid", gap: 16, minWidth: 0 }}
          >
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>
              Tracks belong to this video version and appear wherever it is
              attached. Drafts stay private until explicitly published.
            </p>
            {error && (
              <p role="alert" style={{ color: "var(--red)" }}>
                {error}
              </p>
            )}
            {notice && <p role="status">{notice}</p>}
            {!data && busy ? (
              <LoadingState label="Loading captions…" />
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={() => edit(null)}
                  >
                    New track
                  </button>
                  <button
                    className="btn btn-sm"
                    disabled={busy || dirty}
                    onClick={() => void load()}
                  >
                    Refresh status
                  </button>
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  {data?.items.map((t: Track) => (
                    <li key={t.id}>
                      <button
                        className="btn"
                        style={{
                          width: "100%",
                          textAlign: "left",
                          whiteSpace: "normal",
                        }}
                        disabled={busy}
                        onClick={() => edit(t)}
                      >
                        {t.label} · {t.language} · {t.cueCount} cues ·{" "}
                        {t.publishedRevisionId
                          ? t.hasUnpublishedChanges
                            ? "Published · draft changes"
                            : "Published"
                          : "Private draft"}
                      </button>
                    </li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <label style={{ flex: "1 1 130px" }}>
                    Language code
                    <input
                      className="input"
                      value={language}
                      maxLength={35}
                      disabled={busy || !!selected || !can("media.upload")}
                      onChange={(e) => setLanguage(e.target.value)}
                    />
                  </label>
                  <label style={{ flex: "2 1 180px" }}>
                    Viewer label
                    <input
                      className="input"
                      value={label}
                      maxLength={100}
                      disabled={busy || !can("media.upload")}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                  </label>
                  <label style={{ flex: "1 1 160px" }}>
                    Track type
                    <select
                      className="input"
                      value={kind}
                      disabled={busy || !!selected || !can("media.upload")}
                      onChange={(e) => setKind(e.target.value as any)}
                    >
                      <option value="captions">
                        Captions (includes sounds)
                      </option>
                      <option value="subtitles">Subtitles</option>
                    </select>
                  </label>
                </div>
                {can("media.upload") && (
                  <label>
                    Upload SRT or WebVTT (UTF-8, up to 512 KiB)
                    <input
                      type="file"
                      accept=".srt,.vtt"
                      disabled={busy}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          if (file.size > 512 * 1024)
                            throw Error(
                              "Choose a file no larger than 512 KiB.",
                            );
                          setText(
                            new TextDecoder("utf-8", { fatal: true }).decode(
                              await file.arrayBuffer(),
                            ),
                          );
                          setReviewed(false);
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : "Unable to read caption file.",
                          );
                        }
                      }}
                    />
                  </label>
                )}
                <label>
                  Caption draft
                  <textarea
                    className="input"
                    style={{
                      minHeight: 200,
                      fontFamily: "monospace",
                      resize: "vertical",
                    }}
                    value={text}
                    maxLength={524288}
                    disabled={busy || !can("media.upload")}
                    onChange={(e) => {
                      setText(e.target.value);
                      setReviewed(false);
                    }}
                  />
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {can("media.upload") && (
                    <button
                      className="btn btn-primary"
                      disabled={busy || !text.trim() || !label.trim()}
                      onClick={() => void perform("save")}
                    >
                      Save private draft
                    </button>
                  )}
                  {!selected && can("media.upload") && (
                    <button
                      className="btn"
                      disabled={
                        busy ||
                        !data?.generation.available ||
                        !label.trim() ||
                        !!text
                      }
                      onClick={() => void perform("generate")}
                    >
                      Generate captions
                    </button>
                  )}
                </div>
                {!data?.generation.available && (
                  <small>{data?.generation.reason}</small>
                )}
                {!!reviewText && (
                  <ReviewVideo mediaId={mediaId} text={reviewText} />
                )}
                {selected && (
                  <fieldset
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: 12,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <legend>Publication review</legend>
                    <label>
                      <input
                        type="checkbox"
                        checked={reviewed}
                        disabled={busy || dirty}
                        onChange={(e) => setReviewed(e.target.checked)}
                      />{" "}
                      I reviewed the saved draft’s timing, words and sound
                      descriptions.
                    </label>
                    <label>
                      Reason
                      <textarea
                        className="input"
                        maxLength={2000}
                        value={reason}
                        disabled={busy}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {can("content.publish") && (
                        <button
                          className="btn btn-primary"
                          disabled={
                            busy || dirty || !reviewed || !reason.trim()
                          }
                          onClick={() => void perform("publish")}
                        >
                          Publish reviewed captions
                        </button>
                      )}
                      {can("content.unpublish") &&
                        selected.publishedRevisionId && (
                          <button
                            className="btn"
                            disabled={busy || dirty || !reason.trim()}
                            onClick={() => void perform("withdraw")}
                          >
                            Withdraw captions
                          </button>
                        )}
                    </div>
                  </fieldset>
                )}
                {!!data?.jobs.length && (
                  <div>
                    <h3>Transcription requests</h3>
                    {data.jobs.map((j: any) => (
                      <div
                        key={j.id}
                        style={{ padding: "10px 0", overflowWrap: "anywhere" }}
                      >
                        <strong>{j.label}</strong> · {j.state}
                        {j.state === "uncertain" && (
                          <p>
                            Provider confirmation is needed. This request will
                            not be submitted again automatically.
                          </p>
                        )}
                        {j.state === "uncertain" && can("media.upload") && (
                          <JobReconciliation
                            base={base}
                            id={j.id}
                            disabled={busy || dirty}
                            onDone={load}
                          />
                        )}
                        {j.error_code && (
                          <small>
                            {" "}
                            {j.error_code.replaceAll("_", " ").toLowerCase()}
                          </small>
                        )}
                        {j.has_result &&
                          !j.result_track_id &&
                          can("media.upload") && (
                            <button
                              className="btn btn-sm"
                              disabled={busy}
                              onClick={async () => {
                                try {
                                  if (
                                    dirty &&
                                    !confirm(
                                      "Replace unsaved text with the generated result?",
                                    )
                                  )
                                    return;
                                  const result = await api(
                                    base + "/jobs/" + j.id,
                                  );
                                  const track = data.items.find(
                                    (t: Track) =>
                                      t.language === j.language &&
                                      t.kind === "captions",
                                  );
                                  edit(track ?? null);
                                  setText(result.result_text ?? "");
                                  setLanguage(j.language);
                                  setLabel(j.label);
                                  setReviewed(false);
                                } catch (e) {
                                  setError(
                                    e instanceof Error
                                      ? e.message
                                      : "Unable to load result.",
                                  );
                                }
                              }}
                            >
                              Review generated text
                            </button>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
