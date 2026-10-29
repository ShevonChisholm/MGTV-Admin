import { Link } from "../router";
import { Badge } from "../ui";
import { StatusPill } from "../ui/ops";
import { PRIORITY, REPORT_OUTCOME } from "../pages/opsMeta";
import MediaIcon from "./MediaIcon";
import { HomepageImage } from "./HomepageVisual";
export const moderationPaths: Record<string, string> = {
  podcast: "podcasts",
  movie: "movies",
  show: "shows",
  episode: "episodes",
  music: "music",
  event: "events",
  sports: "sports",
};
export const moderationResource = (kind: string) =>
  kind === "episode" ? "shows" : (moderationPaths[kind] ?? kind);
export const moderationIcon = (kind: string) =>
  ({
    podcast: "podcast",
    comment: "review",
    movie: "film",
    show: "series",
    episode: "series",
    music: "audio",
    event: "calendar",
    sports: "sport",
  })[kind] ?? "file";
export function reportOutcome(kind: string) {
  return kind === "comment"
    ? {
        ...REPORT_OUTCOME,
        approved: { ...REPORT_OUTCOME.approved, label: "Comment kept" },
        removed: { ...REPORT_OUTCOME.removed, label: "Comment removed" },
      }
    : REPORT_OUTCOME;
}
export default function ModerationReportCard({ record: r }: { record: any }) {
  return (
    <article className={"md-report-card md-report-card--" + r.priority}>
      <Link to={"/admin/moderation/" + r.id}>
        <header>
          <span className="md-kind-mark">
            <MediaIcon name={moderationIcon(r.kind)} size={28} />
          </span>
          <StatusPill map={PRIORITY} value={r.priority} />
        </header>
        <small className="md-eyebrow">
          {r.kind} · {r.category}
        </small>
        <h3>{r.snapshot.title}</h3>
        <p className="md-report-excerpt">
          {r.note ||
            r.snapshot.snippet ||
            "Open the report to review its captured evidence."}
        </p>
        <footer>
          <span>
            <MediaIcon name="users" size={15} />
            {r.report_count} reports on item
          </span>
          {r.status === "open" ? (
            <Badge color="#d6b354">Open</Badge>
          ) : (
            <StatusPill map={reportOutcome(r.kind)} value={r.outcome} />
          )}
        </footer>
        <small className="md-date">
          <MediaIcon name="clock" size={13} />
          {new Date(r.created_at).toLocaleString()}
        </small>
      </Link>
    </article>
  );
}
export function ModerationEvidenceHeader({
  report: r,
  image,
  notice,
}: {
  report: any;
  image: string | null;
  notice: string;
}) {
  return (
    <section className="md-evidence-header">
      <div
        className={
          "md-evidence-art " +
          (r.kind === "comment" ? "md-evidence-art--comment" : "")
        }
      >
        {r.kind === "comment" ? (
          <div>
            <MediaIcon name="review" size={44} />
            <span>REPORTED COMMENT</span>
          </div>
        ) : (
          <HomepageImage src={image} kind={r.kind} />
        )}
      </div>
      <div className="md-evidence-heading">
        <small className="md-eyebrow">
          {r.kind} · REPORT VERSION {r.version}
        </small>
        <h2>{r.snapshot.title}</h2>
        <div className="md-badges">
          <StatusPill map={PRIORITY} value={r.priority} />
          <Badge color={r.status === "open" ? "#d6b354" : "#8fbdf2"}>
            {r.status === "open" ? "Open report" : "Resolved report"}
          </Badge>
          <Badge color="#a4acba">{r.target.status}</Badge>
        </div>
        <p>
          {r.kind === "comment"
            ? "Captured comment evidence and current text are separated below."
            : "Current artwork gives context. The report’s captured evidence remains the basis for review."}
        </p>
        {notice && <small className="md-footnote">{notice}</small>}
      </div>
    </section>
  );
}
export function ModerationQueueSummary({
  counts,
}: {
  counts: { open: number; resolved: number };
}) {
  return (
    <div className="md-queue-summary">
      <div>
        <MediaIcon name="review" size={24} />
        <span>
          <strong>{counts.open}</strong>
          <small>Open reports</small>
        </span>
      </div>
      <div>
        <MediaIcon name="check" size={24} />
        <span>
          <strong>{counts.resolved}</strong>
          <small>Resolved reports</small>
        </span>
      </div>
      <p>Review the evidence. Record the reason. Make the effect clear.</p>
    </div>
  );
}
export function ModerationActivity({ items }: { items: any[] }) {
  return (
    <ol className="md-activity">
      {items.map((h) => (
        <li key={h.id}>
          <MediaIcon name="clock" size={18} />
          <div>
            <strong>
              {h.action.replace(/^moderation\./, "").replace(/_/g, " ")}
            </strong>
            <p>{h.details.reason}</p>
            <small>{new Date(h.created_at).toLocaleString()}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
