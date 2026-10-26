import OriginalsSettings, {type OriginFields} from "../components/OriginalsSettings";
import EventTicketing from "../components/EventTicketing";
import LifecycleSettings from "../components/LifecycleSettings";
import MediaAttachment from "../components/MediaAttachment";
import LoadingState from "../components/LoadingState";
import { LinkedSponsors } from "../components/LinkedSponsors";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Card, TextField, SelectField, Modal, Badge, EmptyState } from "../ui";
import { PageActions } from "../components/PageHeader";
import { TIMEZONES, Note } from "../ui/ops";
import StaffAuth from "./StaffAuth";
const blank = {
  title: "",
  description: "",
  format: "in_person",
  venue: "",
  onlineUrl: "",
  registrationUrl: "",
  timezone: "America/Jamaica",
  startsAt: null as string | null,
  endsAt: null as string | null,
  performers: [] as string[],
  classificationId: null as string | null,
  accessTier: "free",
  eligibleTierIds: [] as string[],
  portraitVersionId: null as string | null,
  landscapeVersionId: null as string | null,
  featureMediaVersionId: null as string | null,
  previewMediaVersionId: null as string | null,
  replayMediaVersionId: null as string | null,
  rightsConfirmed: false,
};
type Draft = typeof blank & OriginFields;
function localInput(iso: string | null, timezone: string) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const value = (key: string) => parts.find((p) => p.type === key)?.value;
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}
function localIso(value: string, timezone: string) {
  if (!value) return null;
  const target = Date.parse(value + "Z"),
    matches = [];
  for (let offset = -840; offset <= 840; offset += 15) {
    const iso = new Date(target + offset * 60000).toISOString();
    if (localInput(iso, timezone) === value) matches.push(iso);
  }
  if (matches.length !== 1)
    throw Error(
      "This local time is missing or ambiguous because of daylight saving. Choose another time or use UTC.",
    );
  return matches[0];
}
export default function ConnectedEvents() {
  const { route } = useRouter();
  return <EventsView key={route.parts[0] ?? "list"} id={route.parts[0]} />;
}
function EventsView({ id }: { id?: string }) {
  const { navigate } = useRouter(),
    isNew = id === "new";
  const [session, setSession] = useState<any>(null),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState<Draft>(blank),
    [initialDraft, setInitialDraft] = useState<Draft>(blank),
    [items, setItems] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [tax, setTax] = useState<any[]>([]),
    [tiers, setTiers] = useState<any[]>([]),
    [history, setHistory] = useState<any[]>([]),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [lifecycle, setLifecycle] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [issues, setIssues] = useState<any[]>([]),
    [action, setAction] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [newStart, setNewStart] = useState(""),
    [newEnd, setNewEnd] = useState("");
  const dirty = isNew
      ? JSON.stringify(draft) !== JSON.stringify(initialDraft)
      : !!record && JSON.stringify(draft) !== JSON.stringify(record.draft),
    leaving = useRef(false),
    requestKey = useRef<{ body: string; key: string } | null>(null),
    alert = useRef<HTMLDivElement>(null);
  useDirtyGuard(() => dirty && !leaving.current);
  const can = (p: string) => !!session?.permissions.includes(p),
    locked = record?.status === "archived";
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setIssues([]);
    try {
      await work();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setSession(null);
      setError((e as Error).message);
      if (e instanceof ApiError) setIssues(e.payload.issues ?? []);
      setTimeout(() => alert.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }
  function query(after?: string) {
    return (
      "?" +
      new URLSearchParams({
        q,
        status,
        lifecycle,
        limit: "25",
        ...(after ? { cursor: after } : {}),
      })
    );
  }
  async function load() {
    const s = await api("/admin/session");
    setSession(s);
    if (!s.permissions.includes("events.read"))
      throw Error("You need events.read to view Events.");
    const t = await api("/admin/events/taxonomy");
    setTax(t.classifications);
    const response = await fetch("/api/v1/catalog/subscription-tiers");
    if (!response.ok) throw Error("Subscription policies could not load.");
    setTiers(await response.json());
    if (isNew) {
      const defaults = await api("/catalog/platform-settings");
      const initial = { ...blank, timezone: defaults.defaultTimezone };
      setInitialDraft(initial);
      setDraft(initial);
    }
    if (id && !isNew) {
      const r = await api("/admin/events/" + id);
      setRecord(r);
      setDraft(r.draft);
      setHistory((await api("/admin/events/" + id + "/history")).items);
    } else if (!id) {
      const page = await api("/admin/events" + query());
      setItems(page.items);
      setCursor(page.nextCursor);
    }
    setLoaded(true);
  }
  useEffect(() => {
    void run(load);
  }, []);
  async function refreshList() {
    const page = await api("/admin/events" + query());
    setItems(page.items);
    setCursor(page.nextCursor);
  }
  async function save() {
    const body = JSON.stringify(draft);
    if (!requestKey.current || requestKey.current.body !== body)
      requestKey.current = { body, key: crypto.randomUUID() };
    const r = isNew
      ? await api(
          "/admin/events",
          "POST",
          draft,
          undefined,
          requestKey.current.key,
        )
      : await api(
          "/admin/events/" + id + "/draft",
          "PATCH",
          draft,
          record.version,
        );
    setRecord(r);
    setDraft(r.draft);
    setNotice(
      "Draft saved. Published details stay unchanged until you publish.",
    );
    if (isNew) {
      leaving.current = true;
      navigate("/admin/events/" + r.id);
    } else await load();
  }
  async function command() {
    if (!record || !action) return;
    if (dirty) throw Error("Save or discard your draft first.");
    const body: any =
      action === "publish"
        ? { revisionId: record.draftRevisionId }
        : { reason };
    if (action === "postpone") {
      body.startsAt = localIso(newStart, draft.timezone);
      body.endsAt = localIso(newEnd, draft.timezone);
    }
    const fingerprint = JSON.stringify([action, body, record.version]);
    if (!requestKey.current || requestKey.current.body !== fingerprint)
      requestKey.current = { body: fingerprint, key: crypto.randomUUID() };
    await api(
      "/admin/events/" + id + "/" + action,
      "POST",
      body,
      record.version,
      requestKey.current.key,
    );
    setAction(null);
    setReason("");
    setNotice("Event updated.");
    await load();
  }
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const controls = (
    <>
      {error && (
        <div
          ref={alert}
          tabIndex={-1}
          role="alert"
          className="card"
          style={{ padding: 16, marginBottom: 16, color: "var(--red)" }}
        >
          {error}
          {issues.map((i, index) => (
            <p key={index}>
              {i.path}: {i.message}
            </p>
          ))}
          <button
            className="btn"
            disabled={busy}
            onClick={() => void run(load)}
          >
            Reload from server
          </button>
        </div>
      )}
      <p role="status" style={{ color: "var(--text-secondary)" }}>
        {busy ? "Working…" : notice}
      </p>
    </>
  );
  if (!session && busy)
    return (
      <div className="page-pad events-workspace">
        <LoadingState label="Checking staff access…" />
      </div>
    );
  if (!session)
    return (
      <div className="page-pad events-workspace">
        {controls}
        <StaffAuth onAuthenticated={() => run(load)} />
      </div>
    );
  if (!can("events.read"))
    return (
      <div className="page-pad events-workspace">
        {controls}
        <EmptyState
          title="Access denied"
          body="Your staff account needs explicit events.read permission."
        />
      </div>
    );
  if (!id)
    return (
      <div className="page-pad events-workspace">
        {controls}
        <PageActions>
          {can("events.write") && (
            <Link to="/admin/events/new" className="btn btn-primary">
              Create event
            </Link>
          )}
        </PageActions>
        <Card title="Find events">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 14,
            }}
          >
            <TextField
              label="Search events"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <SelectField
              label="Publication"
              value={status}
              options={["draft", "published", "unpublished", "archived"]}
              placeholder="All"
              onChange={(e) => setStatus(e.target.value)}
            />
            <SelectField
              label="Lifecycle"
              value={lifecycle}
              options={[
                "draft",
                "scheduled",
                "postponed",
                "cancelled",
                "completed",
              ]}
              placeholder="All"
              onChange={(e) => setLifecycle(e.target.value)}
            />
          </div>
          <button
            className="btn"
            disabled={busy}
            style={{ marginTop: 14 }}
            onClick={() => void run(refreshList)}
          >
            Apply filters
          </button>
        </Card>
        <div className="scroll-x">
          <table className="tbl">
            <thead>
              <tr>
                <th>Event</th>
                <th>Starts</th>
                <th>Format</th>
                <th>Publication</th>
                <th>Lifecycle</th>
                <th>Broadcast</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link to={"/admin/events/" + e.id}>{e.draft.title}</Link>
                  </td>
                  <td>
                    {e.draft.startsAt
                      ? new Intl.DateTimeFormat("en-JM", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: e.draft.timezone,
                        }).format(new Date(e.draft.startsAt))
                      : "Not set"}
                    <small style={{ display: "block" }}>
                      {e.draft.timezone}
                    </small>
                  </td>
                  <td>{e.draft.format.replace(/_/g, " ")}</td>
                  <td>{e.status}</td>
                  <td>{e.lifecycle}</td>
                  <td>{e.broadcast.replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loaded && !items.length && (
          <EmptyState
            title="No events match"
            body="Clear the filters or create an event."
          />
        )}
        {cursor && (
          <button
            className="btn"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const page = await api("/admin/events" + query(cursor));
                setItems((x) => [...x, ...page.items]);
                setCursor(page.nextCursor);
              })
            }
          >
            Load more
          </button>
        )}
      </div>
    );
  if (!isNew && !record)
    return (
      <div className="page-pad events-workspace">
        {controls}
        <Link to="/admin/events">Back to events</Link>
        {loaded && (
          <EmptyState
            title="Event unavailable"
            body="Reload or return to the event list."
          />
        )}
      </div>
    );
  return (
    <div className="page-pad events-workspace">
      {controls}
      <Link to="/admin/events">← All events</Link>
      <h2 style={{ margin: "16px 0", fontSize: 22 }}>
        {isNew ? "Create event" : record.draft.title}
      </h2>
      <PageActions>
        <span role="status">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <button
          className="btn"
          disabled={!dirty || busy}
          onClick={() => setDraft(record?.draft ?? blank)}
        >
          Discard
        </button>
        <button
          className="btn btn-primary"
          disabled={!can("events.write") || busy || !dirty || locked}
          onClick={() => void run(save)}
        >
          {isNew ? "Save draft" : "Save details"}
        </button>
      </PageActions>
      <div className="editor-layout">
        <div>
          <fieldset
            disabled={!can("events.write") || busy || locked}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
            <Card title="Details">
              <div style={{ display: "grid", gap: 14 }}>
                <TextField
                  label="Title"
                  required
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                />
                <TextField
                  label="Description"
                  multiline
                  rows={5}
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                />
                <TextField
                  label="Featuring"
                  hint="Separate names with commas."
                  value={draft.performers.join(",")}
                  onChange={(e) => set("performers", e.target.value.split(","))}
                />
                <TextField
                  label="Registration link"
                  hint="Optional external destination; no transactions are processed here."
                  value={draft.registrationUrl}
                  onChange={(e) => set("registrationUrl", e.target.value)}
                />
              </div>
            </Card>
            <Card title="Where and when">
              <div style={{ display: "grid", gap: 14 }}>
                <SelectField
                  label="Format"
                  value={draft.format}
                  options={["in_person", "online", "hybrid"]}
                  onChange={(e) => set("format", e.target.value)}
                />
                {draft.format !== "online" && (
                  <TextField
                    label="Venue"
                    required
                    value={draft.venue}
                    onChange={(e) => set("venue", e.target.value)}
                  />
                )}{" "}
                {draft.format !== "in_person" && (
                  <TextField
                    label="Online event address"
                    required
                    value={draft.onlineUrl}
                    onChange={(e) => set("onlineUrl", e.target.value)}
                  />
                )}
                <SelectField
                  label="Timezone"
                  value={draft.timezone}
                  options={[
                    ...new Set([
                      "America/Jamaica",
                      "UTC",
                      ...TIMEZONES,
                      draft.timezone,
                    ]),
                  ]}
                  hint="Times below are entered in this timezone. Changing timezone preserves the actual instant."
                  onChange={(e) => {
                    if (e.target.value) set("timezone", e.target.value);
                  }}
                />
                {(["startsAt", "endsAt"] as const).map((key) => (
                  <TextField
                    key={key}
                    label={key === "startsAt" ? "Start" : "End"}
                    type="datetime-local"
                    value={localInput(draft[key], draft.timezone)}
                    onChange={(e) => {
                      try {
                        set(key, localIso(e.target.value, draft.timezone));
                        setError("");
                      } catch (err) {
                        setError((err as Error).message);
                      }
                    }}
                  />
                ))}
              </div>
            </Card>
            <Card title="Audience and access">
              <div style={{ display: "grid", gap: 14 }}>
                <label>
                  Age classification
                  <select
                    className="input"
                    value={draft.classificationId ?? ""}
                    onChange={(e) =>
                      set("classificationId", e.target.value || null)
                    }
                  >
                    <option value="">Choose a classification</option>
                    {tax.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <SelectField
                  label="Replay access"
                  value={draft.accessTier}
                  options={["free", "premium"]}
                  onChange={(e) => {
                    setDraft((d) => ({
                      ...d,
                      accessTier: e.target.value,
                      eligibleTierIds:
                        e.target.value === "free" ? [] : d.eligibleTierIds,
                    }));
                  }}
                />
                {draft.accessTier === "premium" && (
                  <fieldset
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                  >
                    <legend>Eligible tiers</legend>
                    {tiers.map((t) => (
                      <label
                        key={t.id}
                        style={{ display: "block", padding: 8 }}
                      >
                        <input
                          type="checkbox"
                          checked={draft.eligibleTierIds.includes(t.id)}
                          onChange={(e) =>
                            set(
                              "eligibleTierIds",
                              e.target.checked
                                ? [...draft.eligibleTierIds, t.id]
                                : draft.eligibleTierIds.filter(
                                    (x) => x !== t.id,
                                  ),
                            )
                          }
                        />{" "}
                        {t.name}
                      </label>
                    ))}
                  </fieldset>
                )}
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Guest previews remain free. Full replay requires a customer
                  profile, age access and an eligible tier when premium.
                </p>
              </div>
            </Card>
            <Card title="Artwork and media">
              <div style={{ display: "grid", gap: 18 }}>
                {(
                  [
                    ["portraitVersionId", "Portrait artwork", "image/*"],
                    ["landscapeVersionId", "Landscape artwork", "image/*"],
                    [
                      "featureMediaVersionId",
                      "Hero clip MP4 (up to 30 seconds, public)",
                      "video/mp4",
                    ],
                    ["previewMediaVersionId", "Preview MP4", "video/mp4"],
                    ["replayMediaVersionId", "Replay MP4", "video/mp4"],
                  ] as const
                ).map(([key, label, accept]) => (
                  <MediaAttachment key={`${id}:${key}`} label={label} kind={accept==="video/mp4"?"video":"image"} value={draft[key]} canRead={!!can("media.read")} canUpload={!!can("media.upload")} onBusyChange={setBusy} maxDuration={key==="featureMediaVersionId"?30:undefined} onChange={v=>set(key,v)}/>
                ))}
                <OriginalsSettings value={draft} onChange={patch=>{setDraft(d=>({...d,...patch}));}} versions={[draft.featureMediaVersionId,draft.previewMediaVersionId,draft.replayMediaVersionId]} canRead={!!can("media.read")} canReview={!!can("media.upload")&&!!can("content.publish")}/>
<label>
                  <input
                    type="checkbox"
                    checked={draft.rightsConfirmed}
                    onChange={(e) => set("rightsConfirmed", e.target.checked)}
                  />{" "}
                  Rights for artwork, preview and replay are confirmed
                </label>
              </div>
            </Card>
          </fieldset>
        </div>
        <aside>
          {record && (
            <>
              <LifecycleSettings key={`${record.id}:${record.publishedRevisionId}`} kind="event" id={record.id} revisionId={record.publishedRevisionId} canPublish={!!can("events.publish")}/>
              <EventTicketing id={record.id} manage={!!can("ticketing.manage")} checkin={!!can("ticketing.checkin")} />
              <LinkedSponsors kind="events" id={record.id} />
              <Card title="Publication">
                <p>
                  Publication: <Badge color="#C9A84C">{record.status}</Badge>
                </p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Draft changes remain private until published. Publishing
                  requires an explicit permission.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    className="btn"
                    disabled={busy || dirty}
                    onClick={() =>
                      void run(async () => {
                        const r = await api(
                          "/admin/events/" + id + "/publication-check",
                        );
                        setIssues(r.issues);
                        setNotice(
                          r.issues.length
                            ? "Review the requirements."
                            : "Ready to publish.",
                        );
                      })
                    }
                  >
                    Check requirements
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={!can("events.publish") || busy || dirty || locked}
                    onClick={() => {
                      setAction("publish");
                      setReason("");
                    }}
                  >
                    Publish event
                  </button>
                  {record.status === "published" && (
                    <button
                      className="btn"
                      disabled={!can("events.unpublish") || busy || dirty}
                      onClick={() => {
                        setAction("unpublish");
                        setReason("");
                      }}
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    className="btn"
                    disabled={!can("events.write") || busy || dirty}
                    onClick={() => {
                      setAction(locked ? "restore" : "archive");
                      setReason("");
                    }}
                  >
                    {locked ? "Restore to draft" : "Archive"}
                  </button>
                </div>
                {issues.map((i, n) => (
                  <p key={n} style={{ fontSize: 13, color: "var(--red)" }}>
                    {i.path}: {i.message}
                  </p>
                ))}
              </Card>
              <Card title="Event lifecycle">
                <p style={{ textTransform: "capitalize" }}>
                  {record.lifecycle}
                </p>
                {record.previousStart && (
                  <p>
                    Originally {new Date(record.previousStart).toISOString()}
                  </p>
                )}
                {record.statusReason && <p>{record.statusReason}</p>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(record.lifecycle === "postponed"
                    ? ["confirm", "postpone", "cancel"]
                    : record.lifecycle === "scheduled"
                      ? ["postpone", "cancel", "complete"]
                      : []
                  ).map((a) => (
                    <button
                      className="btn"
                      key={a}
                      disabled={
                        !can("events.publish") ||
                        busy ||
                        dirty ||
                        record.status !== "published"
                      }
                      onClick={() => {
                        setAction(a);
                        setReason("");
                        setNewStart(localInput(draft.startsAt, draft.timezone));
                        setNewEnd(localInput(draft.endsAt, draft.timezone));
                      }}
                    >
                      {a === "confirm"
                        ? "Confirm new date"
                        : a === "complete"
                          ? "Mark completed"
                          : a === "cancel"
                            ? "Cancel event"
                            : "Postpone"}
                    </button>
                  ))}
                </div>
              </Card>
              <Card title="Broadcast and replay">
                <p>{record.broadcast.replace(/_/g, " ")}</p>
                <Note tone="info">
                  Live broadcasting requires a verified delivery provider.
                  Scheduling an event never starts a stream. A published replay
                  becomes available only after the event is completed.
                </Note>
              </Card>
              <Card title="Activity history">
                {history.length === 0 ? (
                  <p>No changes yet.</p>
                ) : (
                  history.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        padding: "10px 0",
                        fontSize: 12,
                      }}
                    >
                      <strong>{h.action}</strong>
                      <p>{new Date(h.created_at).toLocaleString()}</p>
                      {h.details?.reason && <p>{h.details.reason}</p>}
                    </div>
                  ))
                )}
              </Card>
            </>
          )}
        </aside>
      </div>
      {action && (
        <Modal
          title={
            action === "publish"
              ? "Publish event"
              : action === "postpone"
                ? "Postpone event"
                : "Confirm " + action.replace(/-/g, " ")
          }
          onClose={() => {
            if (!busy) setAction(null);
          }}
          width={520}
          footer={
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setAction(null)}
              >
                Keep editing
              </button>
              <button
                className="btn btn-primary"
                disabled={
                  busy || (action !== "publish" && reason.trim().length < 5)
                }
                onClick={() => void run(command)}
              >
                Confirm {action}
              </button>
            </>
          }
        >
          <div style={{ display: "grid", gap: 14 }}>
            <p>
              {action === "publish"
                ? "Publish the reviewed draft to the customer catalog. Event and broadcast statuses remain separate."
                : "This change is recorded in activity history. It does not send attendee notifications."}
            </p>
            {action === "postpone" && (
              <>
                <TextField
                  label={"New start (" + draft.timezone + ")"}
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
                <TextField
                  label={"New end (" + draft.timezone + ")"}
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                />
              </>
            )}
            {action !== "publish" && (
              <TextField
                label="Reason"
                required
                multiline
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
