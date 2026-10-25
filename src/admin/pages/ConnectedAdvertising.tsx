import MediaAttachment from "../components/MediaAttachment";
import LoadingState from "../components/LoadingState";
import CreativeVideo from "../ui/CreativeVideo";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Card, TextField, SelectField, EmptyState, Modal } from "../ui";
import { PageActions } from "../components/PageHeader";
import { RouteTabs, Toolbar, StatusPill, Note } from "../ui/ops";
import ContactsEditor from "../ui/Contacts";
import { CAMPAIGN_STATUS, ORG_STATUS } from "./opsMeta";
import StaffAuth from "./StaffAuth";
const HOME = "00000000-0000-4000-8000-000000000000";
const advertiserBlank = {
  name: "",
  website: "",
  notes: "",
  contacts: [] as any[],
};
const campaignBlank = {
  advertiserId: "",
  name: "",
  headline: "",
  objective: "",
  destinationUrl: "",
  startAt: null as string | null,
  endAt: null as string | null,
  placements: [] as any[],
  creativeVersionIds: [] as string[],
  rightsConfirmed: false,
};
const sections = [
  { id: "campaigns", label: "Campaigns" },
  { id: "advertisers", label: "Advertisers" },
  { id: "reporting", label: "Reporting" },
];
export default function ConnectedAdvertising() {
  const { route } = useRouter();
  const kind =
    route.parts[0] === "advertisers"
      ? "advertisers"
      : route.parts[0] === "reporting"
        ? "reporting"
        : "campaigns";
  return (
    <AdvertisingView
      key={kind + ":" + (route.parts[1] ?? "list")}
      kind={kind}
      id={route.parts[1]}
    />
  );
}
function AdvertisingView({ kind, id }: { kind: string; id?: string }) {
  const { navigate } = useRouter(),
    isNew = id === "new",
    campaign = kind === "campaigns",
    blank = campaign ? campaignBlank : advertiserBlank;
  const [session, setSession] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState<any>(structuredClone(blank)),
    [items, setItems] = useState<any[]>([]),
    [advertisers, setAdvertisers] = useState<any[]>([]),
    [targets, setTargets] = useState<any[]>([]),
    [targetsError, setTargetsError] = useState(""),
    [history, setHistory] = useState<any[]>([]),
    [organizationCampaigns, setOrganizationCampaigns] = useState<any[]>([]),
    [report, setReport] = useState<any>(null),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [cursor, setCursor] = useState<string | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [issues, setIssues] = useState<any[]>([]),
    [action, setAction] = useState(""),
    [reason, setReason] = useState("");
  const leaving = useRef(false),
    key = useRef<{ body: string; key: string } | null>(null),
    alert = useRef<HTMLDivElement>(null);
  const can = (p: string) => !!session?.permissions.includes(p),
    dirty =
      !!id &&
      JSON.stringify(draft) !==
        JSON.stringify(
          record ? (campaign ? record.draft : record.body) : blank,
        ),
    editable =
      can("advertising.manage") &&
      (!campaign || isNew || record?.status === "draft");
  useDirtyGuard(() => dirty && !leaving.current);
  const base = "/admin/advertising/" + kind;
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
        if (e.status === 401) {
          setSession(null);
          setError("");
        }
      }
      setTimeout(() => alert.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }
  async function all(path: string) {
    const rows = [];
    let next = "";
    do {
      const p = await api(
        path +
          (path.includes("?") ? "&" : "?") +
          "limit=" +
          (path.startsWith("/admin/advertising") ? 100 : 50) +
          (next ? "&cursor=" + encodeURIComponent(next) : ""),
      );
      rows.push(...p.items);
      next = p.nextCursor;
    } while (next);
    return rows;
  }
  async function load() {
    const s = await api("/admin/session");
    setSession(s);
    if (!s.permissions.includes("advertising.read")) return;
    if (kind === "reporting") {
      setReport(await api("/admin/advertising/reporting"));
      return;
    }
    if (id && !isNew) {
      const r = await api(base + "/" + id);
      setRecord(r);
      setDraft(structuredClone(campaign ? r.draft : r.body));
      setHistory((await api(base + "/" + id + "/history")).items);
      if (!campaign)
        setOrganizationCampaigns(
          await all("/admin/advertising/campaigns?advertiserId=" + id),
        );
    } else if (!id) {
      const p = await api(
        base + "?" + new URLSearchParams({ q, status, limit: "25" }),
      );
      setItems(p.items);
      setCursor(p.nextCursor);
    }
    if (campaign) {
      setAdvertisers(await all("/admin/advertising/advertisers"));
      if (
        id &&
        ["sports", "movies", "shows", "music", "events"].some((p) =>
          s.permissions.includes(p + ".read"),
        )
      ) {
        try {
          const options = [];
          for (const [path, type] of [
            ["/admin/sports", "sports"],
            ["/admin/movies", "movie"],
            ["/admin/shows", "show"],
            ["/admin/music", "music"],
            ["/admin/events", "event"],
          ]) {
            if (!s.permissions.includes(path.split("/").pop() + ".read"))
              continue;
            for (const x of await all(path))
              options.push({
                id: x.id,
                kind: type,
                title: x.draft?.title ?? x.title,
                status: x.status,
              });
          }
          setTargets(options);
          setTargetsError("");
        } catch (e) {
          setTargetsError((e as Error).message);
        }
      }
    }
  }
  useEffect(() => {
    void run(load).finally(() => setLoaded(true));
  }, []);
  async function refreshRecord() {
    const r = await api(base + "/" + id);
    setRecord(r);
    setDraft(structuredClone(campaign ? r.draft : r.body));
    setHistory((await api(base + "/" + id + "/history")).items);
  }
  async function save() {
    let r;
    const encoded = JSON.stringify(draft);
    if (isNew) {
      if (key.current?.body !== encoded)
        key.current = { body: encoded, key: crypto.randomUUID() };
      r = await api(base, "POST", draft, undefined, key.current!.key);
      leaving.current = true;
      navigate("/admin/advertising/" + kind + "/" + r.id);
      return;
    }
    r = await api(
      base + "/" + id + (campaign ? "/draft" : ""),
      "PATCH",
      draft,
      record.version,
    );
    setRecord(r);
    setDraft(structuredClone(campaign ? r.draft : r.body));
    setNotice("Changes saved. Review applies to the saved revision.");
    await refreshRecord();
  }
  async function command() {
    const body = {
      reason,
      ...(campaign ? { revisionId: record.draftRevisionId } : {}),
    };
    await api(base + "/" + id + "/" + action, "POST", body, record.version);
    setAction("");
    setReason("");
    setNotice("Action recorded.");
    await refreshRecord();
  }
  const update = (k: string, v: any) =>
    setDraft((d: any) => ({ ...d, [k]: v }));
  const advertiserName = (id: string) =>
    advertisers.find((a) => a.id === id)?.body.name ?? "Advertiser";
  const toggle = (p: any) => {
    const has = draft.placements.some(
      (x: any) => x.kind === p.kind && x.targetId === p.targetId,
    );
    update(
      "placements",
      has
        ? draft.placements.filter(
            (x: any) => !(x.kind === p.kind && x.targetId === p.targetId),
          )
        : [...draft.placements, p],
    );
  };
  const reviewAllowed =
    can("advertising.review") &&
    ![record?.createdBy, record?.lastEditedBy, record?.submittedBy].includes(
      session?.principal.id,
    );
  return (
    <div className="page-pad advertising-workspace">
      <div ref={alert} tabIndex={-1}>
        {error && (
          <Note tone="bad" title="Action could not be completed">
            <p role="alert">{error}</p>
            {issues.map((i, n) => (
              <p key={n}>
                {i.path}: {i.message}
              </p>
            ))}
            {session && (
              <button
                className="btn"
                disabled={busy}
                onClick={() => void run(load)}
              >
                Reload server data
              </button>
            )}
          </Note>
        )}
      </div>
      {!loaded ? (
        <LoadingState label={<>Loading Advertising…</>} variant="table" />
      ) : !session ? (
        <StaffAuth onAuthenticated={() => run(load)} />
      ) : !can("advertising.read") ? (
        <Note tone="warn" title="Access required">
          Your account needs explicit advertising.read permission.
        </Note>
      ) : (
        <>
          {notice && <p role="status">{notice}</p>}
          {!error &&
            issues.map((i, n) => (
              <p key={n} role="alert">
                {i.path}: {i.message}
              </p>
            ))}
          {!id ? (
            <>
              <RouteTabs
                label="Advertising sections"
                base="/admin/advertising"
                value={kind}
                items={sections}
              />
              <div style={{ height: 14 }} />
              {kind === "reporting" ? (
                <>
                  <Note tone="info">
                    {report?.measurement ?? "Loading measured observations…"}
                  </Note>
                  {report?.items.length === 0 ? (
                    <EmptyState
                      title="No active or completed campaigns"
                      body="Reporting appears after a campaign is activated."
                    />
                  ) : (
                    <div className="scroll-x">
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Campaign</th>
                            <th>Status</th>
                            <th>Video starts</th>
                            <th>Clicks</th>
                            <th>Completions</th>
                            <th>Skips</th>
                            <th>Failures</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report?.items.map((r: any) => (
                            <tr key={r.id}>
                              <td>
                                <Link
                                  to={"/admin/advertising/campaigns/" + r.id}
                                >
                                  {r.name}
                                </Link>
                              </td>
                              <td>
                                <StatusPill
                                  map={CAMPAIGN_STATUS}
                                  value={r.status}
                                />
                              </td>
                              {[
                                "impressions",
                                "clicks",
                                "completions",
                                "skips",
                                "failures",
                              ].map((k) => (
                                <td key={k}>{r[k]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <PageActions>
                    {can("advertising.manage") && (
                      <Link
                        className="btn btn-primary"
                        to={"/admin/advertising/" + kind + "/new"}
                      >
                        {campaign ? "Create campaign" : "Add advertiser"}
                      </Link>
                    )}
                  </PageActions>
                  <Toolbar>
                    <TextField
                      label={
                        campaign ? "Search campaigns" : "Search advertisers"
                      }
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                    <SelectField
                      label="Status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      options={Object.keys(
                        campaign ? CAMPAIGN_STATUS : ORG_STATUS,
                      )}
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
                  {items.length === 0 ? (
                    <EmptyState
                      title={"No " + kind + " match"}
                      body="Clear the filters or create a record."
                    />
                  ) : (
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
                            <th>{campaign ? "Campaign" : "Advertiser"}</th>
                            {campaign ? (
                              <>
                                <th>Advertiser</th>
                                <th>Dates</th>
                                <th>Placements</th>
                              </>
                            ) : (
                              <th>Contacts</th>
                            )}
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((r) => (
                            <tr key={r.id}>
                              <td>
                                <Link
                                  to={"/admin/advertising/" + kind + "/" + r.id}
                                >
                                  {campaign ? r.draft.name : r.body.name}
                                </Link>
                              </td>
                              {campaign ? (
                                <>
                                  <td>
                                    {advertiserName(r.draft.advertiserId)}
                                  </td>
                                  <td>
                                    {r.draft.startAt
                                      ? new Date(
                                          r.draft.startAt,
                                        ).toLocaleString()
                                      : "Not set"}{" "}
                                    to{" "}
                                    {r.draft.endAt
                                      ? new Date(r.draft.endAt).toLocaleString()
                                      : "Not set"}
                                  </td>
                                  <td>{r.draft.placements.length}</td>
                                </>
                              ) : (
                                <td>{r.body.contacts.length}</td>
                              )}
                              <td>
                                <StatusPill
                                  map={campaign ? CAMPAIGN_STATUS : ORG_STATUS}
                                  value={r.status}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {cursor && (
                    <button
                      className="btn"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const p = await api(
                            base +
                              "?" +
                              new URLSearchParams({
                                q,
                                status,
                                cursor,
                                limit: "25",
                              }),
                          );
                          setItems((v) => [...v, ...p.items]);
                          setCursor(p.nextCursor);
                        })
                      }
                    >
                      Load more
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <Link to={"/admin/advertising/" + kind}>← All {kind}</Link>
              <div style={{ height: 12 }} />
              {!isNew && !record ? (
                <EmptyState
                  title="Record unavailable"
                  body="Reload server data or return to the list."
                />
              ) : (
                <>
                  <PageActions>
                    <span role="status">
                      {dirty ? "Unsaved changes" : "All changes saved"}
                    </span>
                    <button
                      className="btn"
                      disabled={busy || !dirty}
                      onClick={() =>
                        setDraft(
                          structuredClone(
                            record
                              ? campaign
                                ? record.draft
                                : record.body
                              : blank,
                          ),
                        )
                      }
                    >
                      Discard
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={busy || !editable || (!dirty && !isNew)}
                      onClick={() => void run(save)}
                    >
                      {campaign
                        ? isNew
                          ? "Save draft"
                          : "Save draft changes"
                        : isNew
                          ? "Add advertiser"
                          : "Save details"}
                    </button>
                  </PageActions>
                  {campaign && record?.reviewReason && (
                    <Note
                      tone={record.status === "rejected" ? "bad" : "info"}
                      title="Review decision"
                    >
                      {record.reviewReason}
                    </Note>
                  )}
                  <div className={campaign ? "editor-layout" : ""}>
                    <div>
                      <fieldset
                        disabled={busy || !editable}
                        style={{
                          border: 0,
                          padding: 0,
                          margin: 0,
                          minWidth: 0,
                        }}
                      >
                        <Card title={campaign ? "Campaign" : "Organization"}>
                          <div
                            style={{
                              display: "grid",
                              gap: 14,
                              maxWidth: campaign ? undefined : 640,
                            }}
                          >
                            <TextField
                              label={
                                campaign ? "Campaign name" : "Advertiser name"
                              }
                              required
                              value={draft.name}
                              onChange={(e) => update("name", e.target.value)}
                            />
                            {campaign ? (
                              <>
                                <label>
                                  Advertiser
                                  <select
                                    required
                                    value={draft.advertiserId}
                                    onChange={(e) =>
                                      update("advertiserId", e.target.value)
                                    }
                                  >
                                    <option value="">Choose advertiser</option>
                                    {advertisers
                                      .filter(
                                        (a) =>
                                          a.status === "active" ||
                                          a.id === draft.advertiserId,
                                      )
                                      .map((a) => (
                                        <option key={a.id} value={a.id}>
                                          {a.body.name}
                                          {a.status === "inactive"
                                            ? " (inactive)"
                                            : ""}
                                        </option>
                                      ))}
                                  </select>
                                </label>
                                <TextField
                                  label="Headline"
                                  value={draft.headline}
                                  onChange={(e) =>
                                    update("headline", e.target.value)
                                  }
                                />
                                <TextField
                                  label="Objective"
                                  multiline
                                  rows={2}
                                  value={draft.objective}
                                  onChange={(e) =>
                                    update("objective", e.target.value)
                                  }
                                />
                                <TextField
                                  label="Destination URL"
                                  type="url"
                                  placeholder="https://"
                                  value={draft.destinationUrl}
                                  onChange={(e) =>
                                    update("destinationUrl", e.target.value)
                                  }
                                />
                                <div className="grid-2">
                                  {["startAt", "endAt"].map((k) => (
                                    <TextField
                                      key={k}
                                      label={
                                        k === "startAt"
                                          ? "Start date and time"
                                          : "End date and time"
                                      }
                                      type="datetime-local"
                                      value={
                                        draft[k]
                                          ? new Date(
                                              Date.parse(draft[k]) -
                                                new Date(
                                                  draft[k],
                                                ).getTimezoneOffset() *
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
                                            ? new Date(
                                                e.target.value,
                                              ).toISOString()
                                            : null,
                                        )
                                      }
                                    />
                                  ))}
                                </div>
                                <small>
                                  Times use this computer’s timezone and are
                                  saved in UTC. Active placements serve only
                                  inside this window.
                                </small>
                              </>
                            ) : (
                              <>
                                <TextField
                                  label="Website"
                                  type="url"
                                  value={draft.website}
                                  onChange={(e) =>
                                    update("website", e.target.value)
                                  }
                                />
                                <TextField
                                  label="Internal notes"
                                  multiline
                                  rows={3}
                                  value={draft.notes}
                                  onChange={(e) =>
                                    update("notes", e.target.value)
                                  }
                                />
                              </>
                            )}
                          </div>
                        </Card>
                        {!campaign ? (
                          <Card title="Contacts">
                            <ContactsEditor
                              contacts={draft.contacts}
                              disabled={busy || !editable}
                              onChange={(contacts) =>
                                update(
                                  "contacts",
                                  contacts.map((c) => ({
                                    ...c,
                                    id: /^[0-9a-f]{8}-/i.test(c.id)
                                      ? c.id
                                      : crypto.randomUUID(),
                                  })),
                                )
                              }
                            />
                            <small>
                              Contact edits are saved with the organization.
                              Contacts are private to staff with Advertising
                              access.
                            </small>
                          </Card>
                        ) : (
                          <>
                            <Card title="Placements">
                              <div className="grid-2">
                                <div>
                                  <strong>Content items</strong>
                                  {targetsError && (
                                    <p role="alert">
                                      Could not load placement choices:{" "}
                                      {targetsError}
                                    </p>
                                  )}
                                  {![
                                    "sports",
                                    "movies",
                                    "shows",
                                    "music",
                                    "events",
                                  ].some((p) => can(p + ".read")) && (
                                    <p>
                                      Content-read permission is needed to
                                      select new content placements.
                                    </p>
                                  )}
                                  {targets.map((t) => (
                                    <label
                                      key={t.kind + t.id}
                                      style={{
                                        display: "flex",
                                        gap: 8,
                                        padding: "4px 0",
                                        fontSize: 13.5,
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={draft.placements.some(
                                          (x: any) =>
                                            x.kind === t.kind &&
                                            x.targetId === t.id,
                                        )}
                                        onChange={() =>
                                          toggle({
                                            kind: t.kind,
                                            targetId: t.id,
                                          })
                                        }
                                      />
                                      {t.title} ({t.kind} · {t.status})
                                    </label>
                                  ))}
                                  {draft.placements
                                    .filter(
                                      (p: any) =>
                                        p.kind !== "home" &&
                                        !targets.some(
                                          (t) =>
                                            t.kind === p.kind &&
                                            t.id === p.targetId,
                                        ),
                                    )
                                    .map((p: any) => (
                                      <label
                                        key={p.kind + p.targetId}
                                        style={{ display: "block" }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked
                                          onChange={() => toggle(p)}
                                        />
                                        {p.kind}: {p.targetId}
                                      </label>
                                    ))}
                                </div>
                                <div>
                                  <strong>Homepage</strong>
                                  <label
                                    style={{ display: "block", marginTop: 8 }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={draft.placements.some(
                                        (p: any) => p.kind === "home",
                                      )}
                                      onChange={() =>
                                        toggle({ kind: "home", targetId: HOME })
                                      }
                                    />{" "}
                                    Sponsored image cards
                                  </label>
                                  <small>
                                    Video creative plays before full content,
                                    and at eligible mid-rolls. A show placement
                                    applies to its episodes.
                                  </small>
                                </div>
                              </div>
                            </Card>
                            <Card title="Creative">
                              <div style={{display:"grid",gap:12}}>{(["image","video"] as const).map(kind=><MediaAttachment key={`${record?.id??"new"}:${kind}`} label={kind==="image"?"Add image creative":"Add video creative (up to 30 seconds)"} kind={kind} value={null} disabled={busy||!editable} canRead={!!can("media.read")} canUpload={!!can("media.upload")} onBusyChange={setBusy} maxDuration={kind==="video"?30:undefined} onChange={v=>{if(v&&!draft.creativeVersionIds.includes(v))update("creativeVersionIds",[...draft.creativeVersionIds,v]);}}/>)}</div>
                              {draft.creativeVersionIds.length === 0 ? (
                                <p>No creative attached.</p>
                              ) : (
                                <ul>
                                  {draft.creativeVersionIds.map((v: string) => (
                                    <li
                                      key={v}
                                      style={{ overflowWrap: "anywhere" }}
                                    >
                                      {record?.creative?.find(
                                        (c: any) => c.id === v,
                                      )?.filename ?? v}{" "}
                                      <button
                                        className="btn btn-sm"
                                        onClick={() =>
                                          update(
                                            "creativeVersionIds",
                                            draft.creativeVersionIds.filter(
                                              (x: string) => x !== v,
                                            ),
                                          )
                                        }
                                      >
                                        Remove
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <label style={{ display: "flex", gap: 8 }}>
                                <input
                                  type="checkbox"
                                  checked={draft.rightsConfirmed}
                                  onChange={(e) =>
                                    update("rightsConfirmed", e.target.checked)
                                  }
                                />
                                I confirm rights to run this creative and copy,
                                and that it is suitable for a general audience.
                              </label>
                            </Card>
                          </>
                        )}
                      </fieldset>
                      {!isNew && (
                        <>
                          {!campaign && (
                            <Card
                              title={
                                "Campaigns (" +
                                organizationCampaigns.length +
                                ")"
                              }
                            >
                              {organizationCampaigns.length ? (
                                <ul>
                                  {organizationCampaigns.map((c) => (
                                    <li key={c.id}>
                                      <Link
                                        to={
                                          "/admin/advertising/campaigns/" + c.id
                                        }
                                      >
                                        {c.draft.name}
                                      </Link>{" "}
                                      <StatusPill
                                        map={CAMPAIGN_STATUS}
                                        value={c.status}
                                      />
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p>No campaigns yet.</p>
                              )}
                            </Card>
                          )}
                          <Card title="Activity history">
                            <ul style={{ paddingLeft: 18 }}>
                              {history.map((h, i) => (
                                <li
                                  key={i}
                                  style={{
                                    overflowWrap: "anywhere",
                                    marginBottom: 10,
                                  }}
                                >
                                  <strong>
                                    {h.action
                                      .replace("advertising.", "")
                                      .replaceAll("_", " ")}
                                  </strong>
                                  <div>
                                    {h.actor ?? "Staff member"} ·{" "}
                                    {new Date(h.created_at).toLocaleString()}
                                  </div>
                                  {h.details?.reason && (
                                    <p>{h.details.reason}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </Card>
                        </>
                      )}
                    </div>
                    <aside>
                      {!isNew && record && (
                        <Card title={campaign ? "Review and status" : "Status"}>
                          <StatusPill
                            map={campaign ? CAMPAIGN_STATUS : ORG_STATUS}
                            value={record.status}
                          />
                          <div
                            style={{ display: "grid", gap: 10, marginTop: 12 }}
                          >
                            {!campaign ? (
                              <button
                                className="btn"
                                disabled={
                                  busy || dirty || !can("advertising.manage")
                                }
                                onClick={() =>
                                  setAction(
                                    record.status === "active"
                                      ? "deactivate"
                                      : "activate",
                                  )
                                }
                              >
                                {record.status === "active"
                                  ? "Deactivate…"
                                  : "Reactivate…"}
                              </button>
                            ) : (
                              <>
                                <button
                                  className="btn"
                                  disabled={busy || dirty}
                                  onClick={() =>
                                    void run(async () => {
                                      const r = await api(
                                        base + "/" + id + "/review-check",
                                      );
                                      setIssues(r.issues);
                                      setNotice(
                                        r.issues.length
                                          ? "Complete the listed requirements."
                                          : "Saved revision meets review requirements.",
                                      );
                                    })
                                  }
                                >
                                  Check requirements
                                </button>
                                {record.status === "draft" && (
                                  <button
                                    className="btn btn-primary"
                                    disabled={
                                      busy ||
                                      dirty ||
                                      !can("advertising.manage")
                                    }
                                    onClick={() => setAction("submit")}
                                  >
                                    Submit for review
                                  </button>
                                )}
                                {record.status === "in_review" && (
                                  <>
                                    <button
                                      className="btn btn-primary"
                                      disabled={busy || dirty || !reviewAllowed}
                                      onClick={() => setAction("approve")}
                                    >
                                      Approve…
                                    </button>
                                    <button
                                      className="btn btn-danger"
                                      disabled={busy || dirty || !reviewAllowed}
                                      onClick={() => setAction("reject")}
                                    >
                                      Reject…
                                    </button>
                                    {!reviewAllowed && (
                                      <small>
                                        A reviewer with explicit permission must
                                        be different from the creator, latest
                                        editor and submitter.
                                      </small>
                                    )}
                                  </>
                                )}
                                {["approved", "rejected"].includes(
                                  record.status,
                                ) && (
                                  <button
                                    className="btn"
                                    disabled={
                                      busy ||
                                      dirty ||
                                      !can("advertising.manage")
                                    }
                                    onClick={() => setAction("revise")}
                                  >
                                    Revise as draft
                                  </button>
                                )}
                                {record.status === "approved" && (
                                  <button
                                    className="btn btn-primary"
                                    disabled={
                                      busy ||
                                      dirty ||
                                      !can("advertising.activate")
                                    }
                                    onClick={() => setAction("activate")}
                                  >
                                    Activate placement…
                                  </button>
                                )}
                                {record.status === "active" && (
                                  <button
                                    className="btn"
                                    disabled={
                                      busy ||
                                      dirty ||
                                      !can("advertising.activate")
                                    }
                                    onClick={() => setAction("complete")}
                                  >
                                    Mark completed…
                                  </button>
                                )}
                                <small>
                                  Approval locks the saved creative and copy.
                                  Activation is separate; end times stop
                                  delivery automatically. Completed campaigns
                                  remain read-only.
                                </small>
                              </>
                            )}
                          </div>
                        </Card>
                      )}
                      {campaign && (
                        <Card title="Placement preview">
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--accent-hover)",
                              fontWeight: 700,
                            }}
                          >
                            SPONSORED
                          </span>
                          <h3>{draft.headline || "Headline appears here"}</h3>
                          {record?.creative
                            ?.filter(
                              (c: any) =>
                                c.kind === "image" &&
                                draft.creativeVersionIds.includes(c.id),
                            )
                            .slice(0, 1)
                            .map((c: any) => (
                              <img
                                key={c.id}
                                src={c.url}
                                alt="Campaign creative preview"
                                style={{ width: "100%", borderRadius: 8 }}
                              />
                            ))}
                          {record?.creative
                            ?.filter(
                              (c: any) =>
                                c.kind === "video" &&
                                draft.creativeVersionIds.includes(c.id),
                            )
                            .slice(0, 1)
                            .map((c: any) => (
                              <CreativeVideo key={c.id} src={c.url} />
                            ))}
                          <p>
                            Save uploaded creative to preview it. Customer
                            delivery uses the approved revision only.
                          </p>
                          <p>
                            {draft.placements.length} placement(s) selected.
                          </p>
                        </Card>
                      )}
                    </aside>
                  </div>
                  {action && (
                    <Modal
                      title={"Confirm " + action}
                      width={520}
                      onClose={() => setAction("")}
                    >
                      <label>
                        Reason
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          maxLength={2000}
                        />
                      </label>
                      <p>
                        {campaign
                          ? "This action applies to the saved revision."
                          : "Inactive advertisers cannot be chosen for new campaigns; existing campaign lifecycles remain separate."}
                      </p>
                      <button
                        className="btn"
                        disabled={busy}
                        onClick={() => {
                          setAction("");
                          setReason("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={busy || reason.trim().length < 5}
                        onClick={() => void run(command)}
                      >
                        Confirm {action}
                      </button>
                    </Modal>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
