import LoadingState from "../components/LoadingState";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Modal, EmptyState, Badge } from "../ui";
import MediaIcon from "../components/MediaIcon";
import DiscoveryRecordCard, {
  DiscoveryMark,
  DiscoveryContentCard,
  termLabel,
  contentLabel,
  contentIcon,
} from "../components/DiscoveryVisual";
import "../components/DiscoveryVisual.css";
import StaffAuth from "./StaffAuth";
import EpisodeSelector from "../components/EpisodeSelector";
import { useDirtyGuard } from "../router";
const tabs = [
  { kind: "category", label: "Categories" },
  { kind: "genre", label: "Genres" },
  { kind: "tag", label: "Tags" },
  { kind: "classification", label: "Age Ratings" },
  { kind: "region", label: "Regions & Languages" },
];
const kinds = [
    "podcast",
    "movie",
    "show",
    "episode",
    "music",
    "sports",
    "event",
    "artist",
    "album",
    "playlist",
    "news",
    "lifestyle",
  ],
  paths: any = {
    podcast: "podcasts",
    movie: "movies",
    show: "shows",
    episode: "episodes",
    music: "music",
    sports: "sports",
    event: "events",
    artist: "artists",
    album: "albums",
    playlist: "playlists",
    news: "news",
    lifestyle: "lifestyle",
  };
const blank = () => ({
  name: "",
  code: "",
  description: "",
  active: true,
  position: 0,
  contentKinds: [] as string[],
  reason: "",
});
export default function ConnectedDiscovery() {
  const [session, setSession] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [kind, setKind] = useState("category"),
    [rows, setRows] = useState<any[]>([]),
    [q, setQ] = useState(""),
    [search, setSearch] = useState(""),
    [cursor, setCursor] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [editing, setEditing] = useState<any>(null),
    [body, setBody] = useState(blank),
    [history, setHistory] = useState<any[]>([]),
    [assigning, setAssigning] = useState<any>(null),
    [targets, setTargets] = useState<any[]>([]),
    [pickerKind, setPickerKind] = useState("movie"),
    [options, setOptions] = useState<any[]>([]),
    [pickSearch, setPickSearch] = useState(""),
    [pickQuery, setPickQuery] = useState(""),
    [pickCursor, setPickCursor] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [pane, setPane] = useState("overview");
  const requestKey = useRef<{ body: string; key: string } | null>(null),
    errorRef = useRef<HTMLDivElement>(null),
    serial = useRef(0),
    dirty = useRef(false),
    pickerSerial = useRef(0);
  dirty.current = !!editing || !!assigning;
  useDirtyGuard(() => dirty.current);
  const can = (p: string) => session?.permissions.includes(p);
  function key(value: any) {
    const serialized = JSON.stringify(value);
    if (requestKey.current?.body !== serialized)
      requestKey.current = { body: serialized, key: crypto.randomUUID() };
    return requestKey.current.key;
  }
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setSession(null);
      setError((e as Error).message);
      setTimeout(() => errorRef.current?.focus(), 0);
    } finally {
      setBusy(false);
      setLoaded(true);
    }
  }
  async function load(more = false) {
    const p = await api(
      "/admin/discovery/" +
        kind +
        "?limit=50&q=" +
        encodeURIComponent(search) +
        (more && cursor ? "&after=" + cursor : ""),
    );
    setRows((old) => (more ? [...old, ...p.items] : p.items));
    setCursor(p.nextCursor);
  }
  useEffect(() => {
    const generation = ++serial.current;
    void run(async () => {
      const s = await api("/admin/session");
      if (generation !== serial.current) return;
      setSession(s);
      if (!s.permissions.includes("discovery.read"))
        throw Error("Discovery access requires discovery.read permission.");
      const p = await api(
        "/admin/discovery/" +
          kind +
          "?limit=50&q=" +
          encodeURIComponent(search),
      );
      if (generation !== serial.current) return;
      setRows(p.items);
      setCursor(p.nextCursor);
    });
    return () => {
      serial.current++;
    };
  }, [kind, search]);
  async function edit(row: any) {
    const r = await api("/admin/discovery/" + kind + "/" + row.id);
    setBody({
      ...blank(),
      ...Object.fromEntries(
        [
          "name",
          "code",
          "description",
          "active",
          "position",
          "contentKinds",
        ].map((k) => [k, r[k]]),
      ),
    });
    setEditing(r);
    setPane("overview");
    setHistory(
      (await api("/admin/discovery/" + kind + "/" + r.id + "/history")).items,
    );
  }
  async function save() {
    const value = { kind, id: editing.id, version: editing.version, body };
    if (editing.id)
      await api(
        "/admin/discovery/" + kind + "/" + editing.id,
        "PUT",
        body,
        editing.version,
        key(value),
      );
    else
      await api(
        "/admin/discovery/" + kind,
        "POST",
        body,
        undefined,
        key(value),
      );
    requestKey.current = null;
    setEditing(null);
    setNotice("Discovery record saved.");
    await load();
  }
  async function openTargets(row: any) {
    const r = await api("/admin/discovery/" + kind + "/" + row.id);
    setPickerKind("movie");
    setAssigning(r);
    setTargets(r.targets);
    setReason("");
    setPickSearch("");
    setPickQuery("");
  }
  useEffect(() => {
    if (!assigning) return;
    if (pickerKind === "episode") {
      setOptions([]);
      setPickCursor(null);
      return;
    }
    let active = true;
    pickerSerial.current++;
    setOptions([]);
    setPickCursor(null);
    void run(async () => {
      const p = await api(
        "/admin/" +
          paths[pickerKind] +
          "?limit=24&q=" +
          encodeURIComponent(pickQuery),
      );
      if (active) {
        setOptions(p.items);
        setPickCursor(p.nextCursor);
      }
    });
    return () => {
      active = false;
      pickerSerial.current++;
    };
  }, [assigning?.id, pickerKind, pickQuery]);
  async function moreOptions() {
    const generation = pickerSerial.current;
    const parameter = [
      "podcast",
      "news",
      "lifestyle",
      "artist",
      "album",
      "playlist",
      "event",
    ].includes(pickerKind)
      ? "after"
      : "cursor";
    const p = await api(
      "/admin/" +
        paths[pickerKind] +
        "?limit=24&q=" +
        encodeURIComponent(pickQuery) +
        "&" +
        parameter +
        "=" +
        pickCursor,
    );
    if (generation !== pickerSerial.current) return;
    setOptions((old) => [
      ...old,
      ...p.items.filter((r: any) => !old.some((x) => x.id === r.id)),
    ]);
    setPickCursor(p.nextCursor);
  }
  function toggle(r: any) {
    if (
      !targets.some((t) => t.kind === pickerKind && t.id === r.id) &&
      targets.length >= 100
    ) {
      setError(
        "You can select up to 100 records. Remove one before adding another.",
      );
      return;
    }
    setError("");
    const ref = {
      kind: pickerKind,
      id: r.id,
      title:
        r.draft?.title ?? r.draft?.name ?? r.body?.title ?? r.title ?? r.name,
    };
    setTargets((old) =>
      old.some((t) => t.kind === ref.kind && t.id === ref.id)
        ? old.filter((t) => t.kind !== ref.kind || t.id !== ref.id)
        : old.length < 100
          ? [...old, ref]
          : old,
    );
  }
  async function saveTargets() {
    const payload = {
      targets: targets.map(({ kind, id }) => ({ kind, id })),
      reason,
    };
    await api(
      "/admin/discovery/" + assigning.kind + "/" + assigning.id + "/targets",
      "PUT",
      payload,
      assigning.version,
      key({ id: assigning.id, version: assigning.version, ...payload }),
    );
    requestKey.current = null;
    setAssigning(null);
    setNotice(
      (assigning.kind === "genre" ? "Genre" : "Tag") +
        " associations saved. Only available published content appears in search.",
    );
    await load();
  }
  if (!loaded)
    return (
      <div className="page-pad">
        <LoadingState
          label={<>Loading Categories & Discovery…</>}
          variant="cards"
        />
      </div>
    );
  if (!session)
    return (
      <div className="page-pad">
        <StaffAuth
          onAuthenticated={() =>
            run(async () => {
              const s = await api("/admin/session");
              setSession(s);
              await load();
            })
          }
        />
        {error && <p role="alert">{error}</p>}
      </div>
    );
  if (!can("discovery.read"))
    return (
      <div className="page-pad">
        <p role="alert">
          Categories & Discovery requires explicit discovery.read permission.
        </p>
      </div>
    );
  return (
    <div className="page-pad discovery-workspace">
      {error && (
        <div
          className="card"
          role="alert"
          ref={errorRef}
          tabIndex={-1}
          style={{ padding: 14, marginBottom: 16 }}
        >
          {error}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      <header className="dv-intro">
        <span className="dv-eyebrow">MGTV · FIND YOUR NEXT FAVOURITE</span>
        <h2>Every story, easier to find.</h2>
        <p>
          Build the pathways between your audience and the stories, sounds and
          moments they love.
        </p>
      </header>
      <div
        className="discovery-tabs"
        role="tablist"
        aria-label="Discovery settings"
      >
        {tabs.map((t) => (
          <button
            disabled={busy}
            role="tab"
            aria-selected={
              t.kind === kind || (t.kind === "region" && kind === "language")
            }
            key={t.kind}
            className={
              "btn " +
              (t.kind === kind || (t.kind === "region" && kind === "language")
                ? "btn-primary"
                : "")
            }
            onClick={() => {
              setKind(t.kind);
              setSearch("");
              setQ("");
            }}
          >
            <MediaIcon
              name={
                t.kind === "classification"
                  ? "lock"
                  : t.kind === "region"
                    ? "globe"
                    : t.kind === "category"
                      ? "grid"
                      : t.kind === "genre"
                        ? "film"
                        : "link"
              }
            />
            {t.label}
          </button>
        ))}
      </div>
      {["region", "language"].includes(kind) && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button
            className="btn"
            aria-pressed={kind === "region"}
            disabled={busy}
            onClick={() => setKind("region")}
          >
            Regions
          </button>
          <button
            className="btn"
            aria-pressed={kind === "language"}
            disabled={busy}
            onClick={() => setKind("language")}
          >
            Languages
          </button>
        </div>
      )}
      <p style={{ color: "var(--text-secondary)", marginBottom: 18 }}>
        {kind === "classification"
          ? "Age codes remain fixed for parental protection. Edit their descriptions and display labels without changing access rules."
          : ["region", "language"].includes(kind)
            ? "Maintain discovery reference labels. Adding a region does not grant content rights or enable delivery there."
            : "Organize how audiences discover published stories, sounds and events. Active changes require explicit publication permission."}
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
          }}
          style={{ display: "flex", gap: 8 }}
        >
          <input
            className="input"
            maxLength={120}
            aria-label="Search discovery records"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn" disabled={busy}>
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => {
                setQ("");
                setSearch("");
              }}
            >
              Clear search
            </button>
          )}
        </form>
        {kind !== "classification" && (
          <button
            className="btn btn-primary"
            disabled={busy || !can("discovery.write")}
            onClick={() => {
              setEditing({ id: null });
              setBody(blank());
              setHistory([]);
              setPane("edit");
            }}
          >
            <MediaIcon name="plus" size={17} /> Add{" "}
            {termLabel(kind).toLowerCase()}
          </button>
        )}
      </div>
      <div className="dv-results" role="status">
        <span>
          <strong>{rows.length}</strong> {termLabel(kind, true).toLowerCase()}{" "}
          loaded{cursor ? " · more available" : ""}
        </span>
        <span>
          <MediaIcon name="globe" size={15} /> Published references, before
          profile filters
        </span>
      </div>
      <div
        className="dv-record-grid"
        aria-label={termLabel(kind, true)}
        aria-busy={busy}
      >
        {rows.map((r) => (
          <DiscoveryRecordCard
            key={r.id}
            record={r}
            busy={busy}
            onOpen={() => void run(() => edit(r))}
            onAssign={
              ["tag", "genre"].includes(kind) && can("discovery.write")
                ? () => void run(() => openTargets(r))
                : undefined
            }
          />
        ))}
      </div>
      {!rows.length && !busy && (
        <EmptyState
          title="No records found"
          body="Try a different search or add a discovery record."
        />
      )}
      <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
        Reference counts reflect published records before availability and
        selected-profile checks. Search returns only currently available
        content.
      </p>
      {cursor && (
        <button
          className="btn"
          disabled={busy}
          onClick={() => void run(() => load(true))}
        >
          More records
        </button>
      )}
      {editing && (
        <Modal
          title={
            editing.id ? editing.name : "Add " + termLabel(kind).toLowerCase()
          }
          onClose={() => {
            if (busy) return;
            setEditing(null);
          }}
          width={820}
          footer={
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              {pane === "edit" && (
                <button
                  className="btn btn-primary"
                  disabled={
                    busy ||
                    !body.reason.trim() ||
                    !body.name.trim() ||
                    !body.code.trim() ||
                    !can("discovery.write") ||
                    ((editing.active || body.active) &&
                      !can("discovery.publish"))
                  }
                  onClick={() => void run(save)}
                >
                  Save record
                </button>
              )}
            </>
          }
        >
          {error && (
            <div role="alert" tabIndex={-1} ref={errorRef}>
              {error}
            </div>
          )}
          {editing.id && (
            <>
              <div className="dv-detail-head">
                <DiscoveryMark kind={kind} code={editing.code} />
                <div>
                  <span className="dv-eyebrow">
                    {termLabel(kind)} · SAVED VERSION {editing.version}
                  </span>
                  <h3>{editing.name}</h3>
                  <Badge color={editing.active ? "#34d399" : "#9ca3af"}>
                    {editing.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <nav className="dv-pane-nav" aria-label="Record view">
                {["overview", "edit", "activity"].map((view) => (
                  <button
                    className="btn"
                    aria-pressed={pane === view}
                    disabled={busy}
                    key={view}
                    onClick={() => setPane(view)}
                  >
                    <MediaIcon
                      name={
                        view === "overview"
                          ? "grid"
                          : view === "edit"
                            ? "edit"
                            : "clock"
                      }
                    />
                    {view === "edit"
                      ? "Edit details"
                      : view === "activity"
                        ? "Activity"
                        : "Overview"}
                  </button>
                ))}
              </nav>
              {pane === "overview" && (
                <section className="dv-overview">
                  <p>
                    {editing.description ||
                      "Add a description to give this discovery label more context."}
                  </p>
                  <div className="dv-facts">
                    <div>
                      <MediaIcon name="link" />
                      <strong>{editing.items ?? 0}</strong>
                      <span>Published references</span>
                    </div>
                    <div>
                      <MediaIcon name="grid" />
                      <strong>{editing.position}</strong>
                      <span>Display order</span>
                    </div>
                    <div>
                      <MediaIcon name="lock" />
                      <strong>
                        {editing.protected ? "Protected" : "Managed"}
                      </strong>
                      <span>
                        {editing.protected
                          ? "Age policy stays fixed"
                          : "Explicit access required"}
                      </span>
                    </div>
                  </div>
                  {editing.contentKinds?.length > 0 && (
                    <>
                      <h4>Included content</h4>
                      <div className="dv-chips">
                        {editing.contentKinds.map((k: string) => (
                          <span key={k}>{contentLabel(k)}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {["tag", "genre"].includes(kind) && (
                    <button
                      className="btn btn-primary"
                      disabled={busy || !can("discovery.write")}
                      onClick={() => {
                        setEditing(null);
                        void run(() => openTargets(editing));
                      }}
                    >
                      <MediaIcon name="link" />
                      Arrange associated content
                    </button>
                  )}
                </section>
              )}
            </>
          )}
          {pane === "edit" && (
            <>
              {(editing.active || body.active) && !can("discovery.publish") && (
                <p role="note">
                  Changing an active discovery record requires explicit
                  discovery.publish permission.
                </p>
              )}
              <fieldset
                className="dv-editor"
                disabled={busy || !can("discovery.write")}
                style={{ border: 0, padding: 0, display: "grid", gap: 14 }}
              >
                <label>
                  Name
                  <input
                    className="input"
                    maxLength={120}
                    value={body.name}
                    onChange={(e) => setBody({ ...body, name: e.target.value })}
                  />
                </label>
                <label>
                  Code
                  <input
                    className="input"
                    maxLength={80}
                    disabled={!!editing.id}
                    value={body.code}
                    onChange={(e) => setBody({ ...body, code: e.target.value })}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    className="input"
                    maxLength={600}
                    value={body.description}
                    onChange={(e) =>
                      setBody({ ...body, description: e.target.value })
                    }
                  />
                </label>
                <label>
                  Display order
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={10000}
                    value={body.position}
                    onChange={(e) =>
                      setBody({ ...body, position: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    disabled={kind === "classification"}
                    checked={body.active}
                    onChange={(e) =>
                      setBody({ ...body, active: e.target.checked })
                    }
                  />{" "}
                  Active
                </label>
                {kind === "category" && (
                  <fieldset
                    style={{ border: "1px solid var(--border)", padding: 12 }}
                  >
                    <legend>Included content types</legend>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                        gap: 8,
                      }}
                    >
                      {kinds.map((k) => (
                        <label key={k}>
                          <input
                            type="checkbox"
                            checked={body.contentKinds.includes(k)}
                            onChange={(e) =>
                              setBody({
                                ...body,
                                contentKinds: e.target.checked
                                  ? [...body.contentKinds, k]
                                  : body.contentKinds.filter((x) => x !== k),
                              })
                            }
                          />{" "}
                          <MediaIcon name={contentIcon(k)} size={16} />
                          {contentLabel(k)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <label>
                  Reason for change
                  <textarea
                    className="input"
                    maxLength={1000}
                    value={body.reason}
                    onChange={(e) =>
                      setBody({ ...body, reason: e.target.value })
                    }
                  />
                </label>
              </fieldset>
            </>
          )}
          {pane === "activity" && (
            <>
              <h3>Recent activity</h3>
              {!history.length && (
                <EmptyState
                  title="No activity recorded"
                  body="Saved changes appear here with their audit reasons."
                />
              )}
              <ul className="dv-history">
                {history.map((h) => (
                  <li key={h.id}>
                    <MediaIcon name="clock" size={18} />
                    <div>
                      <strong>
                        {h.action
                          .replaceAll("discovery.", "")
                          .replaceAll("_", " ")}
                      </strong>
                      <p>{h.details.reason}</p>
                      <small style={{ display: "block" }}>
                        {new Date(h.created_at).toLocaleString()}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal>
      )}
      {assigning && (
        <Modal
          title={
            (assigning.kind === "genre"
              ? "Content with genre “"
              : "Content tagged “") +
            assigning.name +
            "”"
          }
          width={1040}
          onClose={() => {
            if (!busy) setAssigning(null);
          }}
          footer={
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setAssigning(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={
                  busy ||
                  !reason.trim() ||
                  !can("discovery.write") ||
                  (assigning.active && !can("discovery.publish"))
                }
                onClick={() => void run(saveTargets)}
              >
                Save associations
              </button>
            </>
          }
        >
          {error && (
            <div role="alert" tabIndex={-1} ref={errorRef}>
              {error}
            </div>
          )}
          <p>
            {assigning.active &&
              !can("discovery.publish") &&
              "Changing these active associations requires explicit discovery.publish permission. "}
            Select up to 100 records. Draft associations remain private until
            the content itself is published.
            {assigning.kind === "genre" &&
              " Manual associations supplement the native genres managed in each content editor."}
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            <label>
              Content type
              <select
                className="input"
                value={pickerKind}
                disabled={busy}
                onChange={(e) => setPickerKind(e.target.value)}
              >
                {kinds.map((k) => (
                  <option key={k} value={k}>
                    {contentLabel(k)}
                  </option>
                ))}
              </select>
            </label>
            {pickerKind === "episode" ? (
              <EpisodeSelector onRows={setOptions} onError={setError} />
            ) : (
              <form
                style={{ display: "flex", gap: 8 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  setPickQuery(pickSearch.trim());
                }}
              >
                <input
                  aria-label="Search associated content"
                  className="input"
                  value={pickSearch}
                  onChange={(e) => setPickSearch(e.target.value)}
                />
                <button className="btn">Search</button>
              </form>
            )}
            <div className="dv-results" role="status">
              <strong>{targets.length} / 100 selected</strong>
              <span>{options.length} records loaded</span>
            </div>
            <details className="dv-selected">
              <summary>Review selected content ({targets.length})</summary>
              <div className="dv-selected-list">
                {targets.map((t) => (
                  <div key={t.kind + t.id}>
                    <MediaIcon name={contentIcon(t.kind)} size={18} />
                    <span>
                      <strong>{t.title ?? t.id}</strong>
                      <small>{contentLabel(t.kind)}</small>
                    </span>
                    <button
                      className="btn btn-sm"
                      aria-label={"Remove " + (t.title ?? t.id)}
                      disabled={busy}
                      onClick={() => {
                        setTargets(
                          targets.filter(
                            (x) => x.kind !== t.kind || x.id !== t.id,
                          ),
                        );
                        setError("");
                      }}
                    >
                      <MediaIcon name="minus" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </details>
            <div className="dv-content-grid" aria-busy={busy}>
              {options.map((r) => (
                <DiscoveryContentCard
                  key={r.id}
                  record={r}
                  kind={pickerKind}
                  checked={targets.some(
                    (t) => t.kind === pickerKind && t.id === r.id,
                  )}
                  disabled={busy}
                  onToggle={() => toggle(r)}
                />
              ))}
            </div>
            {!options.length && !busy && pickerKind !== "episode" && (
              <EmptyState
                title="No selectable content"
                body="Try another search or content type. Access to content is checked separately."
              />
            )}
            {pickCursor && (
              <button
                className="btn"
                disabled={busy}
                onClick={() => void run(moreOptions)}
              >
                More content
              </button>
            )}
            <label>
              Reason for associations
              <textarea
                className="input"
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
