import AccessTable, { Identity, Summary } from "../components/AccessVisual";
import MediaIcon from "../components/MediaIcon";
import LoadingState from "../components/LoadingState";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Card, ConfirmDialog } from "../ui";
export default function ConnectedOnboarding() {
  const { route } = useRouter(),
    id = route.parts[0];
  const [session, setSession] = useState<any>(null),
    [record, setRecord] = useState<any>(null),
    [items, setItems] = useState<any[]>([]),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [q, setQ] = useState(""),
    [status, setStatus] = useState("open"),
    [cursor, setCursor] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [action, setAction] = useState("");
  const [pane, setPane] = useState("journey");
  const key = useRef<{ signature: string; key: string } | null>(null);
  useDirtyGuard(() => !!reason);
  const can = (p: string) => !!session?.permissions.includes(p),
    manage = can("onboarding.manage");
  async function list(more = false, search = q, state = status) {
    const query = new URLSearchParams({
      q: search,
      status: state,
      limit: "24",
    });
    if (more && cursor) query.set("cursor", cursor);
    const result = await api("/admin/onboarding/staff?" + query);
    setItems((old) => (more ? [...old, ...result.items] : result.items));
    setCursor(result.nextCursor);
  }
  async function load() {
    const s = await api("/admin/session");
    setSession(s);
    if (
      !s.permissions.includes("onboarding.read") ||
      !s.permissions.includes("staff.read")
    ) {
      setLoaded(true);
      return;
    }
    if (id) setRecord(await api("/admin/onboarding/staff/" + id));
    else await list();
    setLoaded(true);
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Onboarding could not be loaded.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setPane("journey");
    setLoaded(false);
    setRecord(null);
    setReason("");
    void run(load);
  }, [id]);
  // Include v0 for a development fixture with no journey; the API requires If-Match for every existing journey.
  async function execute() {
    const commandAction = action;
    setAction("");
    await run(async () => {
      const body = {
          reason: reason.trim(),
          ...(commandAction === "review"
            ? { accessFingerprint: record.accessFingerprint }
            : {}),
        },
        signature = JSON.stringify({
          commandAction,
          version: record.version,
          body,
        });
      if (key.current?.signature !== signature)
        key.current = { signature, key: crypto.randomUUID() };
      const result = await api(
        `/admin/onboarding/staff/${id}/${commandAction}`,
        "POST",
        body,
        record.version,
        key.current.key,
      );
      setRecord(result);
      key.current = null;
      setReason("");
    });
  }
  const checkpoints = record
    ? [
        {
          label: "Password setup",
          done: record.passwordReady,
          icon: "lock",
          hint: "The colleague sets their own password through secure account setup.",
        },
        {
          label: "Authenticator",
          done: record.mfaReady,
          icon: "lock",
          hint: "Staff enroll their authenticator before entering the workspace.",
        },
        {
          label: "Security guidance",
          done: record.securityAcknowledged,
          icon: "review",
          hint: "The colleague acknowledges the current security guidance.",
        },
        {
          label: "Workspace orientation",
          done: record.orientationAcknowledged,
          icon: "grid",
          hint: "The colleague reviews the current workspace introduction.",
        },
        {
          label: "Access acknowledged",
          done: record.accessAcknowledged,
          icon: "users",
          hint: "The colleague acknowledges their exact current access.",
        },
        {
          label: "Manager review",
          done: record.managerReviewed,
          icon: "check",
          hint: "An authorized manager reviews the current access without granting permissions.",
        },
      ]
    : [];
  return (
    <div
      className="page-pad people-workspace onboarding-workspace av-workspace"
      aria-busy={busy}
    >
      <header className="people-intro">
        <p className="people-eyebrow">People & access</p>
        <h2>Bring the next storyteller on board.</h2>
        <p>
          Track secure setup, orientation and reviewed access. Inviting someone
          or completing onboarding never grants permissions.
        </p>
      </header>
      {error && (
        <div role="alert" className="access-error">
          {error}{" "}
          <button
            className="btn"
            disabled={busy}
            onClick={() => void run(load)}
          >
            Reload
          </button>
        </div>
      )}
      {!loaded && !error ? (
        <LoadingState label="Loading workspace…" variant="cards" />
      ) : !can("onboarding.read") || !can("staff.read") ? (
        <Card title="Access restricted">
          <p>Staff onboarding requires onboarding.read and staff.read.</p>
        </Card>
      ) : id ? (
        record && (
          <>
            <div className="access-actions">
              <Link className="btn" to="/admin/onboarding">
                ← Onboarding queue
              </Link>
              <Link className="btn" to={"/admin/users/" + id}>
                Staff account & access assignments
              </Link>
              <button
                className="btn"
                disabled={busy || !!reason}
                onClick={() => void run(load)}
              >
                Refresh progress
              </button>
            </div>
            <div className="av-journey-hero">
              <span className="av-icon">
                <MediaIcon name="users" size={28} />
              </span>
              <div>
                <p className="people-eyebrow">Staff onboarding</p>
                <h2>{record.staff.displayName}</h2>
                <p>
                  {record.staff.email} · Account {record.staff.status}
                </p>
              </div>
              <span className="av-status" data-state={record.status}>
                {record.status === "exempt"
                  ? "Predates workflow"
                  : record.status}
              </span>
            </div>
            <nav className="av-section-nav" aria-label="Onboarding sections">
              {[
                { id: "journey", label: "Journey", icon: "review" },
                { id: "access", label: "Access under review", icon: "lock" },
                { id: "activity", label: "Activity", icon: "clock" },
              ].map((section) => (
                <button
                  className="btn"
                  type="button"
                  key={section.id}
                  aria-current={pane === section.id ? "page" : undefined}
                  disabled={busy || (!!reason && pane !== section.id)}
                  onClick={() => setPane(section.id)}
                >
                  <MediaIcon name={section.icon} size={17} />
                  {section.label}
                </button>
              ))}
            </nav>
            <section
              hidden={pane !== "journey"}
              aria-label="Onboarding journey"
            >
              <div className="av-check-count">
                <progress
                  max={6}
                  value={checkpoints.filter((c) => c.done).length}
                  aria-label="Recorded onboarding checks"
                />
                <span>
                  {checkpoints.filter((c) => c.done).length} of 6 checks
                  recorded
                </span>
              </div>
              <ol className="av-milestones">
                {checkpoints.map((checkpoint, i) => (
                  <li key={checkpoint.label} data-done={!!checkpoint.done}>
                    <span className="av-icon">
                      <MediaIcon
                        name={checkpoint.done ? "check" : checkpoint.icon}
                      />
                    </span>
                    <h4>
                      {i + 1}. {checkpoint.label}
                    </h4>
                    <span
                      className="av-status"
                      data-state={checkpoint.done ? "active" : "neutral"}
                    >
                      {checkpoint.done ? "Recorded" : "Not recorded"}
                    </span>
                    <p>{checkpoint.hint}</p>
                  </li>
                ))}
              </ol>
              <div className="av-panel">
                {record.status === "exempt" && (
                  <p>
                    This account predates the workflow. It has not been marked
                    completed; enrollment is an explicit choice that revokes its
                    current sessions.
                  </p>
                )}
                <h3>
                  <MediaIcon name="mail" />
                  Invitation & delivery
                </h3>
                {!record.invitation && (
                  <p>No invitation has been issued for this account.</p>
                )}
                {record.invitation && (
                  <p>
                    Latest invitation:{" "}
                    {record.invitation.consumed_at
                      ? "Used or superseded"
                      : new Date(record.invitation.expires_at) > new Date()
                        ? "Available"
                        : "Expired"}{" "}
                    · delivery{" "}
                    {record.invitation.delivery_state ?? "Not queued"}
                    {record.invitation.provider_outcome
                      ? " · " + record.invitation.provider_outcome
                      : ""}
                    . Link expires{" "}
                    {new Date(record.invitation.expires_at).toLocaleString()}.
                  </p>
                )}
              </div>
            </section>
            <section
              className="av-panel"
              hidden={pane !== "access"}
              aria-label="Access under review"
            >
              <h3>
                <MediaIcon name="lock" />
                Access under review
              </h3>
              <div className="access-chips">
                {record.permissions.map((p: string) => (
                  <code key={p}>{p}</code>
                ))}
                {!record.permissions.length && (
                  <p>
                    No explicit resource access. Assign appropriate roles or
                    direct grants on the staff record first.
                  </p>
                )}
              </div>
              <p>
                Roles:{" "}
                {record.roles
                  .map((r: any) => r.name + (r.active ? "" : " (inactive)"))
                  .join(", ") || "None"}
              </p>
            </section>
            <section hidden={pane !== "journey"}>
              {manage &&
                record.staff.id !== session.principal.id &&
                ["open", "exempt"].includes(record.status) && (
                  <details className="av-panel">
                    <summary>
                      Manager actions · reason and confirmation required
                    </summary>
                    <div className="access-stack" style={{ marginTop: 18 }}>
                      <label>
                        Reason for this action
                        <textarea
                          className="input"
                          value={reason}
                          maxLength={2000}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </label>
                      <div className="access-actions">
                        {record.status === "exempt" ? (
                          <button
                            className="btn btn-primary"
                            disabled={busy || !reason.trim()}
                            onClick={() => setAction("enroll")}
                          >
                            Enroll in onboarding
                          </button>
                        ) : (
                          <>
                            {record.staff.status === "pending" && (
                              <>
                                <button
                                  className="btn btn-primary"
                                  disabled={
                                    busy ||
                                    !reason.trim() ||
                                    !can("staff.manage")
                                  }
                                  onClick={() => setAction("invite")}
                                >
                                  Issue or resend invitation
                                </button>
                                <button
                                  className="btn btn-danger"
                                  disabled={
                                    busy ||
                                    !reason.trim() ||
                                    !can("staff.manage")
                                  }
                                  onClick={() => setAction("cancel")}
                                >
                                  Cancel pending onboarding
                                </button>
                              </>
                            )}
                            <button
                              className="btn btn-primary"
                              disabled={
                                busy ||
                                !reason.trim() ||
                                !can("access.manage") ||
                                !record.mfaReady ||
                                record.staff.status !== "active" ||
                                !record.permissions.length
                              }
                              onClick={() => setAction("review")}
                            >
                              Review & confirm current access
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        className="btn"
                        type="button"
                        disabled={busy || !reason}
                        onClick={() => setReason("")}
                      >
                        Clear action reason
                      </button>
                      <small>
                        Invitations/cancellation also require staff.manage.
                        Access review requires access.manage and only
                        permissions you hold. Active staff must be suspended
                        through Staff users.
                      </small>
                    </div>
                  </details>
                )}
            </section>
            <section hidden={pane !== "activity"}>
              <Card title="Onboarding history">
                <ol className="access-history">
                  {record.history.map((h: any) => (
                    <li key={h.id}>
                      <strong>{h.action}</strong>
                      <p>
                        {h.actor} · {new Date(h.created_at).toLocaleString()}
                      </p>
                      <p>{h.details.reason ?? h.details.step ?? ""}</p>
                    </li>
                  ))}
                </ol>
                {!record.history.length && (
                  <p>No onboarding activity recorded yet.</p>
                )}
              </Card>
            </section>
          </>
        )
      ) : (
        <>
          <Summary
            items={[
              { icon: "users", label: "Journeys loaded", value: items.length },
              {
                icon: "clock",
                label: "Open in loaded list",
                value: items.filter((i) => i.status === "open").length,
              },
              {
                icon: "check",
                label: "Completed in loaded list",
                value: items.filter((i) => i.status === "completed").length,
              },
            ]}
          />
          <form
            className="access-toolbar"
            onSubmit={(e) => {
              e.preventDefault();
              void run(() => list());
            }}
          >
            <label>
              Find a colleague
              <input
                className="input"
                value={q}
                maxLength={120}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <label>
              Journey status
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="open">Open</option>
                <option value="completed">Completed</option>
                <option value="exempt">Predates workflow</option>
                <option value="cancelled">Cancelled</option>
                <option value="">All statuses</option>
              </select>
            </label>
            <button className="btn" disabled={busy}>
              Apply filters
            </button>
            <button
              className="btn"
              type="button"
              disabled={busy || (!q && status === "open")}
              onClick={() => {
                setQ("");
                setStatus("open");
                void run(() => list(false, "", "open"));
              }}
            >
              <MediaIcon name="refresh" size={16} />
              Reset
            </button>
            {can("staff.manage") && (
              <Link className="btn btn-primary" to="/admin/users/new">
                Add staff account
              </Link>
            )}
          </form>
          <p className="av-caption">
            {items.length} journeys loaded
            {cursor ? " · More available from the server" : ""}. Table pages
            cover loaded journeys; Load more retrieves the next set.
          </p>
          <AccessTable
            label="Staff onboarding queue"
            rows={items}
            rowKey={(r) => r.id}
            key={q + ":" + status + ":" + items.map((r) => r.id).join(",")}
            scope="loaded journeys"
            columns={[
              {
                key: "staff",
                label: "Colleague",
                render: (r) => (
                  <Identity
                    name={r.display_name}
                    detail={r.email}
                    icon="users"
                  />
                ),
              },
              {
                key: "status",
                label: "Journey",
                render: (r) => (
                  <span className="av-status" data-state={r.status}>
                    {r.status === "exempt" ? "Predates workflow" : r.status}
                  </span>
                ),
              },
              {
                key: "account",
                label: "Staff account",
                render: (r) => (
                  <span className="av-status" data-state={r.account_status}>
                    {r.account_status}
                  </span>
                ),
              },
              {
                key: "view",
                label: "Next step",
                render: (r) => (
                  <Link
                    className="btn av-link"
                    to={"/admin/onboarding/" + r.id}
                    aria-label={"View onboarding for " + r.display_name}
                  >
                    View journey
                    <MediaIcon name="arrow" size={16} />
                  </Link>
                ),
              },
            ]}
            empty="Try another colleague or journey status. Add a staff account to begin a new journey."
          />
          {cursor && (
            <button
              className="btn"
              disabled={busy}
              onClick={() => void run(() => list(true))}
            >
              Load more journeys
            </button>
          )}
        </>
      )}
      {action && (
        <ConfirmDialog
          title={
            action === "cancel"
              ? "Cancel this pending staff account?"
              : action === "enroll"
                ? "Start onboarding for this colleague?"
                : action === "review"
                  ? "Confirm this exact access?"
                  : "Issue a private staff invitation?"
          }
          confirmLabel="Confirm action"
          onCancel={() => setAction("")}
          onConfirm={() => void execute()}
        >
          <p>
            {action === "cancel"
              ? "This revokes the pending account and invalidates outstanding invitations."
              : action === "enroll"
                ? "Their current sessions will close. They must complete the new onboarding workflow before returning to the workspace."
                : action === "review"
                  ? "This records your review without granting or changing any permission. Later access changes invalidate this review until onboarding is complete."
                  : "The latest invitation replaces earlier links. Local development delivery remains enabled; no production email is configured."}
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
