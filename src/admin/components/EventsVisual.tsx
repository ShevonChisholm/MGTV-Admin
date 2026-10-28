import { useEffect, useState } from "react";
import MediaIcon from "./MediaIcon";
import { ContentStatus } from "./ContentVisual";
import { Link } from "../router";
import "./EventsVisual.css";
export function eventTime(
  value: string | null,
  timezone = "America/Jamaica",
  dateOnly = false,
) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Not set";
  try {
    return new Intl.DateTimeFormat("en-JM", {
      dateStyle: "medium",
      ...(!dateOnly ? { timeStyle: "short" as const } : {}),
      timeZone: timezone,
    }).format(new Date(value));
  } catch {
    return "Date unavailable";
  }
}
export function EventArt({
  record,
  slot = "landscape",
  className = "",
}: {
  record: any;
  slot?: "landscape" | "portrait";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const d = record?.draft,
    actual = d?.[slot + "VersionId"]
      ? slot
      : slot === "portrait"
        ? "landscape"
        : "portrait";
  const src = d?.[actual + "VersionId"]
    ? `/api/v1/admin/events/${record.id}/artwork/${actual}?v=${record.version}`
    : null;
  useEffect(() => setFailed(false), [src]);
  return (
    <div className={`ev-art ev-art--${slot} ${className}`}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="same-origin"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="ev-art-fallback">
          <MediaIcon name="calendar" size={36} />
          <span>{failed ? "Artwork unavailable" : "Artwork to come"}</span>
        </div>
      )}
    </div>
  );
}
export function EventState({ value, label }: { value: string; label: string }) {
  return (
    <span className={`ev-state ev-state--${value}`}>
      <MediaIcon
        name={
          value === "cancelled"
            ? "alert"
            : value === "completed"
              ? "check"
              : value === "live"
                ? "video"
                : "clock"
        }
        size={14}
      />
      <span>
        {label}: {value?.replace(/_/g, " ") ?? "Not set"}
      </span>
    </span>
  );
}
export function EventGrid({ items }: { items: any[] }) {
  return (
    <ul className="ev-grid" aria-label="Event records">
      {items.map((r) => (
        <li className="ev-card" key={r.id}>
          <Link
            to={"/admin/events/" + r.id}
            className="ev-card-link"
            aria-label={"Open " + r.draft.title}
          >
            <div className="ev-card-image">
              <EventArt record={r} />
              <ContentStatus status={r.status} />
              <span className="ev-date-badge">
                <MediaIcon name="calendar" size={16} />
                {eventTime(r.draft.startsAt, r.draft.timezone, true)}
              </span>
            </div>
            <div className="ev-card-copy">
              <span className="cv-kicker">
                {r.draft.format.replace(/_/g, " ")}
              </span>
              <h3>{r.draft.title || "Untitled event"}</h3>
              <p>
                <MediaIcon
                  name={r.draft.format === "online" ? "globe" : "pin"}
                  size={15}
                />
                {r.draft.venue ||
                  (r.draft.format === "online"
                    ? "Online event"
                    : "Venue to be confirmed")}
              </p>
              <small>{r.draft.timezone}</small>
              <EventState label="Event" value={r.lifecycle} />
              <div className="ev-card-foot">
                <span>
                  {r.draft.accessTier === "premium"
                    ? "MGTV+ playback"
                    : "Free playback"}
                </span>
                <MediaIcon name="arrow" size={18} />
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
export function EventsSkeleton() {
  return (
    <div className="ev-grid" role="status" aria-label="Loading events">
      <span className="sr-only">Loading events…</span>
      {Array.from({ length: 6 }, (_, i) => (
        <div className="ev-card ev-skeleton" key={i}>
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export function EventOverview({
  record,
  onEdit,
  canEdit,
  tax,
}: {
  record: any;
  onEdit: () => void;
  canEdit: boolean;
  tax: any[];
}) {
  const d = record.draft,
    opening =
      d.startsAt && Number.isFinite(Date.parse(d.startsAt))
        ? new Date(Date.parse(d.startsAt) - 7200000).toISOString()
        : null;
  const classification = tax.find((c) => c.id === d.classificationId)?.name;
  return (
    <div className="ev-overview">
      <section className="ev-hero">
        <EventArt record={record} />
        <div className="ev-hero-copy">
          <span className="cv-kicker">
            Saved event · {d.format.replace(/_/g, " ")}
          </span>
          <h2>{d.title || "Untitled event"}</h2>
          <div className="ev-state-row">
            <ContentStatus status={record.status} />
            <EventState label="Event" value={record.lifecycle} />
          </div>
          <p className="ev-description">
            {d.description || "Add the event story in Edit details."}
          </p>
          {canEdit && (
            <button className="btn" onClick={onEdit}>
              <MediaIcon name="edit" size={16} /> Edit details
            </button>
          )}
        </div>
      </section>
      <div className="ev-facts">
        <div>
          <MediaIcon name="calendar" />
          <span>
            <strong>{eventTime(d.startsAt, d.timezone)}</strong>Starts ·{" "}
            {d.timezone}
          </span>
        </div>
        <div>
          <MediaIcon name={d.format === "online" ? "globe" : "pin"} />
          <span>
            <strong>
              {d.venue ||
                (d.format === "online" ? "Online event" : "Venue not set")}
            </strong>
            {d.format.replace(/_/g, " ")}
          </span>
        </div>
        <div>
          <MediaIcon name={d.accessTier === "premium" ? "lock" : "globe"} />
          <span>
            <strong>
              {d.accessTier === "premium" ? "MGTV+ playback" : "Free playback"}
            </strong>
            {classification || "Classification not set"} · Admission sold
            separately
          </span>
        </div>
      </div>
      <div className="ev-overview-columns">
        <section className="ev-panel">
          <h3>
            <MediaIcon name="clock" /> Event timeline
          </h3>
          <p className="ev-muted">
            Saved schedule in {d.timezone}. The API enforces admission
            eligibility.
          </p>
          <ol className="ev-timeline">
            <li>
              <span>Planned check-in opens</span>
              <strong>{eventTime(opening, d.timezone)}</strong>
              <small>
                For MGTV ticketing, two hours before the event. A valid issued
                ticket is required; postponed or cancelled events do not admit
                guests.
              </small>
            </li>
            <li>
              <span>Event starts</span>
              <strong>{eventTime(d.startsAt, d.timezone)}</strong>
            </li>
            <li>
              <span>Event ends · check-in closes</span>
              <strong>{eventTime(d.endsAt, d.timezone)}</strong>
            </li>
          </ol>
          {record.previousStart && (
            <p className="ev-notice">
              Previous start: {eventTime(record.previousStart, d.timezone)}
            </p>
          )}
          {record.statusReason && (
            <p className="ev-notice">{record.statusReason}</p>
          )}
        </section>
        <section className="ev-panel">
          <h3>
            <MediaIcon name="artist" /> On the line-up
          </h3>
          <div className="ev-performers">
            {d.performers?.map((name: string, i: number) => (
              <div key={i}>
                <span className="ev-person-avatar" aria-hidden="true">
                  {name.trim().slice(0, 1) || "♪"}
                </span>
                <strong>{name}</strong>
              </div>
            ))}
          </div>
          {!d.performers?.length && (
            <p className="ev-muted">No performers listed yet.</p>
          )}
          <h3>
            <MediaIcon name="video" /> Broadcast & replay
          </h3>
          <EventState label="Broadcast" value={record.broadcast} />
          <p className="ev-muted">
            Event scheduling does not start a live stream. Replay availability
            follows completion and publication checks.
          </p>
          <div className="ev-attachments">
            {[
              ["Featured clip", d.featureMediaVersionId],
              ["Preview", d.previewMediaVersionId],
              ["Replay", d.replayMediaVersionId],
            ].map(([label, id]) => (
              <span key={label}>
                <MediaIcon name={id ? "check" : "minus"} size={14} />
                {label} · {id ? "Attached" : "Not attached"}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
