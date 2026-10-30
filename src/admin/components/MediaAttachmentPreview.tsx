import { useState } from "react";
import { ReviewVideo } from "./CaptionManager";
import MediaIcon from "./MediaIcon";
import type { MediaItem } from "./MediaAttachment";
import "./MediaAttachment.css";

const duration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const size = (bytes: number) =>
  bytes < 1048576
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1048576).toFixed(1)} MB`;

export default function MediaAttachmentPreview({ item }: { item: MediaItem }) {
  const [failed, setFailed] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const ready = item.state === "ready";
  const thumbnail =
    ready && (item.kind === "image" || item.thumbnailUrl)
      ? `/api/v1/admin/media/${encodeURIComponent(item.id)}/thumbnail`
      : null;
  return (
    <div className="ma-selected">
      <div className="ma-summary">
        <div className="ma-art">
          {thumbnail && !failed ? (
            <img
              key={attempt}
              src={thumbnail}
              alt={`Selected ${item.kind}: ${item.filename}`}
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="ma-fallback">
              <MediaIcon name={failed ? "alert" : item.kind} size={36} />
              <span>
                {failed
                  ? "Artwork unavailable"
                  : item.kind === "audio"
                    ? "Audio track"
                    : item.kind === "video"
                      ? "Video file"
                      : "Image file"}
              </span>
            </div>
          )}
        </div>
        <div className="ma-info">
          <span className="ma-eyebrow">Selected {item.kind}</span>
          <strong>{item.filename}</strong>
          <span className={`ma-state ma-state--${item.state}`}>
            <MediaIcon
              name={
                ready ? "check" : item.state === "failed" ? "alert" : "clock"
              }
              size={14}
            />
            {item.state.replace(/_/g, " ")}
          </span>
          <ul className="ma-facts" aria-label="Verified file details">
            <li>
              <MediaIcon name="file" size={14} />
              {size(item.byteSize)}
            </li>
            {item.width != null && item.height != null && (
              <li>
                <MediaIcon name="image" size={14} />
                {item.width} × {item.height}
              </li>
            )}
            {item.durationSeconds != null && (
              <li>
                <MediaIcon name="clock" size={14} />
                {duration(item.durationSeconds)}
              </li>
            )}
          </ul>
          <small className="ma-version">Version {item.versionId}</small>
          {failed && thumbnail && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setFailed(false);
                setAttempt((n) => n + 1);
              }}
            >
              <MediaIcon name="refresh" size={14} />
              Retry artwork
            </button>
          )}
          {ready && item.kind !== "image" && (
            <button
              type="button"
              className="btn btn-sm"
              aria-expanded={playing}
              onClick={() => {
                setPlaying((p) => !p);
                setFailed(false);
              }}
            >
              <MediaIcon name={item.kind} size={15} />
              {playing ? "Close private preview" : "Preview selected file"}
            </button>
          )}
          {!ready && (
            <small>
              Refresh file details after processing. Saving and publishing still
              verify readiness.
            </small>
          )}
        </div>
      </div>
      {playing && ready && (
        <div className="ma-playback">
          {item.kind === "video" ? (
            <ReviewVideo key={attempt} mediaId={item.id} text="" />
          ) : (
            <>
              <audio
                key={attempt}
                aria-label={`Private preview of ${item.filename}`}
                controls
                preload="none"
                src={`/api/v1/admin/media/${encodeURIComponent(item.id)}/preview`}
                onError={() => setAudioFailed(true)}
              />
              {audioFailed && (
                <p role="alert">
                  Audio preview unavailable. Your selection is unchanged.
                </p>
              )}
            </>
          )}
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setAttempt((n) => n + 1);
              setFailed(false);
              setAudioFailed(false);
            }}
          >
            <MediaIcon name="refresh" size={14} />
            Retry playback
          </button>
          <small>Private staff preview. Nothing plays automatically.</small>
        </div>
      )}
    </div>
  );
}
