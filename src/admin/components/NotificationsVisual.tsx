import { useState } from "react";
import { Link } from "../router";
import { Badge } from "../ui";
import BrandLogo from "./BrandLogo";
import MediaIcon from "./MediaIcon";
export const audienceLabel = (id: string) =>
  ({
    all: "All eligible profiles",
    subscribers: "Subscribers",
    free: "Free customers",
    roots: "Roots",
    rhythm: "Rhythm",
    gold: "Gold",
    early_events: "Early event access",
  })[id] ?? id.replace(/_/g, " ");
export const categoryIcon = (category: string) =>
  ({
    Shows: "series",
    Movies: "film",
    Music: "audio",
    Events: "calendar",
    Awards: "sport",
    System: "bell",
  })[category] ?? "bell";
export function NotificationStatus({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "#d6b354",
    scheduled: "#8fbdf2",
    queued: "#b7a1e8",
    sent: "#76d9b1",
    cancelled: "#a4acba",
    archived: "#a4acba",
    template: "#d6b354",
  };
  return (
    <Badge color={colors[status] ?? "#a4acba"}>
      {status[0]?.toUpperCase() + status.slice(1)}
    </Badge>
  );
}
export function ChannelChips({ channels }: { channels: string[] }) {
  return (
    <div className="nt-channel-chips">
      {channels.map((c) => (
        <span key={c}>
          <MediaIcon name={c === "in_app" ? "bell" : "mail"} size={14} />
          {c === "in_app" ? "In-app" : "Local email"}
        </span>
      ))}
    </div>
  );
}
export default function NotificationCard({
  record: r,
  template,
  busy,
  canManage,
  onUse,
}: {
  record: any;
  template: boolean;
  busy: boolean;
  canManage: boolean;
  onUse: () => void;
}) {
  const b = template ? r.body : r,
    status = template ? (r.archived_at ? "archived" : "template") : r.status;
  return (
    <article className="nt-message-card">
      <Link
        className="nt-message-open"
        to={"/admin/notifications/" + (template ? "templates/" : "") + r.id}
      >
        <div className="nt-card-top">
          <span className="nt-category-mark">
            <MediaIcon name={categoryIcon(b.category)} size={28} />
          </span>
          <NotificationStatus status={status} />
        </div>
        <small className="nt-eyebrow">
          {b.category}
          {r.lifecycle_id ? " · AUTOMATIC LIFECYCLE" : ""}
        </small>
        <h3>{template ? r.name : b.title}</h3>
        {template && <strong className="nt-template-title">{b.title}</strong>}
        <p>{b.body}</p>
        <ChannelChips channels={b.channels ?? []} />
        <div className="nt-card-audience">
          <MediaIcon name="users" size={15} />
          {audienceLabel(b.audience)}
        </div>
      </Link>
      <footer>
        <span>
          <MediaIcon name={r.schedule_at ? "calendar" : "clock"} size={14} />
          {r.schedule_at
            ? "Scheduled " + new Date(r.schedule_at).toLocaleString()
            : r.updated_at
              ? "Updated " + new Date(r.updated_at).toLocaleDateString()
              : "Saved record"}
        </span>
        {template ? (
          <button
            className="btn btn-sm"
            disabled={!!r.archived_at || busy || !canManage}
            onClick={onUse}
          >
            <MediaIcon name="plus" size={15} />
            Use template
          </button>
        ) : (
          <span>
            <MediaIcon name="arrow" size={16} />
          </span>
        )}
      </footer>
    </article>
  );
}
export function NotificationPreview({
  body,
  editable = false,
}: {
  body: any;
  editable?: boolean;
}) {
  const [channel, setChannel] = useState("in_app");
  return (
    <section className="nt-preview">
      <div className="nt-preview-heading">
        <span className="nt-eyebrow">
          {editable ? "LIVE COMPOSITION PREVIEW" : "SAVED MESSAGE PREVIEW"}
        </span>
        <div className="nt-preview-switch" aria-label="Preview channel">
          {["in_app", "email"].map((c) => (
            <button
              className="btn btn-sm"
              key={c}
              aria-pressed={channel === c}
              onClick={() => setChannel(c)}
            >
              <MediaIcon name={c === "in_app" ? "bell" : "mail"} size={15} />
              {c === "in_app" ? "In-app" : "Email"}
            </button>
          ))}
        </div>
      </div>
      <div className={"nt-preview-surface nt-preview-surface--" + channel}>
        <div className="nt-preview-brand">
          <BrandLogo width={62} />
          <span>
            {channel === "email"
              ? "PRIVATE DEVELOPMENT INBOX"
              : "YOUR MGTV MOMENT"}
          </span>
        </div>
        {channel === "email" && (
          <small className="nt-email-subject">
            Subject · {body.title || "Your message title"}
          </small>
        )}
        <div className="nt-preview-message">
          <span className="nt-category-mark">
            <MediaIcon name={categoryIcon(body.category)} size={23} />
          </span>
          <div>
            <small className="nt-eyebrow">{body.category}</small>
            <h3>{body.title || "Your next story starts here"}</h3>
            <p>{body.body || "Write a message for the MGTV community."}</p>
            <span className="nt-preview-destination">
              <MediaIcon name="arrow" size={15} />
              {body.destination}
            </span>
          </div>
        </div>
      </div>
      <small className="nt-footnote">
        Layout illustration using{" "}
        {editable ? "unsaved composer text" : "saved content"}. This preview
        sends nothing.
        {!body.channels?.includes(channel) &&
          " This channel is not selected for delivery."}
        {channel === "email" &&
          " Email remains local; the final email template may differ."}
      </small>
    </section>
  );
}
export function AudienceSummary({
  audiences,
  selected,
}: {
  audiences: any[];
  selected: string;
}) {
  const a = audiences.find((x) => x.id === selected);
  return (
    <section className="nt-audience">
      <header>
        <span className="nt-category-mark">
          <MediaIcon name="users" size={22} />
        </span>
        <div>
          <small className="nt-eyebrow">SELECTED AUDIENCE</small>
          <h3>{audienceLabel(selected)}</h3>
        </div>
      </header>
      <div className="nt-audience-counts">
        <div>
          <MediaIcon name="bell" size={18} />
          <strong>{a?.inApp ?? "—"}</strong>
          <span>In-app profiles</span>
        </div>
        <div>
          <MediaIcon name="mail" size={18} />
          <strong>{a?.email ?? "—"}</strong>
          <span>Email opt-ins</span>
        </div>
      </div>
      <p className="nt-footnote">
        System-category estimate from current preferences. Actual delivery
        rechecks the saved category, account status, profile allowance and
        subscription; segments overlap.
      </p>
      <details>
        <summary>Compare eligible segments</summary>
        <div className="nt-segment-list">
          {audiences.map((x) => (
            <div key={x.id}>
              <strong>{audienceLabel(x.id)}</strong>
              <span>
                {x.inApp} in-app · {x.email} email
              </span>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
export function NotificationOverview({
  record,
  body,
  template,
}: {
  record: any;
  body: any;
  template: boolean;
}) {
  return (
    <div className="nt-overview">
      <div className="nt-record-heading">
        <span className="nt-category-mark">
          <MediaIcon name={categoryIcon(body.category)} size={30} />
        </span>
        <div>
          <small className="nt-eyebrow">
            {template ? "REUSABLE TEMPLATE" : "SAVED MESSAGE"} · VERSION{" "}
            {record.version}
          </small>
          <h2>{template ? record.name : body.title}</h2>
          <NotificationStatus
            status={
              template
                ? record.archived_at
                  ? "archived"
                  : "template"
                : record.status
            }
          />
        </div>
      </div>
      <NotificationPreview body={body} />
      <div className="nt-overview-facts">
        <div>
          <MediaIcon name="users" />
          <span>Audience</span>
          <strong>{audienceLabel(body.audience)}</strong>
        </div>
        <div>
          <MediaIcon name="link" />
          <span>Destination</span>
          <strong>{body.destination}</strong>
        </div>
      </div>
      <ChannelChips channels={body.channels ?? []} />
      {record.lifecycle_id && (
        <p className="nt-footnote">
          Automatic lifecycle notice. Eligibility and milestone claims remain
          enforced by the server.
        </p>
      )}
    </div>
  );
}
export function DeliveryMetrics({ outcomes }: { outcomes: any[] }) {
  return (
    <div className="nt-outcomes">
      {outcomes.length ? (
        outcomes.map((o) => (
          <div key={o.channel + o.status}>
            <span className="nt-outcome-icon">
              <MediaIcon name={o.channel === "in_app" ? "bell" : "mail"} />
            </span>
            <div>
              <small>
                {o.channel === "in_app" ? "In-app" : "Local email"} · {o.status}
              </small>
              <strong>{o.count}</strong>
              {o.channel === "in_app" && <span>{o.opened} read</span>}
            </div>
          </div>
        ))
      ) : (
        <p className="nt-footnote">
          No delivery outcomes recorded. Saving or previewing a message does not
          deliver it.
        </p>
      )}
    </div>
  );
}
export function NotificationActivity({ items }: { items: any[] }) {
  return (
    <section className="nt-activity">
      <h3>Activity history</h3>
      {!items.length ? (
        <p className="nt-footnote">No activity recorded for this record.</p>
      ) : (
        <ol>
          {items.map((h) => (
            <li key={h.id}>
              <span>
                <MediaIcon name="clock" size={18} />
              </span>
              <div>
                <strong>
                  {h.action
                    .replaceAll("notifications.", "")
                    .replaceAll("_", " ")}
                </strong>
                {h.details?.reason && <p>{h.details.reason}</p>}
                <small>{new Date(h.created_at).toLocaleString()}</small>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
