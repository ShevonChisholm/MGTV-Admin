import LoadingState, { ErrorState } from "../components/LoadingState";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { useRouter, useDirtyGuard } from "../router";
import { Card, Modal, EmptyState, Badge } from "../ui";
import { PageActions } from "../components/PageHeader";
import StaffAuth from "./StaffAuth";
import MediaIcon from "../components/MediaIcon";
import { ContentStatus } from "../components/ContentVisual";
import HomepageCanvas, {
  HomepageImage,
  homepageImage,
  homepageKindIcon,
  HomepageSavedPreview,
  HomepageLoading,
} from "../components/HomepageVisual";
import "../components/HomepageVisual.css";
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
    [labels, setLabels] = useState<Record<string, any>>({}),
    [savedLabels, setSavedLabels] = useState<Record<string, any>>({}),
    [pane, setPane] = useState("canvas"),
    [editTarget, setEditTarget] = useState("hero"),
    [confirmAction, setConfirmAction] = useState("");
  const commandKey = useRef<{ body: string; key: string } | null>(null),
    errorRef = useRef<HTMLDivElement>(null),
    pickerRequest = useRef(0),
    alive = useRef(true);
  const dirty =
      !!record && JSON.stringify(draft) !== JSON.stringify(record.draft),
    dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useDirtyGuard(() => dirtyRef.current);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      pickerRequest.current++;
    };
  }, []);
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
    setSavedLabels(
      Object.fromEntries(
        entries.map((r: any) => [
          key(r),
          {
            ...r,
            title: r.content.title,
            status: "published",
            image:
              r.content.artwork?.landscapeUrl ??
              r.content.coverUrl ??
              r.content.artwork?.portraitUrl,
          },
        ]),
      ),
    );
    setLabels((old) => ({
      ...old,
      ...Object.fromEntries(
        entries.map((r: any) => [
          key(r),
          {
            ...r,
            title: r.content.title,
            status: "published",
            image:
              r.content.artwork?.landscapeUrl ??
              r.content.coverUrl ??
              r.content.artwork?.portraitUrl,
          },
        ]),
      ),
    }));
  }
  async function review() {
    setPreview(null);
    const [p, h] = await Promise.all([
      api(base + "/publication-check"),
      api(base + "/history"),
    ]);
    if (!alive.current) return;
    setPreview(p);
    remember(p);
    setHistory(h.items);
  }
  async function load() {
    const s = await api("/admin/session");
    if (!alive.current) return;
    setSession(s);
    if (!s.permissions.includes("homepage.read"))
      throw Error("Homepage access requires homepage.read permission.");
    const r = await api(base);
    if (!alive.current) return;
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
    setConfirmAction("");
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
    setPickerError("");
    if (picking === "hero") change({ ...draft, hero: next });
    else if (picking) patch(picking, { items: next });
  }
  const allowed = picking === "hero" ? (heroKinds[surface] ?? []) : kinds;
  useEffect(() => {
    if (!picking) return;
    let active = true;
    const request = ++pickerRequest.current;
    setOptions([]);
    setCursor(null);
    setPickerError("");
    setPickerBusy(true);
    void api(
      "/admin/" + paths[kind] + "?limit=24&q=" + encodeURIComponent(search),
    )
      .then((p) => {
        if (!active || request !== pickerRequest.current) return;
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
                image: homepageImage(kind, r),
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
      pickerRequest.current++;
    };
  }, [picking, kind, search]);
  async function more() {
    const request = pickerRequest.current;
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
      if (request !== pickerRequest.current) return;
      setOptions((old) => [
        ...old,
        ...p.items.filter((r: any) => !old.some((x) => x.id === r.id)),
      ]);
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
              image: homepageImage(kind, r),
            },
          ]),
        ),
      }));
    } catch (e: any) {
      if (request === pickerRequest.current) setPickerError(e.message);
    } finally {
      if (request === pickerRequest.current) setPickerBusy(false);
    }
  }
  function openPicker(id: string) {
    setPicking(id);
    setKind(id === "hero" ? (heroKinds[surface]?.[0] ?? "movie") : "movie");
    setQ("");
    setSearch("");
  }
  function addSection(kind: string) {
    const id = crypto.randomUUID();
    change({
      ...draft,
      sections: [
        ...draft.sections,
        {
          id,
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
    });
    setEditTarget(id);
  }
  function selection(refs: Ref[], update: (refs: Ref[]) => void) {
    return (
      <ol
        className="hp-selection"
        aria-label="Selected content in display order"
      >
        {refs.map((r, i) => {
          const label = labels[key(r)],
            title = label?.title ?? "Selection needs review";
          return (
            <li key={key(r)}>
              <span className="hp-position">
                {String(i + 1).padStart(2, "0")}
              </span>
              <HomepageImage src={label?.image} kind={r.kind} />
              <div className="hp-selection-copy">
                <strong>{title}</strong>
                <span>
                  {r.kind}
                  {label?.status
                    ? " · " + label.status
                    : " · resolve in publication review"}
                </span>
              </div>
              <div className="hp-item-actions">
                <button
                  className="btn btn-sm"
                  disabled={i === 0}
                  aria-label={"Move " + title + " earlier"}
                  onClick={() => update(move(refs, i, -1))}
                >
                  <span className="hp-up">
                    <MediaIcon name="arrow" size={16} />
                  </span>
                </button>
                <button
                  className="btn btn-sm"
                  disabled={i === refs.length - 1}
                  aria-label={"Move " + title + " later"}
                  onClick={() => update(move(refs, i, 1))}
                >
                  <span className="hp-down">
                    <MediaIcon name="arrow" size={16} />
                  </span>
                </button>
                <button
                  className="btn btn-sm"
                  aria-label={"Remove " + title + " from selection"}
                  onClick={() => update(refs.filter((x) => key(x) !== key(r)))}
                >
                  <MediaIcon name="trash" size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }
  if (!loaded) return <HomepageLoading />;
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
  const readOnly = !can("homepage.write"),
    reviewCurrent =
      preview?.revisionId === record.draftRevisionId &&
      preview?.version === record.version;
  return (
    <div className="page-pad homepage-workspace">
      <div className="hp-workspace-head">
        <div>
          <span className="hp-kicker">
            <MediaIcon name="grid" size={15} /> MGTV · THE FRONT ROW
          </span>
          <h2>Set the stage for what’s next.</h2>
          <p>
            Shape the first impression, arrange your stories and review the
            saved page before it reaches viewers.
          </p>
        </div>
        <div className="hp-status">
          <ContentStatus status={record.status} />
          <span>Saved version {record.version}</span>
        </div>
      </div>
      <nav className="hp-surfaces" aria-label="Editorial pages">
        {surfaces.map((s) => (
          <button
            key={s}
            aria-current={surface === s ? "page" : undefined}
            disabled={busy}
            onClick={() => navigate("/admin/homepage/" + s)}
          >
            <MediaIcon
              name={
                s === "home"
                  ? "grid"
                  : s === "shows"
                    ? "series"
                    : s === "movies"
                      ? "film"
                      : s === "music"
                        ? "audio"
                        : s === "sports"
                          ? "sport"
                          : s === "events"
                            ? "calendar"
                            : s === "lifestyle"
                              ? "culture"
                              : "review"
              }
              size={18}
            />
            {s === "home" ? "Homepage" : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </nav>
      <nav className="hp-view-nav" aria-label="Layout workspace">
        {[
          ["canvas", "Saved page canvas", "grid"],
          ["edit", "Arrange draft", "edit"],
          ["preview", "Saved preview", "image"],
          ["review", "Review & publish", "check"],
          ["history", "Activity", "clock"],
        ].map(([id, label, icon]) => (
          <button
            key={id}
            aria-pressed={pane === id}
            onClick={() => setPane(id)}
          >
            <MediaIcon name={icon} size={16} />
            {label}
          </button>
        ))}
      </nav>
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
            setEditTarget("hero");
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
      <p className="hp-version-note" role="status">
        {dirty
          ? "Unsaved edits are kept in Arrange draft. The saved canvas and preview remain unchanged."
          : record.status !== "published"
            ? "This layout is not currently published. Review the saved draft."
            : record.hasUnpublishedChanges
              ? "The saved draft is a separate revision from the published layout."
              : "Saved and published revisions match."}{" "}
        Content availability and profile access still apply.
      </p>
      {(pane === "canvas" || pane === "preview") && !reviewCurrent && (
        <Card title="Refresh the saved layout review">
          <p>
            Check the current saved version to resolve its available content and
            artwork.
          </p>
          <button
            className="btn"
            disabled={busy || dirty}
            onClick={() => void run(review)}
          >
            {busy ? "Checking saved layout…" : "Check requirements"}
          </button>
        </Card>
      )}
      {pane === "canvas" && reviewCurrent && (
        <HomepageCanvas
          layout={record.draft}
          labels={savedLabels}
          surface={surface}
          onEdit={(id) => {
            setEditTarget(id);
            setPane("edit");
          }}
        />
      )}
      {pane === "preview" && reviewCurrent && (
        <HomepageSavedPreview
          preview={preview?.preview}
          surface={surface}
          dirty={dirty}
        />
      )}
      {surface === "home" && pane === "canvas" && (
        <section className="hp-lifecycle">
          <div className="hp-section-heading">
            <MediaIcon name="clock" />
            <div>
              <h3>Stories find their moment</h3>
              <p>
                These automatic rails appear when eligible content or genuine
                profile history is available. They are separate from your
                editorial selections.
              </p>
            </div>
          </div>
          <div>
            {[
              ["New Releases", "First available within 30 days", "plus"],
              [
                "Coming Soon",
                "Approved first looks within 30 days",
                "calendar",
              ],
              [
                "Watch Again",
                "Completed viewing for the selected profile",
                "film",
              ],
              ["Leaving Soon", "Availability ending within 14 days", "clock"],
            ].map(([title, text, icon]) => (
              <article key={title}>
                <MediaIcon name={icon} />
                <h4>{title}</h4>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      <div className="hp-workspace-body">
        <div hidden={pane !== "edit"}>
          <label className="hp-edit-target">
            Editing
            <select
              className="input"
              value={editTarget}
              onChange={(e) => setEditTarget(e.target.value)}
            >
              <option value="hero">Featured hero</option>
              {draft.sections.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {i + 1}. {s.label}
                </option>
              ))}
            </select>
          </label>
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
            <div hidden={editTarget !== "hero"}>
              <Card
                title={
                  <span className="hp-icon-title">
                    <MediaIcon name="image" />
                    Featured hero
                  </span>
                }
              >
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
            </div>
            {surface === "home" && (
              <>
                <h2 style={{ fontSize: 16 }}>Sections</h2>
                {draft.sections.map((s, i) => (
                  <div key={s.id} hidden={editTarget !== s.id}>
                    <Card
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
                            <span className="hp-up">
                              <MediaIcon name="arrow" size={16} />
                            </span>
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
                            <span className="hp-down">
                              <MediaIcon name="arrow" size={16} />
                            </span>
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
                          onClick={() => {
                            change({
                              ...draft,
                              sections: draft.sections.filter(
                                (x) => x.id !== s.id,
                              ),
                            });
                            setEditTarget("hero");
                          }}
                        >
                          <MediaIcon name="trash" size={16} /> Remove section
                          from homepage
                        </button>
                        <small style={{ color: "var(--text-muted)" }}>
                          Removing a section does not delete content.
                        </small>
                      </div>
                    </Card>
                  </div>
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
                        onClick={() => addSection(kind)}
                      >
                        <MediaIcon name="plus" size={16} /> Add{" "}
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
        <aside hidden={pane !== "review"}>
          <Card
            title={
              <span className="hp-icon-title">
                <MediaIcon name="check" />
                Saved revision review
              </span>
            }
          >
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
                  ? "The saved draft is a separate revision from the published layout."
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
                  !reviewCurrent ||
                  !can("homepage.publish")
                }
                onClick={() => setConfirmAction("publish")}
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
                onClick={() => setConfirmAction("unpublish")}
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
                onClick={() => setConfirmAction("restore-published")}
              >
                Restore published layout to draft
              </button>
            </div>
          </Card>
        </aside>
        <aside hidden={pane !== "history"}>
          <Card
            title={
              <span className="hp-icon-title">
                <MediaIcon name="clock" />
                How this page took shape
              </span>
            }
          >
            <ul className="hp-history">
              {history.map((x: any) => (
                <li key={x.id} style={{ marginBottom: 10 }}>
                  <MediaIcon
                    name={x.action.includes("publish") ? "globe" : "edit"}
                  />
                  <div>
                    <strong>
                      {x.action.replace("homepage.", "").replace(/_/g, " ")}
                    </strong>
                    <span>{x.actorName}</span>
                    <small
                      style={{ display: "block", color: "var(--text-muted)" }}
                    >
                      {new Date(x.created_at).toLocaleString()} ·{" "}
                      {x.details.reason ?? "Saved revision"}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
      {confirmAction && (
        <Modal
          title={
            confirmAction === "publish"
              ? "Publish saved layout"
              : confirmAction === "unpublish"
                ? "Withdraw this layout"
                : "Restore published layout to draft"
          }
          onClose={() => {
            if (!busy) setConfirmAction("");
          }}
          footer={
            <button
              className="btn btn-primary"
              disabled={busy || dirty || !reason.trim()}
              onClick={() => void run(() => command(confirmAction))}
            >
              {confirmAction === "publish"
                ? "Confirm publication"
                : confirmAction === "unpublish"
                  ? "Confirm withdrawal"
                  : "Confirm restore"}
            </button>
          }
        >
          <div className="hp-confirm">
            <MediaIcon name="review" size={30} />
            <h3>
              {surface === "home" ? "Homepage" : surface + " featured content"}
            </h3>
            <p>
              Saved version {record.version}.{" "}
              {confirmAction === "restore-published"
                ? "Restoring creates a draft; it does not republish it."
                : "This changes the layout only. The selected content keeps its own publication and access settings."}
            </p>
            <blockquote>{reason}</blockquote>
            {error && <p role="alert">{error}</p>}
          </div>
        </Modal>
      )}
      {picking && (
        <Modal
          title={
            picking === "hero"
              ? "Choose featured content"
              : "Choose section content"
          }
          onClose={() => setPicking(null)}
          width={960}
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
              style={{ minWidth: 0, flex: 1 }}
              aria-label="Search selectable content"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn" type="submit">
              Search
            </button>
          </form>
          <p>
            Names and artwork reflect saved content drafts. Publication review
            uses published, available revisions. {chosen.length} of{" "}
            {picking === "hero" ? 5 : 24} selected.
          </p>
          {pickerError && <p role="alert">{pickerError}</p>}
          {pickerBusy && (
            <LoadingState label={<>Loading content…</>} variant="cards" />
          )}
          {chosen.length > 0 && (
            <details className="hp-picker-selected">
              <summary>Review selected content ({chosen.length})</summary>
              <ul>
                {chosen.map((r) => (
                  <li key={key(r)}>
                    <HomepageImage src={labels[key(r)]?.image} kind={r.kind} />
                    <span>
                      {labels[key(r)]?.title ?? "Selection needs review"}
                      <small>{r.kind}</small>
                    </span>
                    <button
                      className="btn btn-sm"
                      aria-label={
                        "Remove selected " + (labels[key(r)]?.title ?? r.kind)
                      }
                      onClick={() => toggle(r)}
                      disabled={busy || !can("homepage.write")}
                    >
                      <MediaIcon name="trash" size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <ul className="hp-picker-grid" aria-label="Selectable content">
            {options.map((r) => (
              <li key={r.id}>
                <label
                  className={
                    "hp-pick-card " +
                    (chosen.some((x) => x.kind === kind && x.id === r.id)
                      ? "is-selected"
                      : "")
                  }
                >
                  <HomepageImage src={homepageImage(kind, r)} kind={kind} />
                  <div>
                    <input
                      type="checkbox"
                      disabled={busy || !can("homepage.write")}
                      checked={chosen.some(
                        (x) => x.kind === kind && x.id === r.id,
                      )}
                      onChange={() => toggle({ kind, id: r.id })}
                    />
                    <strong>{r.draft?.title ?? r.title ?? "Untitled"}</strong>
                  </div>
                  <ContentStatus status={r.status} />
                </label>
              </li>
            ))}
          </ul>
          {!options.length && !pickerBusy && !pickerError && (
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
