import LoadingState, { ErrorState } from "../components/LoadingState";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { useRouter, useDirtyGuard } from "../router";
import { Card, Modal, EmptyState, Badge } from "../ui";
import { PageActions } from "../components/PageHeader";
import StaffAuth from "./StaffAuth";
type Ref = { kind: string; id: string };
type Section = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  kind: string;
  layout: string;
  destination: string;
  items: Ref[];
};
type Layout = { hero: Ref[]; sections: Section[] };
const surfaces = [
  "home",
  "shows",
  "movies",
  "music",
  "sports",
  "events",
  "news",
  "lifestyle",
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
];
const heroKinds: any = {
  home: kinds.filter((k) => !["episode", "album", "playlist"].includes(k)),
  shows: ["show"],
  movies: ["movie"],
  music: ["music", "artist"],
  sports: ["sports"],
  events: ["event"],
  news: ["news"],
  lifestyle: ["lifestyle"],
};
const paths: any = {
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
const key = (r: Ref) => r.kind + ":" + r.id;
function move<T>(a: T[], i: number, step: number) {
  const b = [...a],
    j = i + step;
  if (j >= 0 && j < b.length) [b[i], b[j]] = [b[j], b[i]];
  return b;
}
const blank = (): Layout => ({ hero: [], sections: [] });
export default function ConnectedHomepage() {
  const { route } = useRouter();
  return (
    <HomepageWorkspace
      key={route.parts[0] ?? "home"}
      surface={route.parts[0] ?? "home"}
    />
  );
}
function HomepageWorkspace({ surface }: { surface: string }) {
  const { navigate } = useRouter();
  const [session, setSession] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState<Layout>(blank),
    [preview, setPreview] = useState<any>(null),
    [history, setHistory] = useState<any[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [reason, setReason] = useState(""),
    [picking, setPicking] = useState<string | null>(null),
    [kind, setKind] = useState("movie"),
    [q, setQ] = useState(""),
    [search, setSearch] = useState(""),
    [options, setOptions] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [pickerBusy, setPickerBusy] = useState(false),
    [pickerError, setPickerError] = useState(""),
    [labels, setLabels] = useState<Record<string, any>>({});
  const commandKey = useRef<{ body: string; key: string } | null>(null),
    errorRef = useRef<HTMLDivElement>(null);
  const dirty =
      !!record && JSON.stringify(draft) !== JSON.stringify(record.draft),
    dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useDirtyGuard(() => dirtyRef.current);
  const can = (p: string) => session?.permissions.includes(p),
    base = "/admin/homepage/" + surface;
  function problem(e: any) {
    if (e instanceof ApiError && e.status === 401) setSession(null);
    setError(e.message ?? "The page could not be saved.");
    setTimeout(() => errorRef.current?.focus(), 0);
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      problem(e);
    } finally {
      setBusy(false);
      setLoaded(true);
    }
  }
  function remember(p: any) {
    const entries = [
      ...(p?.preview?.hero ?? []),
      ...(p?.preview?.sections ?? []).flatMap((s: any) => s.items),
    ];
    setLabels((old) => ({
      ...old,
      ...Object.fromEntries(
        entries.map((r: any) => [
          key(r),
          {
            ...r,
            title: r.content.title,
            status: "published",
            image: r.content.artwork?.landscapeUrl ?? r.content.coverUrl,
          },
        ]),
      ),
    }));
  }
  async function review() {
    const p = await api(base + "/publication-check");
    setPreview(p);
    remember(p);
    setHistory((await api(base + "/history")).items);
  }
  async function load() {
    const s = await api("/admin/session");
    setSession(s);
    if (!s.permissions.includes("homepage.read"))
      throw Error("Homepage access requires homepage.read permission.");
    const r = await api(base);
    setRecord(r);
    setDraft(r.draft);
    await review();
  }
  useEffect(() => {
    void run(load);
  }, [surface]);
  function change(next: Layout) {
    setDraft(next);
    setNotice("");
  }
  const patch = (id: string, b: Partial<Section>) =>
    change({
      ...draft,
      sections: draft.sections.map((s) => (s.id === id ? { ...s, ...b } : s)),
    });
  async function save() {
    const r = await api(base + "/draft", "PATCH", draft, record.version);
    setRecord(r);
    setDraft(r.draft);
    setNotice("Draft saved. The published page stays unchanged.");
    await review();
  }
  async function command(action: string) {
    const b = {
      reason,
      ...(action === "publish" ? { revisionId: record.draftRevisionId } : {}),
    };
    const signature = JSON.stringify({
      surface,
      action,
      version: record.version,
      ...b,
    });
    if (commandKey.current?.body !== signature)
      commandKey.current = { body: signature, key: crypto.randomUUID() };
    const r = await api(
      base + "/" + action,
      "POST",
      b,
      record.version,
      commandKey.current.key,
    );
    commandKey.current = null;
    setRecord(r);
    setDraft(r.draft);
    setNotice(
      action === "publish"
        ? "Published. Customers now receive this saved layout."
        : action === "unpublish"
          ? "Layout withdrawn. Content records remain published independently."
          : "Published layout restored to a new draft. It has not been republished.",
    );
    setReason("");
    await review();
  }
  const chosen =
    picking === "hero"
      ? draft.hero
      : (draft.sections.find((s) => s.id === picking)?.items ?? []);
  function toggle(ref: Ref) {
    const next = chosen.some((r) => key(r) === key(ref))
      ? chosen.filter((r) => key(r) !== key(ref))
      : [...chosen, ref];
    if (next.length > (picking === "hero" ? 5 : 24)) {
      setPickerError("This selection is full. Remove an item first.");
      return;
    }
    if (picking === "hero") change({ ...draft, hero: next });
    else if (picking) patch(picking, { items: next });
  }
  const allowed = picking === "hero" ? (heroKinds[surface] ?? []) : kinds;
  useEffect(() => {
    if (!picking) return;
    let active = true;
    setOptions([]);
    setCursor(null);
    setPickerError("");
    setPickerBusy(true);
    void api(
      "/admin/" + paths[kind] + "?limit=24&q=" + encodeURIComponent(search),
    )
      .then((p) => {
        if (!active) return;
        const rows = p.items ?? [];
        setOptions(rows);
        setCursor(p.nextCursor);
        setLabels((old) => ({
          ...old,
          ...Object.fromEntries(
            rows.map((r: any) => [
              key({ kind, id: r.id }),
              {
                id: r.id,
                kind,
                title: r.draft?.title ?? r.title ?? "Untitled",
                status: r.status,
              },
            ]),
          ),
        }));
      })
      .catch((e) => {
        if (active) setPickerError(e.message);
      })
      .finally(() => {
        if (active) setPickerBusy(false);
      });
    return () => {
      active = false;
    };
  }, [picking, kind, search]);
  async function more() {
    setPickerBusy(true);
    setPickerError("");
    try {
      const param = [
          "news",
          "lifestyle",
          "artist",
          "album",
          "playlist",
        ].includes(kind)
          ? "after"
          : "cursor",
        p = await api(
          "/admin/" +
            paths[kind] +
            "?limit=24&q=" +
            encodeURIComponent(search) +
            "&" +
            param +
            "=" +
            encodeURIComponent(cursor ?? ""),
        );
      setOptions((old) => [...old, ...p.items]);
      setCursor(p.nextCursor);
      setLabels((old) => ({
        ...old,
        ...Object.fromEntries(
          p.items.map((r: any) => [
            key({ kind, id: r.id }),
            {
              kind,
              id: r.id,
              title: r.draft?.title ?? r.title,
              status: r.status,
            },
          ]),
        ),
      }));
    } catch (e: any) {
      setPickerError(e.message);
    } finally {
      setPickerBusy(false);
    }
  }
  function openPicker(id: string) {
    setPicking(id);
    setKind(id === "hero" ? (heroKinds[surface]?.[0] ?? "movie") : "movie");
    setQ("");
    setSearch("");
  }
  function selection(refs: Ref[], update: (refs: Ref[]) => void) {
    return (
      <ol style={{ paddingLeft: 22, display: "grid", gap: 8 }}>
        {refs.map((r, i) => (
          <li key={key(r)}>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span style={{ flex: "1 1 140px", overflowWrap: "anywhere" }}>
                {labels[key(r)]?.title ?? r.id}
                <small
                  style={{ display: "block", color: "var(--text-secondary)" }}
                >
                  {r.kind}
                  {labels[key(r)]?.status ? " · " + labels[key(r)].status : ""}
                </small>
              </span>
              <button
                className="btn btn-sm"
                disabled={i === 0}
                aria-label={
                  "Move " + (labels[key(r)]?.title ?? r.kind) + " earlier"
                }
                onClick={() => update(move(refs, i, -1))}
              >
                Up
              </button>
              <button
                className="btn btn-sm"
                disabled={i === refs.length - 1}
                aria-label={
                  "Move " + (labels[key(r)]?.title ?? r.kind) + " later"
                }
                onClick={() => update(move(refs, i, 1))}
              >
                Down
              </button>
              <button
                className="btn btn-sm"
                onClick={() => update(refs.filter((x) => key(x) !== key(r)))}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ol>
    );
  }
  if (!loaded)
    return (
      <LoadingState label={<>Loading editorial layout…</>} variant="form" />
    );
  if (!session)
    return (
      <div className="page-pad">
        <StaffAuth onAuthenticated={() => run(load)} />
        {error && <p role="alert">{error}</p>}
      </div>
    );
  if (!record)
    return (
      <div className="page-pad">
        {busy ? (
          <LoadingState label="Loading editorial layout…" variant="form" />
        ) : (
          <ErrorState
            message={error || "No saved layout is available for this page."}
            onRetry={() => void run(load)}
            pending={busy}
          />
        )}
      </div>
    );
  const readOnly = !can("homepage.write");
  return (
    <div className="page-pad homepage-workspace">
      {surface==='home'&&<Card title="Automatic lifecycle rails"><p>New Releases, approved Coming Soon first looks, profile-owned Watch Again and Leaving Soon appear below the hero when eligible records exist. They use the existing MGTV cards and current API availability, not manually selected or sample items. Approve first looks in the owning content editor and manage delivery in Notifications.</p></Card>}
      <PageActions>
        {dirty && (
          <span role="status" style={{ color: "var(--yellow)" }}>
            Unsaved changes
          </span>
        )}
        <button
          className="btn"
          disabled={busy || !dirty}
          onClick={() => {
            setDraft(record.draft);
            setNotice("Unsaved changes discarded.");
          }}
        >
          Discard changes
        </button>
        <button
          className="btn btn-primary"
          disabled={busy || !dirty || readOnly}
          onClick={() => void run(save)}
        >
          Save draft
        </button>
      </PageActions>
      {error && (
        <div
          role="alert"
          tabIndex={-1}
          ref={errorRef}
          className="card"
          style={{ padding: 16, marginBottom: 14, color: "var(--red)" }}
        >
          {error}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      <label style={{ display: "block", maxWidth: 360, marginBottom: 18 }}>
        Page
        <select
          className="input"
          value={surface}
          disabled={busy}
          onChange={(e) => navigate("/admin/homepage/" + e.target.value)}
        >
          {surfaces.map((s) => (
            <option key={s} value={s}>
              {s === "home"
                ? "Homepage"
                : s[0].toUpperCase() + s.slice(1) + " — Featured"}
            </option>
          ))}
        </select>
      </label>
      <p style={{ color: "var(--text-secondary)", maxWidth: 740 }}>
        Arrange editorial selections, then save and review before publishing.
        Content availability and profile restrictions still apply.
      </p>
      <div className="editor-layout" style={{ alignItems: "start" }}>
        <div>
          <fieldset
            disabled={busy || readOnly}
            style={{
              border: 0,
              padding: 0,
              minWidth: 0,
              display: "grid",
              gap: 14,
            }}
          >
            <Card title="Featured hero">
              <p>
                Choose up to five published items in display order. Titles,
                artwork and short clips come from their published content
                revisions.
              </p>
              {selection(draft.hero, (hero) => change({ ...draft, hero }))}
              <button className="btn" onClick={() => openPicker("hero")}>
                Choose featured content
              </button>
            </Card>
            {surface === "home" && (
              <>
                <h2 style={{ fontSize: 16 }}>Sections</h2>
                {draft.sections.map((s, i) => (
                  <Card
                    key={s.id}
                    title={
                      <span
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{i + 1}</span>
                        <Badge color={s.enabled ? "#C9A84C" : "#9ca3af"}>
                          {s.kind === "editorial"
                            ? "Editorial selection"
                            : s.kind === "continue-watching"
                              ? "Personal collection"
                              : "Membership banner"}
                        </Badge>
                      </span>
                    }
                    aside={
                      <span style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-sm"
                          disabled={i === 0}
                          aria-label={"Move " + s.label + " up"}
                          onClick={() =>
                            change({
                              ...draft,
                              sections: move(draft.sections, i, -1),
                            })
                          }
                        >
                          Up
                        </button>
                        <button
                          className="btn btn-sm"
                          disabled={i === draft.sections.length - 1}
                          aria-label={"Move " + s.label + " down"}
                          onClick={() =>
                            change({
                              ...draft,
                              sections: move(draft.sections, i, 1),
                            })
                          }
                        >
                          Down
                        </button>
                      </span>
                    }
                  >
                    <div style={{ display: "grid", gap: 12 }}>
                      <label>
                        Section label
                        <input
                          className="input"
                          maxLength={100}
                          value={s.label}
                          onChange={(e) =>
                            patch(s.id, { label: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Section description
                        <input
                          className="input"
                          maxLength={300}
                          value={s.description}
                          onChange={(e) =>
                            patch(s.id, { description: e.target.value })
                          }
                        />
                      </label>
                      <label style={{ display: "flex", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={s.enabled}
                          onChange={(e) =>
                            patch(s.id, { enabled: e.target.checked })
                          }
                        />
                        Visible to customers
                      </label>
                      {s.kind === "editorial" && (
                        <>
                          <label>
                            Layout
                            <select
                              className="input"
                              value={s.layout}
                              onChange={(e) =>
                                patch(s.id, { layout: e.target.value })
                              }
                            >
                              <option value="rail">Content rail</option>
                              <option value="grid">Content grid</option>
                              <option value="news">Editorial split</option>
                            </select>
                          </label>
                          <label>
                            Browse destination
                            <select
                              className="input"
                              value={s.destination}
                              onChange={(e) =>
                                patch(s.id, { destination: e.target.value })
                              }
                            >
                              {[
                                "",
                                ...surfaces.filter((x) => x !== "home"),
                                "my-list",
                              ].map((x) => (
                                <option key={x} value={x}>
                                  {x || "No browse link"}
                                </option>
                              ))}
                            </select>
                          </label>
                          {selection(s.items, (items) =>
                            patch(s.id, { items }),
                          )}
                          <button
                            className="btn"
                            onClick={() => openPicker(s.id)}
                          >
                            Choose content
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() =>
                          change({
                            ...draft,
                            sections: draft.sections.filter(
                              (x) => x.id !== s.id,
                            ),
                          })
                        }
                      >
                        Remove section from homepage
                      </button>
                      <small style={{ color: "var(--text-muted)" }}>
                        Removing a section does not delete content.
                      </small>
                    </div>
                  </Card>
                ))}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["editorial", "continue-watching", "membership"].map(
                    (kind) => (
                      <button
                        key={kind}
                        className="btn"
                        disabled={
                          draft.sections.length >= 20 ||
                          (kind !== "editorial" &&
                            draft.sections.some((s) => s.kind === kind))
                        }
                        onClick={() =>
                          change({
                            ...draft,
                            sections: [
                              ...draft.sections,
                              {
                                id: crypto.randomUUID(),
                                label:
                                  kind === "editorial"
                                    ? "New editorial section"
                                    : kind === "continue-watching"
                                      ? "Continue Watching"
                                      : "MGTV+",
                                description: "",
                                enabled: true,
                                kind,
                                layout: "rail",
                                destination: "",
                                items: [],
                              },
                            ],
                          })
                        }
                      >
                        Add{" "}
                        {kind === "editorial"
                          ? "editorial section"
                          : kind === "continue-watching"
                            ? "Continue Watching"
                            : "membership banner"}
                      </button>
                    ),
                  )}
                </div>
              </>
            )}
          </fieldset>
        </div>
        <aside style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <Card title="Saved revision review">
            <p>
              <Badge
                color={record.status === "published" ? "#34d399" : "#C9A84C"}
              >
                {record.status}
              </Badge>{" "}
              · Revision {record.version}
            </p>
            <p>
              {dirty
                ? "Save your edits to refresh this preview."
                : record.hasUnpublishedChanges
                  ? "Saved draft differs from the published layout."
                  : "Saved and published revisions match."}
            </p>
            <button
              className="btn"
              disabled={busy || dirty}
              onClick={() => void run(review)}
            >
              Check requirements
            </button>
            <ul>
              {preview?.issues?.map((x: any) => (
                <li key={x.path + x.code} style={{ color: "var(--yellow)" }}>
                  {x.path}: {x.message}
                </li>
              ))}
            </ul>
            <label>
              Reason for layout change
              <textarea
                className="input"
                value={reason}
                maxLength={1000}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginTop: 12,
              }}
            >
              <button
                className="btn btn-primary"
                disabled={
                  busy ||
                  dirty ||
                  !reason.trim() ||
                  !preview?.ready ||
                  !can("homepage.publish")
                }
                onClick={() => void run(() => command("publish"))}
              >
                Publish saved layout
              </button>
              <button
                className="btn btn-danger"
                disabled={
                  busy ||
                  dirty ||
                  !reason.trim() ||
                  record.status !== "published" ||
                  !can("homepage.unpublish")
                }
                onClick={() => void run(() => command("unpublish"))}
              >
                Withdraw layout
              </button>
              <button
                className="btn"
                disabled={
                  busy ||
                  dirty ||
                  !reason.trim() ||
                  !record.publishedRevisionId ||
                  readOnly
                }
                onClick={() => void run(() => command("restore-published"))}
              >
                Restore published layout to draft
              </button>
            </div>
          </Card>
          <Card title="Customer layout preview">
            <p>
              Published content resolved from the saved draft. Hidden and empty
              sections are omitted. Profile filtering applies on customer pages.
            </p>
            <div
              style={{
                background: "#0b0c0e",
                borderRadius: 10,
                padding: 12,
                display: "grid",
                gap: 18,
              }}
            >
              {[
                {
                  id: "hero",
                  label: "Featured hero",
                  items: preview?.preview?.hero ?? [],
                },
                ...(preview?.preview?.sections ?? []),
              ].map((s: any) => (
                <section key={s.id}>
                  <h3>{s.label}</h3>
                  {s.kind === "continue-watching" ? (
                    <p>Actual progress for the selected customer profile.</p>
                  ) : s.kind === "membership" ? (
                    <p>Existing MGTV+ banner.</p>
                  ) : (
                    <div
                      style={{ display: "flex", gap: 10, overflowX: "auto" }}
                    >
                      {s.items.map((r: any) => (
                        <div key={key(r)} style={{ width: 140, flexShrink: 0 }}>
                          <img
                            src={
                              r.content.artwork?.landscapeUrl ??
                              r.content.coverUrl
                            }
                            alt=""
                            style={{
                              width: "100%",
                              aspectRatio: "16/9",
                              objectFit: "cover",
                              borderRadius: 6,
                            }}
                          />
                          <p>{r.content.title}</p>
                          <small>{r.kind}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </Card>
          <Card title="Recent activity">
            <ul>
              {history.map((x: any) => (
                <li key={x.id} style={{ marginBottom: 10 }}>
                  {x.action.replace("homepage.", "")} · {x.actorName}
                  <small
                    style={{ display: "block", color: "var(--text-muted)" }}
                  >
                    {new Date(x.created_at).toLocaleString()} ·{" "}
                    {x.details.reason ?? "Saved revision"}
                  </small>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
      {picking && (
        <Modal
          title={
            picking === "hero"
              ? "Choose featured content"
              : "Choose section content"
          }
          onClose={() => setPicking(null)}
          width={680}
          footer={
            <button
              className="btn btn-primary"
              onClick={() => setPicking(null)}
            >
              Done
            </button>
          }
        >
          <label>
            Content type
            <select
              className="input"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setSearch("");
                setQ("");
              }}
            >
              {allowed.map((x: string) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(q);
            }}
            style={{ display: "flex", gap: 8, margin: "12px 0" }}
          >
            <input
              className="input"
              aria-label="Search selectable content"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn" type="submit">
              Search
            </button>
          </form>
          <p>
            Draft items may be prepared here, but publication requires all
            visible selections to be published and available.
          </p>
          {pickerError && <p role="alert">{pickerError}</p>}
          {pickerBusy && (
            <LoadingState label={<>Loading content…</>} variant="table" />
          )}
          <ul
            style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}
          >
            {options.map((r) => (
              <li key={r.id}>
                <label
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: 10,
                    border: "1px solid var(--border-light)",
                    borderRadius: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={chosen.some(
                      (x) => x.kind === kind && x.id === r.id,
                    )}
                    onChange={() => toggle({ kind, id: r.id })}
                  />
                  <span style={{ flex: 1 }}>
                    {r.draft?.title ?? r.title ?? "Untitled"}
                  </span>
                  <small>{r.status}</small>
                </label>
              </li>
            ))}
          </ul>
          {!options.length && !pickerBusy && (
            <EmptyState
              title="No content found"
              body="Choose another type or search term."
            />
          )}
          {cursor && (
            <button
              className="btn"
              disabled={pickerBusy}
              onClick={() => void more()}
            >
              More content
            </button>
          )}
        </Modal>
      )}
    </div>
  );
}
