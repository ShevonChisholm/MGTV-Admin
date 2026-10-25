import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useDirtyGuard, useRouter } from "../router";
import LoadingState from "../components/LoadingState";
type Draft = {
  title: string;
  department: string;
  location: string;
  workplace: string;
  employment: string;
  summary: string;
  description: string;
  requirements: string;
  applicationUrl: string;
  closesAt: string;
};
const empty: Draft = {
  title: "",
  department: "",
  location: "",
  workplace: "onsite",
  employment: "full-time",
  summary: "",
  description: "",
  requirements: "",
  applicationUrl: "",
  closesAt: "",
};
export default function ConnectedCareers() {
  const { route, navigate } = useRouter();
  const id = route.parts[0] ?? "";
  const creating = id === "new";
  const [session, setSession] = useState<any>(null),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState<Draft>(empty),
    [items, setItems] = useState<any[]>([]),
    [history, setHistory] = useState<any[]>([]),
    [next, setNext] = useState<string | null>(null),
    [busy, setBusy] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [reason, setReason] = useState(""),
    [action, setAction] = useState(""),
    [refresh, setRefresh] = useState(0);
  const retry = useRef({ body: "", key: crypto.randomUUID() });
  const savedNavigation = useRef(false);
  const dirty =
    !!id &&
    (creating
      ? JSON.stringify(draft) !== JSON.stringify(empty)
      : record && JSON.stringify(draft) !== JSON.stringify(record.draft));
  useDirtyGuard(() => !!dirty && !savedNavigation.current);
  const canRead = session?.permissions.includes("careers.read"),
    canManage = canRead && session?.permissions.includes("careers.manage"),
    canPublish = canRead && session?.permissions.includes("careers.publish");
  useEffect(() => {
    savedNavigation.current = false;
    let active = true;
    setBusy(true);
    setError("");
    setNotice("");
    setRecord(null);
    setDraft(empty);
    setHistory([]);
    setAction("");
    setReason("");
    setNext(null);
    (async () => {
      const s = await api("/admin/session");
      if (!active) return;
      setSession(s);
      if (!s.permissions.includes("careers.read"))
        throw Error("You need careers.read permission to view vacancies.");
      if (creating) return;
      if (id) {
        const [r, h] = await Promise.all([
          api("/admin/careers/" + id),
          api("/admin/careers/" + id + "/history"),
        ]);
        if (active) {
          setRecord(r);
          setDraft(r.draft);
          setHistory(h.items);
        }
      } else {
        const b = await api("/admin/careers");
        if (active) {
          setItems(b.items);
          setNext(b.next);
        }
      }
    })()
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [id, refresh, creating]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const body = JSON.stringify(draft);
      if (retry.current.body !== body)
        retry.current = { body, key: crypto.randomUUID() };
      const r = await api(
        creating ? "/admin/careers" : "/admin/careers/" + id + "/draft",
        creating ? "POST" : "PUT",
        draft,
        record?.version,
        retry.current.key,
      );
      setRecord(r);
      setDraft(r.draft);
      setNotice("Draft saved. Publish the saved version when it is ready.");
      if (creating) {
        savedNavigation.current = true;
        setDraft(empty);
        navigate("/admin/careers/" + r.id);
      } else setHistory((await api("/admin/careers/" + id + "/history")).items);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function command() {
    setSaving(true);
    setError("");
    try {
      const body = { reason, reviewedVersion: record.version };
      const sig = JSON.stringify({ id, action, ...body });
      if (retry.current.body !== sig)
        retry.current = { body: sig, key: crypto.randomUUID() };
      const r = await api(
        "/admin/careers/" + id + "/" + action,
        "POST",
        body,
        record.version,
        retry.current.key,
      );
      setRecord(r);
      setDraft(r.draft);
      setAction("");
      setReason("");
      setNotice(
        action === "publish"
          ? "Saved vacancy published."
          : action === "close"
            ? "Applications closed."
            : "Reopened as a private draft.",
      );
      setHistory((await api("/admin/careers/" + id + "/history")).items);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  if (busy) return <LoadingState variant="form" />;
  const field = (
    key: keyof Draft,
    label: string,
    max: number,
    large = false,
  ) => (
    <label key={key} className="career-field">
      <span>{label}</span>
      {large ? (
        <textarea
          required
          maxLength={max}
          rows={key === "summary" ? 3 : 7}
          value={draft[key]}
          disabled={!canManage || saving || record?.status === "closed"}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      ) : (
        <input
          required
          maxLength={max}
          type={key === "applicationUrl" ? "url" : "text"}
          value={draft[key]}
          disabled={!canManage || saving || record?.status === "closed"}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      )}
    </label>
  );
  return (
    <div className="career-admin">
      <style>{`.career-admin{max-width:1100px;min-width:0}.career-admin h2{font-size:17px;font-weight:600;margin-bottom:10px}.career-admin h3{font-size:15px;font-weight:600;margin:12px 0}.career-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.career-field{display:flex;flex-direction:column;gap:7px;min-width:0;font-size:13px}.career-field input,.career-field textarea,.career-field select,.career-reason{width:100%;min-width:0;box-sizing:border-box;background:var(--bg);color:var(--text-primary);border:1px solid var(--border);border-radius:8px;padding:11px;font:inherit}.career-panel{border:1px solid var(--border);border-radius:12px;padding:24px;margin:18px 0;background:var(--card)}.career-actions{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0}.career-row{display:block;text-align:left;width:100%;padding:20px;background:var(--card);border:1px solid var(--border);border-radius:12px;color:var(--text-primary);cursor:pointer;overflow-wrap:anywhere}.career-help{color:var(--text-secondary);font-size:13px;line-height:1.6}@media(max-width:600px){.career-grid{grid-template-columns:minmax(0,1fr)}.career-panel{padding:16px}}`}</style>
      {error && (
        <div role="alert" className="career-panel">
          <p>{error}</p>
          <button
            className="btn"
            disabled={saving}
            onClick={() => {
              if (
                !dirty ||
                window.confirm("Discard unsaved changes and reload?")
              )
                setRefresh((v) => v + 1);
            }}
          >
            Reload saved data
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {!id ? (
        <>
          <div className="career-actions">
            <button
              className="btn btn-primary"
              disabled={!canManage}
              onClick={() => navigate("/admin/careers/new")}
            >
              Create vacancy
            </button>
          </div>
          <p className="career-help">
            Publish opportunities with an approved external application
            destination. MGTV does not collect applications.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((r) => (
              <button
                className="career-row"
                key={r.id}
                onClick={() => navigate("/admin/careers/" + r.id)}
              >
                <strong>{r.draft.title}</strong>
                <p className="career-help">
                  {r.draft.department} · {r.draft.location} · {r.status}
                  {r.status === "published" &&
                  Date.parse(r.published.closesAt) <= Date.now()
                    ? " · expired"
                    : ""}
                </p>
              </button>
            ))}
          </div>
          {!items.length && !error && (
            <div className="career-panel">
              No vacancies yet. Start with a draft.
            </div>
          )}
          {next && (
            <button
              className="btn"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  const b = await api("/admin/careers?after=" + next);
                  setItems((v) => [...v, ...b.items]);
                  setNext(b.next);
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setSaving(false);
                }
              }}
            >
              More vacancies
            </button>
          )}
        </>
      ) : (
        <>
          <button
            className="btn"
            disabled={saving}
            onClick={() => navigate("/admin/careers")}
          >
            ← All vacancies
          </button>
          {(creating || record) && (
            <>
              <div className="career-panel">
                <h2>{creating ? "Create an opportunity" : draft.title}</h2>
                <p className="career-help">
                  {creating
                    ? "Private draft"
                    : `Status: ${record.status} · Saved version ${record.version}`}{" "}
                  · Editing a draft does not change the public listing.
                </p>
                <form onSubmit={save}>
                  <fieldset
                    disabled={
                      !canManage || saving || record?.status === "closed"
                    }
                    style={{ border: 0, padding: 0, minWidth: 0 }}
                  >
                    <div className="career-grid">
                      {field("title", "Role title", 180)}
                      {field("department", "Team / department", 100)}
                      {field("location", "Location", 180)}
                      <label className="career-field">
                        Workplace
                        <select
                          value={draft.workplace}
                          onChange={(e) =>
                            setDraft({ ...draft, workplace: e.target.value })
                          }
                        >
                          {["onsite", "hybrid", "remote"].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                      <label className="career-field">
                        Employment
                        <select
                          value={draft.employment}
                          onChange={(e) =>
                            setDraft({ ...draft, employment: e.target.value })
                          }
                        >
                          {[
                            "full-time",
                            "part-time",
                            "contract",
                            "internship",
                          ].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                      <label className="career-field">
                        Applications close (your local timezone)
                        <input
                          required
                          type="datetime-local"
                          value={
                            draft.closesAt
                              ? new Date(
                                  Date.parse(draft.closesAt) -
                                    new Date(
                                      draft.closesAt,
                                    ).getTimezoneOffset() *
                                      60000,
                                )
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              closesAt: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : "",
                            })
                          }
                        />
                      </label>
                    </div>
                    <div style={{ display: "grid", gap: 18, marginTop: 18 }}>
                      {field("summary", "Introduction", 600, true)}
                      {field("description", "The opportunity", 15000, true)}
                      {field(
                        "requirements",
                        "What applicants will bring",
                        10000,
                        true,
                      )}
                      {field(
                        "applicationUrl",
                        "External HTTPS application URL",
                        2048,
                      )}
                    </div>
                    <p className="career-help">
                      Plain text preserves line breaks. Confirm that the
                      external application destination is controlled by your
                      recruitment team.
                    </p>
                    <button className="btn btn-primary" type="submit">
                      {saving ? "Saving…" : "Save draft"}
                    </button>
                  </fieldset>
                </form>
              </div>
              {!creating && (
                <div className="career-panel">
                  <h2>Publication</h2>
                  <p className="career-help">
                    Publishing replaces the public listing with this saved
                    version. Closed and expired vacancies are unavailable
                    publicly. Reopening creates a private draft until published
                    again.
                  </p>
                  <div className="career-actions">
                    <button
                      className="btn btn-primary"
                      disabled={
                        !canPublish ||
                        saving ||
                        dirty ||
                        record.status === "closed"
                      }
                      onClick={() => setAction("publish")}
                    >
                      Publish saved version
                    </button>
                    <button
                      className="btn"
                      disabled={
                        !canPublish ||
                        saving ||
                        dirty ||
                        record.status !== "published"
                      }
                      onClick={() => setAction("close")}
                    >
                      Close applications
                    </button>
                    <button
                      className="btn"
                      disabled={
                        !canManage ||
                        saving ||
                        dirty ||
                        record.status !== "closed"
                      }
                      onClick={() => setAction("reopen")}
                    >
                      Reopen as draft
                    </button>
                  </div>
                  {dirty && (
                    <p className="career-help">
                      Save or discard your changes before making a publication
                      decision.
                    </p>
                  )}
                  {action && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void command();
                      }}
                    >
                      <h3>Confirm {action}</h3>
                      <label className="career-field">
                        Decision reason
                        <textarea
                          className="career-reason"
                          required
                          maxLength={1000}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </label>
                      <div className="career-actions">
                        <button disabled={saving} className="btn btn-primary">
                          Confirm {action}
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          className="btn"
                          onClick={() => setAction("")}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
              {!creating && (
                <section className="career-panel">
                  <h2>Saved history</h2>
                  <p className="career-help">
                    Latest 100 changes. Publication records identify the exact
                    reviewed version.
                  </p>
                  {history.map((h) => (
                    <details
                      key={h.version}
                      style={{ margin: "16px 0", overflowWrap: "anywhere" }}
                    >
                      <summary>
                        Version {h.version} · {h.action} ·{" "}
                        {new Date(h.created_at).toLocaleString()}
                      </summary>
                      <p>{h.reason}</p>
                      <p className="career-help">
                        {h.body.title} · {h.body.department} · {h.body.location}
                      </p>
                      <p style={{ whiteSpace: "pre-wrap" }}>{h.body.summary}</p>
                    </details>
                  ))}
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
