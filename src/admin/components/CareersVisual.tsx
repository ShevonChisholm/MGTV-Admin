import { useState } from "react";
import MediaIcon from "./MediaIcon";
export const careerLabel = (s: string) =>
  s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const careerDate = (value: string) =>
  value
    ? new Date(value).toLocaleString("en-JM", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Jamaica",
      })
    : "Not set";
export function CareerStatus({ record }: { record: any }) {
  const expired =
    record.status === "published" &&
    Date.parse(record.published?.closesAt) <= Date.now();
  return (
    <span
      className="career-v-status"
      data-status={expired ? "expired" : record.status}
    >
      <span />
      {expired ? "Published / expired" : careerLabel(record.status)}
    </span>
  );
}
export function CareersHero() {
  return (
    <header className="career-v-hero">
      <div>
        <span className="career-v-eyebrow">
          <MediaIcon name="users" size={16} />
          BUILDING MGTV TOGETHER
        </span>
        <h2>Make room for the next great talent.</h2>
        <p>
          Shape each opportunity, keep publication decisions clear and help the
          right people find their place at MGTV.
        </p>
      </div>
      <svg
        className="career-v-illustration"
        viewBox="0 0 220 150"
        aria-hidden="true"
      >
        <rect
          x="26"
          y="24"
          width="168"
          height="110"
          rx="14"
          fill="var(--bg)"
          stroke="currentColor"
          opacity=".5"
        />
        <path d="M26 51h168" stroke="currentColor" opacity=".5" />
        <circle cx="43" cy="38" r="3" fill="currentColor" />
        <circle cx="55" cy="38" r="3" fill="currentColor" opacity=".5" />
        <circle
          cx="94"
          cy="79"
          r="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M72 117v-5a22 22 0 0 1 44 0v5m14-45h43m-43 13h32m-32 20h28"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="185" cy="27" r="21" fill="var(--accent)" />
        <path
          d="m175 27 7 7 13-15"
          fill="none"
          stroke="var(--bg)"
          strokeWidth="3"
        />
      </svg>
    </header>
  );
}
export default function CareersDirectory({
  items,
  next,
  open,
}: {
  items: any[];
  next: boolean;
  open: (id: string) => void;
}) {
  const [page, setPage] = useState(0),
    pages = Math.max(1, Math.ceil(items.length / 6)),
    current = Math.min(page, pages - 1),
    start = current * 6;
  return (
    <section className="career-v-directory" aria-label="Vacancies">
      <div className="career-v-summary">
        <div>
          <span className="career-v-icon">
            <MediaIcon name="users" />
          </span>
          <span>
            <strong>
              {items.length}
              {next ? "+" : ""}
            </strong>
            <small>matching vacancies loaded</small>
          </span>
        </div>
        {["draft", "published", "closed"].map((status) => (
          <div key={status}>
            <span className="career-v-icon">
              <MediaIcon
                name={
                  status === "draft"
                    ? "edit"
                    : status === "published"
                      ? "globe"
                      : "lock"
                }
              />
            </span>
            <span>
              <strong>{items.filter((r) => r.status === status).length}</strong>
              <small>{careerLabel(status)}</small>
            </span>
          </div>
        ))}
      </div>
      <p className="career-v-scope">
        Cards show saved draft details; counts and pages cover loaded matching
        records. Published vacancies can still be expired; check their closing
        date.
      </p>
      <div className="career-v-vacancies">
        {items.slice(start, start + 6).map((r) => (
          <button
            className="career-v-vacancy"
            aria-label={"Open vacancy: " + r.draft.title}
            key={r.id}
            onClick={() => open(r.id)}
          >
            <div className="career-v-card-top">
              <span className="career-v-icon">
                <MediaIcon name="users" size={23} />
              </span>
              <CareerStatus record={r} />
            </div>
            <span className="career-v-department">{r.draft.department}</span>
            <h3>{r.draft.title}</h3>
            <p>{r.draft.summary}</p>
            <div className="career-v-card-facts">
              <span>
                <MediaIcon name="pin" size={15} />
                {r.draft.location}
              </span>
              <span>
                <MediaIcon name="globe" size={15} />
                {careerLabel(r.draft.workplace)} /{" "}
                {careerLabel(r.draft.employment)}
              </span>
              <span>
                <MediaIcon name="calendar" size={15} />
                Draft closes {careerDate(r.draft.closesAt)}
              </span>
            </div>
            <div className="career-v-card-bottom">
              <span>
                Open vacancy <MediaIcon name="arrow" size={16} />
              </span>
              <small>v{r.version}</small>
            </div>
          </button>
        ))}
      </div>
      {!items.length && (
        <div className="career-v-empty">
          <span className="career-v-icon">
            <MediaIcon name="search" size={25} />
          </span>
          <h3>No matching opportunities</h3>
          <p>Clear your filters or create a private draft to begin.</p>
        </div>
      )}
      <div className="career-v-pagination">
        <p role="status">
          {items.length
            ? `${start + 1}-${Math.min(start + 6, items.length)} of ${items.length}`
            : "0"}{" "}
          loaded vacancies
        </p>
        <div>
          <button
            className="btn"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            aria-label="Previous vacancy page"
          >
            <MediaIcon name="back" size={16} />
            Previous
          </button>
          <span>
            Page {current + 1} / {pages}
          </span>
          <button
            className="btn"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
            aria-label="Next vacancy page"
          >
            Next
            <MediaIcon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
export function CareerFacts({ body }: { body: any }) {
  return (
    <dl className="career-v-facts">
      {[
        { label: "Team", value: body.department, icon: "users" },
        { label: "Location", value: body.location, icon: "pin" },
        {
          label: "Workplace",
          value: careerLabel(body.workplace),
          icon: "globe",
        },
        {
          label: "Employment",
          value: careerLabel(body.employment),
          icon: "clock",
        },
        {
          label: "Applications close / Jamaica time",
          value: careerDate(body.closesAt),
          icon: "calendar",
        },
      ].map((f) => (
        <div key={f.label}>
          <span className="career-v-icon">
            <MediaIcon name={f.icon} />
          </span>
          <div>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
export function CareerOverview({ body, label }: { body: any; label: string }) {
  let destination = "Not set";
  try {
    destination = new URL(body.applicationUrl).hostname;
  } catch {}
  return (
    <section className="career-v-role-overview" aria-label={label}>
      <div className="career-v-overview-heading">
        <span className="career-v-eyebrow">
          <MediaIcon name="file" size={16} />
          {label}
        </span>
        <h2>{body.title}</h2>
        <p>{body.summary}</p>
      </div>
      <CareerFacts body={body} />
      <div className="career-v-copy-grid">
        <section>
          <h3>
            <MediaIcon name="brand" size={18} />
            The opportunity
          </h3>
          <p>{body.description}</p>
        </section>
        <section>
          <h3>
            <MediaIcon name="check" size={18} />
            What applicants will bring
          </h3>
          <p>{body.requirements}</p>
        </section>
      </div>
      <div className="career-v-destination">
        <span className="career-v-icon">
          <MediaIcon name="globe" />
        </span>
        <div>
          <strong>Applications are handled externally</strong>
          <span>{destination}</span>
          <p>{body.applicationUrl}</p>
          <small>
            MGTV does not collect applications or resumes. Confirm this
            destination with your recruitment team.
          </small>
        </div>
      </div>
    </section>
  );
}
export function CareerHistory({ items }: { items: any[] }) {
  return (
    <section className="career-panel career-v-history">
      <header className="career-v-section-heading">
        <span className="career-v-icon">
          <MediaIcon name="clock" />
        </span>
        <div>
          <h2>Saved version history</h2>
          <p>
            Latest 100 changes. Expand a revision to inspect its recorded reason
            and saved summary.
          </p>
        </div>
      </header>
      {items.map((h) => (
        <details key={h.version}>
          <summary>
            <span className="career-v-version">v{h.version}</span>
            <strong>{careerLabel(h.action)}</strong>
            <time dateTime={h.created_at}>{careerDate(h.created_at)}</time>
          </summary>
          <div>
            <p>{h.reason || "No reason recorded."}</p>
            <h3>{h.body.title}</h3>
            <span>
              {h.body.department} / {h.body.location}
            </span>
            <p>{h.body.summary}</p>
          </div>
        </details>
      ))}
      {!items.length && (
        <p className="career-help">No revisions recorded yet.</p>
      )}
    </section>
  );
}
