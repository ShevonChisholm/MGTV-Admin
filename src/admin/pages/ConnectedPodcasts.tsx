import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Modal } from "../ui";
import MediaAttachment from "../components/MediaAttachment";
import MediaIcon from "../components/MediaIcon";
import { ContentStatus } from "../components/ContentVisual";
import "../components/PodcastsAdmin.css";
const defaults = (episode = false) => ({
  title: "",
  description: "",
  host: "",
  category: "",
  format: episode ? "audio" : "mixed",
  classification: "G",
  accessTier: "free",
  eligibleTierIds: [] as string[],
  coverMediaVersionId: null,
  primaryMediaVersionId: null,
  previewMediaVersionId: null,
  featureMediaVersionId: null,
  seasonNumber: null,
  episodeNumber: episode ? 1 : null,
  releaseAt: null,
  endsAt: null,
  regionMode: "worldwide",
  regionCodes: [] as string[],
  rightsConfirmed: false,
  contentOrigin: "unclassified",
  rightsReference: null,
});
export default function ConnectedPodcasts() {
  const { route } = useRouter();
  return (
    <Workspace
      key={route.parts.join(":")}
      id={route.parts[0]}
      mode={route.parts[1]}
    />
  );
}
function Workspace({ id, mode }: { id?: string; mode?: string }) {
  const { navigate } = useRouter(),
    fresh = id === "new" || mode === "new-episode",
    episode = mode === "new-episode";
  const [session, setSession] = useState<any>(null),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState<any>(defaults(episode)),
    [items, setItems] = useState<any[]>([]),
    [children, setChildren] = useState<any[]>([]),
    [history, setHistory] = useState<any[]>([]),
    [tiers, setTiers] = useState<any[]>([]),
    [next, setNext] = useState<string | null>(null),
    [childNext, setChildNext] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [uploads, setUploads] = useState<Record<string, boolean>>({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [q, setQ] = useState(""),
    [applied, setApplied] = useState(""),
    [status, setStatus] = useState(""),
    [pane, setPane] = useState(
      fresh || mode === "edit" || mode === "media" ? "edit" : "overview",
    ),
    [step, setStep] = useState(mode === "media" ? 1 : 0),
    [action, setAction] = useState(""),
    [reason, setReason] = useState("");
  const keys = useRef<Record<string, { body: string; key: string }>>({}),
    leaving = useRef(false),
    listRequest = useRef(0),
    baseline = useRef(JSON.stringify(defaults(episode))),
    mediaBusy = Object.values(uploads).some(Boolean);
  const isEpisode = record?.kind === "episode" || episode,
    dirty =
      !!id &&
      JSON.stringify(draft) !==
        (record ? JSON.stringify(record.draft) : baseline.current);
  const can = (p: string) => !!session?.permissions?.includes(p);
  useDirtyGuard(() => !leaving.current && (dirty || mediaBusy));
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The request failed.");
    } finally {
      setBusy(false);
    }
  }
  function key(scope: string, body: unknown) {
    const value = JSON.stringify(body);
    if (keys.current[scope]?.body !== value)
      keys.current[scope] = { body: value, key: crypto.randomUUID() };
    return keys.current[scope].key;
  }
  function update(k: string, value: any) {
    setDraft((d: any) => ({ ...d, [k]: value }));
  }
  async function loadList(after?: string) {
    const request = ++listRequest.current;
    const page = await api(
      "/admin/podcasts?" +
        new URLSearchParams({
          limit: "24",
          q: applied,
          status,
          ...(after ? { after } : {}),
        }),
    );
    if (request !== listRequest.current) return;
    setItems((old) => (after ? [...old, ...page.items] : page.items));
    setNext(page.nextCursor);
  }
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    void (async () => {
      const s = await api("/admin/session");
      if (!alive) return;
      setSession(s);
      if (!s.permissions.includes("podcasts.read"))
        throw Error(
          "You need Podcasts read permission to open this workspace.",
        );
      if (!id) {
        await loadList();
        return;
      }
      if (fresh) {
        if (episode) {
          const parent = await api("/admin/podcasts/" + id);
          if (alive) {
            const initial = {
              ...defaults(true),
              host: parent.draft.host,
              category: parent.draft.category,
              classification: parent.draft.classification,
              format: parent.draft.format === "video" ? "video" : "audio",
            };
            baseline.current = JSON.stringify(initial);
            setDraft(initial);
          }
        }
        return;
      }
      const r = await api("/admin/podcasts/" + id);
      if (!alive) return;
      setRecord(r);
      setDraft(r.draft);
      const [h, ch] = await Promise.all([
        api("/admin/podcasts/" + id + "/history"),
        r.kind === "series"
          ? api("/admin/podcasts/" + id + "/episodes?limit=24")
          : Promise.resolve({ items: [] }),
      ]);
      if (alive) {
        setHistory(h.items);
        setChildren(ch.items);
        setChildNext(ch.nextCursor ?? null);
      }
    })()
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
      listRequest.current++;
    };
  }, [id, episode, applied, status]);
  useEffect(() => {
    let alive = true;
    if (id)
      void fetch("/api/v1/catalog/subscription-tiers")
        .then(async (r) => {
          if (!r.ok) throw Error();
          return r.json();
        })
        .then((t) => {
          if (alive) setTiers(Array.isArray(t) ? t : (t.items ?? []));
        })
        .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      if (fresh) {
        const r = await api(
          episode ? "/admin/podcasts/" + id + "/episodes" : "/admin/podcasts",
          "POST",
          draft,
          undefined,
          key("create", draft),
        );
        leaving.current = true;
        navigate("/admin/podcasts/" + r.id + "/media");
      } else {
        const r = await api(
          "/admin/podcasts/" + id + "/draft",
          "PUT",
          draft,
          record.version,
        );
        setRecord(r);
        setDraft(r.draft);
        setNotice("Draft saved. Review it before publishing.");
        setPane("overview");
      }
    });
  }
  async function command() {
    await run(async () => {
      const body = { reason, revisionId: record.draftRevisionId };
      const r = await api(
        "/admin/podcasts/" + id + "/" + action,
        "POST",
        body,
        record.version,
        key("action", { action, body, version: record.version }),
      );
      setRecord(r);
      setDraft(r.draft);
      setAction("");
      setReason("");
      setNotice("Podcast " + action + " completed.");
      setHistory((await api("/admin/podcasts/" + id + "/history")).items);
    });
  }
  const text = (k: string, label: string, area = false) => (
    <label className="pa-field">
      {label}
      {area ? (
        <textarea
          value={draft[k]}
          maxLength={12000}
          rows={5}
          onChange={(e) => update(k, e.target.value)}
        />
      ) : (
        <input
          value={draft[k] ?? ""}
          maxLength={
            k === "rightsReference" ? 1000 : k === "category" ? 80 : 180
          }
          onChange={(e) => update(k, e.target.value)}
        />
      )}
    </label>
  );
  const select = (k: string, label: string, options: string[]) => (
    <label className="pa-field">
      {label}
      <select
        value={draft[k]}
        onChange={(e) => {
          update(k, e.target.value);
          if (k === "accessTier" && e.target.value === "free")
            update("eligibleTierIds", []);
        }}
      >
        {options.map((v) => (
          <option key={v} value={v}>
            {v.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
  const attachment = (
    k: string,
    label: string,
    kind: "image" | "audio" | "video",
    maxDuration?: number,
  ) => (
    <MediaAttachment
      label={label}
      kind={kind}
      value={draft[k]}
      onChange={(v) => update(k, v)}
      canRead={can("media.read")}
      canUpload={can("media.upload")}
      disabled={!can("podcasts.write") || busy}
      maxDuration={maxDuration}
      onBusyChange={(v) => setUploads((old) => ({ ...old, [k]: v }))}
    />
  );
  function card(r: any) {
    return (
      <Link key={r.id} to={"/admin/podcasts/" + r.id} className="pa-card">
        <div className="pa-cover">
          {r.coverUrl ? (
            <img src={r.coverUrl} alt="" loading="lazy" />
          ) : (
            <MediaIcon name="podcast" size={64} />
          )}
          <span className="pa-format">
            <MediaIcon
              name={r.draft.format === "video" ? "video" : "podcast"}
              size={15}
            />
            {r.draft.format}
          </span>
        </div>
        <div className="pa-card-body">
          <ContentStatus status={r.status} />
          <h2>{r.draft.title}</h2>
          <p>{r.draft.host || "Host not added"}</p>
          <span>
            {r.kind === "episode"
              ? `${r.draft.seasonNumber ? "Season " + r.draft.seasonNumber + " · " : ""}Episode ${r.draft.episodeNumber}`
              : r.draft.category || "Category not added"}
          </span>
        </div>
      </Link>
    );
  }
  if (loading)
    return (
      <div
        className="podcast-admin pa-grid"
        aria-label="Loading podcasts"
        role="status"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div className="pa-skeleton" key={i} />
        ))}
      </div>
    );
  return (
    <div className="podcast-admin">
      <div className="pa-toolbar">
        <div>
          <span className="pa-kicker">MGTV · PODCAST STUDIO</span>
          <h2>
            {record?.draft.title ??
              (fresh
                ? episode
                  ? "Create an episode"
                  : "Start a conversation"
                : "Conversations worth coming back to")}
          </h2>
        </div>
        <div className="pa-actions">
          {id ? (
            <Link
              to={
                record?.parentId
                  ? "/admin/podcasts/" + record.parentId
                  : "/admin/podcasts"
              }
            >
              ← {record?.parentId ? "Back to series" : "All podcasts"}
            </Link>
          ) : (
            can("podcasts.write") && (
              <Link className="pa-button primary" to="/admin/podcasts/new">
                <MediaIcon name="plus" />
                New podcast
              </Link>
            )
          )}
        </div>
      </div>
      {error && (
        <div className="pa-message error" role="alert">
          {error}
          <button onClick={() => location.reload()}>Reload workspace</button>
        </div>
      )}
      {notice && (
        <p className="pa-message" role="status">
          {notice}
        </p>
      )}
      {!can("podcasts.read") ? (
        <p>Ask an authorized administrator for Podcasts access.</p>
      ) : !id ? (
        <>
          <form
            className="pa-filters"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(q);
            }}
          >
            <label className="pa-field">
              Search podcasts
              <input
                placeholder="Title…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <label className="pa-field">
              Publication
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {["draft", "published", "unpublished", "archived"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <button className="pa-button" type="submit">
              Search
            </button>
            <button
              className="pa-button"
              type="button"
              onClick={() => {
                setQ("");
                setApplied("");
                setStatus("");
              }}
            >
              Clear
            </button>
          </form>
          <div className="pa-grid">{items.map(card)}</div>
          {!items.length && !error && (
            <div className="pa-empty">
              <MediaIcon name="podcast" size={48} />
              <h3>Your next conversation starts here.</h3>
              <p>
                Create a series, add artwork, then bring in audio and video
                episodes.
              </p>
            </div>
          )}
          {next && (
            <button
              className="pa-button"
              disabled={busy}
              onClick={() => run(() => loadList(next))}
            >
              Load more podcasts
            </button>
          )}
        </>
      ) : (
        <>
          {!fresh && (
            <nav className="pa-tabs" aria-label="Podcast workspace">
              {[
                "overview",
                "edit",
                ...(!isEpisode ? ["episodes"] : []),
                "history",
              ].map((tab) => (
                <button
                  key={tab}
                  aria-pressed={pane === tab}
                  onClick={() => setPane(tab)}
                >
                  {tab === "edit"
                    ? "Edit draft"
                    : tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          )}
          {pane === "overview" && record && (
            <>
              <div className="pa-overview">
                <div className="pa-art">
                  {record.coverUrl ? (
                    <img src={record.coverUrl} alt="" />
                  ) : (
                    <MediaIcon name="podcast" size={88} />
                  )}
                </div>
                <div>
                  <ContentStatus status={record.status} />
                  <h2>{record.draft.title}</h2>
                  <p>
                    {record.draft.description ||
                      "Add the story behind this podcast."}
                  </p>
                  <div className="pa-facts">
                    <span>
                      <MediaIcon name="artist" />
                      {record.draft.host || "Host pending"}
                    </span>
                    <span>
                      <MediaIcon name="podcast" />
                      {record.draft.format} · {record.draft.classification}
                    </span>
                    <span>
                      <MediaIcon name="lock" />
                      {record.draft.accessTier === "premium"
                        ? "MGTV+ · Tier access"
                        : "Free with a selected profile"}
                    </span>
                  </div>
                  <p className="pa-note">
                    {record.publishedRevisionId &&
                    record.publishedRevisionId !== record.draftRevisionId
                      ? "Unpublished changes · viewers still see the last published revision."
                      : record.status === "published"
                        ? "Saved version is published."
                        : "This record is not currently public."}
                  </p>
                  <div className="pa-actions">
                    <button
                      className="pa-button"
                      onClick={() => {
                        setStep(0);
                        setPane("edit");
                      }}
                      disabled={
                        !can("podcasts.write") || record.status === "archived"
                      }
                    >
                      <MediaIcon name="edit" />
                      Edit draft
                    </button>
                    {record.status !== "archived" &&
                      can("podcasts.publish") && (
                        <button
                          className="pa-button primary"
                          disabled={dirty || busy}
                          onClick={() => setAction("publish")}
                        >
                          <MediaIcon name="globe" />
                          Review & publish
                        </button>
                      )}
                    {record.status === "published" &&
                      can("podcasts.unpublish") && (
                        <button
                          className="pa-button"
                          onClick={() => setAction("unpublish")}
                        >
                          Unpublish
                        </button>
                      )}
                    {record.status !== "archived" &&
                      can("podcasts.unpublish") && (
                        <button
                          className="pa-button"
                          onClick={() => setAction("archive")}
                        >
                          <MediaIcon name="archive" />
                          Archive
                        </button>
                      )}
                    {record.status === "archived" && can("podcasts.write") && (
                      <button
                        className="pa-button"
                        onClick={() => setAction("restore")}
                      >
                        Restore to draft
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {!isEpisode && (
                <div className="pa-section">
                  <div className="pa-toolbar">
                    <h3>Episodes</h3>
                    {can("podcasts.write") && record.status !== "archived" && (
                      <Link
                        className="pa-button primary"
                        to={"/admin/podcasts/" + id + "/new-episode"}
                      >
                        <MediaIcon name="plus" />
                        Add episode
                      </Link>
                    )}
                  </div>
                  <div className="pa-grid">
                    {children.slice(0, 6).map(card)}
                  </div>
                  {children.length > 6 && (
                    <button
                      className="pa-button"
                      onClick={() => setPane("episodes")}
                    >
                      View all episodes
                    </button>
                  )}
                  {!children.length && (
                    <p>No episodes yet. Add the first voice to this series.</p>
                  )}
                </div>
              )}
            </>
          )}
          {pane === "episodes" && (
            <div className="pa-section">
              <div className="pa-toolbar">
                <h3>Series episodes</h3>
                {can("podcasts.write") && record.status !== "archived" && (
                  <Link
                    className="pa-button primary"
                    to={"/admin/podcasts/" + id + "/new-episode"}
                  >
                    ＋ Add episode
                  </Link>
                )}
              </div>
              <div className="pa-grid">{children.map(card)}</div>
              {childNext && (
                <button
                  className="pa-button"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const p = await api(
                        "/admin/podcasts/" +
                          id +
                          "/episodes?limit=24&after=" +
                          encodeURIComponent(childNext),
                      );
                      setChildren((old) => [...old, ...p.items]);
                      setChildNext(p.nextCursor);
                    })
                  }
                >
                  Load more episodes
                </button>
              )}
            </div>
          )}
          {pane === "edit" && (
            <form onSubmit={save}>
              <div className="pa-steps">
                <button
                  type="button"
                  aria-pressed={step === 0}
                  onClick={() => setStep(0)}
                >
                  01 · Details & access
                </button>
                <button
                  type="button"
                  aria-pressed={step === 1}
                  disabled={fresh}
                  onClick={() => setStep(1)}
                >
                  02 · Artwork & media
                </button>
              </div>
              <fieldset
                disabled={
                  busy ||
                  !can("podcasts.write") ||
                  record?.status === "archived"
                }
              >
                <legend>
                  {step === 0
                    ? "Shape the conversation"
                    : "Attach media to this saved record"}
                </legend>
                {step === 0 ? (
                  <>
                    <div className="pa-form-grid">
                      {text("title", "Title")}
                      {text("host", "Host / presenters")}
                      {text("category", "Category")}
                      {select(
                        "format",
                        "Format",
                        isEpisode
                          ? ["audio", "video"]
                          : ["mixed", "audio", "video"],
                      )}
                      {select("classification", "Classification", [
                        "G",
                        "PG",
                        "PG-13",
                        "R",
                      ])}
                      {select("accessTier", "Access", ["free", "premium"])}
                      {isEpisode && (
                        <>
                          <label className="pa-field">
                            Season number · optional
                            <input
                              type="number"
                              min="1"
                              max="10000"
                              disabled={!fresh}
                              value={draft.seasonNumber ?? ""}
                              onChange={(e) =>
                                update(
                                  "seasonNumber",
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                            />
                          </label>
                          <label className="pa-field">
                            Episode number
                            <input
                              type="number"
                              required
                              min="1"
                              max="100000"
                              disabled={!fresh}
                              value={draft.episodeNumber ?? 1}
                              onChange={(e) =>
                                update("episodeNumber", Number(e.target.value))
                              }
                            />
                          </label>
                        </>
                      )}
                    </div>
                    {text("description", "Description", true)}
                    {draft.accessTier === "premium" && (
                      <div className="pa-section">
                        <h3>Eligible subscription tiers</h3>
                        {!tiers.length ? (
                          <p role="alert">
                            Subscription tiers could not be loaded. Reload
                            before setting premium access.
                          </p>
                        ) : (
                          tiers.map((t: any) => (
                            <label className="pa-check" key={t.id}>
                              <input
                                type="checkbox"
                                checked={draft.eligibleTierIds.includes(t.id)}
                                onChange={(e) =>
                                  update(
                                    "eligibleTierIds",
                                    e.target.checked
                                      ? [...draft.eligibleTierIds, t.id]
                                      : draft.eligibleTierIds.filter(
                                          (id: string) => id !== t.id,
                                        ),
                                  )
                                }
                              />
                              {t.name}
                            </label>
                          ))
                        )}
                        <p className="pa-note">
                          An episode must satisfy both its series and episode
                          restrictions.
                        </p>
                      </div>
                    )}
                    <div className="pa-form-grid">
                      {["releaseAt", "endsAt"].map((k, i) => (
                        <label className="pa-field" key={k}>
                          {i
                            ? "Availability ends · optional"
                            : "Available from · optional"}
                          <input
                            type="datetime-local"
                            value={
                              draft[k]
                                ? new Date(
                                    Date.parse(draft[k]) -
                                      new Date(draft[k]).getTimezoneOffset() *
                                        60000,
                                  )
                                    .toISOString()
                                    .slice(0, 16)
                                : ""
                            }
                            onChange={(e) =>
                              update(
                                k,
                                e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : null,
                              )
                            }
                          />
                        </label>
                      ))}
                      {select("regionMode", "Regions", [
                        "worldwide",
                        "selected",
                      ])}
                      {draft.regionMode === "selected" && (
                        <label className="pa-field">
                          Country codes
                          <input
                            value={draft.regionCodes.join(", ")}
                            onChange={(e) =>
                              update(
                                "regionCodes",
                                e.target.value
                                  .toUpperCase()
                                  .split(",")
                                  .map((x) => x.trim())
                                  .filter(Boolean),
                              )
                            }
                            placeholder="JM"
                          />
                        </label>
                      )}
                      {select("contentOrigin", "Content origin", [
                        "unclassified",
                        "original",
                        "licensed",
                        "development_sample",
                      ])}
                      {text("rightsReference", "Rights / clearance reference")}
                    </div>
                    <label className="pa-check">
                      <input
                        type="checkbox"
                        checked={draft.rightsConfirmed}
                        onChange={(e) =>
                          update("rightsConfirmed", e.target.checked)
                        }
                      />
                      Publishing rights confirmed
                    </label>
                  </>
                ) : (
                  <div className="pa-media-grid">
                    {attachment(
                      "coverMediaVersionId",
                      "Podcast cover",
                      "image",
                    )}
                    {isEpisode && (
                      <>
                        {attachment(
                          "primaryMediaVersionId",
                          draft.format === "audio"
                            ? "Full audio episode"
                            : "Full video episode",
                          draft.format === "audio" ? "audio" : "video",
                        )}
                        {attachment(
                          "previewMediaVersionId",
                          "Guest preview · separate shorter clip",
                          draft.format === "audio" ? "audio" : "video",
                        )}
                      </>
                    )}
                    {attachment(
                      "featureMediaVersionId",
                      "Featured video clip · up to 30 seconds",
                      "video",
                      30,
                    )}
                  </div>
                )}
              </fieldset>
              <div className="pa-actions">
                <button
                  className="pa-button primary"
                  type="submit"
                  disabled={
                    busy ||
                    mediaBusy ||
                    !can("podcasts.write") ||
                    !draft.title.trim()
                  }
                >
                  {busy
                    ? "Saving…"
                    : fresh
                      ? "Create draft & add media"
                      : "Save draft"}
                </button>
                {!fresh && step === 0 && (
                  <button
                    className="pa-button"
                    type="button"
                    onClick={() => setStep(1)}
                  >
                    Artwork & media →
                  </button>
                )}
                {!fresh && (
                  <button
                    className="pa-button"
                    type="button"
                    onClick={() => {
                      setDraft(record.draft);
                      setPane("overview");
                    }}
                  >
                    Discard changes
                  </button>
                )}
              </div>
              <p className="pa-note">
                Save the complete draft before reviewing publication. The
                current public version stays separate.
              </p>
            </form>
          )}
          {pane === "history" && (
            <div className="pa-section">
              <h3>Activity</h3>
              {history.length ? (
                history.map((h: any, i) => (
                  <div className="pa-history" key={i}>
                    <MediaIcon name="review" />
                    <div>
                      <strong>
                        {h.action.replace("podcast.", "").replace(/_/g, " ")}
                      </strong>
                      <p>{h.details?.reason ?? "Saved record change"}</p>
                      <time>{new Date(h.created_at).toLocaleString()}</time>
                    </div>
                  </div>
                ))
              ) : (
                <p>No recorded actions.</p>
              )}
            </div>
          )}
        </>
      )}
      {action && (
        <Modal
          title={
            action === "publish"
              ? "Review saved podcast publication"
              : action[0].toUpperCase() + action.slice(1) + " podcast"
          }
          onClose={() => !busy && setAction("")}
          footer={
            <div className="pa-actions">
              <button
                className="pa-button"
                disabled={busy}
                onClick={() => setAction("")}
              >
                Cancel
              </button>
              <button
                className="pa-button primary"
                disabled={busy || reason.trim().length < 5 || dirty}
                onClick={command}
              >
                {busy ? "Applying…" : "Confirm " + action}
              </button>
            </div>
          }
        >
          <p>{record?.draft.title}</p>
          <p>
            {action === "publish"
              ? "Publish the saved draft. Rights, media readiness, parent publication and access settings are checked by the API."
              : action === "restore"
                ? "Restoring returns this record to draft; it does not publish it."
                : "Series withdrawal also hides its episodes. Historical records and media references are retained."}
          </p>
          <label className="pa-field">
            Reason
            <textarea
              value={reason}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
        </Modal>
      )}
    </div>
  );
}
