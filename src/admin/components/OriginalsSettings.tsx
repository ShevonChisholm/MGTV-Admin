import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import MediaAttachment from "./MediaAttachment";
import { ReviewVideo } from "./CaptionManager";
export type OriginFields = {
  contentOrigin?:
    "unclassified" | "original" | "licensed" | "development_sample" | null;
  rightsReference?: string | null;
};
function Review({
  version,
  rights,
  canRead,
  canReview,
}: {
  version: string;
  rights: string;
  canRead: boolean;
  canReview: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<any>(null),
    [source, setSource] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const key = useRef<{ body: string; key: string } | null>(null);
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    if (canRead)
      Promise.all([
        api("/admin/media-branding/" + version),
        api("/admin/media?versionId=" + version),
      ])
        .then(([review, media]) => {
          if (active) setData({ ...review, media: media.items[0] });
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [version, canRead, revision]);
  async function save() {
    setBusy(true);
    setError("");
    try {
      const body = {
        sourceVersionId: source,
        derivativeVersionId: version,
        rightsReference: rights.trim(),
        reviewReason: reason.trim(),
        policyVersion: "mgtv-originals-upper-right-v1",
      };
      const signature = JSON.stringify(body);
      if (key.current?.body !== signature)
        key.current = { body: signature, key: crypto.randomUUID() };
      await api(
        "/admin/media-branding",
        "POST",
        body,
        undefined,
        key.current.key,
      );
      key.current = null;
      setRevision((x) => x + 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details
      onToggle={(e) => setExpanded(e.currentTarget.open)}
      style={{
        overflowWrap: "anywhere",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 12,
        minWidth: 0,
      }}
    >
      <summary>
        Branding review · {data?.media?.filename ?? "attached video"}
      </summary>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="btn"
            onClick={() => setRevision((x) => x + 1)}
          >
            Retry loading review
          </button>
        </div>
      )}
      {!data && !error && (
        <p role="status">
          {canRead
            ? "Loading branding review…"
            : "Media read permission is required."}
        </p>
      )}
      {data?.review ? (
        <p role="status">
          Reviewed MGTV watermark · clean master retained. This review is
          permanent; use a new video version for changes.
        </p>
      ) : data?.media && canReview ? (
        <fieldset
          disabled={busy}
          style={{
            border: 0,
            padding: 0,
            display: "grid",
            gap: 12,
            minWidth: 0,
          }}
        >
          <p>
            Review the encoded logo throughout the video, including bright and
            dark scenes. The clean source and branded copy must be separate
            uploads with the same duration and dimensions.
          </p>
          {expanded && <ReviewVideo mediaId={data.media.id} text="" />}
          <MediaAttachment
            label="Retained clean master"
            kind="video"
            value={source}
            canRead={canRead}
            canUpload={false}
            onChange={(v) => {
              setSource(v);
              setConfirmed(false);
            }}
          />
          <label>
            Visual review notes
            <textarea
              value={reason}
              maxLength={2000}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: "100%", minHeight: 80 }}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />{" "}
            I checked the upper-right MGTV mark, picture, audio and timing
            against the clean source.
          </label>
          <button
            type="button"
            className="btn primary"
            disabled={
              !confirmed ||
              !source ||
              source === version ||
              rights.trim().length < 5 ||
              reason.trim().length < 5
            }
            onClick={save}
          >
            {busy ? "Saving review…" : "Approve branded version"}
          </button>
        </fieldset>
      ) : data && !data.review ? (
        <p>
          Media upload and content publishing permissions are both required to
          approve a branded version.
        </p>
      ) : null}
    </details>
  );
}
export default function OriginalsSettings({
  value,
  onChange,
  versions,
  canRead,
  canReview,
}: {
  value: OriginFields;
  onChange: (patch: OriginFields) => void;
  versions: (string | null | undefined)[];
  canRead: boolean;
  canReview: boolean;
}) {
  const ids = [...new Set(versions.filter((x): x is string => !!x))];
  return (
    <section
      style={{ display: "grid", gap: 14, minWidth: 0 }}
      aria-label="Content origin and branding"
    >
      <h3>Content origin &amp; branding</h3>
      <label>
        Production classification
        <select
          value={value.contentOrigin ?? "unclassified"}
          onChange={(e) =>
            onChange({
              contentOrigin: e.target.value as OriginFields["contentOrigin"],
            })
          }
        >
          <option value="unclassified">Unclassified — no Original label</option>
          <option value="original">MGTV Original</option>
          <option value="licensed">Licensed content</option>
          <option value="development_sample">Development sample</option>
        </select>
      </label>
      {value.contentOrigin === "original" && (
        <>
          <label>
            Rights review reference
            <input
              value={value.rightsReference ?? ""}
              maxLength={500}
              onChange={(e) => onChange({ rightsReference: e.target.value })}
            />
          </label>
          <p>
            Attach reviewed branded copies in the media fields. Retain clean
            masters separately. Every attached video needs review, including
            previews, hero clips and additional qualities. Captions remain
            specific to each video version. Automatic cloud watermark processing
            is disabled.
          </p>
          {ids.map((v) => (
            <Review
              key={v}
              version={v}
              rights={value.rightsReference ?? ""}
              canRead={canRead}
              canReview={canReview}
            />
          ))}
        </>
      )}
    </section>
  );
}
