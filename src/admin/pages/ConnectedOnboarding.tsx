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
  const key = useRef<{ signature: string; key: string } | null>(null);
  useDirtyGuard(() => !!reason);
  const can = (p: string) => !!session?.permissions.includes(p),
    manage = can("onboarding.manage");
  async function list(more = false) {
    const query = new URLSearchParams({ q, status, limit: "24" });
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
  return (
    <div className="page-pad people-workspace onboarding-workspace">
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
                disabled={busy}
                onClick={() => void run(load)}
              >
                Refresh progress
              </button>
            </div>
            <Card
              title={record.staff.displayName}
              aside={<span className="badge">{record.status}</span>}
            >
              <div className="access-stack">
                <p>
                  {record.staff.email} · Account {record.staff.status}
                </p>
                <div className="welcome-checks">
                  <span>{record.passwordReady ? "✓" : "○"} Password setup</span>
                  <span>{record.mfaReady ? "✓" : "○"} Authenticator</span>
                  <span>
                    {record.securityAcknowledged ? "✓" : "○"} Security guidance
                  </span>
                  <span>
                    {record.orientationAcknowledged ? "✓" : "○"} Workspace
                    orientation
                  </span>
                  <span>
                    {record.accessAcknowledged ? "✓" : "○"} Access acknowledged
                  </span>
                  <span>
                    {record.managerReviewed ? "✓" : "○"} Manager review
                  </span>
                </div>
                {record.status === "exempt" && (
                  <p>
                    This account predates the workflow. It has not been marked
                    completed; enrollment is an explicit choice that revokes its
                    current sessions.
                  </p>
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
                <h3>Access under review</h3>
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
                {manage &&
                  record.staff.id !== session.principal.id &&
                  ["open", "exempt"].includes(record.status) && (
                    <>
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
                      <small>
                        Invitations/cancellation also require staff.manage.
                        Access review requires access.manage and only
                        permissions you hold. Active staff must be suspended
                        through Staff users.
                      </small>
                    </>
                  )}
              </div>
            </Card>
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
          </>
        )
      ) : (
        <>
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
            {can("staff.manage") && (
              <Link className="btn btn-primary" to="/admin/users/new">
                Add staff account
              </Link>
            )}
          </form>
          <div className="access-grid">
            {items.map((r) => (
              <Card
                key={r.id}
                title={r.display_name}
                aside={<span className="badge">{r.status}</span>}
              >
                <div className="access-stack">
                  <p>{r.email}</p>
                  <p>Staff account: {r.account_status}</p>
                  <Link className="btn" to={"/admin/onboarding/" + r.id}>
                    View onboarding
                  </Link>
                </div>
              </Card>
            ))}
          </div>
          {!items.length && !busy && !error && (
            <Card title="No journeys match">
              <p>
                Create a staff account to begin, or choose another status to
                find existing colleagues.
              </p>
            </Card>
          )}
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
