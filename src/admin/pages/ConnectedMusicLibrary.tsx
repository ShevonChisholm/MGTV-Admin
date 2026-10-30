import { useStaffPermissions } from "../api/staff-session-context";
import MediaAttachment from "../components/MediaAttachment";
import LoadingState from "../components/LoadingState";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Card, TextField, Modal } from "../ui";
import StaffAuth from "./StaffAuth";
import MediaIcon from "../components/MediaIcon";
import { ContentStatus } from "../components/ContentVisual";
import {
  libraryTypes,
  LibraryCover,
  LibraryGrid,
  LibraryGridSkeleton,
  LibraryOverview,
  MusicReleaseVisual,
} from "../components/MusicLibraryVisual";
const types = libraryTypes.map((t) => t.id);
const defaults = (kind: string) => ({
  title: "",
  description: "",
  coverMediaVersionId: null,
  musicIds: [],
  ...(kind === "artists"
    ? { origin: "", genre: "" }
    : kind === "albums"
      ? { artistId: null, releaseYear: 2026 }
      : { playlistKind: "audio" }),
});
export default function ConnectedMusicLibrary() {
  const { route } = useRouter();
  const permissions = useStaffPermissions();
  const kind = types.includes(route.parts[0])
    ? route.parts[0]
    : (types.find((t) => permissions?.includes(t + ".read")) ?? "artists");
  return (
    <Editor
      key={kind + ":" + (route.parts[1] ?? "list")}
      kind={kind}
      id={route.parts[1]}
    />
  );
}
function Editor({ kind, id }: { kind: string; id?: string }) {
  const { navigate } = useRouter();
  const [session, setSession] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [r, setR] = useState<any>(null),
    [draft, setDraft] = useState<any>(defaults(kind)),
    [items, setItems] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [music, setMusic] = useState<any[]>([]),
    [artists, setArtists] = useState<any[]>([]),
    [history, setHistory] = useState<any[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [q, setQ] = useState(""),
    [appliedQ, setAppliedQ] = useState(""),
    [pane, setPane] = useState<"overview" | "edit" | "review">(
      id === "new" ? "edit" : "overview",
    ),
    [action, setAction] = useState(""),
    [reason, setReason] = useState(""),
    [progress, setProgress] = useState("");
  const saveKey = useRef<{ body: string; key: string } | null>(null),
    decisionKey = useRef<{ body: string; key: string } | null>(null);
  const leaving = useRef(false);
  const fresh = id === "new",
    base = "/admin/" + kind,
    path = "/admin/music-library/" + kind,
    can = (p: string) => !!session?.permissions.includes(p),
    dirty =
      !!id &&
      JSON.stringify(draft) !== JSON.stringify(r?.draft ?? defaults(kind));
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
    }
  }
  async function all(url: string, key = "cursor") {
    let result: any[] = [];
    let after = "";
    do {
      const page = await api(
        url +
          (url.includes("?") ? "&" : "?") +
          "limit=50" +
          (after ? "&" + key + "=" + encodeURIComponent(after) : ""),
      );
      result.push(...page.items);
      after = page.nextCursor ?? "";
    } while (after);
    return result;
  }
  async function load(after?: string, query = appliedQ) {
    const s = await api("/admin/session");
    setSession(s);
    if (!s.permissions.includes(`${kind}.read`))
      throw Error(`You need ${kind}.read to view this library.`);
    if (!id) {
      const page = await api(
        base +
          "?limit=24&q=" +
          encodeURIComponent(query) +
          (after ? "&after=" + encodeURIComponent(after) : ""),
      );
      setItems((old) => (after ? [...old, ...page.items] : page.items));
      setCursor(page.nextCursor);
      setAppliedQ(query);
      return;
    }
    if (!fresh) {
      const record = await api(base + "/" + id);
      setR(record);
      setDraft(record.draft);
      setHistory((await api(base + "/" + id + "/history")).items);
    }
    const [releases, people] = await Promise.all([
      s.permissions.includes("music.read")
        ? all("/admin/music")
        : Promise.resolve([]),
      kind === "albums" && s.permissions.includes("artists.read")
        ? all("/admin/artists", "after")
        : Promise.resolve([]),
    ]);
    setMusic(releases);
    setArtists(people);
  }
  useEffect(() => {
    void run(() => load()).finally(() => setLoaded(true));
  }, []);
  const change = (patch: any) => setDraft((old: any) => ({ ...old, ...patch }));
  function move(index: number, delta: number) {
    const ids = [...draft.musicIds];
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    change({ musicIds: ids });
  }
  async function save() {
    await run(async () => {
      if (fresh) {
        const serialized = JSON.stringify(draft);
        if (saveKey.current?.body !== serialized)
          saveKey.current = { body: serialized, key: crypto.randomUUID() };
        const made = await api(
          base,
          "POST",
          draft,
          undefined,
          saveKey.current!.key,
        );
        leaving.current = true;
        navigate(path + "/" + made.id);
      } else {
        const saved = await api(
          base + "/" + id + "/draft",
          "PATCH",
          draft,
          r.version,
        );
        setR(saved);
        setDraft(saved.draft);
        setHistory((await api(base + "/" + id + "/history")).items);
        setNotice("Draft saved. Published content is unchanged.");
      }
    });
  }
  if (!loaded)
    return id ? (
      <LoadingState label={<>Loading music library…</>} variant="form" />
    ) : (
      <div className="page-pad music-library-editor">
        <LibraryGridSkeleton />
      </div>
    );
  if (!session)
    return (
      <StaffAuth
        onAuthenticated={async () => {
          await run(load);
        }}
      />
    );
  if (!can(`${kind}.read`))
    return (
      <p className="page-pad" role="alert">
        This library requires the explicit {kind}.read permission.
      </p>
    );
  if (id && !fresh && !r)
    return (
      <div className="page-pad" role="alert">
        <h2>Record unavailable</h2>
        <p>{error || "This item could not be loaded."}</p>
        <button
          className="btn"
          disabled={busy}
          onClick={() => void run(() => load())}
        >
          Try again
        </button>{" "}
        <Link to={path}>Back to {kind}</Link>
      </div>
    );
  const locked = busy || !can(`${kind}.write`) || r?.status === "archived";
  const type = libraryTypes.find((t) => t.id === kind)!;
  return (
    <div className="page-pad music-library-editor">
      <nav className="cv-type-nav" aria-label="Music library sections">
        {libraryTypes
          .filter((t) => session?.permissions.includes(t.id + ".read"))
          .map((t) => (
            <Link
              aria-current={t.id === kind ? "page" : undefined}
              key={t.id}
              to={"/admin/music-library/" + t.id}
            >
              <MediaIcon name={t.icon} size={18} />
              {t.label}
            </Link>
          ))}
      </nav>
      {error && (
        <div role="alert" className="callout">
          {error}{" "}
          <button
            className="btn"
            disabled={busy || dirty}
            onClick={() => void run(() => load())}
          >
            Reload saved data
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {!id ? (
        <>
          <div className="ml-intro">
            <div>
              <span className="cv-kicker">MGTV music library</span>
              <h2>{type.label}</h2>
              <p>{type.description}</p>
            </div>
            <span className="ml-loaded">
              <MediaIcon name="grid" size={17} />
              {items.length} loaded{cursor ? " · more available" : ""}
            </span>
          </div>
          <form
            className="ml-search"
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) void run(() => load(undefined, q));
            }}
          >
            <TextField
              label="Search titles"
              maxLength={160}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn" disabled={busy} type="submit">
              <MediaIcon name="search" size={16} /> Search
            </button>
            {appliedQ && (
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={() => {
                  setQ("");
                  void run(() => load(undefined, ""));
                }}
              >
                Clear search
              </button>
            )}
            {can(`${kind}.write`) && (
              <Link className="btn btn-primary" to={path + "/new"}>
                <MediaIcon name="plus" size={16} /> Create {type.singular}
              </Link>
            )}
          </form>
          {appliedQ && <p className="ml-loaded">Results for “{appliedQ}”</p>}
          <LibraryGrid items={items} kind={kind} path={path} />
          {!items.length && !busy && !error && (
            <div className="ml-empty">
              <MediaIcon name={type.icon} size={34} />
              <h3>
                {appliedQ
                  ? "No matching " + type.label.toLowerCase()
                  : "Your " + type.label.toLowerCase() + " start here"}
              </h3>
              <p>
                {appliedQ
                  ? "Try another title or clear the search."
                  : "Create a draft and give it a cover, a story and linked music."}
              </p>
            </div>
          )}
          {cursor && (
            <button
              className="btn"
              disabled={busy}
              onClick={() => void run(() => load(cursor))}
            >
              Load more
            </button>
          )}
        </>
      ) : (
        <>
          <Link className="btn" to={path}>
            <MediaIcon name="back" size={16} /> Back to {kind}
          </Link>
          {!fresh && (
            <>
              <div className="ml-editor-state">
                <ContentStatus status={r.status} />
                <span>
                  {dirty
                    ? "Unsaved changes · overview shows the saved revision"
                    : "Saved revision " + r.version}
                </span>
              </div>
              <nav className="cv-detail-nav" aria-label="Record views">
                {(["overview", "edit", "review"] as const).map((v) => (
                  <button
                    key={v}
                    aria-pressed={pane === v}
                    onClick={() => setPane(v)}
                  >
                    <MediaIcon
                      name={
                        v === "overview"
                          ? type.icon
                          : v === "edit"
                            ? "edit"
                            : "review"
                      }
                      size={17}
                    />
                    {v === "overview"
                      ? "Overview"
                      : v === "edit"
                        ? "Edit draft"
                        : "Review & publish"}
                  </button>
                ))}
              </nav>
              <div hidden={pane !== "overview"}>
                <LibraryOverview
                  record={r}
                  kind={kind}
                  music={music}
                  artists={artists}
                  canReadMusic={can("music.read")}
                  canEdit={can(`${kind}.write`) && r.status !== "archived"}
                  onEdit={() => setPane("edit")}
                />
              </div>
            </>
          )}
          <div
            className="editor-layout"
            style={{ marginTop: 16 }}
            hidden={!fresh && pane === "overview"}
          >
            <div style={{ minWidth: 0 }} hidden={pane !== "edit"}>
              <Card title="Details">
                <fieldset
                  disabled={locked}
                  style={{ border: 0, padding: 0, minWidth: 0 }}
                >
                  <TextField
                    label="Title"
                    value={draft.title}
                    maxLength={160}
                    onChange={(e) => change({ title: e.target.value })}
                  />
                  <TextField
                    label={kind === "artists" ? "Biography" : "Description"}
                    multiline
                    rows={5}
                    value={draft.description}
                    maxLength={6000}
                    onChange={(e) => change({ description: e.target.value })}
                  />
                  {kind === "artists" && (
                    <>
                      <TextField
                        label="Origin"
                        value={draft.origin}
                        maxLength={160}
                        onChange={(e) => change({ origin: e.target.value })}
                      />
                      <TextField
                        label="Genre"
                        value={draft.genre}
                        maxLength={160}
                        onChange={(e) => change({ genre: e.target.value })}
                      />
                    </>
                  )}
                  {kind === "albums" && (
                    <>
                      <label className="library-field">
                        Artist
                        <select
                          className="input"
                          value={draft.artistId ?? ""}
                          disabled={!can("artists.read")}
                          onChange={(e) =>
                            change({ artistId: e.target.value || null })
                          }
                        >
                          <option value="">Choose an artist</option>
                          {draft.artistId &&
                            !artists.some((a) => a.id === draft.artistId) && (
                              <option value={draft.artistId}>
                                Linked artist · details unavailable
                              </option>
                            )}
                          {artists.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.body.title} · {a.status}
                            </option>
                          ))}
                        </select>
                      </label>
                      <TextField
                        label="Release year"
                        type="number"
                        min={1900}
                        max={2200}
                        value={draft.releaseYear ?? ""}
                        onChange={(e) =>
                          change({
                            releaseYear: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                      />
                    </>
                  )}
                  {kind === "playlists" && (
                    <label className="library-field">
                      Format
                      <select
                        className="input"
                        value={draft.playlistKind}
                        onChange={(e) =>
                          change({ playlistKind: e.target.value, musicIds: [] })
                        }
                      >
                        <option value="audio">Tracks</option>
                        <option value="video">Music videos</option>
                      </select>
                    </label>
                  )}
                </fieldset>
              </Card>
              <Card title="Cover artwork">
                {r &&
                  draft.coverMediaVersionId === r.draft.coverMediaVersionId &&
                  draft.coverMediaVersionId && (
                    <img
                      style={{
                        width: 180,
                        maxWidth: "100%",
                        aspectRatio: "1",
                        objectFit: "cover",
                        borderRadius: kind === "artists" ? "50%" : 10,
                      }}
                      src={
                        "/api/v1" + base + "/" + id + "/cover?v=" + r.version
                      }
                      alt="Saved cover artwork"
                      referrerPolicy="same-origin"
                    />
                  )}
                <p className="ml-review-note">
                  Choose artwork from a release or the Media Library. A new
                  selection is attached only when you save the draft.
                </p>
                <label className="library-field">
                  Use existing release artwork
                  <select
                    className="input"
                    value=""
                    disabled={locked || !can("music.read")}
                    onChange={(e) => {
                      const release = music.find(
                        (m) => m.id === e.target.value,
                      );
                      if (release) {
                        change({
                          coverMediaVersionId:
                            release.draft.artwork.portraitVersionId,
                        });
                        setProgress(
                          "Artwork selected. Save the draft to verify the attachment.",
                        );
                      }
                    }}
                  >
                    <option value="">Choose artwork from a release</option>
                    {music
                      .filter((m) => m.draft?.artwork?.portraitVersionId)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.draft.title}
                        </option>
                      ))}
                  </select>
                </label>
                {progress && (
                  <p role="status" className="ml-review-note">
                    {progress}
                  </p>
                )}
                <MediaAttachment
                  key={id}
                  label="Cover artwork"
                  kind="image"
                  value={draft.coverMediaVersionId}
                  disabled={locked}
                  canRead={!!can("media.read")}
                  canUpload={!!can("media.upload")}
                  onBusyChange={setBusy}
                  onChange={(v) => change({ coverMediaVersionId: v })}
                />
              </Card>
              <Card
                title={kind === "albums" ? "Track listing" : "Linked music"}
              >
                <fieldset
                  disabled={locked}
                  style={{ border: 0, padding: 0, minWidth: 0 }}
                >
                  <label className="library-field">
                    Add a release
                    <select
                      className="input"
                      value=""
                      disabled={!can("music.read")}
                      onChange={(e) => {
                        if (e.target.value)
                          change({
                            musicIds: [...draft.musicIds, e.target.value],
                          });
                      }}
                    >
                      <option value="">Choose music</option>
                      {music
                        .filter(
                          (m) =>
                            !draft.musicIds.includes(m.id) &&
                            (kind === "artists" ||
                              (m.draft?.musicKind ?? m.musicKind) ===
                                (kind === "albums" ||
                                draft.playlistKind === "audio"
                                  ? "track"
                                  : "music-video")),
                        )
                        .map((m) => (
                          <option value={m.id} key={m.id}>
                            {m.draft?.title ?? m.title} · {m.status}
                          </option>
                        ))}
                    </select>
                  </label>
                  <ol className="ml-releases">
                    {draft.musicIds.map((mid: string, index: number) => {
                      const m = music.find((m) => m.id === mid);
                      return (
                        <li key={mid}>
                          <span className="ml-position">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <MusicReleaseVisual record={m} />
                          <div className="ml-release-copy">
                            <strong>
                              {m?.draft?.title ??
                                (can("music.read")
                                  ? "Unavailable release"
                                  : "Linked release")}
                            </strong>
                            <small>
                              {m
                                ? [
                                    m.draft?.artist,
                                    m.draft?.musicKind === "track"
                                      ? "Audio track"
                                      : "Music video",
                                    m.status,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")
                                : "Reference retained"}
                            </small>
                          </div>
                          <div className="ml-reorder">
                            <button
                              type="button"
                              className="btn btn-sm ml-up"
                              disabled={locked || index === 0}
                              onClick={() => move(index, -1)}
                              aria-label={"Move item " + (index + 1) + " up"}
                              title="Move up"
                            >
                              <MediaIcon name="arrow" size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm ml-down"
                              disabled={
                                locked || index === draft.musicIds.length - 1
                              }
                              onClick={() => move(index, 1)}
                              aria-label={"Move item " + (index + 1) + " down"}
                              title="Move down"
                            >
                              <MediaIcon name="arrow" size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm"
                              disabled={locked}
                              onClick={() =>
                                change({
                                  musicIds: draft.musicIds.filter(
                                    (x: string) => x !== mid,
                                  ),
                                })
                              }
                              aria-label={"Remove item " + (index + 1)}
                              title="Remove from collection"
                            >
                              <MediaIcon name="trash" size={16} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  {!draft.musicIds.length && (
                    <div className="ml-empty">
                      <MediaIcon name="audio" size={28} />
                      <p>No releases linked. Choose music above to start.</p>
                    </div>
                  )}
                  {!can("music.read") && (
                    <p className="ml-review-note">
                      Linked references are preserved. Music read permission is
                      required to browse additional releases.
                    </p>
                  )}
                </fieldset>
              </Card>
              <Card title="Activity history">
                <ol className="ml-history">
                  {history.map((h) => (
                    <li key={h.id}>
                      <MediaIcon name="clock" size={18} />
                      <div>
                        <strong>{h.action.replace(/[._]/g, " ")}</strong>
                        {h.details?.reason && <p>{h.details.reason}</p>}
                        <small>{new Date(h.created_at).toLocaleString()}</small>
                      </div>
                    </li>
                  ))}
                </ol>
                {!history.length && <p>No activity yet.</p>}
              </Card>
            </div>
            <aside
              className={pane === "review" ? "ml-review-panels" : undefined}
              style={{
                minWidth: 0,
                ...(pane === "review" ? { gridColumn: "1 / -1" } : {}),
              }}
            >
              {pane === "review" && (
                <Card title="Review saved revision">
                  <LibraryCover
                    record={r}
                    kind={kind}
                    className="ml-review-cover"
                  />
                  <h3>{r.draft.title || "Untitled"}</h3>
                  <p className="ml-review-note">
                    {dirty
                      ? "Unsaved changes exist. Save the draft before making a publication decision."
                      : "Decisions apply to the saved revision shown here. The server validates cover artwork, linked releases and permissions."}
                  </p>
                </Card>
              )}
              <Card
                title={pane === "review" ? "Publication" : "Draft controls"}
              >
                <p>
                  {r?.status ?? "New draft"} ·{" "}
                  {dirty ? "Unsaved changes" : "Saved"}
                </p>
                <button
                  className="btn btn-primary"
                  disabled={locked || (!fresh && !dirty)}
                  onClick={() => void save()}
                >
                  Save draft
                </button>
                {!fresh && pane === "review" && (
                  <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                    {["publish", "unpublish", "archive", "restore"].map((a) => (
                      <button
                        key={a}
                        className="btn"
                        disabled={
                          busy ||
                          dirty ||
                          (a === "publish"
                            ? !can(`${kind}.publish`) ||
                              r?.status === "archived"
                            : a === "unpublish"
                              ? !can(`${kind}.unpublish`) ||
                                r?.status !== "published"
                              : a === "restore"
                                ? !can(`${kind}.write`) ||
                                  r?.status !== "archived"
                                : !can(`${kind}.write`) ||
                                  r?.status === "archived" ||
                                  (r?.status === "published" &&
                                    !can(`${kind}.unpublish`)))
                        }
                        onClick={() => {
                          setAction(a);
                          setReason("");
                        }}
                      >
                        {a[0].toUpperCase() + a.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
                {!fresh && pane === "edit" && (
                  <button
                    className="btn"
                    style={{ marginTop: 12 }}
                    onClick={() => setPane("review")}
                  >
                    <MediaIcon name="review" size={16} /> Review & publish
                  </button>
                )}
                <p>
                  Save and review before publishing. Linked releases must be
                  published; their playback permissions remain unchanged.
                </p>
              </Card>
            </aside>
          </div>
        </>
      )}
      {action && (
        <Modal
          title={
            action[0].toUpperCase() + action.slice(1) + " " + kind.slice(0, -1)
          }
          onClose={() => {
            if (!busy) setAction("");
          }}
          footer={
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setAction("")}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                disabled={busy || !reason.trim()}
                onClick={() =>
                  void run(async () => {
                    const serialized = JSON.stringify([
                      id,
                      action,
                      r.version,
                      reason,
                      r.draft_revision_id,
                    ]);
                    if (decisionKey.current?.body !== serialized)
                      decisionKey.current = {
                        body: serialized,
                        key: crypto.randomUUID(),
                      };
                    const saved = await api(
                      base + "/" + id + "/" + action,
                      "POST",
                      {
                        reason,
                        ...(action === "publish"
                          ? { revisionId: r.draft_revision_id }
                          : {}),
                      },
                      r.version,
                      decisionKey.current!.key,
                    );
                    setR(saved);
                    setDraft(saved.draft);
                    setAction("");
                    setHistory((await api(base + "/" + id + "/history")).items);
                    setNotice("Decision saved.");
                  })
                }
              >
                Confirm
              </button>
            </>
          }
        >
          <TextField
            label="Reason"
            multiline
            value={reason}
            maxLength={1000}
            onChange={(e) => setReason(e.target.value)}
          />
          {error && <p role="alert">{error}</p>}
        </Modal>
      )}
    </div>
  );
}
