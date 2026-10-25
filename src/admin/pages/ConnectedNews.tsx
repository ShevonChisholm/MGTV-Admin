import MediaAttachment from "../components/MediaAttachment";
import LoadingState, { ErrorState } from "../components/LoadingState";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Card, Modal } from "../ui";
import StaffAuth from "./StaffAuth";
const blank = () => ({
  title: "",
  summary: "",
  category: "",
  author: "",
  coverMediaVersionId: null as string | null,
  imageAlt: "",
  imageCaption: "",
  blocks: [] as { type: string; text: string }[],
});
export default function ConnectedNews() {
  const { route } = useRouter();
  return <NewsEditor key={route.parts[0] ?? "list"} id={route.parts[0]} />;
}
function NewsEditor({ id }: { id?: string }) {
  const { navigate } = useRouter();
  const [session, setSession] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState(blank()),
    [items, setItems] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [action, setAction] = useState(""),
    [reason, setReason] = useState(""),
    [history, setHistory] = useState<any>(null),
    [preview, setPreview] = useState(false);
  const leaving = useRef(false),
    key = useRef<{ body: string; key: string } | null>(null);
  const fresh = id === "new",
    can = (p: string) => !!session?.permissions.includes(p),
    dirty =
      !!id &&
      JSON.stringify(draft) !== JSON.stringify(record?.draft ?? blank());
  useDirtyGuard(() => dirty && !leaving.current);
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
  async function list(after?: string) {
    const p = await api(
      "/admin/news?limit=30&q=" +
        encodeURIComponent(q) +
        "&status=" +
        status +
        (after ? "&after=" + encodeURIComponent(after) : ""),
    );
    setItems((old) => (after ? [...old, ...p.items] : p.items));
    setCursor(p.nextCursor);
  }
  async function load() {
    const s = await api("/admin/session");
    setSession(s);
    if (!s.permissions.includes("news.read"))
      throw Error("You need news.read to view News.");
    if (!id) await list();
    else if (!fresh) {
      const r = await api("/admin/news/" + id);
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
      "/admin/news" + (fresh ? "" : "/" + id + "/draft"),
      fresh ? "POST" : "PATCH",
      draft,
      record?.version,
      fresh ? retryKey(draft) : undefined,
    );
    setRecord(r);
    setDraft(r.draft);
    setNotice("Draft saved. Publish this revision when ready.");
    if (fresh) {
      leaving.current = true;
      navigate("/admin/news/" + r.id);
    }
  }
  async function decide() {
    const body = { reason, revisionId: record.draft_revision_id };
    const r = await api(
      "/admin/news/" + id + "/" + action,
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
    return <LoadingState label={<>Loading News…</>} variant="table" />;
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
  if (!can("news.read")) return <>{controls}</>;
  if (!id)
    return (
      <>
        {controls}
        <Card>
          <div className="news-toolbar">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => list());
              }}
            >
              <label>
                Search stories
                <input
                  className="input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
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
                  {["draft", "published", "unpublished", "archived"].map(
                    (s) => (
                      <option key={s}>{s}</option>
                    ),
                  )}
                </select>
              </label>
              <button disabled={busy} className="btn btn-secondary">
                Search
              </button>
            </form>
            {can("news.write") && (
              <Link to="/admin/news/new" className="btn btn-primary">
                New article
              </Link>
            )}
          </div>
          <div className="news-list">
            {items.map((r) => (
              <Link
                key={r.id}
                to={"/admin/news/" + r.id}
                className="news-list-row"
              >
                <strong>{r.draft.title || "Untitled article"}</strong>
                <span>{r.draft.category || "Uncategorized"}</span>
                <span>{r.status}</span>
              </Link>
            ))}
          </div>
          {!items.length && <p>No articles match these filters.</p>}
          {cursor && (
            <button
              disabled={busy}
              className="btn btn-secondary"
              onClick={() => void run(() => list(cursor))}
            >
              Load more
            </button>
          )}
        </Card>
      </>
    );
  if (!fresh && !record)
    return (
      <>
        {controls}
        <Link to="/admin/news">Back to News</Link>
      </>
    );
  const readonly = busy || !can("news.write") || record?.status === "archived";
  return (
    <>
      {controls}
      <div className="news-toolbar">
        <Link to="/admin/news">← All articles</Link>
        <span>
          {record?.status ?? "New draft"} ·{" "}
          {dirty ? "Unsaved changes" : "Saved"}
        </span>
      </div>
      <div className="news-editor">
        <Card>
          <fieldset
            disabled={readonly}
            style={{ border: 0, padding: 0, minWidth: 0 }}
          >
            <div className="news-fields">
              {(
                [
                  "title",
                  "summary",
                  "category",
                  "author",
                  "imageAlt",
                  "imageCaption",
                ] as const
              ).map((k) => (
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
                  {k === "summary" ? (
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
              ))}
            </div>
            <h3>Article body</h3>
            {draft.blocks.map((b, i) => (
              <div className="news-block" key={i}>
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
                    Move up
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
                    Move down
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
                    Remove block
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
              Add text block
            </button>
          </fieldset>
        </Card>
        <div>
          <Card>
            <h3>Story image</h3>
            {record?.draft.coverMediaVersionId && (
              <img
                src={"/api/v1/admin/news/" + id + "/cover?v=" + record.version}
                alt={draft.imageAlt}
                style={{ width: "100%", borderRadius: 8 }}
              />
            )}
            <p>
              Choose an image from your computer. Save the draft to preview the
              new image.
            </p>
            <MediaAttachment key={id} label="Story image" kind="image" value={draft.coverMediaVersionId} disabled={readonly} canRead={!!can("media.read")} canUpload={!!can("media.upload")} onBusyChange={setBusy} onChange={v=>field("coverMediaVersionId",v)}/>
          </Card>
          <Card>
            <h3>Publication</h3>
            <p>
              Draft edits remain private until this saved revision is published.
            </p>
            <div className="news-actions">
              <button
                className="btn btn-primary"
                disabled={readonly || (!dirty && !fresh)}
                onClick={() => void run(save)}
              >
                Save draft
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setPreview(true)}
              >
                Preview text
              </button>
              {record && (
                <>
                  <button
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() =>
                      void run(async () =>
                        setHistory(await api("/admin/news/" + id + "/history")),
                      )
                    }
                  >
                    History
                  </button>
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
                          dirty ||
                          !can(
                            a === "publish"
                              ? "news.publish"
                              : a === "unpublish"
                                ? "news.unpublish"
                                : "news.write",
                          ) ||
                          (a === "archive" &&
                            record.status === "published" &&
                            !can("news.unpublish"))
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
        </div>
      </div>
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
          <label>
            Reason
            <textarea
              className="input"
              value={reason}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        </Modal>
      )}
      {preview && (
        <Modal title="Article text preview" onClose={() => setPreview(false)}>
          <h2>{draft.title}</h2>
          <p>{draft.summary}</p>
          <p>
            {draft.category} · By {draft.author}
          </p>
          {draft.blocks.map((b, i) =>
            b.type === "heading" ? (
              <h3 key={i}>{b.text}</h3>
            ) : b.type === "quote" ? (
              <blockquote key={i}>{b.text}</blockquote>
            ) : (
              <p key={i} style={{ whiteSpace: "pre-wrap" }}>
                {b.text}
              </p>
            ),
          )}
        </Modal>
      )}
      {history && (
        <Modal title="Article history" onClose={() => setHistory(null)}>
          {history.items.map((h: any) => (
            <p key={h.id}>
              {h.action} · {new Date(h.created_at).toLocaleString()}
              <br />
              {h.details?.reason}
            </p>
          ))}
          <p>{history.revisions?.length ?? 0} immutable saved revisions</p>
        </Modal>
      )}
    </>
  );
}
