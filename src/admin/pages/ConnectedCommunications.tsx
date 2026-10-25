import LoadingState from "../components/LoadingState";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Card, Modal } from "../ui";
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
  const [tab, setTab] = useState<Tab>("contact"),
    [session, setSession] = useState<any>(null),
    [unauth, setUnauth] = useState(false),
    [items, setItems] = useState<any[]>([]),
    [record, setRecord] = useState<any>(null),
    [next, setNext] = useState<string | null>(null),
    [status, setStatus] = useState(""),
    [query, setQuery] = useState(""),
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
  async function load(cursor?: string) {
    const g = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const s = await api("/admin/session");
      if (g !== generation.current) return;
      setSession(s);
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
      className="communications-workspace"
      style={{ display: "grid", gap: 20, minWidth: 0 }}
    >
      <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
        Contact replies and newsletters are delivered only to the private
        development inbox. Subscribers must confirm their own email address.
      </p>
      <div
        role="tablist"
        aria-label="Communications"
        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        {(["contact", "subscribers", "campaigns"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "btn btn-primary" : "btn btn-secondary"}
            onClick={() => {
              if (dirty && !window.confirm("Discard unsaved changes?")) return;
              clear();
              setStatus("");
              setQuery("");
              setTab(t);
            }}
          >
            {t === "contact"
              ? "Contact inbox"
              : t === "subscribers"
                ? "Subscribers"
                : "Newsletters"}
          </button>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "end",
        }}
      >
        <label style={{ flex: "1 1 200px" }}>
          Search
          <input
            style={style}
            type="search"
            value={query}
            onChange={(e) => {
              if (dirty && !window.confirm("Discard unsaved changes?")) return;
              setQuery(e.target.value);
            }}
          />
        </label>
        <label style={{ flex: "0 1 220px" }}>
          Status
          <select
            style={style}
            value={status}
            onChange={(e) => {
              if (dirty && !window.confirm("Discard unsaved changes?")) return;
              setStatus(e.target.value);
            }}
          >
            <option value="">All statuses</option>
            {states[tab].map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn btn-secondary"
          disabled={busy}
          onClick={() => void load()}
        >
          Refresh list
        </button>
        {tab === "campaigns" && can("newsletter.manage") && (
          <button
            className="btn btn-primary"
            onClick={() => {
              if (dirty && !window.confirm("Discard unsaved changes?")) return;
              clear();
              setCreating(true);
            }}
          >
            New newsletter
          </button>
        )}
      </div>
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
      <Card>
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((item) => (
            <button
              key={item.id}
              className="btn btn-secondary"
              style={{
                textAlign: "left",
                height: "auto",
                whiteSpace: "normal",
                justifyContent: "space-between",
                gap: 12,
                overflowWrap: "anywhere",
              }}
              disabled={busy}
              onClick={() => void open(item.id)}
            >
              <span>
                {item.subject ?? item.email}
                <small
                  style={{ display: "block", color: "var(--text-secondary)" }}
                >
                  {item.name ?? ""} {item.subject ? (item.email ?? "") : ""}
                </small>
              </span>
              <span>
                {item.status.replace(/_/g, " ")}
                {item.fixture ? " · seed fixture" : ""}
              </span>
            </button>
          ))}
          {!items.length && !busy && !error && <p>No matching records.</p>}
          {busy && !items.length && (
            <LoadingState label={<>Loading…</>} variant="table" />
          )}
          {next && (
            <button
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => void load(next)}
            >
              Load more
            </button>
          )}
        </div>
      </Card>
      {(record || creating) && (
        <Card>
          <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <h2 style={{ fontSize: 21 }}>
                {creating
                  ? "New newsletter"
                  : tab === "contact"
                    ? record.subject
                    : tab === "subscribers"
                      ? record.email
                      : record.subject}
              </h2>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (!dirty || window.confirm("Discard unsaved changes?"))
                    clear();
                }}
              >
                Close
              </button>
            </div>
            {record?.fixture && (
              <p style={{ color: "var(--accent)" }}>
                Development fixture — excluded from email delivery.
              </p>
            )}
            {tab === "contact" && record && (
              <>
                <p>
                  {record.name} ·{" "}
                  <span style={{ overflowWrap: "anywhere" }}>
                    {record.email}
                  </span>{" "}
                  · {record.topic}
                </p>
                <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                  {record.message}
                </p>
              </>
            )}
            {tab === "subscribers" && record && (
              <>
                <p>
                  Status: {record.status}. Consent version:{" "}
                  {record.consentVersion ?? record.consent_version}. Staff
                  cannot confirm a subscription.
                </p>
                <p>
                  Clearing suppression leaves this address unsubscribed. A new
                  signup and email confirmation are required.
                </p>
              </>
            )}
            {tab === "campaigns" && (
              <>
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
                <details>
                  <summary>Preview newsletter</summary>
                  <h3>{subject}</h3>
                  <p
                    style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                  >
                    {body}
                  </p>
                  <p>
                    Unsubscribe from the MGTV newsletter: a private link is
                    added for each confirmed subscriber.
                  </p>
                </details>
                {record?.audience && (
                  <p>
                    Currently eligible confirmed recipients:{" "}
                    {record.audience.eligible ?? record.audience.confirmed ?? 0}
                    . Seed subscribers are excluded.
                  </p>
                )}
                {record?.outcomes?.map((o: any) => (
                  <p key={o.status}>
                    {o.status}: {o.count}
                  </p>
                ))}
              </>
            )}
            {(tab !== "campaigns" || creating || record?.status === "draft") &&
              (can(permission + ".manage") ||
                (tab === "campaigns" && can("newsletter.send"))) && (
                <>
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
                <h3>Activity history</h3>
                {record.history?.map((h: any, i: number) => (
                  <div
                    key={h.id ?? i}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border)",
                      overflowWrap: "anywhere",
                    }}
                  >
                    <p>
                      {h.action} · {h.actor} ·{" "}
                      {new Date(h.created_at).toLocaleString()}
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>{h.reason}</p>
                    {h.text && (
                      <p style={{ whiteSpace: "pre-wrap" }}>{h.text}</p>
                    )}
                  </div>
                ))}
                {record.replies?.map((o: any) => (
                  <p key={o.id}>
                    Reply: {o.status} {o.outcome}
                  </p>
                ))}
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
