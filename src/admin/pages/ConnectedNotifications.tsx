import { LifecycleAutomation } from "../components/LifecycleSettings";
import LoadingState from "../components/LoadingState";
import React, { useEffect, useState, useRef } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Card, TextField, EmptyState, Modal } from "../ui";
import { RouteTabs, Note } from "../ui/ops";
import { PageActions } from "../components/PageHeader";
import StaffAuth from "./StaffAuth";
import MediaIcon from "../components/MediaIcon";
import NotificationCard, {
  NotificationPreview,
  NotificationOverview,
  AudienceSummary,
  DeliveryMetrics,
  NotificationActivity,
  NotificationStatus,
  audienceLabel,
  ChannelChips,
} from "../components/NotificationsVisual";
import "../components/NotificationsVisual.css";
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
    [archived, setArchived] = useState(false),
    [pane, setPane] = useState(id === "new" ? "edit" : "overview"),
    [step, setStep] = useState("message"),
    [filterQuery, setFilterQuery] = useState(""),
    [filterCategory, setFilterCategory] = useState(""),
    [filterStatus, setFilterStatus] = useState("");
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
    setItems((old) =>
      after
        ? [
            ...old,
            ...page.items.filter((r: any) => !old.some((x) => x.id === r.id)),
          ]
        : page.items,
    );
    setCursor(page.nextCursor);
  }
  useEffect(() => {
    let active = true;
    void run(async () => {
      const s = await api("/admin/session");
      if (!active) return;
      setSession(s);
      if (!s.permissions.includes("notifications.read")) return;
      const [a, data] = await Promise.all([
        api("/admin/notifications/audiences"),
        editing
          ? id !== "new"
            ? api(endpoint + "/" + id)
            : Promise.resolve(null)
          : api(endpoint + (template ? "?archived=false" : "")),
      ]);
      if (!active) return;
      setAudiences(a.items);
      if (editing && data) apply(data);
      else if (!editing && data) {
        setItems(data.items);
        setCursor(data.nextCursor);
      }
    }).finally(() => {
      if (active) setLoaded(true);
    });
    return () => {
      active = false;
    };
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
      apply(await api(endpoint + "/" + r.id));
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
      apply(await api(endpoint + "/" + record.id));
      setAction("");
      setNotice(
        action === "test"
          ? "Preview prepared. No audience delivery created."
          : "Message " + r.status + ".",
      );
    });
  }
  if (!loaded)
    return <LoadingState label={<>Loading notifications…</>} variant="cards" />;
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
  const loadedRows = items.filter((r) =>
    template || tab === "history"
      ? !["draft", "scheduled"].includes(r.status)
      : ["draft", "scheduled"].includes(r.status),
  );
  const rows = loadedRows.filter((r) => {
    const b = template ? r.body : r;
    return (
      (!filterQuery ||
        [r.name, b.title, b.body].some((x) =>
          String(x ?? "")
            .toLowerCase()
            .includes(filterQuery.trim().toLowerCase()),
        )) &&
      (!filterCategory || b.category === filterCategory) &&
      (!filterStatus || r.status === filterStatus)
    );
  });
  const savedBody = record ? (template ? record.body : record) : draft;
  const navTab = template
    ? "templates"
    : editing && record && !["draft", "scheduled"].includes(record.status)
      ? "history"
      : tab;
  return (
    <div className="page-pad notifications-workspace" aria-busy={busy}>
      <header className="nt-intro">
        <span className="nt-eyebrow">MGTV · STAY IN THE KNOW</span>
        <h2>
          {editing
            ? template
              ? "A reusable spark for your next message."
              : "Make every message feel like MGTV."
            : tab === "history"
              ? "Every message has a story."
              : template
                ? "Great messages start with a spark."
                : "Keep your audience in the moment."}
        </h2>
        <p>
          {editing
            ? "Shape the message, choose its audience and review the saved version before delivery."
            : "Compose with intention, review the audience and follow real delivery outcomes."}
        </p>
      </header>
      <RouteTabs
        label="Notification sections"
        base="/admin/notifications"
        value={navTab}
        items={sections}
      />
      <div style={{ height: 16 }} />
      {!id && (
        <details className="nt-lifecycle">
          <summary>
            <MediaIcon name="refresh" size={18} />
            <strong>Lifecycle automation</strong>
            <span>Release moments, first looks and event notices</span>
          </summary>
          <LifecycleAutomation />
        </details>
      )}
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
                <MediaIcon name="plus" size={16} />
                {template ? "New template" : "Compose message"}
              </Link>
            )}
          </PageActions>
          <div className="nt-mode-strip" aria-label="Delivery availability">
            <span>
              <MediaIcon name="bell" size={16} />
              In-app · connected
            </span>
            <span className="nt-mode-local">
              <MediaIcon name="mail" size={16} />
              Email · private development inbox
            </span>
            <span>
              <MediaIcon name="lock" size={16} />
              Browser push · unavailable
            </span>
          </div>
          <div
            className="nt-toolbar"
            role="search"
            aria-label="Filter loaded notifications"
          >
            <label>
              Search loaded {template ? "templates" : "messages"}
              <input
                className="input"
                maxLength={120}
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </label>
            <label>
              Category
              <select
                className="input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            {!template && (
              <label>
                Message status
                <select
                  className="input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {(tab === "messages"
                    ? ["draft", "scheduled"]
                    : ["queued", "sent", "cancelled"]
                  ).map((c) => (
                    <option key={c} value={c}>
                      {c[0].toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {(filterQuery || filterCategory || filterStatus) && (
              <button
                className="btn"
                onClick={() => {
                  setFilterQuery("");
                  setFilterCategory("");
                  setFilterStatus("");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="nt-result-count">
            <span>
              {rows.length} of {loadedRows.length} loaded{" "}
              {template ? "templates" : "messages"} shown
            </span>
            <span>
              {cursor
                ? "More saved records available below"
                : "End of loaded records"}
            </span>
          </div>
          {template && (
            <button
              className="btn"
              style={{ marginBottom: 12 }}
              aria-pressed={archived}
              disabled={busy}
              onClick={() => {
                setArchived(!archived);
                void run(() => load(undefined, !archived));
              }}
            >
              {archived ? "Show active templates" : "Show archived templates"}
            </button>
          )}
          {rows.length ? (
            <div className="nt-message-grid">
              {rows.map((r) => (
                <NotificationCard
                  key={r.id}
                  record={r}
                  template={template}
                  busy={busy}
                  canManage={can("notifications.manage")}
                  onUse={() =>
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
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                template
                  ? "No templates in this view"
                  : "No messages in this view"
              }
              body={
                filterQuery || filterCategory || filterStatus
                  ? "Clear the filters or load more saved records."
                  : "Compose a message, load more records or choose another tab."
              }
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
            <Link className="btn" to={"/admin/notifications/" + navTab}>
              Back to {navTab}
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
                disabled={
                  busy ||
                  !dirty ||
                  !draft.title.trim() ||
                  !draft.body.trim() ||
                  !draft.channels.length ||
                  (template && !draft.name.trim())
                }
                onClick={() => void save()}
              >
                Save {template ? "template" : "draft"}
              </button>
            )}
          </PageActions>
          {record && (
            <nav className="nt-pane-nav" aria-label="Message workspace">
              {["overview", "edit", ...(!template ? ["activity"] : [])].map(
                (v) => (
                  <button
                    key={v}
                    className="btn"
                    aria-pressed={pane === v}
                    onClick={() => setPane(v)}
                  >
                    <MediaIcon
                      name={
                        v === "overview"
                          ? "grid"
                          : v === "edit"
                            ? "edit"
                            : "clock"
                      }
                      size={17}
                    />
                    {v === "edit"
                      ? editable
                        ? "Edit message"
                        : "Saved details"
                      : v === "activity"
                        ? "Activity"
                        : "Overview"}
                  </button>
                ),
              )}
            </nav>
          )}
          <div className="nt-editor-layout">
            {pane === "overview" && record ? (
              <NotificationOverview
                record={record}
                body={savedBody}
                template={template}
              />
            ) : pane === "activity" && record ? (
              <NotificationActivity items={record.history ?? []} />
            ) : (
              <Card
                title={
                  template
                    ? "Notification template"
                    : editable
                      ? "Compose message"
                      : "Saved message details"
                }
              >
                <nav className="nt-steps" aria-label="Composition steps">
                  {["message", "audience", "review"].map((v, i) => (
                    <button
                      className="btn"
                      key={v}
                      aria-pressed={step === v}
                      onClick={() => setStep(v)}
                    >
                      <span>{i + 1}</span>
                      {v === "message"
                        ? "Message"
                        : v === "audience"
                          ? "Audience & channels"
                          : "Review"}
                    </button>
                  ))}
                </nav>
                <div style={{ display: "grid", gap: 16 }}>
                  {step === "message" && (
                    <div className="nt-step-fields">
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
                        onChange={(e) =>
                          setDraft({ ...draft, body: e.target.value })
                        }
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
                    </div>
                  )}
                  {step === "audience" && (
                    <div className="nt-step-fields">
                      <fieldset
                        disabled={!editable}
                        style={{ border: 0, padding: 0 }}
                      >
                        <legend>Channels</legend>
                        {["in_app", "email"].map((x) => (
                          <label
                            key={x}
                            className="nt-channel-choice"
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
                                    ? draft.channels.filter(
                                        (c: string) => c !== x,
                                      )
                                    : [...draft.channels, x],
                                })
                              }
                            />
                            <MediaIcon
                              name={x === "in_app" ? "bell" : "mail"}
                              size={18}
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
                          Browser push is unavailable until delivery credentials
                          and customer opt-in are configured.
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
                              {audienceLabel(a.id)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  {step === "review" && (
                    <div className="nt-step-fields">
                      <NotificationPreview body={draft} editable={editable} />
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
                          {!destinations.includes(draft.destination) &&
                            !editable && (
                              <option value={draft.destination}>
                                {draft.destination}
                              </option>
                            )}
                          {destinations.map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </label>
                      <p className="nt-footnote">
                        {draft.channels.includes("in_app")
                          ? "In-app delivery selected. "
                          : "In-app delivery not selected. "}
                        {draft.channels.includes("email")
                          ? "Opted-in email goes to the private development inbox. "
                          : "Email delivery not selected. "}
                        Audience: {audienceLabel(draft.audience)}. Save before
                        using delivery actions.
                      </p>
                    </div>
                  )}
                  <p role="status" style={{ fontSize: 12 }}>
                    {dirty
                      ? "Unsaved changes"
                      : record
                        ? "All changes saved"
                        : "New draft"}
                  </p>
                </div>
                <div className="nt-step-navigation">
                  <button
                    className="btn"
                    disabled={step === "message"}
                    onClick={() =>
                      setStep(step === "review" ? "audience" : "message")
                    }
                  >
                    <MediaIcon name="back" size={16} />
                    Previous
                  </button>
                  <button
                    className="btn"
                    disabled={step === "review"}
                    onClick={() =>
                      setStep(step === "message" ? "audience" : "review")
                    }
                  >
                    Next
                    <MediaIcon name="arrow" size={16} />
                  </button>
                </div>
              </Card>
            )}
            <div style={{ display: "grid", gap: 16 }}>
              {pane !== "overview" && step !== "review" && (
                <Card title="Message preview">
                  <NotificationPreview
                    body={pane === "edit" ? draft : savedBody}
                    editable={pane === "edit" && editable}
                  />
                </Card>
              )}
              <AudienceSummary
                audiences={audiences}
                selected={pane === "edit" ? draft.audience : savedBody.audience}
              />
              {record && !template && (
                <Card title="Delivery status">
                  <NotificationStatus status={record.status} />
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
                  <DeliveryMetrics outcomes={record.outcomes ?? []} />
                  <p className="nt-footnote">
                    Message status reflects processing. Check each channel's
                    outcomes for delivered, skipped or failed counts.
                  </p>
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
                  : action === "cancel"
                    ? "Cancelling stops this unsent message. It does not recall delivered notices."
                    : "Scheduling uses your local time and stores UTC."}
          </p>
          {!template && (
            <div className="nt-message-review">
              <span className="nt-eyebrow">
                SAVED VERSION {record?.version}
              </span>
              <h3>{savedBody.title}</h3>
              <p>{savedBody.body}</p>
              <ChannelChips channels={savedBody.channels ?? []} />
              <p>
                {audienceLabel(savedBody.audience)} · {savedBody.destination}
              </p>
            </div>
          )}
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
          <NotificationPreview body={test} />
          <p>{test.notice}</p>
        </Modal>
      )}
    </div>
  );
}
