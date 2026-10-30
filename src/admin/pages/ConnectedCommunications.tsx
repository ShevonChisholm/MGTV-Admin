import { useStaffPermissions } from "../api/staff-session-context";
import LoadingState from "../components/LoadingState";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Card, Modal } from "../ui";
import MediaIcon from "../components/MediaIcon";
import {
  CommunicationsHero,
  CommunicationsSnapshot,
  CommunicationsDirectory,
  CommunicationFacts,
  CommunicationHistory,
  CommunicationDelivery,
  NewsletterPreview,
  communicationsDate,
  communicationsNames,
  communicationsIcons,
} from "../components/CommunicationsVisual";
import "./communications.css";
import StaffAuth from "./StaffAuth";
import { useDirtyGuard } from "../router";
type Tab = "contact" | "subscribers" | "campaigns";
const states = {
  contact: ["new", "in_progress", "resolved", "spam"],
  subscribers: ["pending", "confirmed", "unsubscribed", "suppressed"],
  campaigns: ["draft", "sending", "completed", "cancelled"],
};
const style = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--text-primary)",
  font: "inherit",
};
export default function ConnectedCommunications() {
  const verifiedPermissions = useStaffPermissions();
  const allowedTabs: Tab[] = (
    ["contact", "subscribers", "campaigns"] as Tab[]
  ).filter((t) =>
    verifiedPermissions?.includes(
      t === "contact" ? "contact.read" : "newsletter.read",
    ),
  );
  const allowedTabKey = allowedTabs.join(",");
  const [tab, setTab] = useState<Tab>(() => allowedTabs[0] ?? "contact"),
    [session, setSession] = useState<any>(null),
    [unauth, setUnauth] = useState(false),
    [items, setItems] = useState<any[]>([]),
    [record, setRecord] = useState<any>(null),
    [next, setNext] = useState<string | null>(null),
    [status, setStatus] = useState(""),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [reason, setReason] = useState(""),
    [text, setText] = useState(""),
    [subject, setSubject] = useState(""),
    [body, setBody] = useState(""),
    [creating, setCreating] = useState(false),
    [confirm, setConfirm] = useState(false),
    [conflict, setConflict] = useState(false);
  const detailHeading = useRef<HTMLHeadingElement>(null),
    searchField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (record || creating) detailHeading.current?.focus();
  }, [record?.id, creating]);
  function closeDetail() {
    if (busy) return;
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    clear();
    requestAnimationFrame(() => searchField.current?.focus());
  }
  const generation = useRef(0),
    retry = useRef({ body: "", key: crypto.randomUUID() });
  const base =
    tab === "contact" ? "/admin/contact/messages" : "/admin/newsletter/" + tab;
  const permission = tab === "contact" ? "contact" : "newsletter";
  const can = (p: string) => session?.permissions?.includes(p);
  const dirty =
    !!reason ||
    !!text ||
    (tab === "campaigns" &&
      (creating
        ? !!subject || !!body
        : !!record && (subject !== record.subject || body !== record.body)));
  useDirtyGuard(() => dirty);
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty]);
  function clear() {
    setRecord(null);
    setCreating(false);
    setSubject("");
    setBody("");
    setReason("");
    setText("");
    setConflict(false);
    setNotice("");
    setError("");
    retry.current.body = "";
  }
  useEffect(() => {
    if (!allowedTabs.includes(tab)) {
      generation.current++;
      clear();
      setItems([]);
      setNext(null);
      setTab(allowedTabs[0] ?? "contact");
    }
  }, [allowedTabKey, tab]);
  async function load(cursor?: string) {
    if (!allowedTabs.includes(tab)) return;
    const g = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const s = await api("/admin/session");
      if (g !== generation.current) return;
      setSession(s);
      if (!s.permissions.includes(permission + ".read"))
        throw Error("Read permission is required for this workspace.");
      const params = new URLSearchParams({
        status,
        q: query,
        ...(cursor ? { cursor } : {}),
      });
      const result = await api(base + "?" + params);
      if (g !== generation.current) return;
      setItems((prev) => (cursor ? [...prev, ...result.items] : result.items));
      setNext(result.nextCursor);
    } catch (e) {
      if (g !== generation.current) return;
      if (e instanceof ApiError && e.status === 401) setUnauth(true);
      setError((e as Error).message);
    } finally {
      if (g === generation.current) setBusy(false);
    }
  }
  useEffect(() => {
    clear();
    setItems([]);
    setNext(null);
    void load();
    return () => {
      generation.current++;
    };
  }, [tab, status, query]);
  async function open(id: string, discard = false) {
    if (!discard && dirty && !window.confirm("Discard unsaved changes?"))
      return;
    setBusy(true);
    setError("");
    const g = ++generation.current;
    try {
      const r = await api(base + "/" + id);
      if (g !== generation.current) return;
      clear();
      setRecord(r);
      setSubject(r.subject ?? "");
      setBody(r.body ?? "");
    } catch (e) {
      if (g === generation.current) setError((e as Error).message);
    } finally {
      if (g === generation.current) setBusy(false);
    }
  }
  async function mutate(
    path: string,
    method: string,
    payload: any,
    version?: number,
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    const fingerprint = JSON.stringify({ path, method, payload, version });
    if (retry.current.body !== fingerprint)
      retry.current = { body: fingerprint, key: crypto.randomUUID() };
    try {
      const result = await api(
        path,
        method,
        payload,
        version,
        retry.current.key,
      );
      setReason("");
      setText("");
      setConfirm(false);
      setCreating(false);
      retry.current.body = "";
      await load();
      await open(result.id, true);
      setNotice(
        "Saved. Delivery outcomes refer only to the private local inbox.",
      );
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError && e.status === 412) setConflict(true);
    } finally {
      setBusy(false);
    }
  }
  function action(action: string) {
    if (!record) return;
    void mutate(
      base + "/" + record.id + "/actions",
      "POST",
      {
        action,
        reason,
        ...(tab === "contact" && ["reply", "note"].includes(action)
          ? { text }
          : {}),
      },
      record.version,
    );
  }
  if (unauth)
    return (
      <StaffAuth
        onAuthenticated={async () => {
          setUnauth(false);
          await load();
        }}
      />
    );
  return (
    <div
      className="communications-workspace av-workspace"
      style={{ display: "grid", gap: 20, minWidth: 0 }}
    >
      <CommunicationsHero tab={tab} />
      <aside className="cm-delivery-notice">
        <span className="cm-icon">
          <MediaIcon name="lock" />
        </span>
        <div>
          <strong>Private development delivery</strong>
          <p>
            Contact replies and newsletters go only to the private development
            inbox. Subscribers confirm their own address; production email
            remains pending.
          </p>
        </div>
      </aside>
      <div
        role="tablist"
        aria-label="Communications"
        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        {allowedTabs.map((t) => (
          <button
            key={t}
            role="tab"
            disabled={busy}
            aria-selected={tab === t}
            tabIndex={tab === t ? 0 : -1}
            onKeyDown={(e) => {
              const tabs = allowedTabs;
              const position = tabs.indexOf(t);
              const step =
                e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!step || busy) return;
              e.preventDefault();
              if (dirty && !window.confirm("Discard unsaved changes?")) return;
              const target =
                tabs[(position + step + tabs.length) % tabs.length];
              clear();
              setStatus("");
              setQuery("");
              setSearch("");
              setTab(target);
              requestAnimationFrame(() =>
                document
                  .querySelector<HTMLButtonElement>(
                    `[role="tab"][data-communications-tab="${target}"]`,
                  )
                  ?.focus(),
              );
            }}
            data-communications-tab={t}
            className={tab === t ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => {
              if (dirty && !window.confirm("Discard unsaved changes?")) return;
              clear();
              setStatus("");
              setQuery("");
              setSearch("");
              setTab(t);
            }}
          >
            <MediaIcon name={communicationsIcons[t]} size={17} />
            {t === "contact"
              ? "Contact inbox"
              : t === "subscribers"
                ? "Subscribers"
                : "Newsletters"}
          </button>
        ))}
      </div>
      {!(record || creating) && (
        <>
          <form
            className="cm-toolbar"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
            }}
          >
            <label>
              Search{" "}
              {tab === "contact"
                ? "enquiries"
                : tab === "subscribers"
                  ? "subscribers"
                  : "newsletters"}
              <input
                ref={searchField}
                className="input"
                type="search"
                maxLength={100}
                placeholder={
                  tab === "contact"
                    ? "Name, email or subject"
                    : tab === "subscribers"
                      ? "Email address"
                      : "Newsletter subject"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              Status
              <select
                className="input"
                value={status}
                disabled={busy}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {states[tab].map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary" disabled={busy} type="submit">
              <MediaIcon name="search" size={16} />
              Search
            </button>
            <button
              className="btn"
              disabled={busy}
              type="button"
              onClick={() => {
                setSearch("");
                setQuery("");
                setStatus("");
              }}
            >
              Reset
            </button>
            <button
              className="btn"
              type="button"
              disabled={busy}
              onClick={() => void load()}
            >
              <MediaIcon name="refresh" size={16} />
              Refresh list
            </button>
            {tab === "campaigns" && can("newsletter.manage") && (
              <button
                className="btn btn-primary"
                disabled={busy}
                type="button"
                onClick={() => {
                  clear();
                  setCreating(true);
                }}
              >
                <MediaIcon name="plus" size={17} />
                New newsletter
              </button>
            )}
          </form>
          {!busy && (
            <CommunicationsSnapshot rows={items} tab={tab} more={!!next} />
          )}
        </>
      )}
      {error && (
        <p
          role="alert"
          style={{ color: "var(--red)", overflowWrap: "anywhere" }}
        >
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {conflict && record && (
        <button
          className="btn btn-secondary"
          onClick={() => void open(record.id)}
        >
          Reload current version
        </button>
      )}
      {!(record || creating) && (
        <section
          className="cm-directory"
          aria-busy={busy}
          aria-label={communicationsNames[tab]}
        >
          {busy && !items.length ? (
            <LoadingState variant="table" label="Loading communications" />
          ) : (
            <CommunicationsDirectory
              tab={tab}
              rows={items}
              busy={busy}
              open={(id) => void open(id)}
            />
          )}
          <div className="cm-list-footer">
            <p>
              Newest first. Table pages cover loaded results
              {next ? "; more matching records are available." : "."}
            </p>
            {next && (
              <button
                className="btn"
                disabled={busy}
                onClick={() => void load(next)}
              >
                <MediaIcon name="plus" size={16} />
                {busy ? "Loading..." : "Load next 25 records"}
              </button>
            )}
          </div>
        </section>
      )}
      {(record || creating) && (
        <Card>
          <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
            <header className="cm-detail-header">
              <div>
                <span className="cm-eyebrow">
                  <MediaIcon name={communicationsIcons[tab]} size={16} />
                  {communicationsNames[tab]}
                </span>
                <h2 ref={detailHeading} tabIndex={-1}>
                  {creating
                    ? "Create your next update"
                    : tab === "subscribers"
                      ? record.email
                      : record.subject}
                </h2>
                <p>
                  {creating
                    ? "Compose, preview, then save. Sending remains a separate reviewed action."
                    : "A focused view of this record and its recorded activity."}
                </p>
              </div>
              <button className="btn" disabled={busy} onClick={closeDetail}>
                <MediaIcon name="back" size={16} />
                Back to list
              </button>
            </header>
            {record && <CommunicationFacts record={record} tab={tab} />}
            {record?.fixture && (
              <p style={{ color: "var(--accent)" }}>
                Development fixture — excluded from email delivery.
              </p>
            )}
            {tab === "contact" && record && (
              <section className="cm-message">
                <header>
                  <span className="cm-icon">
                    <MediaIcon name="users" />
                  </span>
                  <div>
                    <strong>{record.name}</strong>
                    <span>{record.email}</span>
                  </div>
                  <span className="cm-topic">{record.topic}</span>
                </header>
                <p>{record.message}</p>
              </section>
            )}
            {tab === "subscribers" && record && (
              <section className="cm-consent-policy">
                <header className="cm-section-title">
                  <span className="cm-icon">
                    <MediaIcon name="lock" />
                  </span>
                  <div>
                    <h3>Consent belongs to the subscriber</h3>
                    <p>
                      Staff cannot confirm a subscription. Clearing suppression
                      leaves the address unsubscribed; a new signup and email
                      confirmation are required.
                    </p>
                  </div>
                </header>
                <dl>
                  <div>
                    <dt>Requested</dt>
                    <dd>{communicationsDate(record.requested_at)}</dd>
                  </div>
                  <div>
                    <dt>Confirmed</dt>
                    <dd>{communicationsDate(record.confirmed_at)}</dd>
                  </div>
                  <div>
                    <dt>Unsubscribed</dt>
                    <dd>{communicationsDate(record.unsubscribed_at)}</dd>
                  </div>
                </dl>
              </section>
            )}
            {tab === "campaigns" && (
              <>
                <header className="cm-section-title">
                  <span className="cm-icon">
                    <MediaIcon name="edit" />
                  </span>
                  <div>
                    <h3>Compose the message</h3>
                    <p>
                      Keep the subject clear and the update focused. The preview
                      below follows your edits.
                    </p>
                  </div>
                </header>
                <label>
                  Subject
                  <input
                    style={style}
                    maxLength={180}
                    value={subject}
                    disabled={
                      !can("newsletter.manage") ||
                      (record?.status && record.status !== "draft")
                    }
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </label>
                <label>
                  Message
                  <textarea
                    style={style}
                    rows={8}
                    maxLength={10000}
                    value={body}
                    disabled={
                      !can("newsletter.manage") ||
                      (record?.status && record.status !== "draft")
                    }
                    onChange={(e) => setBody(e.target.value)}
                  />
                </label>
                <NewsletterPreview subject={subject} body={body} />
                {record?.audience && (
                  <div className="cm-audience">
                    <span className="cm-icon">
                      <MediaIcon name="users" />
                    </span>
                    <div>
                      <strong>
                        {record.audience.eligible ?? 0} eligible recipients
                      </strong>
                      <p>
                        Confirmed, non-fixture subscribers currently eligible.
                        Eligibility is checked again before delivery.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            {(tab !== "campaigns" || creating || record?.status === "draft") &&
              (can(permission + ".manage") ||
                (tab === "campaigns" && can("newsletter.send"))) && (
                <>
                  <header className="cm-section-title">
                    <span className="cm-icon">
                      <MediaIcon name="edit" />
                    </span>
                    <div>
                      <h3>
                        {tab === "contact"
                          ? "Respond & update"
                          : tab === "subscribers"
                            ? "Consent safeguards"
                            : "Save & review"}
                      </h3>
                      <p>
                        Every change requires a reason and the appropriate
                        explicit permission.
                      </p>
                    </div>
                  </header>
                  <p className="cm-edit-state" role="status">
                    <MediaIcon name={dirty ? "edit" : "check"} size={16} />
                    {dirty
                      ? "Unsaved input - review your changes before continuing."
                      : creating
                        ? "New draft - nothing has been sent."
                        : "Viewing the saved record. Actions require a reason."}
                  </p>
                  <label>
                    Reason for this action
                    <textarea
                      style={style}
                      rows={2}
                      minLength={5}
                      maxLength={1000}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  {tab === "contact" && (
                    <label>
                      Reply or internal note
                      <textarea
                        style={style}
                        rows={4}
                        maxLength={5000}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />
                    </label>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {tab === "contact" &&
                      record &&
                      can("contact.manage") &&
                      [
                        ...(record.status === "new" ? ["start"] : []),
                        ...(["new", "in_progress"].includes(record.status)
                          ? ["resolve"]
                          : []),
                        ...(record.status !== "spam" ? ["spam"] : []),
                        ...(["resolved", "spam"].includes(record.status)
                          ? ["reopen"]
                          : []),
                        "note",
                        ...(!record.fixture && record.status !== "spam"
                          ? ["reply"]
                          : []),
                      ].map((a) => (
                        <button
                          key={a}
                          className="btn btn-secondary"
                          disabled={
                            busy ||
                            conflict ||
                            reason.trim().length < 5 ||
                            (["note", "reply"].includes(a) &&
                              text.trim().length < 5)
                          }
                          onClick={() => action(a)}
                        >
                          {a === "reply"
                            ? "Reply to local inbox"
                            : a === "note"
                              ? "Add internal note"
                              : ((
                                  {
                                    start: "Start review",
                                    resolve: "Resolve",
                                    spam: "Mark as spam",
                                    reopen: "Reopen",
                                  } as Record<string, string>
                                )[a] ?? a)}
                        </button>
                      ))}
                    {tab === "subscribers" &&
                      record &&
                      can("newsletter.manage") && (
                        <button
                          className="btn btn-secondary"
                          disabled={
                            busy || conflict || reason.trim().length < 5
                          }
                          onClick={() =>
                            action(
                              record.status === "suppressed"
                                ? "clear_suppression"
                                : "suppress",
                            )
                          }
                        >
                          {record.status === "suppressed"
                            ? "Clear suppression"
                            : "Suppress newsletters"}
                        </button>
                      )}
                    {tab === "campaigns" &&
                      (creating || record?.status === "draft") && (
                        <>
                          {can("newsletter.manage") && (
                            <button
                              className="btn btn-primary"
                              disabled={
                                busy ||
                                conflict ||
                                reason.trim().length < 5 ||
                                !subject.trim() ||
                                body.trim().length < 20
                              }
                              onClick={() =>
                                void mutate(
                                  base + (creating ? "" : "/" + record.id),
                                  creating ? "POST" : "PUT",
                                  { subject, body, reason },
                                  record?.version,
                                )
                              }
                            >
                              Save draft
                            </button>
                          )}
                          {record && (
                            <>
                              {can("newsletter.manage") && (
                                <button
                                  className="btn btn-secondary"
                                  disabled={
                                    busy || conflict || reason.trim().length < 5
                                  }
                                  onClick={() => action("cancel")}
                                >
                                  Cancel draft
                                </button>
                              )}
                              {can("newsletter.send") && !record.fixture && (
                                <button
                                  className="btn btn-primary"
                                  disabled={
                                    busy ||
                                    conflict ||
                                    reason.trim().length < 5 ||
                                    subject !== record.subject ||
                                    body !== record.body
                                  }
                                  onClick={() => setConfirm(true)}
                                >
                                  Review local send
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                  </div>
                </>
              )}
            {record && (
              <>
                <button
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => void open(record.id)}
                >
                  Refresh details and outcomes
                </button>
                <CommunicationHistory record={record} tab={tab} />
                {tab !== "subscribers" && (
                  <CommunicationDelivery record={record} />
                )}
              </>
            )}
          </div>
        </Card>
      )}
      {confirm && record && (
        <Modal
          title="Send to the private local inbox?"
          onClose={() => !busy && setConfirm(false)}
        >
          <p>
            This freezes the saved newsletter and queues it for confirmed,
            non-fixture subscribers. Nothing will be emailed outside this
            machine.
          </p>
          <p>
            Currently eligible confirmed recipients:{" "}
            {record.audience?.eligible ?? 0}. Eligibility is checked again
            before delivery.
          </p>
          {error && (
            <p role="alert" style={{ color: "var(--red)" }}>
              {error}
            </p>
          )}
          <h3>{record.subject}</h3>
          <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {record.body}
          </p>
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() => action("send")}
          >
            Confirm local send
          </button>
        </Modal>
      )}
    </div>
  );
}
