import DiscussionControls from "../components/DiscussionControls";
import LoadingState from "../components/LoadingState";
import React, { useEffect, useState, useRef } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter } from "../router";
import {
  Card,
  EmptyState,
  TextField,
  SelectField,
  Tabs,
  Modal,
  Badge,
} from "../ui";
import { StatusPill, Toolbar, Note } from "../ui/ops";
import { PRIORITY, REPORT_OUTCOME } from "./opsMeta";
import { PageActions } from "../components/PageHeader";
import StaffAuth from "./StaffAuth";
import MediaIcon from "../components/MediaIcon";
import ModerationReportCard, {
  ModerationEvidenceHeader,
  ModerationQueueSummary,
  ModerationActivity,
  moderationPaths,
  moderationResource,
} from "../components/ModerationVisual";
import { homepageImage } from "../components/HomepageVisual";
import { DiscoveryContentCard } from "../components/DiscoveryVisual";
import EpisodeSelector from "../components/EpisodeSelector";
import "../components/DiscoveryVisual.css";
import "../components/ModerationVisual.css";
const outcomeFor = (kind: string) =>
  kind === "comment"
    ? {
        ...REPORT_OUTCOME,
        approved: { ...REPORT_OUTCOME.approved, label: "Comment kept" },
        removed: { ...REPORT_OUTCOME.removed, label: "Comment removed" },
      }
    : REPORT_OUTCOME;
const baseCopy: any = {
  approved: {
    label: "Approve content",
    effect:
      "Close all currently open reports on this item. Its publication stays unchanged; approval does not publish it.",
  },
  dismissed: {
    label: "Dismiss report",
    effect:
      "Close only this report as no violation. Other reports and publication stay unchanged.",
  },
  removed: {
    label: "Remove content",
    effect:
      "Unpublish this item and cancel its pending publication, then close all open reports on it. No records or media are deleted.",
  },
  reopen: {
    label: "Reopen report",
    effect:
      "Return this report to the open queue. The content stays in its current publication state.",
  },
  priority: {
    label: "Change priority",
    effect: "Record a new queue priority with your reason.",
  },
};
export default function ConnectedModeration() {
  const { route } = useRouter();
  return <Workspace key={route.parts[0] ?? "queue"} id={route.parts[0]} />;
}
function Workspace({ id }: { id?: string }) {
  const { navigate } = useRouter();
  const [session, setSession] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [report, setReport] = useState<any>(null),
    [items, setItems] = useState<any[]>([]),
    [counts, setCounts] = useState<any>({ open: 0, resolved: 0 }),
    [options, setOptions] = useState<any>({ kinds: [], categories: [] }),
    [status, setStatus] = useState("open"),
    [kind, setKind] = useState(""),
    [priority, setPriority] = useState(""),
    [q, setQ] = useState(""),
    [cursor, setCursor] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [action, setAction] = useState(""),
    [reason, setReason] = useState(""),
    [newPriority, setNewPriority] = useState("medium"),
    [composing, setComposing] = useState(false),
    [pane, setPane] = useState("evidence"),
    [artwork, setArtwork] = useState<string | null>(null),
    [artworkNotice, setArtworkNotice] = useState(""),
    [targetLabel, setTargetLabel] = useState(""),
    [targetSearch, setTargetSearch] = useState(""),
    [targetQuery, setTargetQuery] = useState(""),
    [targetCursor, setTargetCursor] = useState<string | null>(null),
    [targets, setTargets] = useState<any[]>([]),
    [draft, setDraft] = useState({
      kind: "movie",
      contentId: "",
      category: "Other",
      note: "",
    });
  const request = useRef<{ body: string; key: string } | null>(null);
  const appliedFilters = useRef({
    status: "open",
    kind: "",
    priority: "",
    q: "",
  });
  const can = (p: string) => !!session?.permissions.includes(p);
  const allowed = can("moderation.act");
  const copy =
    report?.kind === "comment"
      ? {
          ...baseCopy,
          approved: {
            label: "Keep comment",
            effect:
              "Close all currently open reports on this comment. Its current visibility stays unchanged.",
          },
          removed: {
            label: "Remove comment",
            effect:
              "Hide this comment and close its open reports. Its film, episode or music release stays published; replies remain available.",
          },
          reopen: {
            label: "Reopen report",
            effect:
              "Return the report to the open queue. This does not restore a removed comment.",
          },
        }
      : baseCopy;
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? [
              e.message,
              ...(e.payload.issues ?? []).map((i: any) => i.message),
            ].join(" ")
          : e instanceof Error
            ? e.message
            : "The request failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function load(
    after?: string,
    tab = status,
    override?: { kind: string; priority: string; q: string },
  ) {
    const criteria = after
      ? appliedFilters.current
      : { status: tab, ...(override ?? { kind, priority, q }) };
    if (!after) appliedFilters.current = criteria;
    if (id) {
      setReport(await api("/admin/moderation/reports/" + id));
    } else {
      const p = await api(
        "/admin/moderation/reports?" +
          new URLSearchParams({
            ...criteria,
            limit: "30",
            ...(after ? { after } : {}),
          }),
      );
      setItems((old) =>
        after
          ? [
              ...old,
              ...p.items.filter((r: any) => !old.some((x) => x.id === r.id)),
            ]
          : p.items,
      );
      setCursor(p.nextCursor);
    }
    setCounts(await api("/admin/moderation/summary"));
    window.dispatchEvent(new Event("mgtv-moderation"));
  }
  useEffect(() => {
    void run(async () => {
      const s = await api("/admin/session");
      setSession(s);
      if (!s.permissions.includes("moderation.read")) return;
      setOptions(await api("/admin/moderation/options"));
      await load();
    }).finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    let active = true;
    setArtwork(null);
    setArtworkNotice("");
    if (!report || report.kind === "comment") return;
    if (!can(moderationResource(report.kind) + ".read")) {
      setArtworkNotice(
        "Linked artwork requires separate content-read permission.",
      );
      return;
    }
    void api(`/admin/${moderationPaths[report.kind]}/${report.content_id}`)
      .then((r) => {
        if (active)
          setArtwork(
            report.kind === "podcast"
              ? r.coverUrl
              : homepageImage(report.kind, r),
          );
      })
      .catch(() => {
        if (active)
          setArtworkNotice(
            "Current artwork could not be loaded. Captured report evidence remains available.",
          );
      });
    return () => {
      active = false;
    };
  }, [report?.content_id, report?.kind, report?.target?.version, session]);
  useEffect(() => {
    if (!composing) return;
    setTargets([]);
    setTargetCursor(null);
    if (["comment", "episode"].includes(draft.kind)) return;
    let active = true;
    void run(async () => {
      const p = await api(
        `/admin/${moderationPaths[draft.kind]}?limit=24&q=${encodeURIComponent(targetQuery)}`,
      );
      if (active) {
        setTargets(p.items);
        setTargetCursor(p.nextCursor);
      }
    });
    return () => {
      active = false;
    };
  }, [composing, draft.kind, targetQuery]);
  async function moreTargets() {
    const parameter = ["podcast"].includes(draft.kind) ? "after" : "cursor";
    const p = await api(
      `/admin/${moderationPaths[draft.kind]}?limit=24&q=${encodeURIComponent(targetQuery)}&${parameter}=${encodeURIComponent(targetCursor ?? "")}`,
    );
    setTargets((old) => [
      ...old,
      ...p.items.filter((r: any) => !old.some((x) => x.id === r.id)),
    ]);
    setTargetCursor(p.nextCursor);
  }
  async function confirm() {
    await run(async () => {
      if (action === "priority")
        await api(
          "/admin/moderation/reports/" + id + "/priority",
          "PATCH",
          { priority: newPriority, reason },
          report.version,
        );
      else {
        const b = {
          action,
          reason,
          targetVersion: report.target.targetVersion,
        };
        const serialized = JSON.stringify(b);
        if (request.current?.body !== serialized)
          request.current = { body: serialized, key: crypto.randomUUID() };
        await api(
          "/admin/moderation/reports/" + id + "/decisions",
          "POST",
          b,
          report.version,
          request.current!.key,
        );
      }
      setAction("");
      await load();
      setNotice(
        action === "priority"
          ? "Priority saved."
          : action === "reopen"
            ? report.kind === "comment"
              ? "Report reopened. Comment visibility is unchanged."
              : "Report reopened. Publication is unchanged."
            : "Decision saved.",
      );
    });
  }
  async function create() {
    await run(async () => {
      const serialized = JSON.stringify(draft);
      if (request.current?.body !== serialized)
        request.current = { body: serialized, key: crypto.randomUUID() };
      const r = await api(
        "/admin/moderation/reports",
        "POST",
        draft,
        undefined,
        request.current!.key,
      );
      setComposing(false);
      navigate("/admin/moderation/" + r.id);
    });
  }
  if (!loaded)
    return <LoadingState label={<>Loading moderation…</>} variant="cards" />;
  if (!session)
    return (
      <StaffAuth
        onAuthenticated={async () => {
          location.reload();
        }}
      />
    );
  if (!can("moderation.read"))
    return (
      <div className="page-pad">
        <Note title="Access required">
          Explicit moderation read permission is required.
        </Note>
      </div>
    );
  return (
    <div className="page-pad moderation-workspace" aria-busy={busy}>
      <header className="md-intro">
        <span className="md-eyebrow">MGTV · COMMUNITY CARE</span>
        <h2>
          {id
            ? "The context behind the report."
            : "A clear view. A considered decision."}
        </h2>
        <p>
          {id
            ? "Compare the captured evidence, review related reports and record a reasoned decision."
            : "Keep the community welcoming while treating every report and every story with care."}
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="banner"
          style={{ color: "var(--red)", marginBottom: 14 }}
        >
          {error}{" "}
          <button className="btn" onClick={() => void run(() => load())}>
            Reload queue or report
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {!id ? (
        <>
          <PageActions>
            {allowed &&
              ["podcasts", "movies", "shows", "music", "events", "sports"].some(
                (p) => can(p + ".read"),
              ) && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setError("");
                    setComposing(true);
                    setTargetSearch("");
                    setTargetQuery("");
                  }}
                >
                  <MediaIcon name="plus" size={16} />
                  Create staff report
                </button>
              )}
          </PageActions>
          <ModerationQueueSummary counts={counts} />
          <Tabs
            label="Report status"
            value={status}
            onChange={(s: any) => {
              if (busy) return;
              setStatus(s);
              void run(() => load(undefined, s));
            }}
            items={[
              { id: "open", label: "Open", count: counts.open },
              { id: "resolved", label: "Resolved", count: counts.resolved },
            ]}
          />
          <div style={{ height: 14 }} />
          <Toolbar>
            <TextField
              label="Search reports"
              value={q}
              maxLength={200}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Title, text or category"
            />
            <SelectField
              label="Type"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              options={options.kinds}
              placeholder="All types"
            />
            <SelectField
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={["high", "medium", "low"]}
              placeholder="All priorities"
            />
            <button
              className="btn"
              disabled={busy}
              onClick={() => void run(() => load())}
            >
              <MediaIcon name="filter" size={16} />
              Apply filters
            </button>
            {(kind || priority || q) && (
              <button
                className="btn"
                disabled={busy}
                onClick={() => {
                  setKind("");
                  setPriority("");
                  setQ("");
                  void run(() =>
                    load(undefined, status, { kind: "", priority: "", q: "" }),
                  );
                }}
              >
                Clear filters
              </button>
            )}
          </Toolbar>
          <div className="md-loaded">
            <span>
              {items.length} loaded reports · {status} queue
            </span>
            <span>
              {cursor ? "More reports available" : "End of this filtered queue"}
            </span>
          </div>
          {items.length ? (
            <div className="md-queue-grid">
              {items.map((r) => (
                <ModerationReportCard key={r.id} record={r} />
              ))}
            </div>
          ) : (
            !busy &&
            !error && (
              <EmptyState
                title="No reports match this view"
                body="Change filters or switch between Open and Resolved."
              />
            )
          )}
          {cursor && (
            <button
              className="btn"
              disabled={busy}
              onClick={() => void run(() => load(cursor))}
            >
              Load more
            </button>
          )}
        </>
      ) : report ? (
        <>
          <Link className="md-back" to="/admin/moderation">
            <MediaIcon name="back" size={16} />
            Back to the queue
          </Link>
          <ModerationEvidenceHeader
            report={report}
            image={artwork}
            notice={artworkNotice}
          />
          <nav className="md-pane-nav" aria-label="Report workspace">
            {[
              { id: "evidence", label: "Evidence", icon: "image" },
              { id: "context", label: "Report details", icon: "users" },
              { id: "related", label: "Related reports", icon: "link" },
              { id: "activity", label: "Activity", icon: "clock" },
            ].map((x) => (
              <button
                className="btn"
                key={x.id}
                aria-pressed={pane === x.id}
                onClick={() => setPane(x.id)}
              >
                <MediaIcon name={x.icon} size={17} />
                {x.label}
              </button>
            ))}
          </nav>
          <div style={{ height: 14 }} />
          {!allowed && (
            <Note title="Read-only access">
              You can review reports but need explicit moderation action
              permission to decide.
            </Note>
          )}
          <div className="md-detail-layout">
            <div>
              {pane === "evidence" && (
                <>
                  <Card title="Captured evidence">
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Badge color="#C9A84C">{report.kind}</Badge>
                      <StatusPill map={PRIORITY} value={report.priority} />
                      <Badge
                        color={
                          ["published", "active"].includes(report.target.status)
                            ? "#4ade80"
                            : "#fbbf24"
                        }
                      >
                        {report.target.status}
                      </Badge>
                    </div>
                    <h3 style={{ overflowWrap: "anywhere" }}>
                      {report.snapshot.title}
                    </h3>
                    <blockquote
                      style={{
                        margin: 0,
                        padding: "10px 14px",
                        borderLeft: "3px solid var(--border-light)",
                        background: "var(--bg)",
                        borderRadius: 6,
                        lineHeight: 1.6,
                        overflowWrap: "anywhere",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {report.snapshot.snippet ||
                        "No description was available when this report was received."}
                    </blockquote>
                    {report.kind === "comment" && (
                      <div style={{ marginTop: 16 }}>
                        <strong>Current comment text</strong>
                        <p
                          style={{
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                            fontSize: 13,
                          }}
                        >
                          {report.target.currentSnippet}
                        </p>
                      </div>
                    )}
                    <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                      {report.kind === "comment"
                        ? "Comment evidence captured when the report was received."
                        : report.reporter_staff_id
                          ? "Saved draft evidence captured for this staff report."
                          : "Published evidence captured when this customer reported."}{" "}
                      Current visibility: {report.target.status}.{" "}
                      {report.target.lastRemovedAt &&
                        (report.kind === "comment"
                          ? "Reopening or approval does not restore a removed comment."
                          : "A removal decision is recorded; reopening or approval does not republish.")}
                    </p>
                    {report.kind !== "comment" &&
                      can(moderationResource(report.kind) + ".read") && (
                        <Link
                          className="btn md-back"
                          to={
                            (report.kind === "event" ||
                            report.kind === "podcast"
                              ? "/admin/"
                              : "/admin/content/") +
                            moderationPaths[report.kind] +
                            "/" +
                            report.content_id
                          }
                        >
                          <MediaIcon name="arrow" size={16} />
                          Open linked content
                        </Link>
                      )}
                  </Card>
                  {report.kind === "comment" && report.target.discussion && (
                    <DiscussionControls
                      key={
                        report.target.discussion.kind +
                        report.target.discussion.targetId
                      }
                      discussion={report.target.discussion}
                      canManage={allowed}
                    />
                  )}
                </>
              )}
              {pane === "context" && (
                <Card title="This report">
                  <dl className="moderation-facts">
                    <dt>Reason</dt>
                    <dd>{report.category}</dd>
                    <dt>Reporter</dt>
                    <dd>
                      {report.reporter_name} ·{" "}
                      {report.reporter_staff_id ? "Staff" : "Customer profile"}
                    </dd>
                    <dt>Received</dt>
                    <dd>{new Date(report.created_at).toLocaleString()}</dd>
                    <dt>Reporter’s note</dt>
                    <dd style={{ whiteSpace: "pre-wrap" }}>
                      {report.note || "None provided"}
                    </dd>
                  </dl>
                </Card>
              )}
              {pane === "related" && (
                <Card
                  title={
                    "Reports on this item (" +
                    report.relatedCounts.total +
                    " total; " +
                    report.related.length +
                    " shown)"
                  }
                >
                  <ul className="md-related">
                    {report.related.map((r: any) => (
                      <li key={r.id}>
                        <MediaIcon name="review" size={19} />
                        <div>
                          <Link to={"/admin/moderation/" + r.id}>
                            {r.category}
                            {r.id === report.id ? " · This report" : ""}
                          </Link>
                          <small>
                            {r.reporter_name} ·{" "}
                            {new Date(r.created_at).toLocaleString()}
                          </small>
                        </div>
                        {r.status === "open" ? (
                          <Badge color="#d6b354">Open</Badge>
                        ) : (
                          <StatusPill
                            map={outcomeFor(report.kind)}
                            value={r.outcome}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {pane === "activity" && (
                <Card title="Activity history">
                  {report.history.length ? (
                    <ModerationActivity items={report.history} />
                  ) : (
                    <p className="md-footnote">
                      No staff decision recorded yet.
                    </p>
                  )}
                </Card>
              )}
            </div>
            <aside>
              <Card title="Decision">
                {report.status === "open" ? (
                  <div
                    className="md-staff-report"
                    style={{ display: "grid", gap: 14 }}
                  >
                    {["approved", "dismissed", "removed"].map((a) => (
                      <div className="md-decision-option" key={a}>
                        <button
                          className={
                            "btn " +
                            (a === "removed"
                              ? "btn-danger"
                              : a === "approved"
                                ? "btn-primary"
                                : "")
                          }
                          style={{ width: "100%" }}
                          disabled={
                            busy ||
                            !allowed ||
                            (a === "removed" &&
                              ["published", "scheduled"].includes(
                                report.target.status,
                              ) &&
                              !can(
                                ((
                                  {
                                    podcast: "podcasts",
                                    movie: "movies",
                                    show: "shows",
                                    episode: "shows",
                                    music: "music",
                                    event: "events",
                                    sports: "sports",
                                  } as Record<string, string>
                                )[report.kind] ?? report.kind) + ".unpublish",
                              ))
                          }
                          onClick={() => {
                            setError("");
                            setReason("");
                            setAction(a);
                          }}
                        >
                          <MediaIcon
                            name={
                              a === "approved"
                                ? "check"
                                : a === "dismissed"
                                  ? "minus"
                                  : "archive"
                            }
                            size={17}
                          />
                          {copy[a].label}
                        </button>
                        <p
                          style={{
                            fontSize: 12.5,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {copy[a].effect}
                        </p>
                      </div>
                    ))}
                    <Note>
                      {report.relatedCounts.open} open reports on this item. A
                      new report or content change requires reloading before a
                      decision.
                    </Note>
                    <button
                      className="btn"
                      disabled={!allowed || busy}
                      onClick={() => {
                        setNewPriority(report.priority);
                        setReason("");
                        setError("");
                        setAction("priority");
                      }}
                    >
                      Change priority
                    </button>
                  </div>
                ) : (
                  <>
                    <StatusPill
                      map={outcomeFor(report.kind)}
                      value={report.outcome}
                    />
                    <p>{report.reason}</p>
                    <p>
                      Resolved {new Date(report.resolved_at).toLocaleString()}
                    </p>
                    <button
                      className="btn"
                      disabled={!allowed || busy}
                      onClick={() => {
                        setReason("");
                        setError("");
                        setAction("reopen");
                      }}
                    >
                      Reopen report
                    </button>
                  </>
                )}
              </Card>
            </aside>
          </div>
        </>
      ) : (
        !busy &&
        !error && (
          <EmptyState
            title="Report unavailable"
            body="Return to the queue and reload."
          />
        )
      )}
      {action && (
        <Modal
          title={copy[action].label + "?"}
          onClose={() => {
            if (!busy) setAction("");
          }}
          footer={
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setAction("")}
              >
                Back
              </button>
              <button
                className={
                  "btn " + (action === "removed" ? "btn-danger" : "btn-primary")
                }
                disabled={busy || !reason.trim()}
                onClick={() => void confirm()}
              >
                {copy[action].label}
              </button>
            </>
          }
        >
          <div className="md-confirm-summary">
            <span className="md-eyebrow">
              {report.kind} · REPORT VERSION {report.version}
            </span>
            <h3>{report.snapshot.title}</h3>
            <div className="md-badges">
              <StatusPill map={PRIORITY} value={report.priority} />
              <Badge color="#a4acba">{report.target.status}</Badge>
            </div>
          </div>
          <p>{copy[action].effect}</p>
          {error && (
            <p role="alert" style={{ color: "var(--red)" }}>
              {error}
            </p>
          )}
          {action === "priority" && (
            <SelectField
              label="Priority"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              options={["high", "medium", "low"]}
            />
          )}
          <TextField
            label="Reason · recorded for moderators"
            value={reason}
            maxLength={1000}
            onChange={(e) => setReason(e.target.value)}
          />
        </Modal>
      )}
      {composing && (
        <Modal
          title="Create staff report"
          width={960}
          onClose={() => {
            if (!busy) setComposing(false);
          }}
          footer={
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setComposing(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={busy || !draft.contentId}
                onClick={() => void create()}
              >
                Save report
              </button>
            </>
          }
        >
          <div className="md-staff-report" style={{ display: "grid", gap: 14 }}>
            {error && (
              <p role="alert" style={{ color: "var(--red)" }}>
                {error}
              </p>
            )}
            <SelectField
              label="Content type"
              options={options.kinds}
              disabled={busy}
              value={draft.kind}
              onChange={(e) => {
                setDraft({ ...draft, kind: e.target.value, contentId: "" });
                setTargetQuery("");
                setTargetSearch("");
                setTargetLabel("");
              }}
            />
            {draft.kind === "comment" ? (
              <TextField
                label="Comment ID"
                value={draft.contentId}
                onChange={(e) =>
                  setDraft({ ...draft, contentId: e.target.value })
                }
              />
            ) : (
              <>
                {draft.kind === "episode" ? (
                  <EpisodeSelector onRows={setTargets} onError={setError} />
                ) : (
                  <form
                    className="md-target-search"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setTargetQuery(targetSearch.trim());
                    }}
                  >
                    <input
                      className="input"
                      aria-label="Search report content"
                      maxLength={200}
                      value={targetSearch}
                      onChange={(e) => setTargetSearch(e.target.value)}
                    />
                    <button className="btn" disabled={busy}>
                      Search
                    </button>
                  </form>
                )}
                <p className="md-footnote">
                  Choose one item. {targets.length} loaded ·{" "}
                  {draft.contentId
                    ? "Selected: " + (targetLabel || draft.contentId)
                    : "No item selected"}
                </p>
                <div className="md-target-grid">
                  {targets.map((t) => (
                    <DiscoveryContentCard
                      key={t.id}
                      record={t}
                      kind={draft.kind}
                      checked={t.id === draft.contentId}
                      disabled={busy}
                      onToggle={() => {
                        setDraft({
                          ...draft,
                          contentId: draft.contentId === t.id ? "" : t.id,
                        });
                        setTargetLabel(t.draft?.title ?? t.title ?? t.id);
                      }}
                    />
                  ))}
                </div>
                {targetCursor && (
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() => void run(moreTargets)}
                  >
                    More content
                  </button>
                )}
              </>
            )}
            <SelectField
              label="Report category"
              options={options.categories}
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            />
            <TextField
              label="Report note"
              multiline
              rows={4}
              maxLength={2000}
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            />
            <Note>
              This records a staff report, never a fabricated customer report.
            </Note>
          </div>
        </Modal>
      )}
    </div>
  );
}
