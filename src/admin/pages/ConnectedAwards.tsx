import MediaAttachment from "../components/MediaAttachment";
import LoadingState from "../components/LoadingState";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Card, TextField, Modal, EmptyState } from "../ui";
import { PageActions } from "../components/PageHeader";
import StaffAuth from "./StaffAuth";
const blank = {
  title: "",
  year: 2026,
  description: "",
  timezone: "America/Jamaica",
  opensAt: null as string | null,
  closesAt: null as string | null,
  portraitVersionId: null as string | null,
  landscapeVersionId: null as string | null,
  featureMediaVersionId: null as string | null,
  rightsConfirmed: false,
  votePolicy: "final",
  tiePolicy: "joint_winners",
  categories: [] as any[],
};
export default function ConnectedAwards() {
  const { route } = useRouter();
  return <AwardsView key={route.parts[0] ?? "list"} id={route.parts[0]} />;
}
function AwardsView({ id }: { id?: string }) {
  const { navigate, route } = useRouter(),
    isNew = id === "new",
    [session, setSession] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState(blank),
    [items, setItems] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [history, setHistory] = useState<any[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [issues, setIssues] = useState<any[]>([]),
    [action, setAction] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [preview, setPreview] = useState<any>(null);
  const leaving = useRef(false),
    request = useRef<{ payload: string; key: string } | null>(null),
    dirty = record
      ? JSON.stringify(draft) !== JSON.stringify(record.draft)
      : isNew && JSON.stringify(draft) !== JSON.stringify(blank),
    can = (p: string) => session?.permissions.includes(p),
    locked = !!record?.ballotRevisionId || record?.status === "archived";
  useDirtyGuard(() => !!dirty && !leaving.current);
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError) {
        setIssues(e.payload.issues ?? []);
        if (e.status === 401) setSession(null);
      }
    } finally {
      setBusy(false);
    }
  }
  async function load() {
    const s = await api("/admin/session");
    setSession(s);
    if (!s.permissions.includes("awards.read"))
      throw Error("You need awards.read to view Awards.");
    if (id && !isNew) {
      const r = await api("/admin/awards/" + id);
      setRecord(r);
      setDraft(r.draft);
      setHistory((await api("/admin/awards/" + id + "/history")).items);
    } else if (!id) {
      const p = await api("/admin/awards?limit=25");
      setItems(p.items);
      setCursor(p.nextCursor);
    }
  }
  useEffect(() => {
    void run(load).finally(() => setLoaded(true));
  }, []);
  const change = (v: Partial<typeof blank>) => {
    setDraft((d) => ({ ...d, ...v }));
    setIssues([]);
    setNotice("");
  };
  const category = (index: number, v: any) =>
    change({
      categories: draft.categories.map((c, i) =>
        i === index ? { ...c, ...v } : c,
      ),
    });
  const nominee = (ci: number, ni: number, v: any) =>
    category(ci, {
      nominees: draft.categories[ci].nominees.map((n: any, i: number) =>
        i === ni ? { ...n, ...v } : n,
      ),
    });
  async function save() {
    const payload = JSON.stringify(draft);
    if (request.current?.payload !== payload)
      request.current = { payload, key: crypto.randomUUID() };
    const r = await api(
      "/admin/awards" + (isNew ? "" : "/" + id + "/draft"),
      isNew ? "POST" : "PATCH",
      draft,
      record?.version,
      request.current.key,
    );
    setRecord(r);
    setDraft(r.draft);
    request.current = null;
    if (!isNew)
      setHistory((await api("/admin/awards/" + r.id + "/history")).items);
    setNotice("Draft saved.");
    if (isNew) {
      leaving.current = true;
      navigate("/admin/awards/" + r.id + "/overview");
    }
  }
  function slot(
    label: string,
    key: string,
    value: string | null,
    done: (id: string | null) => void,
    video = false,
  ) {
    return <MediaAttachment key={`${record?.id??"new"}:${key}`} label={label} kind={video?"video":"image"} value={value} disabled={busy||locked||!can("awards.write")} canRead={!!can("media.read")} canUpload={!!can("media.upload")} onBusyChange={setBusy} onChange={done}/>;
  }
  const tabs = ["overview", "categories", "nominees", "activity"],
    tab = tabs.includes(route.parts[1]) ? route.parts[1] : "overview";
  if (!loaded)
    return <LoadingState label={<>Loading Awards…</>} variant="table" />;
  if (!session)
    return (
      <>
        <div className="page-pad" role="alert">
          {error}
        </div>
        <StaffAuth onAuthenticated={() => run(load)} />
      </>
    );
  return (
    <div className="page-pad">
      <PageActions>
        <Link className="btn" to="/admin/awards">
          All award programs
        </Link>
        {!id && can("awards.write") && (
          <Link className="btn btn-primary" to="/admin/awards/new/overview">
            Create award program
          </Link>
        )}
        {id && can("awards.write") && (
          <button
            className="btn btn-primary"
            disabled={busy || locked || !dirty}
            onClick={() => void run(save)}
          >
            {busy ? "Working…" : "Save draft"}
          </button>
        )}
      </PageActions>
      {error && (
        <div
          role="alert"
          className="alert alert-danger"
          style={{ marginBottom: 16 }}
        >
          {error}
          <button
            className="btn"
            disabled={busy || !!dirty}
            onClick={() => void run(load)}
          >
            Reload saved records
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {issues.length > 0 && (
        <Card title="Complete before publication">
          <ul>
            {issues.map((v, i) => (
              <li key={i}>
                {v.message} <small>{v.path}</small>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {!id ? (
        items.length ? (
          <div className="scroll-x">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Categories</th>
                  <th>Publication</th>
                  <th>Voting</th>
                  <th>Results</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={"/admin/awards/" + r.id + "/overview"}>
                        {r.draft.title} · {r.draft.year}
                      </Link>
                    </td>
                    <td>{r.draft.categories.length}</td>
                    <td>{r.status}</td>
                    <td>{r.votingState}</td>
                    <td>{r.resultsState}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cursor && (
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const p = await api(
                      "/admin/awards?limit=25&cursor=" +
                        encodeURIComponent(cursor),
                    );
                    setItems((old) => [...old, ...p.items]);
                    setCursor(p.nextCursor);
                  })
                }
              >
                Load more programs
              </button>
            )}
          </div>
        ) : (
          <EmptyState
            title="No award programs"
            body="Create a program to add categories and nominees."
          />
        )
      ) : (
        <>
          <div
            className="route-tabs"
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            {tabs.map((t) => (
              <button
                key={t}
                className={"btn " + (tab === t ? "btn-primary" : "")}
                aria-pressed={tab === t}
                onClick={() => {
                  leaving.current = true;
                  navigate("/admin/awards/" + id + "/" + t);
                  leaving.current = false;
                }}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {record && (
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>
              {record.draft.title}
            </h2>
          )}
          {record && (
            <p style={{ color: "var(--text-secondary)" }}>
              Publication: {record.status} · Voting: {record.votingState} ·
              Results: {record.resultsState} ·{" "}
              {dirty ? "Unsaved changes" : "Saved"}
            </p>
          )}
          {locked && (
            <p role="status">
              {record?.ballotRevisionId
                ? "Voting has opened. Categories, nominees, rules and editorial details are frozen to protect submitted votes."
                : "Restore this archived program before editing."}
            </p>
          )}
          {tab === "overview" && (
            <>
              <Card title="Program details">
                <fieldset
                  disabled={busy || locked || !can("awards.write")}
                  style={{ border: 0, padding: 0, minWidth: 0 }}
                >
                  <TextField
                    label="Program title"
                    value={draft.title}
                    onChange={(e) => change({ title: e.target.value })}
                  />
                  <TextField
                    label="Year"
                    type="number"
                    min="2020"
                    max="2200"
                    value={draft.year}
                    onChange={(e) => change({ year: Number(e.target.value) })}
                  />
                  <label style={{ display: "block", marginBottom: 16 }}>
                    Description
                    <textarea
                      className="input"
                      style={{
                        display: "block",
                        width: "100%",
                        minHeight: 100,
                      }}
                      value={draft.description}
                      onChange={(e) => change({ description: e.target.value })}
                    />
                  </label>
                  <TextField
                    label="Timezone (IANA)"
                    value={draft.timezone}
                    onChange={(e) => change({ timezone: e.target.value })}
                  />
                  {(["opensAt", "closesAt"] as const).map((key) => (
                    <TextField
                      key={key}
                      label={
                        (key === "opensAt" ? "Voting opens" : "Voting closes") +
                        " (UTC, ISO 8601)"
                      }
                      placeholder="2026-11-01T00:00:00Z"
                      value={draft[key] ?? ""}
                      onChange={(e) =>
                        change({ [key]: e.target.value || null })
                      }
                    />
                  ))}
                  <p>
                    Adult customer profiles only. One final vote per
                    account/category. Joint winners for ties. No votes means no
                    winner. Results require manual release with awards.release.
                  </p>
                  <label>
                    <input
                      type="checkbox"
                      checked={draft.rightsConfirmed}
                      onChange={(e) =>
                        change({ rightsConfirmed: e.target.checked })
                      }
                    />{" "}
                    Rights confirmed for program and nominee media
                  </label>
                </fieldset>
              </Card>
              <Card title="Program media">
                {slot(
                  "Portrait artwork",
                  "portrait",
                  draft.portraitVersionId,
                  (v) => change({ portraitVersionId: v }),
                )}
                {slot(
                  "Landscape artwork",
                  "landscape",
                  draft.landscapeVersionId,
                  (v) => change({ landscapeVersionId: v }),
                )}
                {slot(
                  "Hero clip (public MP4, up to 30 seconds)",
                  "feature",
                  draft.featureMediaVersionId,
                  (v) => change({ featureMediaVersionId: v }),
                  true,
                )}
              </Card>
            </>
          )}
          {tab === "categories" && (
            <Card title="Categories">
              <fieldset
                disabled={busy || locked || !can("awards.write")}
                style={{ border: 0, padding: 0, minWidth: 0 }}
              >
                {draft.categories.map((c, i) => (
                  <div
                    key={c.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: 18,
                      marginBottom: 18,
                    }}
                  >
                    <TextField
                      label="Category name"
                      value={c.name}
                      onChange={(e) => category(i, { name: e.target.value })}
                    />
                    <TextField
                      label="Section"
                      value={c.section}
                      onChange={(e) => category(i, { section: e.target.value })}
                    />
                    <TextField
                      label="Category description"
                      value={c.description}
                      onChange={(e) =>
                        category(i, { description: e.target.value })
                      }
                    />
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Remove this category and its draft nominees?",
                          )
                        )
                          change({
                            categories: draft.categories.filter(
                              (x) => x.id !== c.id,
                            ),
                          });
                      }}
                    >
                      Remove category
                    </button>
                  </div>
                ))}
                <button
                  className="btn"
                  disabled={draft.categories.length >= 30}
                  onClick={() =>
                    change({
                      categories: [
                        ...draft.categories,
                        {
                          id: crypto.randomUUID(),
                          name: "",
                          section: "Music",
                          description: "",
                          nominees: [],
                        },
                      ],
                    })
                  }
                >
                  Add category
                </button>
              </fieldset>
            </Card>
          )}
          {tab === "nominees" &&
            draft.categories.map((c, ci) => (
              <Card key={c.id} title={c.name || "Unnamed category"}>
                <fieldset
                  disabled={busy || locked || !can("awards.write")}
                  style={{ border: 0, padding: 0, minWidth: 0 }}
                >
                  {c.nominees.map((n: any, ni: number) => (
                    <div
                      key={n.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        marginBottom: 18,
                        paddingBottom: 18,
                      }}
                    >
                      <TextField
                        label="Nominee name"
                        value={n.name}
                        onChange={(e) =>
                          nominee(ci, ni, { name: e.target.value })
                        }
                      />
                      <TextField
                        label="Subtitle"
                        value={n.subtitle}
                        onChange={(e) =>
                          nominee(ci, ni, { subtitle: e.target.value })
                        }
                      />
                      <TextField
                        label="Nominee description"
                        value={n.description}
                        onChange={(e) =>
                          nominee(ci, ni, { description: e.target.value })
                        }
                      />
                      {slot("Nominee image", n.id, n.imageVersionId, (v) =>
                        nominee(ci, ni, { imageVersionId: v }),
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() =>
                          category(ci, {
                            nominees: c.nominees.filter(
                              (x: any) => x.id !== n.id,
                            ),
                          })
                        }
                      >
                        Remove nominee
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn"
                    disabled={c.nominees.length >= 30}
                    onClick={() =>
                      category(ci, {
                        nominees: [
                          ...c.nominees,
                          {
                            id: crypto.randomUUID(),
                            name: "",
                            subtitle: "",
                            description: "",
                            imageVersionId: null,
                          },
                        ],
                      })
                    }
                  >
                    Add nominee
                  </button>
                </fieldset>
              </Card>
            ))}
          {tab === "activity" && (
            <Card title="Activity history">
              {history.length ? (
                history.map((h, i) => (
                  <p key={i}>
                    {h.action} · {new Date(h.created_at).toLocaleString()}{" "}
                    {h.details?.reason ?? ""}
                  </p>
                ))
              ) : (
                <p>No recorded activity yet.</p>
              )}
            </Card>
          )}
          {record && (
            <Card title="Publication and voting controls">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="btn"
                  disabled={busy || !!dirty}
                  onClick={() =>
                    void run(async () => {
                      const c = await api(
                        "/admin/awards/" + id + "/publication-check",
                      );
                      setIssues(c.issues);
                      setNotice(
                        c.issues.length
                          ? "Publication needs attention."
                          : "Ready to publish.",
                      );
                    })
                  }
                >
                  Check publication
                </button>
                {[
                  "publish",
                  "unpublish",
                  "open-voting",
                  "close-voting",
                  "release-results",
                  "withdraw-results",
                  "archive",
                  "restore",
                ].map((a) => (
                  <button
                    key={a}
                    className="btn"
                    disabled={
                      busy ||
                      !!dirty ||
                      !can(
                        a.includes("results")
                          ? "awards.release"
                          : a === "unpublish"
                            ? "awards.unpublish"
                            : ["archive", "restore"].includes(a)
                              ? "awards.write"
                              : "awards.publish",
                      ) ||
                      (a === "open-voting" &&
                        record.votingState !== "not_open") ||
                      (a === "close-voting" && record.votingState !== "open") ||
                      (a === "release-results" &&
                        (record.votingState !== "closed" ||
                          record.resultsState === "released")) ||
                      (a === "withdraw-results" &&
                        record.resultsState !== "released") ||
                      (a === "restore" && record.status !== "archived") ||
                      (a === "archive" && record.status === "archived")
                    }
                    onClick={() => {
                      setAction(a);
                      setReason("");
                      setConfirmation("");
                      request.current = null;
                      setPreview(null);
                      if (a === "release-results")
                        void run(async () =>
                          setPreview(
                            await api(
                              "/admin/awards/" + id + "/results-preview",
                            ),
                          ),
                        );
                    }}
                  >
                    {a.replace(/-/g, " ")}
                  </button>
                ))}
              </div>
              {!can("awards.release") && (
                <p>
                  Results review and release require the explicit awards.release
                  permission.
                </p>
              )}
            </Card>
          )}
        </>
      )}
      {action && (
        <Modal
          title={action.replace(/-/g, " ")}
          onClose={() => {
            if (!busy) setAction(null);
          }}
          footer={
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setAction(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={
                  busy ||
                  (action !== "publish" && reason.trim().length < 5) ||
                  (action.includes("results") &&
                    confirmation !== record.draft.title) ||
                  (action === "release-results" && !preview)
                }
                onClick={() =>
                  void run(async () => {
                    const body = {
                        revisionId: record.draftRevisionId,
                        ...(action !== "publish" ? { reason } : {}),
                        ...(action.includes("results") ? { confirmation } : {}),
                      },
                      payload = JSON.stringify([action, body, record.version]);
                    if (request.current?.payload !== payload)
                      request.current = { payload, key: crypto.randomUUID() };
                    await api(
                      "/admin/awards/" + id + "/" + action,
                      "POST",
                      body,
                      record.version,
                      request.current.key,
                    );
                    setAction(null);
                    request.current = null;
                    await load();
                    setNotice("Award program updated.");
                  })
                }
              >
                {busy ? "Working…" : "Confirm"}
              </button>
            </>
          }
        >
          <p>
            Review the saved program before confirming. Opening voting
            permanently freezes the ballot. Results remain private until
            released.
          </p>
          {error && <p role="alert">{error}</p>}
          {action !== "publish" && (
            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
          {action.includes("results") && (
            <TextField
              label={"Type the exact program title: " + record.draft.title}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          )}
          {preview && (
            <div>
              <p>Total votes: {preview.totalVotes}</p>
              {preview.categories.map((c: any) => (
                <div key={c.id}>
                  <strong>
                    {c.name} · {c.outcome}
                  </strong>
                  {c.nominees.map((n: any) => (
                    <p key={n.id}>
                      {n.name}: {n.votes}
                      {c.winnerIds.includes(n.id) ? " · winner" : ""}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
