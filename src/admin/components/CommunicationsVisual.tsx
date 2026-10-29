import MediaIcon from "./MediaIcon";
import AccessTable, { Identity } from "./AccessVisual";
export type CommunicationsTab = "contact" | "subscribers" | "campaigns";
export const communicationsNames = {
  contact: "Contact inbox",
  subscribers: "Subscribers",
  campaigns: "Newsletters",
};
export const communicationsIcons = {
  contact: "mail",
  subscribers: "users",
  campaigns: "send",
};
export const readable = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export function communicationsDate(value?: string) {
  return value
    ? new Date(value).toLocaleString("en-JM", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Jamaica",
      })
    : "Not recorded";
}
export function CommunicationStatus({ value }: { value: string }) {
  return (
    <span className="cm-status" data-status={value}>
      <span />
      {readable(value)}
    </span>
  );
}
export function CommunicationsHero({ tab }: { tab: CommunicationsTab }) {
  return (
    <header className="cm-hero">
      <div>
        <span className="cm-eyebrow">
          <MediaIcon name={communicationsIcons[tab]} size={16} />
          MGTV CONNECTIONS
        </span>
        <h2>
          {tab === "contact"
            ? "Every conversation matters."
            : tab === "subscribers"
              ? "An audience built on trust."
              : "Keep your audience in the know."}
        </h2>
        <p>
          {tab === "contact"
            ? "Turn incoming questions into clear answers, with one shared view of the conversation."
            : tab === "subscribers"
              ? "Understand consent at a glance and keep every subscriber choice respected."
              : "Shape the next MGTV update, review its message and follow recorded delivery outcomes."}
        </p>
      </div>
      <svg className="cm-illustration" viewBox="0 0 240 150" aria-hidden="true">
        <circle cx="165" cy="70" r="70" fill="currentColor" opacity=".06" />
        <rect
          x="43"
          y="28"
          width="133"
          height="93"
          rx="9"
          transform="rotate(-9 43 28)"
          fill="var(--bg)"
          stroke="currentColor"
          opacity=".5"
        />
        <rect
          x="61"
          y="25"
          width="133"
          height="100"
          rx="9"
          fill="var(--card)"
          stroke="currentColor"
        />
        <path
          d="m65 42 63 43 62-43M65 117l44-41m81 41-43-41"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="190" cy="30" r="21" fill="var(--accent)" />
        <path
          d="m180 30 7 7 13-15"
          fill="none"
          stroke="var(--bg)"
          strokeWidth="3"
        />
      </svg>
    </header>
  );
}
export function CommunicationsSnapshot({
  rows,
  tab,
  more,
}: {
  rows: any[];
  tab: CommunicationsTab;
  more: boolean;
}) {
  const groups =
    tab === "contact"
      ? [
          { label: "Awaiting review", states: ["new"], icon: "mail" },
          { label: "In progress", states: ["in_progress"], icon: "clock" },
          { label: "Resolved", states: ["resolved"], icon: "check" },
        ]
      : tab === "subscribers"
        ? [
            { label: "Confirmed", states: ["confirmed"], icon: "check" },
            {
              label: "Awaiting confirmation",
              states: ["pending"],
              icon: "clock",
            },
            {
              label: "Unsubscribed / suppressed",
              states: ["unsubscribed", "suppressed"],
              icon: "lock",
            },
          ]
        : [
            { label: "Drafts", states: ["draft"], icon: "edit" },
            { label: "Sending", states: ["sending"], icon: "send" },
            { label: "Completed", states: ["completed"], icon: "check" },
          ];
  return (
    <section className="cm-snapshot" aria-label="Loaded result summary">
      <div className="cm-snapshot-label">
        <strong>
          {rows.length}
          {more ? "+" : ""}
        </strong>
        <span>
          matching records loaded
          <small>Status counts below cover loaded results only.</small>
        </span>
      </div>
      <div className="cm-stat-grid">
        {groups.map((g) => (
          <div key={g.label}>
            <span className="cm-icon">
              <MediaIcon name={g.icon} />
            </span>
            <span>
              <strong>
                {rows.filter((r) => g.states.includes(r.status)).length}
              </strong>
              <small>{g.label}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
export function CommunicationsDirectory({
  tab,
  rows,
  busy,
  open,
}: {
  tab: CommunicationsTab;
  rows: any[];
  busy: boolean;
  open: (id: string) => void;
}) {
  return (
    <AccessTable
      label={communicationsNames[tab]}
      scope="loaded matching records"
      rows={rows}
      rowKey={(r) => r.id}
      empty="No records match this search and status. Try clearing your filters."
      columns={[
        {
          key: "identity",
          label:
            tab === "contact"
              ? "Enquiry"
              : tab === "subscribers"
                ? "Subscriber"
                : "Newsletter",
          render: (r) => (
            <div className="cm-row-identity">
              <Identity
                icon={communicationsIcons[tab]}
                name={r.subject ?? r.email}
                detail={
                  tab === "contact"
                    ? r.name + " / " + r.email
                    : tab === "subscribers"
                      ? "Consent: " + r.consent_version
                      : undefined
                }
              />
              {r.fixture && (
                <span className="cm-fixture">Development fixture</span>
              )}
            </div>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (r) => <CommunicationStatus value={r.status} />,
        },
        {
          key: "date",
          label:
            tab === "subscribers"
              ? "Requested / Jamaica time"
              : "Created / Jamaica time",
          render: (r) => (
            <time dateTime={r.created_at ?? r.requested_at}>
              {communicationsDate(r.created_at ?? r.requested_at)}
            </time>
          ),
        },
        {
          key: "open",
          label: "Workspace",
          render: (r) => (
            <button
              className="btn av-link"
              disabled={busy}
              onClick={() => open(r.id)}
              aria-label={"Open " + (r.subject ?? r.email)}
            >
              Open
              <MediaIcon name="arrow" size={15} />
            </button>
          ),
        },
      ]}
    />
  );
}
export function CommunicationFacts({
  record,
  tab,
}: {
  record: any;
  tab: CommunicationsTab;
}) {
  return (
    <section className="cm-facts" aria-label="Record overview">
      <div>
        <span className="cm-icon">
          <MediaIcon name={communicationsIcons[tab]} />
        </span>
        <span>
          <small>Current status</small>
          <CommunicationStatus value={record.status} />
        </span>
      </div>
      <div>
        <span className="cm-icon">
          <MediaIcon name={tab === "subscribers" ? "lock" : "calendar"} />
        </span>
        <span>
          <small>
            {tab === "subscribers"
              ? "Consent version"
              : "Created / Jamaica time"}
          </small>
          <strong>
            {tab === "subscribers"
              ? (record.consentVersion ?? record.consent_version)
              : communicationsDate(record.created_at)}
          </strong>
        </span>
      </div>
      <div>
        <span className="cm-icon">
          <MediaIcon name="archive" />
        </span>
        <span>
          <small>Record version</small>
          <strong>v{record.version}</strong>
        </span>
      </div>
    </section>
  );
}
export function NewsletterPreview({
  subject,
  body,
}: {
  subject: string;
  body: string;
}) {
  return (
    <section
      className="cm-mail-preview"
      aria-label="Newsletter content preview"
    >
      <div className="cm-mail-top">
        <MediaIcon name="mail" />
        <span>MGTV NEWSLETTER</span>
        <span className="cm-fixture">Local preview</span>
      </div>
      <div className="cm-mail-content">
        <span className="cm-eyebrow">YOUR NEXT MGTV MOMENT</span>
        <h3>{subject.trim() || "Your newsletter subject"}</h3>
        <p className={!body.trim() ? "cm-placeholder" : ""}>
          {body.trim()
            ? body
            : "Write your message to see how the newsletter reads."}
        </p>
      </div>
      <footer>
        Each eligible subscriber receives a private unsubscribe link. This is a
        content preview; delivery uses the existing email template.
      </footer>
    </section>
  );
}
export function CommunicationHistory({
  record,
  tab,
}: {
  record: any;
  tab: CommunicationsTab;
}) {
  return (
    <section className="cm-history">
      <header className="cm-section-title">
        <span className="cm-icon">
          <MediaIcon name="clock" />
        </span>
        <div>
          <h3>
            {tab === "subscribers" ? "Consent history" : "Activity history"}
          </h3>
          <p>Recorded actions and reasons, latest first.</p>
        </div>
      </header>
      {record.history?.length ? (
        <ol>
          {record.history.map((h: any, i: number) => (
            <li key={h.id ?? i}>
              <span className="cm-history-dot" />
              <div>
                <strong>{readable(h.action)}</strong>
                <span>
                  {h.actor} / {communicationsDate(h.created_at)}
                </span>
                {h.reason && <p>{h.reason}</p>}
                {h.text && <blockquote>{h.text}</blockquote>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="cm-muted">No recorded actions yet.</p>
      )}
    </section>
  );
}
export function CommunicationDelivery({ record }: { record: any }) {
  return (
    <section className="cm-delivery">
      <header className="cm-section-title">
        <span className="cm-icon">
          <MediaIcon name="send" />
        </span>
        <div>
          <h3>Local delivery outcomes</h3>
          <p>Recorded results from the private development inbox.</p>
        </div>
      </header>
      {record.outcomes?.length > 0 ? (
        <div className="cm-outcomes">
          {record.outcomes.map((o: any) => (
            <div key={o.status}>
              <CommunicationStatus value={o.status} />
              <strong>{o.count}</strong>
            </div>
          ))}
        </div>
      ) : record.replies?.length > 0 ? (
        <AccessTable
          label="Reply delivery history"
          rows={record.replies}
          rowKey={(o: any) => o.id}
          columns={[
            {
              key: "status",
              label: "Delivery",
              render: (o: any) => <CommunicationStatus value={o.status} />,
            },
            {
              key: "outcome",
              label: "Outcome",
              render: (o: any) => o.outcome || "Awaiting outcome",
            },
            {
              key: "attempts",
              label: "Attempts",
              render: (o: any) => o.attempts,
            },
            {
              key: "created",
              label: "Queued / Jamaica time",
              render: (o: any) => communicationsDate(o.created_at),
            },
          ]}
        />
      ) : (
        <p className="cm-muted">
          No delivery outcomes recorded. A saved draft is not a sent message.
        </p>
      )}
    </section>
  );
}
