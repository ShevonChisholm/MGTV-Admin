import {LifecycleAutomation} from "../components/LifecycleSettings";
import LoadingState from "../components/LoadingState";
import React, { useEffect, useState, useRef } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Card, TextField, SelectField, EmptyState, Modal } from "../ui";
import { RouteTabs, Note } from "../ui/ops";
import { PageActions } from "../components/PageHeader";
import StaffAuth from "./StaffAuth";
const blank = {
  title: "",
  body: "",
  category: "System",
  destination: "/notifications",
  audience: "all",
  channels: ["in_app"],
  name: "",
};
const categories = ["Shows", "Movies", "Music", "Events", "Awards", "System"];
const destinations = [
  "/",
  "/shows",
  "/movies",
  "/music",
  "/events",
  "/awards",
  "/account",
  "/notifications",
];
const sections = [
  { id: "messages", label: "Messages" },
  { id: "templates", label: "Templates" },
  { id: "history", label: "History" },
];
export default function ConnectedNotifications() {
  const { route } = useRouter();
  return <Workspace key={route.parts.join("/")} parts={route.parts} />;
}
function Workspace({ parts }: { parts: string[] }) {
  const { navigate } = useRouter();
  const tab =
    parts[0] === "templates"
      ? "templates"
      : parts[0] === "history"
        ? "history"
        : "messages";
  const template = tab === "templates";
  const id = template
    ? parts[1]
    : parts[0] === "messages"
      ? parts[1]
      : parts[0] === "history"
        ? undefined
        : parts[0];
  const editing = !!id;
  const [session, setSession] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState<any>(blank),
    [items, setItems] = useState<any[]>([]),
    [audiences, setAudiences] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [action, setAction] = useState(""),
    [reason, setReason] = useState(""),
    [schedule, setSchedule] = useState(""),
    [test, setTest] = useState<any>(null),
    [archived, setArchived] = useState(false);
  const saved = useRef(JSON.stringify(blank)),
    leaving = useRef(false),
    request = useRef<{ body: string; key: string } | null>(null);
  const dirty = editing && JSON.stringify(draft) !== saved.current;
  useDirtyGuard(() => dirty && !leaving.current);
  const can = (p: string) => session?.permissions.includes(p);
  const endpoint =
    "/admin/notifications/" + (template ? "templates" : "messages");
  const editable =
    can("notifications.manage") &&
    (!record || (template ? !record.archived_at : record.status === "draft"));
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
  function apply(r: any) {
    setRecord(r);
    const b = template ? r.body : r;
    const d = {
      ...blank,
      ...Object.fromEntries(
        Object.keys(blank).map((k) => [
          k,
          b[k] ?? blank[k as keyof typeof blank],
        ]),
      ),
    };
    setDraft(d);
    saved.current = JSON.stringify(d);
  }
  async function load(after?: string, viewArchived = archived) {
    const page = await api(
      endpoint +
        (template
          ? "?archived=" + viewArchived + (after ? "&after=" + after : "")
          : after
            ? "?after=" + after
            : ""),
    );
    setItems((old) => (after ? [...old, ...page.items] : page.items));
    setCursor(page.nextCursor);
  }
  useEffect(() => {
    void run(async () => {
      const s = await api("/admin/session");
      setSession(s);
      if (!s.permissions.includes("notifications.read")) return;
      const a = await api("/admin/notifications/audiences");
      setAudiences(a.items);
      if (editing && id !== "new") apply(await api(endpoint + "/" + id));
      else if (!editing) await load();
    }).finally(() => setLoaded(true));
  }, []);
  async function save() {
    await run(async () => {
      const { name, ...body } = draft;
      const payload = template ? draft : body;
      const serialized = JSON.stringify(payload);
      if (request.current?.body !== serialized)
        request.current = { body: serialized, key: crypto.randomUUID() };
      const r = await api(
        endpoint + (record ? "/" + record.id : ""),
        record ? "PATCH" : "POST",
        payload,
        record?.version,
        request.current!.key,
      );
      apply(r);
      setNotice("Saved.");
      if (!record) {
        leaving.current = true;
        navigate(
          "/admin/notifications/" + (template ? "templates/" : "") + r.id,
        );
      }
    });
  }
  async function command() {
    await run(async () => {
      if (template && ["archive", "restore"].includes(action)) {
        const r = await api(
          endpoint + "/" + record.id + "/actions",
          "POST",
          { action, reason },
          record.version,
        );
        apply(r);
        setAction("");
        setNotice(
          action === "archive"
            ? "Template archived. Existing messages are unchanged."
            : "Template restored.",
        );
        return;
      }
      const payload = {
        action,
        reason,
        ...(action === "schedule"
          ? { scheduleAt: new Date(schedule).toISOString() }
          : {}),
      };
      const r = await api(
        "/admin/notifications/messages/" + record.id + "/actions",
        "POST",
        payload,
        record.version,
      );
      if (r.test) setTest(r.test);
      else apply(await api(endpoint + "/" + record.id));
      setAction("");
      setNotice(
        action === "test"
          ? "Preview prepared. No audience delivery created."
          : "Message " + r.status + ".",
      );
    });
  }
  if (!loaded)
    return <LoadingState label={<>Loading notifications…</>} variant="table" />;
  if (!session)
    return (
      <StaffAuth
        onAuthenticated={async () => {
          location.reload();
        }}
      />
    );
  if (!can("notifications.read"))
    return (
      <div className="page-pad">
        <Note title="Access required">
          Your account needs explicit notification read permission.
        </Note>
      </div>
    );
  const rows = items.filter((r) =>
    template || tab === "history"
      ? !["draft", "scheduled"].includes(r.status)
      : ["draft", "scheduled"].includes(r.status),
  );
  return (
    <div className="page-pad notifications-workspace">
      <RouteTabs
        label="Notification sections"
        base="/admin/notifications"
        value={tab}
        items={sections}
      />
      <div style={{ height: 16 }} />
      {!id&&<LifecycleAutomation/>}
      {error && (
        <div
          role="alert"
          className="banner"
          style={{ color: "var(--red)", marginBottom: 16 }}
        >
          {error}{" "}
          <button className="btn" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {!editing ? (
        <>
          <PageActions>
            {can("notifications.manage") && (
              <Link
                className="btn btn-primary"
                to={
                  "/admin/notifications/" + (template ? "templates/new" : "new")
                }
              >
                {template ? "New template" : "Compose message"}
              </Link>
            )}
          </PageActions>
          <Note title="Delivery connected">
            In-app delivery is stored in customer profiles. Email is delivered
            to the private local inbox only; browser push is not configured.
          </Note>
          {template && (
            <button
              className="btn"
              style={{ marginBottom: 12 }}
              aria-pressed={archived}
              onClick={() => {
                setArchived(!archived);
                void run(() => load(undefined, !archived));
              }}
            >
              {archived ? "Show active templates" : "Show archived templates"}
            </button>
          )}
          {template && rows.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {rows.map((r) => (
                <Card key={r.id} title={r.name}>
                  <p
                    style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 14 }}
                  >
                    {r.body.title}
                  </p>
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: 13.5,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {r.body.body}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-muted)",
                        marginRight: "auto",
                      }}
                    >
                      {r.body.channels
                        .map((x: string) =>
                          x === "in_app" ? "In-app" : "Email",
                        )
                        .join(" + ")}
                    </span>
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={
                        !!r.archived_at || busy || !can("notifications.manage")
                      }
                      onClick={() =>
                        void run(async () => {
                          const { name, ...b } = r.body;
                          const created = await api(
                            "/admin/notifications/messages",
                            "POST",
                            b,
                          );
                          navigate("/admin/notifications/" + created.id);
                        })
                      }
                    >
                      Use in new message
                    </button>
                    <Link
                      className="btn btn-sm"
                      to={"/admin/notifications/templates/" + r.id}
                    >
                      {r.archived_at ? "View archived" : "Edit"}
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : rows.length ? (
            <div className="scroll-x">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{template ? "Template" : "Message"}</th>
                    <th>Audience</th>
                    <th>Channels</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link
                          to={
                            "/admin/notifications/" +
                            (template ? "templates/" : "") +
                            r.id
                          }
                        >
                          {template ? r.name : r.title}
                          {r.lifecycle_id&&<small style={{display:"block",color:"var(--accent)"}}>Automatic lifecycle notice</small>}
                        </Link>
                      </td>
                      <td>{r.audience ?? r.body?.audience}</td>
                      <td>
                        {(r.channels ?? r.body?.channels)
                          ?.map((s: string) =>
                            s === "in_app" ? "In-app" : "Email",
                          )
                          .join(" + ")}
                      </td>
                      <td>
                        {r.status ?? "Template"}
                        {r.schedule_at && (
                          <div>{new Date(r.schedule_at).toLocaleString()}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title={template ? "No templates yet" : "No messages in this view"}
              body="Compose a message or choose another tab."
            />
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
      ) : (
        <>
          <PageActions>
            <Link className="btn" to={"/admin/notifications/" + tab}>
              Back to {tab}
            </Link>
            {template && record && can("notifications.manage") && (
              <button
                className="btn"
                disabled={busy || dirty}
                onClick={() => {
                  setReason("");
                  setError("");
                  setAction(record.archived_at ? "restore" : "archive");
                }}
              >
                {record.archived_at ? "Restore template" : "Archive template…"}
              </button>
            )}
            {editable && (
              <button
                className="btn btn-primary"
                disabled={busy || !dirty}
                onClick={() => void save()}
              >
                Save {template ? "template" : "draft"}
              </button>
            )}
          </PageActions>
          <div
            className="editor-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) minmax(240px,300px)",
              gap: 20,
              alignItems: "start",
            }}
          >
            <Card
              title={template ? "Notification template" : "Compose message"}
            >
              <div style={{ display: "grid", gap: 16 }}>
                {template && (
                  <TextField
                    label="Template name"
                    value={draft.name}
                    disabled={!editable}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                  />
                )}
                <TextField
                  label="Title"
                  value={draft.title}
                  maxLength={120}
                  disabled={!editable}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
                <TextField
                  label="Message"
                  multiline
                  rows={5}
                  value={draft.body}
                  maxLength={400}
                  disabled={!editable}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                />
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {draft.body.length}/400 characters · plain text
                </div>
                <label>
                  Category
                  <select
                    className="input"
                    value={draft.category}
                    disabled={!editable}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value })
                    }
                  >
                    {categories.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <fieldset
                  disabled={!editable}
                  style={{ border: 0, padding: 0 }}
                >
                  <legend>Channels</legend>
                  {["in_app", "email"].map((x) => (
                    <label
                      key={x}
                      style={{
                        display: "inline-flex",
                        gap: 6,
                        marginRight: 16,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={draft.channels.includes(x)}
                        onChange={() =>
                          setDraft({
                            ...draft,
                            channels: draft.channels.includes(x)
                              ? draft.channels.filter((c: string) => c !== x)
                              : [...draft.channels, x],
                          })
                        }
                      />
                      {x === "in_app" ? "In-app" : "Email · local inbox"}
                    </label>
                  ))}
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 8,
                      color: "var(--text-muted)",
                    }}
                  >
                    Browser push is unavailable until delivery credentials and
                    customer opt-in are configured.
                  </div>
                </fieldset>
                <label>
                  Audience
                  <select
                    className="input"
                    disabled={!editable}
                    value={draft.audience}
                    onChange={(e) =>
                      setDraft({ ...draft, audience: e.target.value })
                    }
                  >
                    {audiences.map((a) => (
                      <option value={a.id} key={a.id}>
                        {a.id.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Destination
                  <select
                    className="input"
                    disabled={!editable}
                    value={draft.destination}
                    onChange={(e) =>
                      setDraft({ ...draft, destination: e.target.value })
                    }
                  >
                    {destinations.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <p role="status" style={{ fontSize: 12 }}>
                  {dirty
                    ? "Unsaved changes"
                    : record
                      ? "All changes saved"
                      : "New draft"}
                </p>
              </div>
            </Card>
            <div style={{ display: "grid", gap: 16 }}>
              <Card title="Message preview">
                <strong>{draft.title || "Your next story starts here"}</strong>
                <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                  {draft.body || "Write a message for the MGTV community."}
                </p>
                <span>
                  {draft.category} · {draft.destination}
                </span>
              </Card>
              <Card title="Audience segments">
                {audiences.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "8px 0",
                      fontSize: 12,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <strong>{a.id.replace("_", " ")}</strong>
                    <div>
                      {a.inApp} profiles · {a.email} email opt-ins
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Counts use the System category and current preferences.
                  Delivery rechecks the saved category, account status, profile
                  allowance and subscription. No inferred interests.
                </p>
              </Card>
              {record && !template && (
                <Card title="Delivery status">
                  <p>{record.status}</p>
                  {record.schedule_at && (
                    <p>{new Date(record.schedule_at).toLocaleString()}</p>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {can("notifications.send") &&
                      ["draft", "scheduled"].includes(record.status) &&
                      [
                        "test",
                        ...(record.status === "draft"
                          ? ["send", "schedule"]
                          : []),
                        "cancel",
                      ].map((x) => (
                        <button
                          key={x}
                          className={
                            "btn " + (x === "send" ? "btn-primary" : "")
                          }
                          disabled={busy || dirty}
                          onClick={() => {
                            setReason("");
                            setError("");
                            setAction(x);
                          }}
                        >
                          {x === "test"
                            ? "Test preview"
                            : x === "send"
                              ? "Send now"
                              : x === "schedule"
                                ? "Schedule"
                                : "Cancel message"}
                        </button>
                      ))}
                  </div>
                  {record.status === "queued" && (
                    <button
                      className="btn"
                      onClick={() =>
                        void run(async () =>
                          apply(await api(endpoint + "/" + record.id)),
                        )
                      }
                    >
                      Refresh outcome
                    </button>
                  )}
                  {record.outcomes?.map((o: any) => (
                    <p key={o.channel + o.status}>
                      {o.channel}: {o.status} {o.count}
                      {o.channel === "in_app" ? " · read " + o.opened : ""}
                    </p>
                  ))}
                  <p style={{ fontSize: 12 }}>
                    Email delivered means written to the development inbox.
                    Email opens are not tracked.
                  </p>
                </Card>
              )}
              {template && record && (
                <button
                  className="btn"
                  disabled={
                    !!record.archived_at ||
                    busy ||
                    dirty ||
                    !can("notifications.manage")
                  }
                  onClick={() =>
                    void run(async () => {
                      const { name, ...b } = draft;
                      const r = await api(
                        "/admin/notifications/messages",
                        "POST",
                        b,
                      );
                      leaving.current = true;
                      navigate("/admin/notifications/" + r.id);
                    })
                  }
                >
                  Use template to compose
                </button>
              )}
            </div>
          </div>
          {record?.history?.length > 0 && (
            <Card title="Activity history">
              {record.history.map((h: any) => (
                <p key={h.id}>
                  {new Date(h.created_at).toLocaleString()} · {h.action}{" "}
                  {h.details?.reason && "— " + h.details.reason}
                </p>
              ))}
            </Card>
          )}
        </>
      )}
      {action && (
        <Modal
          title={
            ["archive", "restore"].includes(action)
              ? action + " template"
              : action === "send"
                ? "Send this saved message?"
                : action === "schedule"
                  ? "Schedule this saved message"
                  : action === "cancel"
                    ? "Cancel this message?"
                    : "Test saved message preview"
          }
          onClose={() => setAction("")}
          footer={
            <>
              <button className="btn" onClick={() => setAction("")}>
                Back
              </button>
              <button
                className="btn btn-primary"
                disabled={
                  busy || !reason.trim() || (action === "schedule" && !schedule)
                }
                onClick={() => void command()}
              >
                Confirm {action}
              </button>
            </>
          }
        >
          {error && (
            <p role="alert" style={{ color: "var(--red)" }}>
              {error}
            </p>
          )}
          <p>
            {["archive", "restore"].includes(action)
              ? "Existing messages retain their own copy. Archived templates can be restored."
              : action === "send"
                ? "This queues real in-app notices and opted-in emails to the local inbox."
                : action === "test"
                  ? "Preview only. No customer message is created."
                  : "Scheduling uses your local time and stores UTC."}
          </p>
          {action === "schedule" && (
            <TextField
              label="Send at · local time"
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          )}
          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Modal>
      )}
      {test && (
        <Modal title="Saved message test preview" onClose={() => setTest(null)}>
          <h3>{test.title}</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{test.body}</p>
          <p>{test.notice}</p>
        </Modal>
      )}
    </div>
  );
}
