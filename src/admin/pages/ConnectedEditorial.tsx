import {
  CONTENT_TYPES,
  ContentGrid,
  ContentGridSkeleton,
  ContentOverview,
} from "../components/ContentVisual";
import MediaIcon from "../components/MediaIcon";
import OriginalsSettings, {
  type OriginFields,
} from "../components/OriginalsSettings";
import LifecycleSettings from "../components/LifecycleSettings";
import MediaAttachment from "../components/MediaAttachment";
import { LinkedSponsors } from "../components/LinkedSponsors";
import { Card, Badge, ConfirmDialog } from "../ui";
import StaffAuth from "./StaffAuth";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
const localDate = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
type Draft = OriginFields & {
  sport?: string;
  competition?: string;
  participants?: string[];
  venue?: string;
  occurredAt?: string | null;
  coverage?: "highlight" | "replay";
  musicKind?: "track" | "music-video";
  artist?: string;
  album?: string;
  accessTier: "free" | "premium";
  eligibleTierIds: string[];
  featureMediaVersionId?: string | null;
  previewMediaVersionId: string | null;
  renditionVersionIds: string[];
  title: string;
  synopsis: string;
  director: string;
  cast: string[];
  releaseYear: number | null;
  genreIds: string[];
  classificationId: string | null;
  primaryMediaVersionId: string | null;
  artwork: {
    portraitVersionId: string | null;
    landscapeVersionId: string | null;
  };
  availability: any;
};
const empty: Draft = {
  accessTier: "free",
  eligibleTierIds: [],
  featureMediaVersionId: null,
  previewMediaVersionId: null,
  renditionVersionIds: [],
  title: "",
  synopsis: "",
  director: "",
  cast: [],
  releaseYear: null,
  genreIds: [],
  classificationId: null,
  primaryMediaVersionId: null,
  artwork: { portraitVersionId: null, landscapeVersionId: null },
  availability: null,
};
const requirementLabel = (path: string) => {
  if (path === "/primaryMediaVersionId") return "Primary media";
  if (path === "/previewMediaVersionId") return "Free preview";
  if (path === "/artwork/portraitVersionId") return "Portrait artwork";
  if (path === "/artwork/landscapeVersionId") return "Landscape artwork";
  if (path?.startsWith("/renditionVersionIds/"))
    return "Additional quality version";
  return "";
};
export default function ConnectedEditorial({
  id,
  entity = "movies",
  basePath = "/admin/content/movies",
  parentId,
  childrenFor,
  listPath,
  musicKind,
}: {
  musicKind?: "track" | "music-video";
  id?: string;
  entity?: "movies" | "shows" | "seasons" | "episodes" | "music" | "sports";
  basePath?: string;
  parentId?: string;
  listPath?: string;
  childrenFor?: (record: any, canWrite: boolean) => React.ReactNode;
}) {
  const resource = ["seasons", "episodes"].includes(entity) ? "shows" : entity;
  const label =
      entity === "sports"
        ? "sports video"
        : entity === "music"
          ? "music release"
          : entity.slice(0, -1),
    hasVideo =
      entity === "sports" ||
      entity === "movies" ||
      entity === "episodes" ||
      entity === "music";
  const [panel, setPanel] = useState<"overview" | "edit" | "publish">(
    id === "new" ? "edit" : "overview",
  );
  const appliedFilters = useRef({ q: "", status: "" });
  const [number, setNumber] = useState(1);
  const [initializing, setInitializing] = useState(true);
  const apiBase = "/admin/" + entity;
  const createPath = parentId
    ? "/admin/" +
      (entity === "seasons" ? "shows" : "seasons") +
      "/" +
      parentId +
      "/" +
      entity
    : apiBase;

  const { navigate } = useRouter();
  const [session, setSession] = useState<any>(null),
    [tax, setTax] = useState<any>(null),
    [tiers, setTiers] = useState<any[]>([]),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [scheduleAt, setScheduleAt] = useState(""),
    [history, setHistory] = useState<any[]>([]),
    [confirm, setConfirm] = useState<
      "archive" | "restore" | "cancel-schedule" | null
    >(null),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState<Draft>(
      entity === "music"
        ? {
            ...empty,
            musicKind: musicKind ?? "music-video",
            artist: "",
            album: "",
          }
        : empty,
    ),
    [items, setItems] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [issues, setIssues] = useState<any[]>([]),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<{ body: string; key: string } | null>(null);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useDirtyGuard(() => dirtyRef.current);
  const can = (p: string) => session?.permissions.includes(p);
  function problem(e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      setSession(null);
      setError("");
      setIssues([]);
      return;
    }
    setError(e instanceof Error ? e.message : "Something went wrong.");
    if (e instanceof ApiError) {
      setIssues(e.payload.issues ?? []);
    }
    setTimeout(() => errorRef.current?.focus(), 0);
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setIssues([]);
    try {
      await fn();
    } catch (e) {
      problem(e);
    } finally {
      setBusy(false);
    }
  }
  async function load() {
    const s = await api("/admin/session");
    setSession(s);
    if (!s.permissions.includes(`${resource}.read`))
      throw Error("You need content.read to view these records.");
    const referenceData = await api(
      entity === "sports"
        ? "/admin/sports/taxonomy"
        : entity === "music"
          ? "/admin/music/taxonomy"
          : resource === "shows"
            ? "/admin/shows/taxonomy"
            : "/admin/taxonomy",
    );
    setTax(
      Array.isArray(referenceData)
        ? {
            genres: referenceData.filter(
              (r) => r.kind === "genre" && r.active !== false,
            ),
            classifications: referenceData.filter(
              (r) => r.kind === "classification" && r.active !== false,
            ),
          }
        : referenceData,
    );
    const tierResponse = await fetch("/api/v1/catalog/subscription-tiers");
    if (!tierResponse.ok)
      throw Error("Subscription tiers could not be loaded.");
    setTiers(await tierResponse.json());
    if (id && id !== "new") {
      const r = await api(apiBase + "/" + id);
      setRecord(r);
      setDraft({ ...empty, ...r.draft });
    } else if (!id) {
      const list = await api(
        apiBase +
          "?" +
          new URLSearchParams({
            q,
            ...(musicKind ? { musicKind } : {}),
            ...(status ? { status } : {}),
          }),
      );
      appliedFilters.current = { q, status };
      setItems(list.items);
      setCursor(list.nextCursor);
    } else {
      setRecord(null);
      setDraft(
        structuredClone(
          entity === "music"
            ? {
                ...empty,
                musicKind: musicKind ?? "music-video",
                artist: "",
                album: "",
              }
            : empty,
        ),
      );
    }
    setDirty(false);
  }
  useEffect(() => {
    if (!record) return;
    let active = true;
    void api(apiBase + "/" + record.id + "/history")
      .then((page) => {
        if (active) setHistory(page.items);
      })
      .catch(() => {
        if (active) setHistory([]);
      });
    return () => {
      active = false;
    };
  }, [record?.id, record?.version]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  useEffect(() => {
    setInitializing(true);
    void run(load).finally(() => setInitializing(false));
  }, [id]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  const change = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
    setNotice("");
  };
  async function save() {
    const body = {
      ...draft,
      ...(!record && parentId ? { number } : {}),
      cast: draft.cast.map((name) => name.trim()).filter(Boolean),
    };
    const payload = JSON.stringify(body);
    if (requestRef.current?.body !== payload)
      requestRef.current = { body: payload, key: crypto.randomUUID() };
    const r = await api(
      record ? apiBase + "/" + record.id + "/draft" : createPath,
      record ? "PATCH" : "POST",
      body,
      record?.version,
      requestRef.current.key,
    );
    requestRef.current = null;
    setRecord(r);
    setDraft({ ...empty, ...r.draft });
    dirtyRef.current = false;
    setDirty(false);
    setNotice("Draft saved. Published content stays unchanged.");
    if (!record) navigate(basePath + "/" + r.id);
  }
  async function transition(action: "publish" | "unpublish") {
    if (dirty) throw new Error("Save your draft before changing publication.");
    const body =
      action === "publish"
        ? { revisionId: record.draftRevisionId }
        : { reason };
    const marker = action + JSON.stringify(body);
    if (requestRef.current?.body !== marker)
      requestRef.current = { body: marker, key: crypto.randomUUID() };
    const r = await api(
      apiBase + "/" + record.id + "/" + action,
      "POST",
      body,
      record.version,
      requestRef.current.key,
    );
    requestRef.current = null;
    setRecord(r);
    setNotice(
      action === "publish"
        ? "Published. This content is now available within its rights window."
        : "Unpublished. This content is no longer visible to customers.",
    );
  }
  async function lifecycle(
    action: "archive" | "restore" | "schedule" | "cancel-schedule",
  ) {
    if (!record || dirty)
      throw Error("Save or discard your draft changes first.");
    const body =
      action === "schedule"
        ? {
            revisionId: record.draftRevisionId,
            scheduledAt: new Date(scheduleAt).toISOString(),
          }
        : { reason: reason.trim() };
    const signature = action + JSON.stringify(body);
    if (requestRef.current?.body !== signature)
      requestRef.current = { body: signature, key: crypto.randomUUID() };
    const result = await api(
      apiBase + "/" + record.id + "/" + action,
      "POST",
      body,
      record.version,
      requestRef.current.key,
    );
    requestRef.current = null;
    setRecord(result);
    setNotice(
      action === "schedule"
        ? "Publication scheduled for the reviewed revision."
        : action === "restore"
          ? "Restored as a draft."
          : action === "archive"
            ? "Content archived and hidden from customers."
            : "Publication schedule cancelled.",
    );
    setReason("");
  }
  const field = (label: string, node: React.ReactNode) => (
    <label
      style={{
        display: "grid",
        gap: 6,
        fontSize: 13,
        color: "var(--text-secondary)",
      }}
    >
      {label}
      {node}
    </label>
  );
  const availability = (patch: any) =>
    change({
      availability: {
        regionMode: "allowlist",
        regionCodes: ["JM"],
        startsAt: null,
        endsAt: null,
        rightsConfirmed: false,
        ...draft.availability,
        ...patch,
      },
    });
  if (initializing)
    return (
      <div className="page-pad content-visual" aria-busy="true">
        <div className="cv-loading-context" role="status">
          Loading content workspace…
        </div>
        {id ? (
          <>
            <div className="cv-feature cv-skeleton">
              <div className="cv-art" style={{ height: 380 }} />
            </div>
            <ContentGridSkeleton />
          </>
        ) : (
          <ContentGridSkeleton entity={entity} />
        )}
      </div>
    );
  return (
    <div className="page-pad movie-workspace content-visual">
      <div ref={errorRef} tabIndex={-1} role={error ? "alert" : undefined}>
        {error && (
          <div
            style={{
              padding: 14,
              marginBottom: 16,
              border: "1px solid #f87171",
              borderRadius: 8,
            }}
          >
            {error}
            {issues.length > 0 && (
              <ul>
                {issues.map((i, n) => (
                  <li key={n}>
                    {requirementLabel(i.path) &&
                      `${requirementLabel(i.path)}: `}
                    {i.message}
                  </li>
                ))}
              </ul>
            )}{" "}
            {session && (
              <button
                className="btn"
                disabled={busy || dirty}
                onClick={() => void run(load)}
              >
                Reload server data
              </button>
            )}
          </div>
        )}
      </div>
      <div role="status" aria-live="polite">
        {notice}
      </div>
      {!session ? (
        <StaffAuth
          onAuthenticated={async () => {
            setError("");
            await load();
          }}
        />
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              Signed in as {session.principal.displayName}
            </span>
            <button
              className="btn"
              disabled={busy || dirty}
              onClick={() =>
                void run(async () => {
                  await api("/admin/logout", "POST");
                  setSession(null);
                  setRecord(null);
                })
              }
            >
              Sign out
            </button>
          </div>
          {!id ? (
            <>
              <div className="cv-library-head">
                <div>
                  <span className="cv-kicker">THE MGTV CONTENT ROOM</span>
                  <h2>
                    {entity === "music"
                      ? musicKind === "track"
                        ? "Audio tracks"
                        : "Music videos"
                      : entity === "movies"
                        ? "Movies"
                        : entity === "sports"
                          ? "Sports"
                          : "Shows"}
                  </h2>
                  <p>
                    Find the story by its artwork. Open a record to explore its
                    saved draft, media and publication.
                  </p>
                </div>
                {can(`${resource}.write`) && (
                  <Link className="btn btn-primary" to={basePath + "/new"}>
                    <MediaIcon name="plus" size={18} /> Add {label}
                  </Link>
                )}
              </div>
              <nav className="cv-type-nav" aria-label="Content types">
                {CONTENT_TYPES.map((t) => (
                  <Link
                    key={t.id}
                    to={"/admin/content/" + t.id}
                    aria-current={
                      (entity === "music"
                        ? musicKind === "track"
                          ? "audio"
                          : "music-videos"
                        : entity) === t.id
                        ? "page"
                        : undefined
                    }
                  >
                    <MediaIcon name={t.icon} size={18} />
                    {t.label}
                  </Link>
                ))}
              </nav>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(load);
                }}
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "end",
                  margin: "20px 0",
                }}
              >
                {field(
                  `Search ${label}`,
                  <input
                    className="input"
                    value={q}
                    maxLength={200}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Title"
                  />,
                )}
                {field(
                  "Status",
                  <select
                    className="input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    {[
                      "draft",
                      "published",
                      "scheduled",
                      "unpublished",
                      "archived",
                    ].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>,
                )}
                <button className="btn" disabled={busy}>
                  Apply filters
                </button>
              </form>
              {busy && !items.length && <ContentGridSkeleton entity={entity} />}
              {!busy && !error && !items.length && (
                <Card title="No stories in this view">
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Try another title or status, or add a record to begin.
                  </p>
                </Card>
              )}
              {!!items.length && (
                <>
                  <p className="cv-context">
                    <MediaIcon name="grid" size={16} />
                    {items.length} loaded records{busy ? " · Updating…" : ""}.
                    Open a card to manage its draft.
                  </p>
                  <ContentGrid
                    items={items}
                    entity={entity}
                    basePath={basePath}
                  />
                </>
              )}
              {cursor && (
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const page = await api(
                        apiBase +
                          "?" +
                          new URLSearchParams({
                            q: appliedFilters.current.q,
                            ...(appliedFilters.current.status
                              ? { status: appliedFilters.current.status }
                              : {}),
                            ...(musicKind ? { musicKind } : {}),
                            cursor,
                          }),
                      );
                      setItems((x) => [...x, ...page.items]);
                      setCursor(page.nextCursor);
                    })
                  }
                >
                  Load more
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() => {
                  if (!dirty || window.confirm("Discard your unsaved changes?"))
                    navigate(listPath ?? basePath);
                }}
              >
                ← Back to library
              </button>
              <div className="cv-save-state">
                <MediaIcon name={dirty ? "edit" : "check"} size={16} />
                {record
                  ? dirty
                    ? "Unsaved changes in the editor"
                    : "Saved draft · Version " + record.version
                  : "New " + label + " · Save details before attaching media"}
              </div>
              {record && (
                <nav className="cv-detail-nav" aria-label="Record workspace">
                  {(
                    [
                      { id: "overview", label: "Overview", icon: "grid" },
                      { id: "edit", label: "Edit draft", icon: "edit" },
                      {
                        id: "publish",
                        label: "Review & publish",
                        icon: "review",
                      },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={panel === t.id}
                      onClick={() => setPanel(t.id)}
                    >
                      <MediaIcon name={t.icon} size={17} />
                      {t.label}
                    </button>
                  ))}
                </nav>
              )}
              {record && panel === "overview" && (
                <ContentOverview
                  record={record}
                  entity={entity}
                  tax={tax}
                  canEdit={!!can(`${resource}.write`)}
                  onEdit={() => setPanel("edit")}
                  onReview={() => setPanel("publish")}
                />
              )}
              <div hidden={panel !== "edit"}>
                <Card title="Shape the draft">
                  <nav
                    aria-label="Creation steps"
                    style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
                  >
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() =>
                        document
                          .getElementById("entity-details")
                          ?.scrollIntoView()
                      }
                    >
                      01 · Details & access
                    </button>
                    {entity !== "seasons" && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() =>
                          document
                            .getElementById("entity-media")
                            ?.scrollIntoView()
                        }
                      >
                        02 · Media
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={!record}
                      onClick={() => setPanel("publish")}
                    >
                      03 · Review & publish
                    </button>
                  </nav>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Save details to create the draft, then attach artwork and
                    media. Publication is a separate reviewed action.
                  </p>
                  {!record && (
                    <button
                      type="submit"
                      form="entity-draft"
                      className="btn btn-primary"
                      disabled={busy || !can(`${resource}.write`)}
                    >
                      Save details to start attaching media
                    </button>
                  )}
                  {parentId && (
                    <p style={{ fontSize: 13 }}>
                      This {label} belongs to its selected parent. Its number
                      must be unique within that parent.
                    </p>
                  )}
                </Card>
              </div>
              <div className="editor-layout cv-editor-panel">
                <form
                  hidden={panel !== "edit"}
                  id="entity-draft"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(save);
                  }}
                  style={{ display: "grid", gap: 18 }}
                >
                  <fieldset
                    disabled={
                      busy ||
                      !can(`${resource}.write`) ||
                      record?.status === "archived"
                    }
                    style={{ border: 0, padding: 0, display: "grid", gap: 16 }}
                  >
                    <div id="entity-details" style={{ scrollMarginTop: 80 }} />
                    <Card title="Basics">
                      <div className="movie-fields">
                        {!record &&
                          parentId &&
                          field(
                            "Number (unique within parent)",
                            <input
                              className="input"
                              type="number"
                              min={1}
                              max={9999}
                              value={number}
                              onChange={(e) => {
                                setNumber(Number(e.target.value));
                                setDirty(true);
                              }}
                            />,
                          )}
                        {field(
                          "Title",
                          <input
                            className="input"
                            required
                            maxLength={200}
                            value={draft.title}
                            onChange={(e) => change({ title: e.target.value })}
                          />,
                        )}
                        {field(
                          "Synopsis",
                          <textarea
                            className="input"
                            rows={4}
                            maxLength={5000}
                            value={draft.synopsis}
                            onChange={(e) =>
                              change({ synopsis: e.target.value })
                            }
                          />,
                        )}
                      </div>
                    </Card>
                    {entity === "sports" && (
                      <Card title="Sports coverage">
                        <div className="movie-fields">
                          {(
                            [
                              ["sport", "Sport"],
                              ["competition", "Competition / series"],
                              ["venue", "Venue"],
                            ] as const
                          ).map(([key, label]) => (
                            <label key={key}>
                              {label}
                              <input
                                className="input"
                                value={draft[key] ?? ""}
                                onChange={(e) =>
                                  change({ [key]: e.target.value })
                                }
                              />
                            </label>
                          ))}
                          <label>
                            Teams / athletes (one per line)
                            <textarea
                              className="input"
                              value={(draft.participants ?? []).join("\n")}
                              onChange={(e) =>
                                change({
                                  participants: e.target.value
                                    .split("\n")
                                    .filter(Boolean),
                                })
                              }
                            />
                          </label>
                          <label>
                            Event date and time (local)
                            <input
                              type="datetime-local"
                              className="input"
                              value={localDate(draft.occurredAt ?? null)}
                              onChange={(e) =>
                                change({
                                  occurredAt: e.target.value
                                    ? new Date(e.target.value).toISOString()
                                    : null,
                                })
                              }
                            />
                          </label>
                          <label>
                            Coverage
                            <select
                              className="input"
                              value={draft.coverage ?? "highlight"}
                              onChange={(e) =>
                                change({
                                  coverage: e.target.value as
                                    "highlight" | "replay",
                                })
                              }
                            >
                              <option value="highlight">Highlights</option>
                              <option value="replay">Full replay</option>
                            </select>
                          </label>
                        </div>
                      </Card>
                    )}
                    {entity === "music" && (
                      <Card title="Music release">
                        <div className="movie-fields">
                          <label
                            style={{ display: "grid", gap: 6, fontSize: 13 }}
                          >
                            Format
                            <select
                              className="input"
                              aria-label="Music format"
                              value={draft.musicKind ?? "music-video"}
                              onChange={(e) =>
                                change({
                                  musicKind: e.target.value as
                                    "track" | "music-video",
                                  primaryMediaVersionId: null,
                                  featureMediaVersionId: null,
                                  previewMediaVersionId: null,
                                  renditionVersionIds: [],
                                })
                              }
                            >
                              <option value="music-video">Music video</option>
                              <option value="track">Audio track · MP3</option>
                            </select>
                          </label>
                          <label
                            style={{ display: "grid", gap: 6, fontSize: 13 }}
                          >
                            Artist
                            <input
                              className="input"
                              aria-label="Artist"
                              value={draft.artist ?? ""}
                              onChange={(e) =>
                                change({ artist: e.target.value })
                              }
                            />
                          </label>
                          <label
                            style={{ display: "grid", gap: 6, fontSize: 13 }}
                          >
                            Album (optional)
                            <input
                              className="input"
                              aria-label="Album"
                              value={draft.album ?? ""}
                              onChange={(e) =>
                                change({ album: e.target.value })
                              }
                            />
                          </label>
                        </div>
                      </Card>
                    )}
                    {entity !== "seasons" && (
                      <>
                        <Card
                          title={
                            entity === "movies" ? "Movie details" : "Details"
                          }
                        >
                          <div className="movie-fields">
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit,minmax(min(100%,190px),1fr))",
                                gap: 16,
                              }}
                            >
                              {field(
                                entity === "sports"
                                  ? "Production credit (optional)"
                                  : entity === "music"
                                    ? "Director / producer (optional)"
                                    : "Director",
                                <input
                                  className="input"
                                  value={draft.director}
                                  onChange={(e) =>
                                    change({ director: e.target.value })
                                  }
                                />,
                              )}
                              {field(
                                "Release year",
                                <input
                                  className="input"
                                  type="number"
                                  min={1888}
                                  max={2200}
                                  value={draft.releaseYear ?? ""}
                                  onChange={(e) =>
                                    change({
                                      releaseYear: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                    })
                                  }
                                />,
                              )}
                              {field(
                                "Genre",
                                <select
                                  className="input"
                                  value={draft.genreIds[0] ?? ""}
                                  onChange={(e) =>
                                    change({
                                      genreIds: e.target.value
                                        ? [e.target.value]
                                        : [],
                                    })
                                  }
                                >
                                  <option value="">Choose genre</option>
                                  {tax?.genres.map((g: any) => (
                                    <option key={g.id} value={g.id}>
                                      {g.name}
                                    </option>
                                  ))}
                                </select>,
                              )}
                              {field(
                                "Classification",
                                <select
                                  className="input"
                                  value={draft.classificationId ?? ""}
                                  onChange={(e) =>
                                    change({
                                      classificationId: e.target.value || null,
                                    })
                                  }
                                >
                                  <option value="">
                                    Choose classification
                                  </option>
                                  {tax?.classifications.map((g: any) => (
                                    <option key={g.id} value={g.id}>
                                      {g.name}
                                    </option>
                                  ))}
                                </select>,
                              )}
                            </div>
                            {field(
                              entity === "music"
                                ? "Additional credits (one name per line)"
                                : entity === "sports"
                                  ? "Additional credits (one per line, optional)"
                                  : "Cast (one name per line)",
                              <textarea
                                className="input"
                                value={draft.cast.join("\n")}
                                onChange={(e) =>
                                  change({
                                    cast: e.target.value.split("\n"),
                                  })
                                }
                              />,
                            )}
                          </div>
                        </Card>
                        <Card title="Access & subscription tiers">
                          <div className="movie-fields">
                            {field(
                              entity === "shows"
                                ? "Series access"
                                : entity === "episodes"
                                  ? "Full-episode access"
                                  : entity === "music"
                                    ? "Full-release access"
                                    : entity === "sports"
                                      ? "Full-video access"
                                      : "Full-film access",
                              <select
                                className="input"
                                value={draft.accessTier}
                                onChange={(e) =>
                                  change({
                                    accessTier: e.target
                                      .value as Draft["accessTier"],
                                    eligibleTierIds:
                                      e.target.value === "premium"
                                        ? tiers.map((tier) => tier.id)
                                        : [],
                                  })
                                }
                              >
                                <option value="free">
                                  Free with a customer profile
                                </option>
                                <option value="premium">
                                  Premium subscription required
                                </option>
                              </select>,
                            )}
                            {draft.accessTier === "premium" && (
                              <fieldset style={{ border: 0, padding: 0 }}>
                                <legend
                                  style={{ marginBottom: 12, fontSize: 13 }}
                                >
                                  Eligible subscription tiers
                                </legend>
                                {tiers.map((tier) => (
                                  <label
                                    key={tier.id}
                                    style={{
                                      display: "flex",
                                      gap: 10,
                                      padding: "8px 0",
                                      fontSize: 13,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={draft.eligibleTierIds.includes(
                                        tier.id,
                                      )}
                                      onChange={(e) =>
                                        change({
                                          eligibleTierIds: e.target.checked
                                            ? [
                                                ...draft.eligibleTierIds,
                                                tier.id,
                                              ]
                                            : draft.eligibleTierIds.filter(
                                                (id) => id !== tier.id,
                                              ),
                                        })
                                      }
                                    />
                                    {tier.name} · {tier.maxProfiles} profile(s)
                                    · up to{" "}
                                    {tier.maxVideoHeight === 2160
                                      ? "4K"
                                      : tier.maxVideoHeight + "p"}
                                  </label>
                                ))}
                              </fieldset>
                            )}
                            <small>
                              Guest previews stay free. Staff cannot activate a
                              subscription.
                            </small>
                          </div>
                        </Card>
                        <div
                          id="entity-media"
                          style={{ scrollMarginTop: 80 }}
                        />
                        <Card
                          title={
                            entity === "music"
                              ? "Artwork & media"
                              : hasVideo
                                ? "Artwork & video"
                                : "Artwork"
                          }
                        >
                          <div className="movie-fields">
                            <p>
                              {entity === "music" && draft.musicKind === "track"
                                ? "Upload cover artwork, landscape artwork and an MP3."
                                : hasVideo
                                  ? "Upload portrait artwork, landscape artwork and an MP4."
                                  : "Upload portrait and landscape artwork."}{" "}
                              Each file must finish processing before
                              publication.
                            </p>
                            {!record && (
                              <p role="note">
                                Save this draft before uploading or choosing
                                files. Your title gives the upload a clear
                                destination.
                              </p>
                            )}
                            {[
                              "portrait",
                              "landscape",
                              "feature",
                              ...(hasVideo ? ["video", "preview"] : []),
                            ].map((slot) => {
                              const audio =
                                entity === "music" &&
                                draft.musicKind === "track";
                              const value =
                                slot === "feature"
                                  ? draft.featureMediaVersionId
                                  : slot === "preview"
                                    ? draft.previewMediaVersionId
                                    : slot === "video"
                                      ? draft.primaryMediaVersionId
                                      : slot === "portrait"
                                        ? draft.artwork.portraitVersionId
                                        : draft.artwork.landscapeVersionId;
                              return (
                                <MediaAttachment
                                  key={`${id}:${record?.id ?? "new"}:${slot}`}
                                  label={
                                    slot === "feature"
                                      ? "Hero clip (public, up to 30 seconds)"
                                      : slot === "preview"
                                        ? "Free preview (public, optional)"
                                        : slot === "video"
                                          ? audio
                                            ? "Full track"
                                            : "Full video"
                                          : slot === "portrait"
                                            ? "Portrait artwork"
                                            : "Landscape artwork"
                                  }
                                  kind={
                                    slot === "feature"
                                      ? "video"
                                      : slot === "video" || slot === "preview"
                                        ? audio
                                          ? "audio"
                                          : "video"
                                        : "image"
                                  }
                                  value={value}
                                  disabled={
                                    !record ||
                                    !can(`${resource}.write`) ||
                                    record.status === "archived"
                                  }
                                  canRead={!!can("media.read")}
                                  canUpload={!!can("media.upload")}
                                  onBusyChange={setBusy}
                                  maxDuration={
                                    slot === "feature" ? 30 : undefined
                                  }
                                  onChange={(version) => {
                                    if (slot === "video")
                                      change({
                                        primaryMediaVersionId: version,
                                      });
                                    else if (slot === "feature")
                                      change({
                                        featureMediaVersionId: version,
                                      });
                                    else if (slot === "preview")
                                      change({
                                        previewMediaVersionId: version,
                                      });
                                    else
                                      change({
                                        artwork: {
                                          ...draft.artwork,
                                          [slot === "portrait"
                                            ? "portraitVersionId"
                                            : "landscapeVersionId"]: version,
                                        },
                                      });
                                  }}
                                />
                              );
                            })}
                            {hasVideo &&
                              !(
                                entity === "music" &&
                                draft.musicKind === "track"
                              ) && (
                                <>
                                  <p
                                    style={{
                                      fontSize: 13,
                                      color: "var(--text-secondary)",
                                    }}
                                  >
                                    Videos support MP4 uploads up to 100 GB;
                                    audio up to 5 GB; images up to 50 MB. Select
                                    the same file again to resume an interrupted
                                    transfer. The preview must be separate and
                                    shorter than the full film.
                                  </p>
                                  <MediaAttachment
                                    key={`${id}:${record?.id ?? "new"}:rendition`}
                                    label="Additional full-length quality version (optional)"
                                    kind="video"
                                    value={null}
                                    disabled={
                                      !record ||
                                      draft.renditionVersionIds.length >= 5
                                    }
                                    canRead={!!can("media.read")}
                                    canUpload={!!can("media.upload")}
                                    onBusyChange={setBusy}
                                    onChange={(v) => {
                                      if (
                                        v &&
                                        !draft.renditionVersionIds.includes(v)
                                      )
                                        change({
                                          renditionVersionIds: [
                                            ...draft.renditionVersionIds,
                                            v,
                                          ],
                                        });
                                    }}
                                  />
                                  <small>
                                    {draft.renditionVersionIds.length}{" "}
                                    additional quality version(s). New video
                                    uploads adapt automatically within the
                                    viewer’s quality allowance. Separate
                                    matching full-length cuts remain optional
                                    for existing local files.
                                  </small>
                                  {draft.previewMediaVersionId && (
                                    <button
                                      type="button"
                                      className="btn"
                                      onClick={() =>
                                        change({ previewMediaVersionId: null })
                                      }
                                    >
                                      Remove preview
                                    </button>
                                  )}
                                  {draft.renditionVersionIds.map(
                                    (version, index) => (
                                      <div
                                        key={version}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <span style={{ fontSize: 13 }}>
                                          Full-film quality version {index + 1}
                                        </span>
                                        <button
                                          type="button"
                                          className="btn"
                                          onClick={() =>
                                            change({
                                              renditionVersionIds:
                                                draft.renditionVersionIds.filter(
                                                  (id) => id !== version,
                                                ),
                                            })
                                          }
                                        >
                                          Remove quality version {index + 1}
                                        </button>
                                      </div>
                                    ),
                                  )}
                                </>
                              )}
                            {record && (
                              <div className="grid-2">
                                {(["portrait", "landscape"] as const).map(
                                  (slot) =>
                                    (slot === "portrait"
                                      ? draft.artwork.portraitVersionId
                                      : draft.artwork.landscapeVersionId) && (
                                      <img
                                        key={slot}
                                        src={
                                          "/api/v1" +
                                          apiBase +
                                          "/" +
                                          record.id +
                                          "/artwork/" +
                                          slot +
                                          "?v=" +
                                          record.version
                                        }
                                        alt={slot + " artwork"}
                                        style={{
                                          width: "100%",
                                          maxHeight: 220,
                                          objectFit: "contain",
                                          borderRadius: 8,
                                          background: "var(--bg)",
                                        }}
                                      />
                                    ),
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                        <Card title="Rights & availability">
                          <OriginalsSettings
                            value={draft}
                            onChange={change}
                            versions={[
                              draft.primaryMediaVersionId,
                              draft.previewMediaVersionId,
                              draft.featureMediaVersionId,
                              ...draft.renditionVersionIds,
                            ]}
                            canRead={!!can("media.read")}
                            canReview={
                              !!can("media.upload") && !!can("content.publish")
                            }
                          />
                          <div className="movie-fields">
                            <label
                              style={{
                                display: "flex",
                                alignItems: "start",
                                gap: 10,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={!!draft.availability?.rightsConfirmed}
                                onChange={(e) =>
                                  availability({
                                    rightsConfirmed: e.target.checked,
                                  })
                                }
                              />
                              I confirm MGTV has rights to publish this content
                              and artwork for the selected availability window
                              and regions.
                            </label>
                            {field(
                              "Rights regions",
                              <select
                                className="input"
                                value={
                                  draft.availability?.regionMode ?? "allowlist"
                                }
                                onChange={(e) =>
                                  availability({
                                    regionMode: e.target.value,
                                    regionCodes:
                                      e.target.value === "worldwide"
                                        ? []
                                        : ["JM"],
                                  })
                                }
                              >
                                <option value="allowlist">Jamaica</option>
                                <option value="worldwide">Worldwide</option>
                              </select>,
                            )}
                            <div className="grid-2">
                              {field(
                                "Available from (optional, local time)",
                                <input
                                  className="input"
                                  type="datetime-local"
                                  value={localDate(
                                    draft.availability?.startsAt,
                                  )}
                                  onChange={(e) =>
                                    availability({
                                      startsAt: e.target.value
                                        ? new Date(e.target.value).toISOString()
                                        : null,
                                    })
                                  }
                                />,
                              )}
                              {field(
                                "Available until (optional, local time)",
                                <input
                                  className="input"
                                  type="datetime-local"
                                  value={localDate(draft.availability?.endsAt)}
                                  onChange={(e) =>
                                    availability({
                                      endsAt: e.target.value
                                        ? new Date(e.target.value).toISOString()
                                        : null,
                                    })
                                  }
                                />,
                              )}
                            </div>
                            <small>
                              Dates are stored in UTC. Regional enforcement
                              currently uses the local development region,
                              Jamaica; production geolocation is not connected.
                            </small>
                          </div>
                        </Card>
                      </>
                    )}
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={!dirty && !!record}
                    >
                      {busy ? "Working…" : "Save draft"}
                    </button>
                  </fieldset>
                </form>
                <aside
                  hidden={panel !== "publish"}
                  id="entity-review"
                  style={{ scrollMarginTop: 80 }}
                  aria-label="Status and publishing"
                >
                  {record && entity !== "seasons" && (
                    <LifecycleSettings
                      key={`${record.id}:${record.publishedRevisionId}`}
                      kind={
                        entity === "movies"
                          ? "movie"
                          : entity === "shows"
                            ? "show"
                            : entity === "episodes"
                              ? "episode"
                              : entity
                      }
                      id={record.id}
                      revisionId={record.publishedRevisionId}
                      canPublish={!!can(`${resource}.publish`)}
                    />
                  )}
                  <Card title="Status">
                    <Badge
                      color={
                        record?.status === "published" ? "#34d399" : "#fbbf24"
                      }
                    >
                      {record?.status ?? "Unsaved draft"}
                    </Badge>
                    <p
                      style={{
                        fontSize: 13,
                        marginTop: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {!record || dirty
                        ? "Selections are not saved yet"
                        : "Draft and media attachments saved"}
                      . Publishing is an explicit permission.
                    </p>
                  </Card>
                  {record && (
                    <Card title="Publishing">
                      <div
                        style={{
                          display: "grid",
                          gap: 14,
                          marginTop: 24,
                          paddingTop: 20,
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
                        >
                          <button
                            className="btn"
                            disabled={busy || dirty}
                            onClick={() =>
                              void run(async () => {
                                const result = await api(
                                  apiBase +
                                    "/" +
                                    record.id +
                                    "/publication-check",
                                );
                                setIssues(result.issues);
                                setError(
                                  result.ready
                                    ? ""
                                    : "Complete these requirements before publishing.",
                                );
                                setNotice(
                                  result.ready
                                    ? "This revision is ready to publish."
                                    : "",
                                );
                              })
                            }
                          >
                            Check requirements
                          </button>
                          <button
                            className="btn btn-primary"
                            disabled={
                              busy ||
                              dirty ||
                              !can(`${resource}.publish`) ||
                              record.status === "archived"
                            }
                            onClick={() =>
                              void run(() => transition("publish"))
                            }
                          >
                            Publish saved revision
                          </button>
                          {record.status === "published" &&
                            entity !== "seasons" && (
                              <a
                                className="btn"
                                href={
                                  "http://127.0.0.1:5193" +
                                  (entity === "music"
                                    ? record.draft.musicKind === "track"
                                      ? "/music/track/"
                                      : "/music/video/"
                                    : entity === "sports"
                                      ? "/sports/"
                                      : entity === "movies"
                                        ? "/movies/"
                                        : entity === "shows"
                                          ? "/shows/"
                                          : "/watch/episodes/") +
                                  record.id
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                View customer page
                              </a>
                            )}
                        </div>
                        {!can(`${resource}.publish`) && (
                          <p>
                            You need an explicit publication permission to
                            publish.
                          </p>
                        )}
                        {record.status === "published" &&
                          can(`${resource}.unpublish`) && (
                            <div style={{ display: "grid", gap: 8 }}>
                              {field(
                                "Reason for unpublishing",
                                <input
                                  className="input"
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                />,
                              )}
                              <button
                                className="btn"
                                disabled={busy || dirty || !reason.trim()}
                                onClick={() =>
                                  void run(() => transition("unpublish"))
                                }
                              >
                                Unpublish
                              </button>
                            </div>
                          )}
                      </div>
                    </Card>
                  )}
                  {record && (
                    <Card title="Lifecycle">
                      <div className="movie-fields">
                        {record.scheduledAt && (
                          <p style={{ fontSize: 13 }}>
                            Scheduled for{" "}
                            {new Date(record.scheduledAt).toLocaleString()}. The
                            reviewed revision will publish even if you keep
                            editing a later draft.
                          </p>
                        )}
                        {record.scheduleError && (
                          <p
                            role="alert"
                            style={{ fontSize: 13, color: "var(--red)" }}
                          >
                            {record.scheduleError}
                          </p>
                        )}
                        {!["published", "archived"].includes(record.status) &&
                          can(`${resource}.publish`) && (
                            <>
                              {field(
                                "Publish at (local time)",
                                <input
                                  className="input"
                                  type="datetime-local"
                                  value={scheduleAt}
                                  onChange={(e) =>
                                    setScheduleAt(e.target.value)
                                  }
                                />,
                              )}
                              <button
                                className="btn btn-primary"
                                disabled={busy || dirty || !scheduleAt}
                                onClick={() =>
                                  void run(() => lifecycle("schedule"))
                                }
                              >
                                Schedule saved revision
                              </button>
                            </>
                          )}
                        {field(
                          "Reason for lifecycle change",
                          <textarea
                            className="input"
                            value={reason}
                            maxLength={2000}
                            onChange={(e) => setReason(e.target.value)}
                          />,
                        )}
                        {record.status === "scheduled" &&
                          can(`${resource}.publish`) && (
                            <button
                              className="btn"
                              disabled={busy || dirty || !reason.trim()}
                              onClick={() => setConfirm("cancel-schedule")}
                            >
                              Cancel schedule
                            </button>
                          )}
                        {can(`${resource}.write`) && (
                          <button
                            className="btn"
                            disabled={
                              busy ||
                              dirty ||
                              !reason.trim() ||
                              (record.status === "published" &&
                                !can(`${resource}.unpublish`))
                            }
                            onClick={() =>
                              setConfirm(
                                record.status === "archived"
                                  ? "restore"
                                  : "archive",
                              )
                            }
                          >
                            {record.status === "archived"
                              ? "Restore to draft"
                              : "Archive"}
                          </button>
                        )}
                        <small>
                          Archiving hides this content and its descendants, and
                          cancels its schedule. Restoring never republishes it.
                        </small>
                      </div>
                    </Card>
                  )}
                  {entity === "shows" && record && (
                    <LinkedSponsors kind="shows" id={record.id} />
                  )}
                  {!!history.length && (
                    <Card title="Recent activity">
                      <ol
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "grid",
                          gap: 16,
                        }}
                      >
                        {history.slice(0, 10).map((event) => (
                          <li
                            key={event.id}
                            style={{ fontSize: 12, lineHeight: 1.6 }}
                          >
                            <strong>
                              {event.action
                                .replace("movie.", "")
                                .replace("shows.", "")
                                .replaceAll("_", " ")}
                            </strong>
                            <div style={{ color: "var(--text-secondary)" }}>
                              {event.actorName} ·{" "}
                              {new Date(event.createdAt).toLocaleString()}
                            </div>
                            {event.details?.reason && (
                              <p>{event.details.reason}</p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </Card>
                  )}
                </aside>
              </div>
              {record && (
                <div hidden={panel !== "overview"}>
                  {childrenFor?.(record, !!can(`${resource}.write`))}
                </div>
              )}
            </>
          )}
        </>
      )}
      {confirm && (
        <ConfirmDialog
          title={
            confirm === "archive"
              ? "Archive this content?"
              : confirm === "restore"
                ? "Restore this content to draft?"
                : "Cancel scheduled publication?"
          }
          confirmLabel={
            confirm === "archive"
              ? "Archive"
              : confirm === "restore"
                ? "Restore to draft"
                : "Cancel schedule"
          }
          danger={confirm === "archive"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const action = confirm;
            setConfirm(null);
            void run(() => lifecycle(action));
          }}
        >
          <p>
            {confirm === "archive"
              ? "The content will be hidden from customers and any publication schedule will be cancelled."
              : confirm === "restore"
                ? "The content will return as a draft. It will not be visible until an authorized publisher publishes it."
                : "The reviewed revision will not publish automatically."}
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
