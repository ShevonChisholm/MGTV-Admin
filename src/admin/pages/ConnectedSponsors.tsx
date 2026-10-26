import SponsorPreview from "../components/SponsorPreview";
import MediaAttachment from "../components/MediaAttachment";
import LoadingState from "../components/LoadingState";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import {
  Card,
  TextField,
  SelectField,
  Modal,
  EmptyState,
  ConfirmDialog,
} from "../ui";
import { PageActions } from "../components/PageHeader";
import { Toolbar, Note } from "../ui/ops";
import ContactsEditor from "../ui/Contacts";
import StaffAuth from "./StaffAuth";
const blank = {
  name: "",
  description: "",
  website: "",
  contacts: [] as any[],
  brandAssets: [] as any[],
  publicAssetId: null as string | null,
  storyImageVersionId: null as string | null,
  storyImageAlt: "",
  showIds: [] as string[],
  eventIds: [] as string[],
  rightsConfirmed: false,
};
const tabs = [
    { id: "details", label: "Details" },
    { id: "contacts", label: "Contacts" },
    { id: "assets", label: "Brand assets" },
    { id: "associations", label: "Shows & events" },
    { id: "activity", label: "Activity" },
  ],
  assetKinds = [
    { value: "logo_light", label: "Logo for light backgrounds" },
    { value: "logo_dark", label: "Logo for dark backgrounds" },
    { value: "brand_mark", label: "Brand mark" },
  ];
export default function ConnectedSponsors() {
  const { route } = useRouter();
  return <SponsorView key={route.parts[0] ?? "list"} id={route.parts[0]} />;
}
function SponsorView({ id }: { id?: string }) {
  const { route, navigate } = useRouter(),
    isNew = id === "new",
    tab = tabs.some((t) => t.id === route.parts[1])
      ? route.parts[1]
      : "details";
  const [session, setSession] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState(blank),
    [items, setItems] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [history, setHistory] = useState<any[]>([]),
    [shows, setShows] = useState<any[]>([]),
    [events, setEvents] = useState<any[]>([]),
    [targetsError, setTargetsError] = useState(""),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [issues, setIssues] = useState<any[]>([]),
    [action, setAction] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [asset, setAsset] = useState<any>(null),
    [assetProgress, setAssetProgress] = useState(""),
    [remove, setRemove] = useState<any>(null);
  const leaving = useRef(false),
    requestKey = useRef<{ body: string; key: string } | null>(null),
    alert = useRef<HTMLDivElement>(null),
    can = (p: string) => !!session?.permissions.includes(p),
    dirty = record
      ? JSON.stringify(draft) !== JSON.stringify(record.draft)
      : isNew && JSON.stringify(draft) !== JSON.stringify(blank);
  useDirtyGuard(() => !!dirty && !leaving.current);
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setIssues([]);
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError) {
        setIssues(e.payload.issues ?? []);
        if (e.status === 401) setSession(null);
      }
      setTimeout(() => alert.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }
  function query(after?: string) {
    return (
      "?" +
      new URLSearchParams({
        q,
        status,
        limit: "25",
        ...(after ? { cursor: after } : {}),
      })
    );
  }
  async function targets(permissions: string[] = session?.permissions ?? []) {
    setTargetsError("");
    try {
      async function all(path: string) {
        const result = [];
        let cursor: string | null = null;
        do {
          const p = await api(
            path +
              "?limit=50" +
              (cursor ? "&cursor=" + encodeURIComponent(cursor) : ""),
          );
          result.push(...p.items);
          cursor = p.nextCursor;
        } while (cursor);
        return result;
      }
      const [s, e] = await Promise.all([
        permissions.includes("shows.read")
          ? all("/admin/shows")
          : Promise.resolve([]),
        permissions.includes("events.read")
          ? all("/admin/events")
          : Promise.resolve([]),
      ]);
      setShows(s);
      setEvents(e);
    } catch (e) {
      setTargetsError((e as Error).message);
    }
  }
  async function load() {
    const s = await api("/admin/session");
    setSession(s);
    if (!s.permissions.includes("sponsors.read"))
      throw Error(
        "You need sponsors.read to view sponsor organizations and contacts.",
      );
    if (id && !isNew) {
      const r = await api("/admin/sponsors/" + id);
      setRecord(r);
      setDraft(r.draft);
      setHistory((await api("/admin/sponsors/" + id + "/history")).items);
    } else if (!id) {
      const p = await api("/admin/sponsors" + query());
      setItems(p.items);
      setCursor(p.nextCursor);
    }
    if (
      id &&
      ["shows.read", "events.read"].some((p) => s.permissions.includes(p))
    )
      await targets(s.permissions);
  }
  useEffect(() => {
    void run(load).finally(() => setLoaded(true));
  }, []);
  function change(v: Partial<typeof blank>) {
    setDraft((d) => ({ ...d, ...v }));
    setNotice("");
    setIssues([]);
  }
  async function save() {
    const body = JSON.stringify(draft);
    if (requestKey.current?.body !== body)
      requestKey.current = { body, key: crypto.randomUUID() };
    const r = await api(
      "/admin/sponsors" + (isNew ? "" : "/" + id + "/draft"),
      isNew ? "POST" : "PATCH",
      draft,
      record?.version,
      requestKey.current.key,
    );
    setRecord(r);
    setDraft(r.draft);
    requestKey.current = null;
    setNotice(
      "Sponsor draft saved. Publish separately to update customer pages.",
    );
    if (isNew) {
      leaving.current = true;
      navigate("/admin/sponsors/" + r.id + "/contacts");
    } else setHistory((await api("/admin/sponsors/" + id + "/history")).items);
  }
  if (!loaded)
    return <LoadingState label={<>Loading sponsors…</>} variant="table" />;
  if (!session)
    return (
      <>
        <div className="page-pad" role="alert">
          {error}
        </div>
        <StaffAuth onAuthenticated={() => run(load)} />
      </>
    );
  if (!can("sponsors.read"))
    return (
      <div className="page-pad">
        <EmptyState
          title="Sponsor access is restricted"
          body="Your staff account needs sponsors.read to view organizations, private contacts and brand assets."
        />
      </div>
    );
  if (id && !isNew && !record)
    return (
      <div className="page-pad">
        <p role="alert">{error || "Sponsor not found."}</p>
        <Link className="btn" to="/admin/sponsors">
          Back to sponsors
        </Link>
      </div>
    );
  return (
    <div className="page-pad">
      <PageActions>
        {id ? (
          <>
            <Link className="btn" to="/admin/sponsors">
              ← All sponsors
            </Link>
            <span
              role="status"
              style={{
                fontSize: 12.5,
                alignSelf: "center",
                color: dirty ? "var(--yellow)" : "var(--text-muted)",
              }}
            >
              {dirty ? "Unsaved changes" : "All changes saved"}
            </span>
            <button
              className="btn"
              disabled={!dirty || busy}
              onClick={() => change(record?.draft ?? blank)}
            >
              Discard
            </button>
            <button
              className="btn btn-primary"
              disabled={!can("sponsors.manage") || busy || !dirty}
              onClick={() => void run(save)}
            >
              {busy ? "Working…" : isNew ? "Create sponsor" : "Save draft"}
            </button>
          </>
        ) : (
          can("sponsors.manage") && (
            <Link to="/admin/sponsors/new/details" className="btn btn-primary">
              Add sponsor
            </Link>
          )
        )}
      </PageActions>
      {error && (
        <div
          role="alert"
          ref={alert}
          tabIndex={-1}
          style={{ marginBottom: 16, color: "var(--red)" }}
        >
          {error}{" "}
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
            {issues.map((i, n) => (
              <li key={n}>{i.message}</li>
            ))}
          </ul>
        </Card>
      )}
      {!id ? (
        <>
          <Toolbar>
            <div style={{ flex: "1 1 220px" }}>
              <TextField
                label="Search sponsors"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Organization name"
              />
            </div>
            <SelectField
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={["active", "inactive"]}
              placeholder="All statuses"
            />
            <button
              className="btn"
              disabled={busy}
              onClick={() => void run(load)}
            >
              Apply filters
            </button>
          </Toolbar>
          {items.length ? (
            <div
              className="scroll-x"
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "var(--card)",
              }}
            >
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Sponsor</th>
                    <th>Status</th>
                    <th>Publication</th>
                    <th>Contacts</th>
                    <th>Shows</th>
                    <th>Events</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link
                          to={"/admin/sponsors/" + r.id + "/details"}
                          style={{
                            display: "inline-block",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {r.draft.name}
                        </Link>
                      </td>
                      <td>{r.status}</td>
                      <td>{r.publicationStatus}</td>
                      <td>{r.draft.contacts.length}</td>
                      <td>{r.draft.showIds.length}</td>
                      <td>{r.draft.eventIds.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No sponsors match"
              body="Clear the filters or add a sponsor organization."
            />
          )}
          {cursor && (
            <button
              className="btn"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const p = await api("/admin/sponsors" + query(cursor));
                  setItems((old) => [...old, ...p.items]);
                  setCursor(p.nextCursor);
                })
              }
            >
              Load more sponsors
            </button>
          )}
        </>
      ) : (
        <>
          {!isNew && (
            <>
              <h2 style={{ fontSize: 22 }}>{record?.draft.name}</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Organization: {record?.status} · Publication:{" "}
                {record?.publicationStatus}
              </p>
              <div
                role="group"
                aria-label="Sponsor sections"
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    className={"btn " + (tab === t.id ? "btn-primary" : "")}
                    aria-pressed={tab === t.id}
                    onClick={() => {
                      leaving.current = true;
                      navigate("/admin/sponsors/" + id + "/" + t.id);
                      leaving.current = false;
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
          {(isNew || tab === "details") && (
            <>
              <Card title="Organization">
                <fieldset
                  disabled={busy || !can("sponsors.manage")}
                  style={{ border: 0, padding: 0, minWidth: 0 }}
                >
                  <div style={{ display: "grid", gap: 14, maxWidth: 640 }}>
                    <TextField
                      label="Organization name"
                      required
                      value={draft.name}
                      onChange={(e) => change({ name: e.target.value })}
                    />
                    <label>
                      Description
                      <textarea
                        className="input"
                        style={{
                          display: "block",
                          width: "100%",
                          minHeight: 110,
                        }}
                        value={draft.description}
                        onChange={(e) =>
                          change({ description: e.target.value })
                        }
                      />
                    </label>
                    <TextField
                      label="Website"
                      type="url"
                      placeholder="https://"
                      value={draft.website}
                      onChange={(e) => change({ website: e.target.value })}
                    />
                    <label>
                      <input
                        type="checkbox"
                        checked={draft.rightsConfirmed}
                        onChange={(e) =>
                          change({ rightsConfirmed: e.target.checked })
                        }
                      />{" "}
                      Permission confirmed to display this organization’s
                      branding and story artwork
                    </label>
                  </div>
                </fieldset>
              </Card>
              <Note>
                Contacts stay private. Only a published name, description,
                website, selected public logo and reviewed story image appear
                under “Supported by” on published shows and events.
              </Note>
            </>
          )}
          {!isNew && tab === "contacts" && (
            <Card title="Contacts">
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Private staff information. Save the draft after making changes.
              </p>
              <ContactsEditor
                contacts={draft.contacts}
                disabled={busy || !can("sponsors.manage")}
                onChange={(contacts) =>
                  change({
                    contacts: contacts.map((c) => ({
                      ...c,
                      id: /^[0-9a-f-]{36}$/i.test(c.id)
                        ? c.id
                        : crypto.randomUUID(),
                    })),
                  })
                }
              />
            </Card>
          )}
          {!isNew && tab === "assets" && (
            <Card
              title="Brand assets"
              aside={
                <button
                  className="btn btn-primary btn-sm"
                  disabled={
                    busy ||
                    !can("sponsors.manage") ||
                    draft.brandAssets.length >= 30
                  }
                  onClick={() => {
                    setAsset({
                      id: crypto.randomUUID(),
                      label: "",
                      kind: "logo_dark",
                      mediaVersionId: "",
                    });
                    setAssetProgress("");
                  }}
                >
                  Add brand asset
                </button>
              }
            >
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Upload a real logo or brand mark, then save the sponsor draft.
                Historical references retain their files.
              </p>
              {draft.brandAssets.length ? (
                <>
                  <div style={{ display: "grid", gap: 12 }}>
                    {draft.brandAssets.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          display: "flex",
                          gap: 16,
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: 12,
                        }}
                      >
                        {record?.draft.brandAssets.some(
                          (x: any) => x.mediaVersionId === a.mediaVersionId,
                        ) && (
                          <img
                            src={
                              "/api/v1/admin/sponsors/" +
                              id +
                              "/assets/" +
                              a.mediaVersionId
                            }
                            alt={a.label}
                            style={{
                              width: 160,
                              maxWidth: "100%",
                              height: 64,
                              objectFit: "contain",
                              background: "#141414",
                              borderRadius: 6,
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <strong>{a.label}</strong>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {assetKinds.find((k) => k.value === a.kind)?.label}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-sm"
                            disabled={busy || !can("sponsors.manage")}
                            onClick={() => {
                              setAsset({ ...a });
                              setAssetProgress("");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm"
                            disabled={busy || !can("sponsors.manage")}
                            onClick={() => setRemove(a)}
                          >
                            Remove…
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <label style={{ display: "grid", gap: 6, marginTop: 18 }}>
                    Public logo
                    <select
                      aria-label="Public logo"
                      className="input"
                      value={draft.publicAssetId ?? ""}
                      disabled={busy || !can("sponsors.manage")}
                      onChange={(e) =>
                        change({ publicAssetId: e.target.value || null })
                      }
                    >
                      <option value="">
                        Choose the logo customers will see
                      </option>
                      {draft.brandAssets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold">
                      Sponsor story artwork
                    </h3>
                    <p className="text-sm text-muted">
                      Optional editorial imagery sits beside the approved logo
                      on full credits. Saving keeps it private; publish the
                      reviewed sponsor revision to make it visible.
                    </p>
                    <MediaAttachment
                      label="Sponsor story image"
                      kind="image"
                      value={draft.storyImageVersionId}
                      disabled={busy || !can("sponsors.manage")}
                      canRead={!!can("media.read")}
                      canUpload={!!can("media.upload")}
                      onBusyChange={setBusy}
                      onChange={(value) =>
                        change({
                          storyImageVersionId: value,
                          storyImageAlt: value ? draft.storyImageAlt : "",
                          ...(value && value !== draft.storyImageVersionId
                            ? { rightsConfirmed: false }
                            : {}),
                        })
                      }
                    />
                    <TextField
                      label="Public story image alternative text"
                      value={draft.storyImageAlt}
                      maxLength={500}
                      disabled={busy || !can("sponsors.manage")}
                      onChange={(e) =>
                        change({ storyImageAlt: e.target.value })
                      }
                    />
                  </div>
                  {draft.storyImageVersionId && (
                    <label className="mt-4 flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.rightsConfirmed}
                        disabled={busy || !can("sponsors.manage")}
                        onChange={(e) =>
                          change({ rightsConfirmed: e.target.checked })
                        }
                      />
                      Permission confirmed for the selected public branding and
                      story artwork
                    </label>
                  )}
                  <SponsorPreview draft={draft} record={record} />
                </>
              ) : (
                <EmptyState
                  title="No brand assets yet"
                  body="Add a verified logo or brand mark, then choose the one customers will see."
                />
              )}
            </Card>
          )}
          {!isNew && tab === "associations" && (
            <>
              {record?.status === "inactive" && (
                <Note tone="warn">
                  This sponsor is inactive. Existing links remain; reactivate it
                  before adding more. Reactivation does not republish branding.
                </Note>
              )}
              {!["shows.read", "events.read"].some((p) => can(p)) ? (
                <Note>
                  Content browsing permission is required to manage show and
                  event associations.
                </Note>
              ) : (
                <>
                  {targetsError && (
                    <p role="alert">
                      {targetsError}
                      <button className="btn" onClick={() => void targets()}>
                        Reload shows and events
                      </button>
                    </p>
                  )}
                  <div className="grid-2">
                    {[
                      {
                        kind: "showIds" as const,
                        label: "Shows",
                        rows: shows,
                        url: "/admin/content/shows/",
                      },
                      {
                        kind: "eventIds" as const,
                        label: "Events",
                        rows: events,
                        url: "/admin/events/",
                      },
                    ].map((group) => (
                      <Card key={group.kind} title={group.label}>
                        {group.rows.length ? (
                          group.rows.map((target) => {
                            const chosen = draft[group.kind].includes(
                              target.id,
                            );
                            return (
                              <div
                                key={target.id}
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  alignItems: "center",
                                  padding: "8px 0",
                                  flexWrap: "wrap",
                                }}
                              >
                                <label
                                  style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "center",
                                    flex: 1,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={chosen}
                                    disabled={
                                      busy ||
                                      !can("sponsors.manage") ||
                                      (!chosen &&
                                        (record?.status === "inactive" ||
                                          target.status === "archived"))
                                    }
                                    onChange={() =>
                                      change({
                                        [group.kind]: chosen
                                          ? draft[group.kind].filter(
                                              (x) => x !== target.id,
                                            )
                                          : [...draft[group.kind], target.id],
                                      })
                                    }
                                  />
                                  <span>
                                    {target.draft.title}{" "}
                                    <small
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      ({target.status})
                                    </small>
                                  </span>
                                </label>
                                <Link
                                  to={group.url + target.id}
                                  className="btn btn-sm"
                                >
                                  Open
                                </Link>
                              </div>
                            );
                          })
                        ) : (
                          <p>No {group.label.toLowerCase()} available.</p>
                        )}
                      </Card>
                    ))}
                  </div>
                </>
              )}
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Save and publish to update customer branding. Draft and archived
                targets never show public sponsor placement.
              </p>
            </>
          )}
          {!isNew && tab === "activity" && (
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
          {!isNew && record && (
            <Card title="Publication and lifecycle">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="btn"
                  disabled={busy || !!dirty}
                  onClick={() =>
                    void run(async () => {
                      const c = await api(
                        "/admin/sponsors/" + id + "/publication-check",
                      );
                      setIssues(c.issues);
                      setNotice(
                        c.issues.length
                          ? "Public branding needs attention."
                          : "Ready to publish sponsor branding.",
                      );
                    })
                  }
                >
                  Check publication
                </button>
                {[
                  {
                    id: "publish",
                    label: "Publish branding",
                    permission: "sponsors.publish",
                    disabled: record.status !== "active",
                  },
                  {
                    id: "unpublish",
                    label: "Unpublish",
                    permission: "sponsors.unpublish",
                    disabled: record.publicationStatus !== "published",
                  },
                  {
                    id: record.status === "active" ? "deactivate" : "activate",
                    label:
                      record.status === "active"
                        ? "Deactivate sponsor"
                        : "Reactivate sponsor",
                    permission: "sponsors.manage",
                    disabled:
                      record.status === "active" &&
                      record.publicationStatus === "published" &&
                      !can("sponsors.unpublish"),
                  },
                ].map((a) => (
                  <button
                    key={a.id}
                    className="btn"
                    disabled={
                      busy || !!dirty || !can(a.permission) || a.disabled
                    }
                    onClick={() => {
                      setAction(a.id);
                      setReason("");
                      requestKey.current = null;
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Publishing needs explicit content.publish permission.
                Deactivation hides public branding and retains records.
                Reactivation requires a separate publish action to display it
                again.
              </p>
            </Card>
          )}
        </>
      )}
      {asset && (
        <Modal
          title={
            draft.brandAssets.some((a) => a.id === asset.id)
              ? "Edit brand asset"
              : "Add brand asset"
          }
          onClose={() => {
            if (!busy) setAsset(null);
          }}
          footer={
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setAsset(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={busy || !asset.label.trim() || !asset.mediaVersionId}
                onClick={() => {
                  change({
                    brandAssets: draft.brandAssets.some(
                      (a) => a.id === asset.id,
                    )
                      ? draft.brandAssets.map((a) =>
                          a.id === asset.id ? asset : a,
                        )
                      : [...draft.brandAssets, asset],
                  });
                  setAsset(null);
                }}
              >
                Use asset in draft
              </button>
            </>
          }
        >
          <TextField
            label="Label"
            value={asset.label}
            onChange={(e) => setAsset({ ...asset, label: e.target.value })}
          />
          <label style={{ display: "grid", gap: 6, marginBottom: 14 }}>
            Type
            <select
              className="input"
              value={asset.kind}
              onChange={(e) => setAsset({ ...asset, kind: e.target.value })}
            >
              {assetKinds.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <MediaAttachment
            key={asset.id}
            label="Brand image"
            kind="image"
            value={asset.mediaVersionId}
            disabled={busy}
            canRead={!!can("media.read")}
            canUpload={!!can("media.upload")}
            onBusyChange={setBusy}
            onChange={(v) =>
              setAsset((a: any) => (a ? { ...a, mediaVersionId: v } : a))
            }
          />
          {error && <p role="alert">{error}</p>}
        </Modal>
      )}
      {remove && (
        <ConfirmDialog
          title="Remove this brand asset?"
          confirmLabel="Remove asset"
          danger
          onCancel={() => setRemove(null)}
          onConfirm={() => {
            change({
              brandAssets: draft.brandAssets.filter((a) => a.id !== remove.id),
              publicAssetId:
                draft.publicAssetId === remove.id ? null : draft.publicAssetId,
            });
            setRemove(null);
          }}
        >
          The asset will be removed from the draft. Historical references keep
          the original file. Save and publish separately to change customer
          branding.
        </ConfirmDialog>
      )}
      {action && (
        <Modal
          title={
            action === "publish"
              ? "Publish sponsor branding"
              : action === "deactivate"
                ? "Deactivate sponsor"
                : action === "activate"
                  ? "Reactivate sponsor"
                  : "Unpublish sponsor"
          }
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
                  busy || (action !== "publish" && reason.trim().length < 5)
                }
                onClick={() =>
                  void run(async () => {
                    const body = {
                        revisionId: record.draftRevisionId,
                        ...(action !== "publish" ? { reason } : {}),
                      },
                      keyBody = JSON.stringify([action, body, record.version]);
                    if (requestKey.current?.body !== keyBody)
                      requestKey.current = {
                        body: keyBody,
                        key: crypto.randomUUID(),
                      };
                    await api(
                      "/admin/sponsors/" + id + "/" + action,
                      "POST",
                      body,
                      record.version,
                      requestKey.current.key,
                    );
                    setAction(null);
                    requestKey.current = null;
                    await load();
                    setNotice("Sponsor updated.");
                  })
                }
              >
                {busy ? "Working…" : "Confirm"}
              </button>
            </>
          }
        >
          <p>
            {action === "publish"
              ? "Customers will see the saved name, description, website and selected logo on linked published shows and events. Compact credits also accompany those featured items and the series’ episodes. These editorial credits remain visible to every tier, including Gold. Contacts and other brand assets stay private."
              : action === "activate"
                ? "Reactivate this organization. Its public branding stays unpublished until a separate publication action."
                : "This hides public branding while retaining contacts, assets, associations and history."}
          </p>
          {action !== "publish" && (
            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
          {error && <p role="alert">{error}</p>}
        </Modal>
      )}
    </div>
  );
}
