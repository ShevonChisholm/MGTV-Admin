import { useEffect, useState } from "react";
import { Link } from "../router";
import MediaIcon from "./MediaIcon";
import "./ContentVisual.css";

export const CONTENT_TYPES = [
  { id: "shows", label: "Shows", icon: "series" },
  { id: "movies", label: "Movies", icon: "film" },
  { id: "music-videos", label: "Music videos", icon: "video" },
  { id: "audio", label: "Audio tracks", icon: "audio" },
  { id: "sports", label: "Sports", icon: "sport" },
];
export function ContentStatus({ status }: { status: string }) {
  const icon =
    status === "published"
      ? "check"
      : status === "scheduled"
        ? "clock"
        : status === "archived"
          ? "archive"
          : "edit";
  return (
    <span className={"cv-status cv-status--" + status}>
      <MediaIcon name={icon} size={14} />
      {status.replace(/_/g, " ")}
    </span>
  );
}
export function ContentArtwork({
  record,
  entity,
  slot = "landscape",
  className = "",
  fallback = true,
}: {
  record: any;
  entity: string;
  slot?: "landscape" | "portrait";
  className?: string;
  fallback?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const artwork = record.draft?.artwork;
  const selected =
    slot === "portrait"
      ? artwork?.portraitVersionId
      : artwork?.landscapeVersionId;
  const alternative =
    slot === "portrait"
      ? artwork?.landscapeVersionId
      : artwork?.portraitVersionId;
  const actual = selected
    ? slot
    : slot === "portrait"
      ? "landscape"
      : "portrait";
  const src =
    selected || (fallback && alternative)
      ? `/api/v1/admin/${entity}/${record.id}/artwork/${actual}?v=${record.version}`
      : null;
  useEffect(() => setFailed(false), [src]);
  return (
    <div className={"cv-art " + className}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="same-origin"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="cv-art-fallback">
          <MediaIcon
            name={
              entity === "music"
                ? record.draft?.musicKind === "track"
                  ? "audio"
                  : "video"
                : entity === "movies"
                  ? "film"
                  : entity === "sports"
                    ? "sport"
                    : "series"
            }
            size={42}
          />
          <span>{failed ? "Artwork unavailable" : "Artwork to come"}</span>
        </div>
      )}
    </div>
  );
}
export function ContentGrid({
  items,
  entity,
  basePath,
}: {
  items: any[];
  entity: string;
  basePath: string;
}) {
  return (
    <ul
      className={"cv-grid " + (entity === "movies" ? "cv-grid--posters" : "")}
      aria-label="Content records"
    >
      {items.map((m) => (
        <li className="cv-card" key={m.id}>
          <Link
            className="cv-card-link"
            to={basePath + "/" + m.id}
            aria-label={"Open " + m.draft.title}
          >
            <div className="cv-card-image">
              <ContentArtwork
                record={m}
                entity={entity}
                slot={entity === "movies" ? "portrait" : "landscape"}
              />
              <ContentStatus status={m.status} />
            </div>
            <div className="cv-card-copy">
              <span className="cv-kicker">
                {m.kind === "music"
                  ? m.draft.musicKind === "track"
                    ? "Audio track"
                    : "Music video"
                  : (m.kind?.replace(/-/g, " ") ?? entity)}
                {m.number ? " · " + String(m.number).padStart(2, "0") : ""}
              </span>
              <h3>{m.draft.title}</h3>
              <p className="cv-card-meta">
                {[m.draft.artist, m.draft.releaseYear, m.draft.coverage]
                  .filter(Boolean)
                  .join(" · ") || "Saved draft"}
              </p>
              <div className="cv-card-foot">
                <span>
                  <MediaIcon
                    name={m.draft.accessTier === "premium" ? "lock" : "globe"}
                    size={14}
                  />
                  {m.kind === "season"
                    ? "Inherited access"
                    : m.draft.accessTier === "premium"
                      ? "MGTV+"
                      : "Free access"}
                </span>
                <span className="cv-open">
                  <MediaIcon name="arrow" size={18} />
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
export function ContentGridSkeleton({ entity = "" }: { entity?: string }) {
  return (
    <div
      className={"cv-grid " + (entity === "movies" ? "cv-grid--posters" : "")}
      role="status"
      aria-label="Loading content records"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="cv-card cv-skeleton">
          <div className="cv-art" />
          <div className="cv-card-copy">
            <span />
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}
export function ContentOverview({
  record,
  entity,
  onEdit,
  onReview,
  tax,
  canEdit = true,
}: {
  record: any;
  entity: string;
  onEdit: () => void;
  onReview: () => void;
  tax: any;
  canEdit?: boolean;
}) {
  const d = record.draft;
  const genre = (tax?.genres ?? [])
    .filter((g: any) => d.genreIds?.includes(g.id))
    .map((g: any) => g.name)
    .join(" · ");
  const classification = (tax?.classifications ?? []).find(
    (c: any) => c.id === d.classificationId,
  )?.name;
  const attachments = [
    { name: "Portrait", value: d.artwork?.portraitVersionId, icon: "image" },
    { name: "Landscape", value: d.artwork?.landscapeVersionId, icon: "image" },
    ...(["seasons", "shows"].includes(entity)
      ? entity === "shows"
        ? [
            {
              name: "Featured clip",
              value: d.featureMediaVersionId,
              icon: "film",
            },
          ]
        : []
      : [
          {
            name: "Primary media",
            value: d.primaryMediaVersionId,
            icon: d.musicKind === "track" ? "audio" : "video",
          },
          {
            name: "Free preview",
            value: d.previewMediaVersionId,
            icon: d.musicKind === "track" ? "audio" : "video",
          },
          {
            name: "Featured clip",
            value: d.featureMediaVersionId,
            icon: "film",
          },
        ]),
  ];
  return (
    <div className="cv-overview">
      <section className="cv-feature" aria-label="Saved content overview">
        <ContentArtwork
          record={record}
          entity={entity}
          className="cv-feature-art"
        />
        <div className="cv-feature-shade" />
        <div className="cv-feature-copy">
          <span className="cv-kicker">
            THE SAVED DRAFT ·{" "}
            {entity === "music" ? d.musicKind?.replace(/-/g, " ") : record.kind}
          </span>
          <ContentStatus status={record.status} />
          <h2>{d.title}</h2>
          <p className="cv-feature-meta">
            {[d.artist, d.releaseYear, classification, genre]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="cv-synopsis">
            {d.synopsis || "Add a synopsis to introduce this story."}
          </p>
          <div className="cv-feature-actions">
            <button type="button" className="btn btn-primary" onClick={onEdit}>
              <MediaIcon name="edit" size={17} />{" "}
              {canEdit ? "Edit draft" : "View draft"}
            </button>
            <button type="button" className="btn" onClick={onReview}>
              <MediaIcon name="review" size={17} /> Review & publish
            </button>
          </div>
        </div>
      </section>
      <div className="cv-overview-grid">
        <section className="cv-panel">
          <div className="cv-panel-title">
            <span className="cv-icon-tile">
              <MediaIcon name="image" />
            </span>
            <div>
              <h3>Artwork pair</h3>
              <p>The images attached to this saved draft.</p>
            </div>
          </div>
          <div className="cv-art-pair">
            <div>
              <ContentArtwork
                record={record}
                entity={entity}
                slot="portrait"
                className="cv-pair-portrait"
                fallback={false}
              />
              <span>Portrait</span>
            </div>
            <div>
              <ContentArtwork
                record={record}
                entity={entity}
                className="cv-pair-landscape"
                fallback={false}
              />
              <span>Landscape</span>
            </div>
          </div>
        </section>
        <section className="cv-panel">
          <div className="cv-panel-title">
            <span className="cv-icon-tile">
              <MediaIcon name="link" />
            </span>
            <div>
              <h3>Attached to the story</h3>
              <p>Saved selections; readiness is checked before publication.</p>
            </div>
          </div>
          <ul className="cv-attachments">
            {attachments.map((a) => (
              <li key={a.name}>
                <span className="cv-icon-tile">
                  <MediaIcon name={a.icon} />
                </span>
                <span>{a.name}</span>
                <span className={a.value ? "cv-selected" : "cv-muted"}>
                  <MediaIcon name={a.value ? "link" : "minus"} size={15} />
                  {a.value ? "Selected" : "Not attached"}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="cv-panel">
          <div className="cv-panel-title">
            <span className="cv-icon-tile">
              <MediaIcon name="globe" />
            </span>
            <div>
              <h3>Audience & availability</h3>
              <p>Access settings on this saved draft.</p>
            </div>
          </div>
          <dl className="cv-facts">
            <div>
              <dt>Access</dt>
              <dd>
                {entity === "seasons"
                  ? "Inherited from show"
                  : d.accessTier === "premium"
                    ? "MGTV+ subscription"
                    : "Free"}
              </dd>
            </div>
            {d.artist && (
              <div>
                <dt>Artist</dt>
                <dd>{d.artist}</dd>
              </div>
            )}
            {d.director && (
              <div>
                <dt>Director</dt>
                <dd>{d.director}</dd>
              </div>
            )}
            <div>
              <dt>Rights</dt>
              <dd>
                {entity === "seasons"
                  ? "Reviewed on the parent show"
                  : d.availability?.rightsConfirmed
                    ? "Confirmed"
                    : "Awaiting confirmation"}
              </dd>
            </div>
            <div>
              <dt>Available from</dt>
              <dd>
                {d.availability?.startsAt
                  ? new Date(d.availability.startsAt).toLocaleString()
                  : "No start set"}
              </dd>
            </div>
            <div>
              <dt>Available until</dt>
              <dd>
                {d.availability?.endsAt
                  ? new Date(d.availability.endsAt).toLocaleString()
                  : "No end set"}
              </dd>
            </div>
          </dl>
        </section>
        <section className="cv-panel">
          <div className="cv-panel-title">
            <span className="cv-icon-tile">
              <MediaIcon name="review" />
            </span>
            <div>
              <h3>Publication snapshot</h3>
              <p>Saving and publication are separate steps.</p>
            </div>
          </div>
          <div className="cv-publication">
            <ContentStatus status={record.status} />
            <p>
              {record.status === "published"
                ? record.draftRevisionId === record.publishedRevisionId
                  ? "This saved revision is published. Availability and audience rules still apply."
                  : "A published revision exists. This view shows the saved draft; its changes are not live until published."
                : record.status === "scheduled"
                  ? "A reviewed revision is scheduled. Later draft edits do not change that scheduled revision."
                  : "This record is not currently published."}
            </p>
            <small>Updated {new Date(record.updatedAt).toLocaleString()}</small>
            <button type="button" className="btn" onClick={onReview}>
              Open publication controls <MediaIcon name="arrow" size={16} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
