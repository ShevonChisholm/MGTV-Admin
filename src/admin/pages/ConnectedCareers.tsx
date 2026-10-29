import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useDirtyGuard, useRouter } from "../router";
import LoadingState from "../components/LoadingState";
import MediaIcon from "../components/MediaIcon";
import CareersDirectory, {
  CareersHero,
  CareerOverview,
  CareerHistory,
  CareerStatus,
} from "../components/CareersVisual";
import "./careers-admin.css";
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
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [view, setView] = useState("overview");
  const listParams = (after?: string) =>
    new URLSearchParams({ q: query, status, ...(after ? { after } : {}) });
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
    setView(creating ? "edit" : "overview");
    setError("");
    setNotice("");
    setRecord(null);
    if (!id) setItems([]);
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
        const b = await api("/admin/careers?" + listParams());
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
  }, [id, refresh, creating, query, status]);
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
  if (busy)
    return (
      <LoadingState
        variant={id ? "form" : "cards"}
        label="Loading Careers workspace"
      />
    );
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
    <div className="career-admin av-workspace">
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
          <CareersHero />
          <aside className="career-v-external-note">
            <span className="career-v-icon">
              <MediaIcon name="globe" />
            </span>
            <div>
              <strong>Applications stay with your recruitment team</strong>
              <p>
                Each vacancy links to an approved external application
                destination. MGTV does not collect applications or resumes.
              </p>
            </div>
          </aside>
          <form
            className="career-v-toolbar"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
            }}
          >
            <label>
              Find a vacancy
              <input
                className="input"
                type="search"
                maxLength={120}
                placeholder="Role, team or location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              Status
              <select
                className="input"
                value={status}
                disabled={saving}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <button className="btn btn-primary" disabled={saving}>
              <MediaIcon name="search" size={16} />
              Search
            </button>
            <button
              className="btn"
              type="button"
              disabled={saving}
              onClick={() => {
                setSearch("");
                setQuery("");
                setStatus("");
              }}
            >
              Reset
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!canManage || saving}
              onClick={() => navigate("/admin/careers/new")}
            >
              <MediaIcon name="plus" size={17} />
              Create vacancy
            </button>
          </form>
          <CareersDirectory
            key={query + status}
            items={items}
            next={!!next}
            open={(id) => navigate("/admin/careers/" + id)}
          />
          {next && (
            <button
              className="btn"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  const b = await api("/admin/careers?" + listParams(next));
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
            <MediaIcon name="back" size={16} />
            All vacancies
          </button>
          {(creating || record) && (
            <>
              <header className="career-v-workspace-heading">
                <div>
                  <span className="career-v-eyebrow">
                    <MediaIcon name="users" size={16} />
                    {creating ? "NEW OPPORTUNITY" : "VACANCY WORKSPACE"}
                  </span>
                  <h2>
                    {creating
                      ? "Build your next opportunity"
                      : record.draft.title}
                  </h2>
                  <p>
                    {creating
                      ? "Start privately. Review and publish only when ready."
                      : "Manage the saved role, public snapshot and recorded decisions separately."}
                  </p>
                </div>
                {record && <CareerStatus record={record} />}
              </header>
              {!creating && (
                <nav
                  className="career-v-section-nav"
                  aria-label="Vacancy workspace"
                >
                  {[
                    { id: "overview", label: "Saved overview", icon: "grid" },
                    { id: "edit", label: "Edit draft", icon: "edit" },
                    { id: "public", label: "Public snapshot", icon: "globe" },
                    { id: "history", label: "Version history", icon: "clock" },
                  ].map((item) => (
                    <button
                      className="btn"
                      type="button"
                      key={item.id}
                      aria-pressed={view === item.id}
                      disabled={
                        saving || (item.id === "public" && !record.published)
                      }
                      onClick={() => setView(item.id)}
                    >
                      <MediaIcon name={item.icon} size={17} />
                      {item.label}
                    </button>
                  ))}
                </nav>
              )}
              {dirty && (
                <p className="career-v-unsaved" role="status">
                  <MediaIcon name="edit" size={16} />
                  Unsaved draft edits. The saved and public snapshots below do
                  not include them.
                </p>
              )}
              {!creating && view === "overview" && (
                <CareerOverview
                  body={record.draft}
                  label="Saved draft / not a live preview"
                />
              )}
              {!creating && view === "public" && record.published && (
                <>
                  <p className="career-v-external-note">
                    This is the stored published snapshot. Expired or closed
                    vacancies are unavailable publicly. It does not include
                    unpublished draft edits.
                  </p>
                  <CareerOverview
                    body={record.published}
                    label="Published snapshot"
                  />
                </>
              )}
              {(creating || view === "edit") && (
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
              )}
              {!creating && view === "overview" && (
                <div className="career-panel career-v-publication">
                  <header className="career-v-section-heading">
                    <span className="career-v-icon">
                      <MediaIcon name="globe" />
                    </span>
                    <div>
                      <h2>Publication decisions</h2>
                      <p>
                        Review the saved version before changing its public
                        availability.
                      </p>
                    </div>
                  </header>
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
              {!creating && view === "history" && (
                <CareerHistory items={history} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
