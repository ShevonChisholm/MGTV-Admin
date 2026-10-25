import LoadingState from "../components/LoadingState";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Card, Modal, EmptyState, Badge } from "../ui";
import StaffAuth from "./StaffAuth";
import { useDirtyGuard } from "../router";
const tabs = [
  { kind: "category", label: "Categories" },
  { kind: "genre", label: "Genres" },
  { kind: "tag", label: "Tags" },
  { kind: "classification", label: "Age Ratings" },
  { kind: "region", label: "Regions & Languages" },
];
const kinds = [
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
    [reason, setReason] = useState("");
  const requestKey = useRef<{ body: string; key: string } | null>(null),
    errorRef = useRef<HTMLDivElement>(null),
    serial = useRef(0),
    dirty = useRef(false);
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
    setAssigning(r);
    setTargets(r.targets);
    setReason("");
    setPickSearch("");
    setPickQuery("");
  }
  useEffect(() => {
    if (!assigning) return;
    let active = true;
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
    };
  }, [assigning?.id, pickerKind, pickQuery]);
  async function moreOptions() {
    const parameter = [
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
    setOptions((old) => [...old, ...p.items]);
    setPickCursor(p.nextCursor);
  }
  function toggle(r: any) {
    const ref = {
      kind: pickerKind,
      id: r.id,
      title: r.draft?.title ?? r.body?.title ?? r.title,
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
          variant="table"
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
          <button className="btn">Search</button>
        </form>
        {kind !== "classification" && (
          <button
            className="btn btn-primary"
            disabled={busy || !can("discovery.write")}
            onClick={() => {
              setEditing({ id: null });
              setBody(blank());
              setHistory([]);
            }}
          >
            Add {kind}
          </button>
        )}
      </div>
      <Card>
        <div className="scroll-x">
          <table
            className="data-table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                {[
                  "Name",
                  "Code",
                  "Published references",
                  "Status",
                  "Order",
                  "Actions",
                ].map((x) => (
                  <th
                    key={x}
                    style={{
                      textAlign: "left",
                      padding: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: 12 }}>
                    <strong>{r.name}</strong>
                    <small
                      style={{
                        display: "block",
                        color: "var(--text-muted)",
                        maxWidth: 380,
                      }}
                    >
                      {r.description}
                    </small>
                  </td>
                  <td style={{ padding: 12 }}>{r.code}</td>
                  <td style={{ padding: 12 }}>{r.items ?? "—"}</td>
                  <td style={{ padding: 12 }}>
                    <Badge color={r.active ? "#34d399" : "#9ca3af"}>
                      {r.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td style={{ padding: 12 }}>{r.position}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-sm"
                        disabled={busy}
                        onClick={() => void run(() => edit(r))}
                      >
                        Edit
                      </button>
                      {["tag", "genre"].includes(kind) && (
                        <button
                          className="btn btn-sm"
                          disabled={busy || !can("discovery.write")}
                          onClick={() => void run(() => openTargets(r))}
                        >
                          Content
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <EmptyState
            title="No records found"
            body="Try a different search or add a discovery record."
          />
        )}
      </Card>
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
          title={(editing.id ? "Edit " : "Add ") + kind}
          onClose={() => {
            if (busy) return;
            setEditing(null);
          }}
          width={620}
          footer={
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={
                  busy ||
                  !body.reason.trim() ||
                  !body.name.trim() ||
                  !body.code.trim() ||
                  !can("discovery.write") ||
                  ((editing.active || body.active) && !can("discovery.publish"))
                }
                onClick={() => void run(save)}
              >
                Save record
              </button>
            </>
          }
        >
          {error && (
            <div role="alert" tabIndex={-1} ref={errorRef}>
              {error}
            </div>
          )}
          {(editing.active || body.active) && !can("discovery.publish") && (
            <p role="note">
              Changing an active discovery record requires explicit
              discovery.publish permission.
            </p>
          )}
          <fieldset
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
                onChange={(e) => setBody({ ...body, active: e.target.checked })}
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
                      {k}
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
                onChange={(e) => setBody({ ...body, reason: e.target.value })}
              />
            </label>
          </fieldset>
          <h3 style={{ marginTop: 20 }}>Recent activity</h3>
          <ul>
            {history.map((h) => (
              <li key={h.id}>
                {h.action} · {h.details.reason}
                <small style={{ display: "block" }}>
                  {new Date(h.created_at).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
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
          width={720}
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
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <form
              style={{ display: "flex", gap: 8 }}
              onSubmit={(e) => {
                e.preventDefault();
                setPickQuery(pickSearch.trim());
              }}
            >
              <input
                aria-label="Search tag content"
                className="input"
                value={pickSearch}
                onChange={(e) => setPickSearch(e.target.value)}
              />
              <button className="btn">Search</button>
            </form>
            <p>{targets.length} selected</p>
            <ul style={{ padding: 0, listStyle: "none" }}>
              {targets.map((t) => (
                <li
                  key={t.kind + t.id}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ flex: 1 }}>
                    {t.title ?? t.id} · {t.kind}
                  </span>
                  <button
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={() =>
                      setTargets(
                        targets.filter(
                          (x) => x.kind !== t.kind || x.id !== t.id,
                        ),
                      )
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ display: "grid", gap: 8 }}>
              {options.map((r) => (
                <label
                  key={r.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: 10,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={targets.some(
                      (t) => t.kind === pickerKind && t.id === r.id,
                    )}
                    onChange={() => toggle(r)}
                  />
                  <span style={{ flex: 1 }}>
                    {r.draft?.title ?? r.body?.title ?? r.title}
                  </span>
                  <small>{r.status}</small>
                </label>
              ))}
            </div>
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
