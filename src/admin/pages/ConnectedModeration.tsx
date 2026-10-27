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
    [targets, setTargets] = useState<any[]>([]),
    [draft, setDraft] = useState({
      kind: "movie",
      contentId: "",
      category: "Other",
      note: "",
    });
  const request = useRef<{ body: string; key: string } | null>(null);
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
  async function load(after?: string, tab = status) {
    if (id) {
      setReport(await api("/admin/moderation/reports/" + id));
    } else {
      const p = await api(
        "/admin/moderation/reports?" +
          new URLSearchParams({
            status: tab,
            kind,
            priority,
            q,
            limit: "30",
            ...(after ? { after } : {}),
          }),
      );
      setItems((old) => (after ? [...old, ...p.items] : p.items));
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
    if (!composing || draft.kind === "comment") return;
    let active = true;
    setTargets([]);
    void run(async () => {
      const paths: any = {
        sports: "sports",
        movie: "movies",
        show: "shows",
        episode: "episodes",
        music: "music",
        event: "events",
      };
      const rows: any[] = [];
      let next = "";
      do {
        const p = await api(
          "/admin/" +
            paths[draft.kind] +
            "?limit=50" +
            (next ? "&cursor=" + encodeURIComponent(next) : ""),
        );
        rows.push(...p.items);
        next = p.nextCursor;
      } while (next && active);
      if (active) setTargets(rows);
    });
    return () => {
      active = false;
    };
  }, [composing, draft.kind]);
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
    return <LoadingState label={<>Loading moderation…</>} variant="table" />;
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
    <div className="page-pad moderation-workspace">
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
              ["movies", "shows", "music", "events", "sports"].some((p) =>
                can(p + ".read"),
              ) && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setError("");
                    setComposing(true);
                  }}
                >
                  Create staff report
                </button>
              )}
          </PageActions>
          <Tabs
            label="Report status"
            value={status}
            onChange={(s: any) => {
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
              Apply filters
            </button>
          </Toolbar>
          {items.length ? (
            <div className="scroll-x">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Reported item</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Reports on item</th>
                    <th>{status === "open" ? "Received" : "Outcome"}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link to={"/admin/moderation/" + r.id}>
                          {r.snapshot.title}
                        </Link>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {r.category}
                        </div>
                      </td>
                      <td>{r.kind}</td>
                      <td>
                        <StatusPill map={PRIORITY} value={r.priority} />
                      </td>
                      <td>{r.report_count}</td>
                      <td>
                        {r.status === "open" ? (
                          new Date(r.created_at).toLocaleString()
                        ) : (
                          <StatusPill
                            map={outcomeFor(r.kind)}
                            value={r.outcome}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <Link to="/admin/moderation">← Back to the queue</Link>
          <div style={{ height: 14 }} />
          {!allowed && (
            <Note title="Read-only access">
              You can review reports but need explicit moderation action
              permission to decide.
            </Note>
          )}
          <div className="editor-layout">
            <div>
              <Card title="Reported item">
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
                {can(
                  ((
                    {
                      movie: "movies",
                      show: "shows",
                      episode: "shows",
                      music: "music",
                      event: "events",
                      sports: "sports",
                    } as Record<string, string>
                  )[report.kind] ?? report.kind) + ".read",
                ) && (
                  <Link
                    to={
                      (report.kind === "event"
                        ? "/admin/"
                        : "/admin/content/") +
                      (
                        {
                          sports: "sports",
                          movie: "movies",
                          show: "shows",
                          episode: "episodes",
                          music: "music",
                          event: "events",
                        } as any
                      )[report.kind] +
                      "/" +
                      report.content_id
                    }
                  >
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
              <Card
                title={
                  "Reports on this item (" +
                  report.relatedCounts.total +
                  " total; " +
                  report.related.length +
                  " shown)"
                }
              >
                {report.related.map((r: any) => (
                  <p key={r.id}>
                    <Link to={"/admin/moderation/" + r.id}>
                      {r.category}
                      {r.id === report.id ? " (this report)" : ""}
                    </Link>{" "}
                    · {r.reporter_name} ·{" "}
                    {r.status === "open" ? "Open" : r.outcome}
                  </p>
                ))}
              </Card>
              <Card title="Activity history">
                {report.history.length ? (
                  report.history.map((h: any) => (
                    <p key={h.id}>
                      {new Date(h.created_at).toLocaleString()} · {h.action}
                      <br />
                      {h.details.reason}
                    </p>
                  ))
                ) : (
                  <p>No staff decision recorded yet.</p>
                )}
              </Card>
            </div>
            <aside>
              <Card title="Decision">
                {report.status === "open" ? (
                  <div style={{ display: "grid", gap: 14 }}>
                    {["approved", "dismissed", "removed"].map((a) => (
                      <div key={a}>
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
          onClose={() => setAction("")}
          footer={
            <>
              <button className="btn" onClick={() => setAction("")}>
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
          onClose={() => setComposing(false)}
          footer={
            <>
              <button className="btn" onClick={() => setComposing(false)}>
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
          <div style={{ display: "grid", gap: 14 }}>
            {error && (
              <p role="alert" style={{ color: "var(--red)" }}>
                {error}
              </p>
            )}
            <SelectField
              label="Content type"
              options={options.kinds}
              value={draft.kind}
              onChange={(e) =>
                setDraft({ ...draft, kind: e.target.value, contentId: "" })
              }
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
                <label>
                  Reported item
                  <select
                    className="input"
                    value={draft.contentId}
                    onChange={(e) =>
                      setDraft({ ...draft, contentId: e.target.value })
                    }
                  >
                    <option value="">Choose an item</option>
                    {targets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.draft?.title ?? t.title} · {t.status}
                      </option>
                    ))}
                  </select>
                </label>
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
