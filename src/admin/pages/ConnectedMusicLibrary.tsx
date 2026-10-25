import MediaAttachment from "../components/MediaAttachment";
import LoadingState from "../components/LoadingState";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Card, TextField, Modal } from "../ui";
import StaffAuth from "./StaffAuth";
const types = ["artists", "albums", "playlists"];
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
  const kind = types.includes(route.parts[0]) ? route.parts[0] : "artists";
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
  async function load(after?: string) {
    const s = await api("/admin/session");
    setSession(s);
    if (!s.permissions.includes(`${kind}.read`))
      throw Error("You need content.read to view the music library.");
    if (!id) {
      const page = await api(
        base +
          "?limit=30&q=" +
          encodeURIComponent(q) +
          (after ? "&after=" + encodeURIComponent(after) : ""),
      );
      setItems((old) => (after ? [...old, ...page.items] : page.items));
      setCursor(page.nextCursor);
      return;
    }
    if (!fresh) {
      const record = await api(base + "/" + id);
      setR(record);
      setDraft(record.draft);
      setHistory((await api(base + "/" + id + "/history")).items);
    }
    setMusic(await all("/admin/music"));
    if (kind === "albums") setArtists(await all("/admin/artists", "after"));
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
    return <LoadingState label={<>Loading music library…</>} variant="table" />;
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
        Music library access requires content.read.
      </p>
    );
  const locked = busy || !can(`${kind}.write`) || r?.status === "archived";
  return (
    <div className="page-pad music-library-editor">
      <nav
        aria-label="Music library sections"
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}
      >
        {types.map((t) => (
          <Link
            className={"btn " + (t === kind ? "btn-primary" : "")}
            key={t}
            to={"/admin/music-library/" + t}
          >
            {t[0].toUpperCase() + t.slice(1)}
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
          <div className="toolbar">
            <TextField
              label="Search titles"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              className="btn"
              disabled={busy}
              onClick={() => void run(() => load())}
            >
              Search
            </button>
            {can(`${kind}.write`) && (
              <Link className="btn btn-primary" to={path + "/new"}>
                Create {kind.slice(0, -1)}
              </Link>
            )}
          </div>
          <Card title={kind[0].toUpperCase() + kind.slice(1)}>
            <div className="scroll-x">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Saved revision</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link to={path + "/" + item.id}>
                          {item.body.title || "Untitled"}
                        </Link>
                      </td>
                      <td>{item.status}</td>
                      <td>{item.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!items.length && !busy && !error && (
              <p>No records match this view.</p>
            )}
          </Card>
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
          <Link to={path}>← Back to {kind}</Link>
          <div className="editor-layout" style={{ marginTop: 16 }}>
            <div style={{ minWidth: 0 }}>
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
                          onChange={(e) =>
                            change({ artistId: e.target.value || null })
                          }
                        >
                          <option value="">Choose an artist</option>
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
                      src={"/api/v1" + base + "/" + id + "/cover"}
                    />
                  )}
                <label className="library-field">
                  Use existing release artwork
                  <select
                    className="input"
                    value=""
                    disabled={locked}
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
                <MediaAttachment key={id} label="Cover artwork" kind="image" value={draft.coverMediaVersionId} disabled={locked} canRead={!!can("media.read")} canUpload={!!can("media.upload")} onBusyChange={setBusy} onChange={v=>change({coverMediaVersionId:v})}/>
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
                  <ol style={{ paddingLeft: 20 }}>
                    {draft.musicIds.map((mid: string, index: number) => (
                      <li
                        key={mid}
                        style={{ marginBottom: 10, overflowWrap: "anywhere" }}
                      >
                        {music.find((m) => m.id === mid)?.draft?.title ??
                          music.find((m) => m.id === mid)?.title ??
                          "Unavailable release"}{" "}
                        <span
                          style={{
                            display: "inline-flex",
                            flexWrap: "wrap",
                            gap: 4,
                          }}
                        >
                          <button
                            className="btn btn-sm"
                            disabled={locked || index === 0}
                            onClick={() => move(index, -1)}
                            aria-label={"Move item " + (index + 1) + " up"}
                          >
                            Up
                          </button>
                          <button
                            className="btn btn-sm"
                            disabled={
                              locked || index === draft.musicIds.length - 1
                            }
                            onClick={() => move(index, 1)}
                            aria-label={"Move item " + (index + 1) + " down"}
                          >
                            Down
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() =>
                              change({
                                musicIds: draft.musicIds.filter(
                                  (x: string) => x !== mid,
                                ),
                              })
                            }
                          >
                            Remove
                          </button>
                        </span>
                      </li>
                    ))}
                  </ol>
                </fieldset>
              </Card>
              <Card title="Activity history">
                {history.map((h) => (
                  <div key={h.id} style={{ marginBottom: 12 }}>
                    <strong>{h.action}</strong>
                    <p>{h.details.reason}</p>
                    <small>{new Date(h.created_at).toLocaleString()}</small>
                  </div>
                ))}
                {!history.length && <p>No activity yet.</p>}
              </Card>
            </div>
            <aside style={{ minWidth: 0 }}>
              <Card title="Publication">
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
                {!fresh && (
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
