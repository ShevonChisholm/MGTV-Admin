import MediaAttachment from "../components/MediaAttachment";
import LoadingState, { ErrorState } from "../components/LoadingState";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Card, Modal } from "../ui";
import StaffAuth from "./StaffAuth";
import MediaIcon from "../components/MediaIcon";
import { ContentStatus } from "../components/ContentVisual";
import NewsArtwork, {
  ArticleReadingView,
  articleStats,
} from "../components/NewsVisual";
const LIFESTYLE_TOPICS = [
  { value: "food", label: "Food & Cooking", icon: "food" },
  { value: "travel", label: "Travel", icon: "travel" },
  { value: "fashion", label: "Fashion", icon: "fashion" },
  { value: "culture", label: "Culture", icon: "culture" },
  { value: "wellness", label: "Wellness", icon: "wellness" },
];
import "../components/NewsVisual.css";
const blank = (category = "") => ({
  title: "",
  summary: "",
  category,
  author: "",
  coverMediaVersionId: null as string | null,
  imageAlt: "",
  imageCaption: "",
  blocks: [] as { type: string; text: string }[],
});
export default function EditorialWorkspace({
  id,
  resource,
}: {
  id?: string;
  resource: "news" | "lifestyle";
}) {
  const lifestyle = resource === "lifestyle",
    base = "/admin/" + resource;
  const categoryLabel = (value: string) =>
    lifestyle
      ? (LIFESTYLE_TOPICS.find((x) => x.value === value)?.label ?? value)
      : value;
  const categoryIcon = (value: string) =>
    lifestyle
      ? (LIFESTYLE_TOPICS.find((x) => x.value === value)?.icon ?? "review")
      : "review";
  const { navigate } = useRouter();
  const [session, setSession] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState(() => blank(lifestyle ? "culture" : "")),
    [items, setItems] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [categoryFilter, setCategoryFilter] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [action, setAction] = useState(""),
    [reason, setReason] = useState(""),
    [history, setHistory] = useState<any>(null),
    [preview, setPreview] = useState(false),
    [pane, setPane] = useState("overview"),
    [editorStep, setEditorStep] = useState("details"),
    [mediaBusy, setMediaBusy] = useState(false);
  const leaving = useRef(false),
    key = useRef<{ body: string; key: string } | null>(null),
    listGeneration = useRef(0),
    appliedFilters = useRef({ q: "", status: "", category: "" }),
    alive = useRef(true);
  const fresh = id === "new",
    can = (p: string) => !!session?.permissions.includes(p),
    dirty =
      !!id &&
      JSON.stringify(draft) !==
        JSON.stringify(record?.draft ?? blank(lifestyle ? "culture" : ""));
  useDirtyGuard(() => (dirty || mediaBusy) && !leaving.current);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      listGeneration.current++;
    };
  }, []);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
      if (e instanceof ApiError && e.status === 401) setSession(null);
    } finally {
      setBusy(false);
      setLoaded(true);
    }
  }
  async function list(
    after?: string,
    override?: { q: string; status: string; category: string },
  ) {
    const generation = ++listGeneration.current;
    if (!after)
      appliedFilters.current = override ?? {
        q,
        status,
        category: categoryFilter,
      };
    const filters = appliedFilters.current;
    const p = await api(
      base +
        "?limit=30&q=" +
        encodeURIComponent(filters.q) +
        "&status=" +
        filters.status +
        "&category=" +
        encodeURIComponent(filters.category) +
        (after ? "&after=" + encodeURIComponent(after) : ""),
    );
    if (!alive.current || generation !== listGeneration.current) return;
    setItems((old) =>
      after
        ? [
            ...old,
            ...p.items.filter((row: any) => !old.some((x) => x.id === row.id)),
          ]
        : p.items,
    );
    setCursor(p.nextCursor);
  }
  async function load() {
    const s = await api("/admin/session");
    if (!alive.current) return;
    setSession(s);
    if (!s.permissions.includes(resource + ".read"))
      throw Error(
        "You need " +
          resource +
          ".read to view " +
          (lifestyle ? "Lifestyle & Culture" : "News") +
          ".",
      );
    if (!id) await list();
    else if (!fresh) {
      const r = await api(base + "/" + id);
      if (!alive.current) return;
      setRecord(r);
      setDraft(r.draft);
    }
  }
  useEffect(() => {
    void run(load);
  }, [id]);
  function field(k: string, v: unknown) {
    setDraft((d) => ({ ...d, [k]: v }));
    setNotice("");
  }
  function retryKey(body: unknown) {
    const text = JSON.stringify(body);
    if (key.current?.body !== text)
      key.current = { body: text, key: crypto.randomUUID() };
    return key.current!.key;
  }
  async function save() {
    const r = await api(
      base + (fresh ? "" : "/" + id + "/draft"),
      fresh ? "POST" : "PATCH",
      draft,
      record?.version,
      fresh ? retryKey(draft) : undefined,
    );
    setRecord(r);
    setDraft(r.draft);
    setNotice("Draft saved. Review the saved story before publishing.");
    setPane("overview");
    if (fresh) {
      leaving.current = true;
      navigate(base + "/" + r.id);
    }
  }
  async function decide() {
    const body = { reason, revisionId: record.draft_revision_id };
    const r = await api(
      base + "/" + id + "/" + action,
      "POST",
      body,
      record.version,
      retryKey({ action, version: record.version, ...body }),
    );
    setRecord(r);
    setDraft(r.draft);
    setNotice("Article " + action + " completed.");
    setAction("");
    setReason("");
    setHistory(null);
  }
  if (loaded && !session)
    return <StaffAuth onAuthenticated={() => run(load)} />;
  if (!loaded)
    return (
      <LoadingState
        label={<>Loading {lifestyle ? "Lifestyle & Culture" : "News"}…</>}
        variant={id ? "form" : "cards"}
      />
    );
  const controls = (
    <>
      {error && (
        <ErrorState
          message={error}
          onRetry={
            !id || (!fresh && !record) ? () => void run(load) : undefined
          }
          pending={busy}
        />
      )}
      {notice && <p role="status">{notice}</p>}
    </>
  );
  if (!can(resource + ".read")) return <>{controls}</>;
  if (!id)
    return (
      <div className="news-visual">
        {controls}
        <div className="nv-library-head">
          <div>
            <span className="nv-kicker">
              <MediaIcon name="review" size={15} /> MGTV ·{" "}
              {lifestyle ? "LIFESTYLE STUDIO" : "EDITORIAL DESK"}
            </span>
            <h2>
              {lifestyle
                ? "The way we live. The stories we share."
                : "Stories with something to say"}
            </h2>
            <p>
              {lifestyle
                ? "Explore food, places, style and everyday culture. Shape the story, choose its cover and review it for readers."
                : "Find a story by its cover. Open the saved article, shape its draft and review publication."}
            </p>
          </div>
          {can(resource + ".write") && (
            <Link to={base + "/new"} className="btn btn-primary">
              <MediaIcon name="plus" size={16} /> New article
            </Link>
          )}
        </div>
        <form
          className="nv-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => list());
          }}
          aria-label="Find articles"
        >
          <label className="nv-search">
            Search stories
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Headline or summary…"
            />
          </label>
          <label>
            Status
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {["draft", "published", "unpublished", "archived"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button disabled={busy} className="btn btn-secondary">
            <MediaIcon name="search" size={16} /> Search
          </button>
          <button
            type="button"
            disabled={busy}
            className="btn btn-ghost"
            onClick={() => {
              setQ("");
              setStatus("");
              setCategoryFilter("");
              appliedFilters.current = { q: "", status: "", category: "" };
              void run(async () => {
                const generation = ++listGeneration.current;
                const p = await api(base + "?limit=30");
                if (alive.current && generation === listGeneration.current) {
                  setItems(p.items);
                  setCursor(p.nextCursor);
                }
              });
            }}
          >
            Clear
          </button>
        </form>
        {lifestyle && (
          <nav className="nv-topics" aria-label="Lifestyle topics">
            {[
              { value: "", label: "All stories", icon: "review" },
              ...LIFESTYLE_TOPICS,
            ].map((topic) => (
              <button
                key={topic.value}
                aria-pressed={categoryFilter === topic.value}
                disabled={busy}
                onClick={() => {
                  setCategoryFilter(topic.value);
                  void run(() =>
                    list(undefined, { q, status, category: topic.value }),
                  );
                }}
              >
                <MediaIcon name={topic.icon} size={19} />
                {topic.label}
              </button>
            ))}
          </nav>
        )}
        <p className="nv-result-count" role="status">
          {busy
            ? "Finding stories…"
            : `${items.length} loaded ${items.length === 1 ? "story" : "stories"}${cursor ? " · more available" : ""}`}
        </p>
        <ul className="nv-grid" aria-label="Article library">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                to={base + "/" + r.id}
                className="nv-story-card"
                aria-label={"Open " + r.draft.title}
              >
                <div className="nv-card-cover">
                  <NewsArtwork resource={resource} record={r} />
                  <ContentStatus status={r.status} />
                </div>
                <div className="nv-card-copy">
                  <span className="nv-kicker">
                    <MediaIcon
                      name={categoryIcon(r.draft.category)}
                      size={14}
                    />
                    {categoryLabel(r.draft.category) || "Category to come"}
                  </span>
                  <h3>{r.draft.title || "Untitled story"}</h3>
                  <p>
                    {r.draft.summary ||
                      "Add a summary to introduce this story."}
                  </p>
                  <div className="nv-byline">
                    <span>
                      <MediaIcon name="artist" size={14} />
                      {r.draft.author || "Byline to come"}
                    </span>
                    <span>
                      <MediaIcon name="clock" size={14} />
                      {articleStats(r.draft).minutes} min read
                    </span>
                  </div>
                  <span className="nv-card-open">
                    Open story <MediaIcon name="arrow" size={16} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {!busy && !items.length && (
          <div className="nv-empty">
            <MediaIcon name="review" size={40} />
            <h3>No stories in this view</h3>
            <p>Try another headline or status, or begin a new article.</p>
          </div>
        )}
        {cursor && (
          <button
            disabled={busy}
            className="btn btn-secondary"
            onClick={() => void run(() => list(cursor))}
          >
            {busy ? "Loading…" : "Load more stories"}
          </button>
        )}
      </div>
    );
  if (!fresh && !record)
    return (
      <>
        {controls}
        <Link to={base}>
          Back to {lifestyle ? "Lifestyle & Culture" : "News"}
        </Link>
      </>
    );
  const readonly =
    busy ||
    mediaBusy ||
    !can(resource + ".write") ||
    record?.status === "archived";
  const activePane = fresh ? "edit" : pane;
  const stats = articleStats(record?.draft ?? draft);
  const pendingRevision =
    record?.status === "published" &&
    record.draft_revision_id !== record.published_revision_id;
  const coverChanged =
    draft.coverMediaVersionId !== (record?.draft.coverMediaVersionId ?? null);
  const choosePane = (next: string) => {
    setPane(next);
    if (next === "history" && !history)
      void run(async () => setHistory(await api(base + "/" + id + "/history")));
  };
  return (
    <div className="news-visual">
      {controls}
      <div className="nv-library-head">
        <div>
          <span className="nv-kicker">
            <MediaIcon name="review" size={15} /> MGTV ·{" "}
            {lifestyle ? "LIFESTYLE STUDIO" : "EDITORIAL DESK"}
          </span>
          <h2>{fresh ? "Start your next story" : record.draft.title}</h2>
        </div>
        <Link to={base} className="btn btn-ghost">
          ← All articles
        </Link>
      </div>
      {!fresh && (
        <nav className="nv-tabs" aria-label="Article workspace">
          {[
            ["overview", "Saved story", "review"],
            ["edit", "Edit draft", "edit"],
            ["artwork", "Artwork", "image"],
            ["publication", "Review & publish", "globe"],
            ["history", "Activity", "clock"],
          ].map(([value, label, icon]) => (
            <button
              key={value}
              aria-pressed={activePane === value}
              onClick={() => choosePane(value)}
            >
              <MediaIcon name={icon} size={16} />
              {label}
            </button>
          ))}
        </nav>
      )}
      <div className="nv-save-status" role="status">
        <ContentStatus status={record?.status ?? "draft"} />
        <span>
          {mediaBusy
            ? "Media upload in progress"
            : dirty
              ? "Unsaved changes · public story unchanged"
              : pendingRevision
                ? "A saved draft is waiting for publication"
                : fresh
                  ? "Not created yet"
                  : "Saved revision"}
        </span>
      </div>
      {!fresh && activePane === "overview" && (
        <>
          <section className="nv-overview">
            <NewsArtwork resource={resource} record={record} />
            <div>
              <span className="nv-kicker">
                <MediaIcon
                  name={categoryIcon(record.draft.category)}
                  size={15}
                />
                {categoryLabel(record.draft.category) || "Category to come"}
              </span>
              <h2>{record.draft.title}</h2>
              <p>
                {record.draft.summary ||
                  "Add a summary to invite readers into the story."}
              </p>
              <div className="nv-facts">
                <span>
                  <MediaIcon name="artist" />
                  {record.draft.author || "Byline to come"}
                </span>
                <span>
                  <MediaIcon name="clock" />
                  {stats.minutes} min read
                </span>
                <span>
                  <MediaIcon name="review" />
                  {stats.words} words · {stats.blocks} blocks
                </span>
              </div>
              <p className="nv-help">
                {pendingRevision
                  ? "This saved draft differs from the published story. Review and publish when it is ready."
                  : record.status === "published"
                    ? "This saved revision is published."
                    : "This is the saved private revision. Publication is a separate, permission-checked step."}
              </p>
              <div className="nv-actions">
                <button
                  className="btn btn-primary"
                  disabled={
                    !can(resource + ".write") || record.status === "archived"
                  }
                  onClick={() => setPane("edit")}
                >
                  <MediaIcon name="edit" size={16} /> Edit draft
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPane("publication")}
                >
                  <MediaIcon name="check" size={16} /> Review publication
                </button>
              </div>
            </div>
          </section>
          <ArticleReadingView
            body={record.draft}
            label="Saved reading preview"
          />
        </>
      )}
      <div
        className="nv-editor-layout"
        hidden={activePane !== "edit" && activePane !== "artwork"}
      >
        <div className="nv-editor-main">
          <div hidden={activePane !== "edit"}>
            <div className="nv-step-nav" aria-label="Draft editor sections">
              {[
                ["details", "Story details", "edit"],
                ["body", "Article body", "review"],
              ].map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={editorStep === value}
                  onClick={() => setEditorStep(value)}
                >
                  <MediaIcon name={icon} size={16} />
                  {label}
                </button>
              ))}
            </div>
            <Card>
              <fieldset
                disabled={readonly}
                style={{ border: 0, padding: 0, minWidth: 0 }}
              >
                <div className="news-fields" hidden={editorStep !== "details"}>
                  {(["title", "summary", "category", "author"] as const).map(
                    (k) => (
                      <label key={k}>
                        {
                          {
                            title: "Headline",
                            summary: "Summary",
                            category: "Category",
                            author: "Byline",
                            imageAlt: "Image alternative text",
                            imageCaption: "Image caption",
                          }[k]
                        }
                        {k === "category" && lifestyle ? (
                          <select
                            className="input"
                            value={draft.category}
                            onChange={(e) => field("category", e.target.value)}
                          >
                            {LIFESTYLE_TOPICS.map((topic) => (
                              <option key={topic.value} value={topic.value}>
                                {topic.label}
                              </option>
                            ))}
                          </select>
                        ) : k === "summary" ? (
                          <textarea
                            className="input"
                            rows={3}
                            maxLength={600}
                            value={draft[k]}
                            onChange={(e) => field(k, e.target.value)}
                          />
                        ) : (
                          <input
                            className="input"
                            maxLength={
                              k === "title"
                                ? 180
                                : k === "category"
                                  ? 80
                                  : k === "author"
                                    ? 160
                                    : k === "imageAlt"
                                      ? 400
                                      : 600
                            }
                            value={draft[k]}
                            onChange={(e) => field(k, e.target.value)}
                          />
                        )}
                      </label>
                    ),
                  )}
                </div>
                <div hidden={editorStep !== "body"}>
                  <div className="nv-section-heading">
                    <MediaIcon name="review" />
                    <div>
                      <h3>Build the story</h3>
                      <p>
                        Give each idea space with paragraphs, headings and pull
                        quotes.
                      </p>
                    </div>
                  </div>
                  {draft.blocks.map((b, i) => (
                    <div className="news-block nv-block" key={i}>
                      <span className="nv-block-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <label>
                        Block {i + 1}
                        <select
                          className="input"
                          value={b.type}
                          onChange={(e) =>
                            field(
                              "blocks",
                              draft.blocks.map((x, n) =>
                                n === i ? { ...x, type: e.target.value } : x,
                              ),
                            )
                          }
                        >
                          {["paragraph", "heading", "quote"].map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Text
                        <textarea
                          className="input"
                          rows={b.type === "paragraph" ? 5 : 2}
                          maxLength={6000}
                          value={b.text}
                          onChange={(e) =>
                            field(
                              "blocks",
                              draft.blocks.map((x, n) =>
                                n === i ? { ...x, text: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </label>
                      <div className="news-toolbar">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={!i}
                          onClick={() => {
                            const a = [...draft.blocks];
                            [a[i - 1], a[i]] = [a[i], a[i - 1]];
                            field("blocks", a);
                          }}
                        >
                          <span className="nv-move-up">
                            <MediaIcon name="arrow" size={16} />
                          </span>
                          <span>Move up</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={i === draft.blocks.length - 1}
                          onClick={() => {
                            const a = [...draft.blocks];
                            [a[i + 1], a[i]] = [a[i], a[i + 1]];
                            field("blocks", a);
                          }}
                        >
                          <span className="nv-move-down">
                            <MediaIcon name="arrow" size={16} />
                          </span>
                          <span>Move down</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() =>
                            field(
                              "blocks",
                              draft.blocks.filter((_, n) => i !== n),
                            )
                          }
                        >
                          <MediaIcon name="trash" size={16} />
                          <span>Remove block</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={draft.blocks.length >= 150}
                    onClick={() =>
                      field("blocks", [
                        ...draft.blocks,
                        { type: "paragraph", text: "" },
                      ])
                    }
                  >
                    <MediaIcon name="plus" size={16} /> Add text block
                  </button>
                </div>
              </fieldset>
            </Card>
          </div>
          <div hidden={activePane !== "artwork"}>
            <Card>
              <div className="nv-section-heading">
                <MediaIcon name="image" />
                <div>
                  <h3>Give the story a first impression</h3>
                  <p>
                    One strong image, an accessible description and a useful
                    caption.
                  </p>
                </div>
              </div>
              <div className="nv-selected-cover">
                <NewsArtwork
                  resource={resource}
                  record={record}
                  draft={draft}
                />
              </div>
              <p>
                Choose an image from your computer. Save the draft to preview
                the new image.
              </p>
              <MediaAttachment
                key={id}
                label="Story image"
                kind="image"
                value={draft.coverMediaVersionId}
                disabled={readonly}
                canRead={!!can("media.read")}
                canUpload={!!can("media.upload")}
                onBusyChange={setMediaBusy}
                onChange={(v) => field("coverMediaVersionId", v)}
              />
            </Card>
            <div className="news-fields nv-image-fields">
              {(["imageAlt", "imageCaption"] as const).map((k) => (
                <label key={k}>
                  {k === "imageAlt"
                    ? "Image alternative text"
                    : "Image caption"}
                  <input
                    className="input"
                    value={draft[k]}
                    maxLength={k === "imageAlt" ? 400 : 600}
                    disabled={readonly}
                    onChange={(e) => field(k, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="nv-edit-footer">
            <span>
              {dirty
                ? "Changes are not saved yet."
                : fresh
                  ? "Create the draft when you are ready."
                  : "No unsaved changes."}
            </span>
            <div className="nv-actions">
              <button
                className="btn btn-primary"
                disabled={readonly || (!dirty && !fresh)}
                onClick={() => void run(save)}
              >
                <MediaIcon name="check" size={16} />
                {fresh ? "Create draft" : "Save draft"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setPreview(true)}
              >
                <MediaIcon name="review" size={16} /> Preview draft text
              </button>
              {!fresh && (
                <button
                  className="btn btn-ghost"
                  disabled={busy || mediaBusy || !dirty}
                  onClick={() => {
                    setDraft(record.draft);
                    setNotice("Unsaved changes discarded.");
                  }}
                >
                  Discard changes
                </button>
              )}
            </div>
          </div>
        </div>
        <aside className="nv-editor-guide">
          <NewsArtwork resource={resource} record={record} draft={draft} />
          <span className="nv-kicker">YOUR STORY AT A GLANCE</span>
          <h3>{draft.title || "Your headline goes here"}</h3>
          <p>
            {draft.summary ||
              "A short summary helps readers decide where to begin."}
          </p>
          <div className="nv-facts">
            <span>
              <MediaIcon name="clock" size={16} />
              {articleStats(draft).minutes} min read
            </span>
            <span>
              <MediaIcon name="review" size={16} />
              {articleStats(draft).words} words
            </span>
          </div>
          <p className="nv-help">
            {fresh
              ? "Create the draft first, then choose its cover in Artwork."
              : coverChanged
                ? "Save the draft to preview the replacement cover. The current saved image remains unchanged."
                : "Preview the writing as you work. Save first, then review publication separately."}
          </p>
        </aside>
      </div>
      <section hidden={activePane !== "publication"}>
        <Card>
          <div className="nv-section-heading">
            <MediaIcon name="check" />
            <div>
              <h3>Ready for readers?</h3>
              <p>
                Check the saved article before choosing a publication action.
              </p>
            </div>
          </div>
          <ul className="nv-checklist">
            {[
              ["Headline", !!record?.draft.title.trim()],
              [
                "Summary & category",
                !!record?.draft.summary.trim() &&
                  !!record?.draft.category.trim(),
              ],
              ["Byline", !!record?.draft.author.trim()],
              [
                "Cover & alternative text",
                !!record?.draft.coverMediaVersionId &&
                  !!record?.draft.imageAlt.trim(),
              ],
              [
                "Article paragraph",
                !!record?.draft.blocks.some(
                  (b: any) => b.type === "paragraph" && b.text.trim(),
                ),
              ],
            ].map(([label, done]) => (
              <li key={String(label)}>
                <MediaIcon name={done ? "check" : "edit"} size={18} />
                <span>{label}</span>
                <small>{done ? "Added" : "To complete"}</small>
              </li>
            ))}
          </ul>
          <p>
            Draft edits remain private until this saved revision is published.
          </p>
          <div className="news-actions">
            {record && (
              <>
                {["publish", "unpublish", "archive", "restore"]
                  .filter((a) =>
                    a === "restore"
                      ? record.status === "archived"
                      : a === "publish"
                        ? record.status !== "archived"
                        : a === "unpublish"
                          ? record.status === "published"
                          : record.status !== "archived",
                  )
                  .map((a) => (
                    <button
                      key={a}
                      className="btn btn-secondary"
                      disabled={
                        busy ||
                        mediaBusy ||
                        dirty ||
                        !can(
                          a === "publish"
                            ? resource + ".publish"
                            : a === "unpublish"
                              ? resource + ".unpublish"
                              : resource + ".write",
                        ) ||
                        (a === "archive" &&
                          record.status === "published" &&
                          !can(resource + ".unpublish"))
                      }
                      onClick={() => {
                        setAction(a);
                        setReason("");
                      }}
                    >
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </button>
                  ))}
              </>
            )}
          </div>
        </Card>
      </section>
      {activePane === "history" && (
        <section className="nv-history">
          <div className="nv-section-heading">
            <MediaIcon name="clock" />
            <div>
              <h3>How this story took shape</h3>
              <p>Real saved activity and immutable revisions.</p>
            </div>
          </div>
          {!history ? (
            error ? (
              <button
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => choosePane("history")}
              >
                Retry story history
              </button>
            ) : (
              <LoadingState label="Loading story history…" variant="cards" />
            )
          ) : (
            <>
              <ol>
                {history.items.map((h: any) => (
                  <li key={h.id}>
                    <span className="nv-history-icon">
                      <MediaIcon
                        name={h.action.includes("publish") ? "globe" : "edit"}
                        size={18}
                      />
                    </span>
                    <div>
                      <strong>
                        {h.action
                          .replace(/^(news|lifestyle)\./, "")
                          .replace(/_/g, " ")}
                      </strong>
                      <time>{new Date(h.created_at).toLocaleString()}</time>
                      {h.details?.reason && <p>{h.details.reason}</p>}
                    </div>
                  </li>
                ))}
              </ol>
              <p className="nv-help">
                {history.revisions?.length ?? 0} immutable saved revisions
              </p>
            </>
          )}
        </section>
      )}
      {action && (
        <Modal
          title={action + " article"}
          onClose={() => {
            if (!busy) setAction("");
          }}
          footer={
            <button
              className="btn btn-primary"
              disabled={busy || !reason.trim()}
              onClick={() => void run(decide)}
            >
              Confirm {action}
            </button>
          }
        >
          {error && <p role="alert">{error}</p>}
          <p>
            This applies to the saved revision. Restoring an archived article
            never republishes it.
          </p>
          <div className="nv-review-summary">
            <MediaIcon name="review" />
            <strong>{record?.draft.title}</strong>
            <ContentStatus status={record?.status ?? "draft"} />
          </div>
          <label>
            Reason
            <textarea
              className="input"
              value={reason}
              maxLength={1000}
              disabled={busy}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        </Modal>
      )}
      {preview && (
        <Modal title="Article text preview" onClose={() => setPreview(false)}>
          <ArticleReadingView body={draft} label="Unsaved draft text preview" />
        </Modal>
      )}
    </div>
  );
}
