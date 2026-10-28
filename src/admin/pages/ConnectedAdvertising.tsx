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
import MediaIcon from "../components/MediaIcon";
import {
  AdvertisingGrid,
  AdvertiserOverview,
  CampaignOverview,
  PartnerHistory,
  PartnerImage,
  PartnerSkeleton,
  TargetArtwork,
  CampaignFlow,
} from "../components/PartnersVisual";
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
    [applied, setApplied] = useState({ q: "", status: "" }),
    [pane, setPane] = useState<"overview" | "edit" | "review" | "activity">(
      isNew ? "edit" : "overview",
    ),
    [placementQuery, setPlacementQuery] = useState(""),
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
  async function load(filters = applied) {
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
        base + "?" + new URLSearchParams({ ...filters, limit: "24" }),
      );
      setItems(p.items);
      setCursor(p.nextCursor);
      setApplied(filters);
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
                record: x,
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
                disabled={busy || dirty}
                onClick={() => void run(load)}
              >
                Reload server data
              </button>
            )}
          </Note>
        )}
      </div>
      {!loaded ? (
        id ? (
          <LoadingState label="Loading advertising record…" variant="form" />
        ) : (
          <PartnerSkeleton />
        )
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
                    <div className="pv-report-grid">
                      {report?.items.map((r: any) => (
                        <article className="pv-panel" key={r.id}>
                          <div className="pv-list-head">
                            <h3>
                              <MediaIcon name="campaign" />{" "}
                              <Link to={"/admin/advertising/campaigns/" + r.id}>
                                {r.name}
                              </Link>
                            </h3>
                            <StatusPill
                              map={CAMPAIGN_STATUS}
                              value={r.status}
                            />
                          </div>
                          <dl className="pv-report-stats">
                            {[
                              ["impressions", "Video starts", "video"],
                              ["clicks", "Clicks", "link"],
                              ["completions", "Completions", "check"],
                              ["skips", "Skips", "arrow"],
                              ["failures", "Failures", "alert"],
                            ].map(([key, label, icon]) => (
                              <div key={key}>
                                <dt>
                                  <MediaIcon name={icon} size={16} /> {label}
                                </dt>
                                <dd>{Number(r[key] ?? 0).toLocaleString()}</dd>
                              </div>
                            ))}
                          </dl>
                        </article>
                      ))}
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
                  <div className="pv-list-head">
                    <div>
                      <span className="cv-kicker">MGTV advertising</span>
                      <h2>
                        {campaign
                          ? "Creative with a clear purpose."
                          : "The brands behind the campaigns."}
                      </h2>
                      <p>
                        {campaign
                          ? "Saved creative, placement scope and review status in one place."
                          : "Organization details stay separate from campaign approval and delivery."}
                      </p>
                    </div>
                    <span className="pv-muted">
                      {items.length} loaded{cursor ? " · more available" : ""}
                    </span>
                  </div>
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
                      onClick={() => void run(() => load({ q, status }))}
                    >
                      <MediaIcon name="filter" size={16} /> Apply filters
                    </button>
                    {(applied.q || applied.status) && (
                      <button
                        className="btn"
                        disabled={busy}
                        onClick={() => {
                          setQ("");
                          setStatus("");
                          void run(() => load({ q: "", status: "" }));
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                  </Toolbar>
                  {items.length === 0 ? (
                    <EmptyState
                      title={"No " + kind + " match"}
                      body="Clear the filters or create a record."
                    />
                  ) : (
                    <AdvertisingGrid
                      items={items}
                      kind={kind}
                      advertisers={advertisers}
                    />
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
                                ...applied,
                                cursor,
                                limit: "24",
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
                  {pane === "edit" && (
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
                  )}
                  {!isNew && (
                    <>
                      <div className="pv-state-line">
                        <StatusPill
                          map={campaign ? CAMPAIGN_STATUS : ORG_STATUS}
                          value={record.status}
                        />
                        <span>
                          {dirty
                            ? "Unsaved changes · overview shows saved information"
                            : "Saved version " + record.version}
                        </span>
                      </div>
                      <nav
                        className="cv-detail-nav"
                        aria-label="Advertising record views"
                      >
                        {(
                          ["overview", "edit", "review", "activity"] as const
                        ).map((v) => (
                          <button
                            key={v}
                            aria-pressed={pane === v}
                            onClick={() => setPane(v)}
                          >
                            <MediaIcon
                              name={
                                v === "overview"
                                  ? campaign
                                    ? "campaign"
                                    : "brand"
                                  : v === "edit"
                                    ? "edit"
                                    : v === "review"
                                      ? "review"
                                      : "clock"
                              }
                              size={17}
                            />
                            {v === "overview"
                              ? "Overview"
                              : v === "edit"
                                ? "Edit details"
                                : v === "review"
                                  ? campaign
                                    ? "Review & status"
                                    : "Organization status"
                                  : "Activity"}
                          </button>
                        ))}
                      </nav>
                      <div hidden={pane !== "overview"}>
                        {campaign ? (
                          <CampaignOverview
                            record={record}
                            advertiser={advertiserName(
                              record.draft.advertiserId,
                            )}
                            targets={targets}
                            onReview={() => setPane("review")}
                            active={pane === "overview"}
                          />
                        ) : (
                          <AdvertiserOverview
                            record={record}
                            campaigns={organizationCampaigns}
                          />
                        )}
                      </div>
                      <div hidden={pane !== "activity"}>
                        <Card title="Activity history">
                          <PartnerHistory items={history} />
                          {!history.length && <p>No recorded activity yet.</p>}
                        </Card>
                      </div>
                    </>
                  )}
                  {campaign && record?.reviewReason && (
                    <Note
                      tone={record.status === "rejected" ? "bad" : "info"}
                      title="Review decision"
                    >
                      {record.reviewReason}
                    </Note>
                  )}
                  <div
                    className="pv-operations-grid"
                    hidden={pane === "overview" || pane === "activity"}
                  >
                    <div hidden={pane !== "edit"} className="pv-edit-grid">
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
                              <TextField
                                label="Find placement titles"
                                value={placementQuery}
                                onChange={(e) =>
                                  setPlacementQuery(e.target.value)
                                }
                              />
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
                                  {targets
                                    .filter((t) =>
                                      t.title
                                        .toLowerCase()
                                        .includes(placementQuery.toLowerCase()),
                                    )
                                    .map((t) => (
                                      <label
                                        key={t.kind + t.id}
                                        className="pv-target-choice"
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
                                        <TargetArtwork
                                          record={t.record}
                                          kind={t.kind}
                                        />
                                        <span>
                                          {t.title}
                                          <small className="pv-muted">
                                            {" "}
                                            {t.kind} · {t.status}
                                          </small>
                                        </span>
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
                              <div style={{ display: "grid", gap: 12 }}>
                                {(["image", "video"] as const).map((kind) => (
                                  <MediaAttachment
                                    key={`${record?.id ?? "new"}:${kind}`}
                                    label={
                                      kind === "image"
                                        ? "Add image creative"
                                        : "Add video creative (up to 30 seconds)"
                                    }
                                    kind={kind}
                                    value={null}
                                    disabled={busy || !editable}
                                    canRead={!!can("media.read")}
                                    canUpload={!!can("media.upload")}
                                    onBusyChange={setBusy}
                                    maxDuration={
                                      kind === "video" ? 30 : undefined
                                    }
                                    onChange={(v) => {
                                      if (
                                        v &&
                                        !draft.creativeVersionIds.includes(v)
                                      )
                                        update("creativeVersionIds", [
                                          ...draft.creativeVersionIds,
                                          v,
                                        ]);
                                    }}
                                  />
                                ))}
                              </div>
                              {draft.creativeVersionIds.length === 0 ? (
                                <p>No creative attached.</p>
                              ) : (
                                <div className="pv-creative-grid">
                                  {draft.creativeVersionIds.map((v: string) => {
                                    const c = record?.creative?.find(
                                      (c: any) => c.id === v,
                                    );
                                    return (
                                      <div className="pv-asset-card" key={v}>
                                        {c?.kind === "image" ? (
                                          <PartnerImage src={c.url} />
                                        ) : (
                                          <p className="pv-notice">
                                            <MediaIcon
                                              name={
                                                c?.kind === "video"
                                                  ? "video"
                                                  : "file"
                                              }
                                            />
                                            {c
                                              ? "Video creative · review under Overview"
                                              : "Save the draft to preview this file"}
                                          </p>
                                        )}
                                        <strong>
                                          {c?.filename ??
                                            "Selected creative file"}
                                        </strong>
                                        <div className="pv-asset-actions">
                                          <button
                                            type="button"
                                            className="btn btn-sm"
                                            aria-label={
                                              "Remove creative " +
                                              (c?.filename ?? "file")
                                            }
                                            onClick={() =>
                                              update(
                                                "creativeVersionIds",
                                                draft.creativeVersionIds.filter(
                                                  (x: string) => x !== v,
                                                ),
                                              )
                                            }
                                          >
                                            <MediaIcon name="trash" size={15} />{" "}
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
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
                    </div>
                    <aside
                      style={
                        pane === "review" ? { gridColumn: "1 / -1" } : undefined
                      }
                    >
                      {!isNew && record && pane === "review" && (
                        <Card title={campaign ? "Review and status" : "Status"}>
                          {campaign && <CampaignFlow status={record.status} />}
                          {dirty && (
                            <p className="pv-notice">
                              Save or discard edits before making a decision.
                              Actions apply to the saved revision.
                            </p>
                          )}
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
                                referrerPolicy="same-origin"
                                loading="lazy"
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
                            .map((c: any) =>
                              pane === "edit" || pane === "review" ? (
                                <CreativeVideo key={c.id} src={c.url} />
                              ) : null,
                            )}
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
