import { useState } from "react";
import { Link } from "../router";
import AccessTable, { Identity } from "./AccessVisual";
import MediaIcon from "./MediaIcon";
import { AnalyticsPanel } from "./AnalyticsCharts";
import {
  count,
  contentLink,
  activityLink,
  actionLabel,
  momentLabel,
  titleCase,
  type AnalyticsReport,
} from "./analytics-model";
type Permit = (permission: string) => boolean;
export function AttentionQueue({
  operations,
  can,
}: Pick<AnalyticsReport, "operations"> & { can: Permit }) {
  const items = [
    {
      count: operations.openReports,
      label: "Reports to review",
      note: "Open moderation queue",
      path: "/admin/moderation",
      permission: "moderation.read",
      icon: "review",
    },
    {
      count: operations.campaignsInReview,
      label: "Campaigns in review",
      note: "Awaiting a review decision",
      path: "/admin/advertising/campaigns",
      permission: "advertising.read",
      icon: "campaign",
    },
    {
      count: operations.scheduledEvents,
      label: "Scheduled events",
      note: "Published with scheduled lifecycle",
      path: "/admin/events",
      permission: "events.read",
      icon: "calendar",
    },
  ];
  return (
    <section className="an-attention" aria-label="Current operational queues">
      {items.map((item) => {
        const body = (
          <>
            <span className="an-icon">
              <MediaIcon name={item.icon} />
            </span>
            <div>
              <strong>{count(item.count)}</strong>
              <span>{item.label}</span>
              <small>{item.note}</small>
            </div>
            {can(item.permission) && <MediaIcon name="arrow" size={18} />}
          </>
        );
        return can(item.permission) ? (
          <Link className="an-queue" to={item.path} key={item.label}>
            {body}
          </Link>
        ) : (
          <div className="an-queue" key={item.label}>
            {body}
          </div>
        );
      })}
    </section>
  );
}
export function CatalogBreakdown({
  inventory,
  can,
}: Pick<AnalyticsReport, "inventory"> & { can: Permit }) {
  const total = inventory.reduce((sum, r) => sum + r.count, 0);
  return (
    <AnalyticsPanel
      title="Inside the catalog"
      note="Current discoverable items; separate from viewing interest."
      icon="grid"
    >
      <div className="an-catalog-total">
        <strong>{count(total)}</strong>
        <span>items in the Discovery index</span>
      </div>
      <div
        className="an-inventory"
        tabIndex={0}
        role="region"
        aria-label="Catalog types"
      >
        {inventory.map((r) => {
          const d = contentLink(r.kind);
          return (
            <div key={r.kind} className="an-inventory-row">
              <span className="an-icon">
                <MediaIcon name={d?.icon ?? "file"} size={17} />
              </span>
              <div>
                <div className="an-inventory-title">
                  {d && can(d.permission) ? (
                    <Link to={d.href}>{d.label}</Link>
                  ) : (
                    <span>{d?.label ?? titleCase(r.kind)}</span>
                  )}
                  <strong>{count(r.count)}</strong>
                </div>
                <meter
                  min="0"
                  max={Math.max(1, total)}
                  value={r.count}
                  aria-label={
                    titleCase(r.kind) + ": " + r.count + " discoverable items"
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
      {!inventory.length && (
        <p className="an-empty-note">No indexed catalog items yet.</p>
      )}
      <p className="an-footnote">
        This is the current index across content types. Shop products are
        managed separately.
      </p>
    </AnalyticsPanel>
  );
}
export function TopContent({
  rows,
  can,
}: {
  rows: AnalyticsReport["top"];
  can: Permit;
}) {
  const [query, setQuery] = useState(""),
    [kind, setKind] = useState("all"),
    [sort, setSort] = useState("views");
  const kinds = [...new Set(rows.map((r) => r.kind))],
    filtered = rows
      .filter(
        (r) =>
          (kind === "all" || r.kind === kind) &&
          r.title.toLowerCase().includes(query.trim().toLowerCase()),
      )
      .sort((a, b) =>
        sort === "title"
          ? a.title.localeCompare(b.title)
          : b.views - a.views || a.title.localeCompare(b.title),
      );
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <AnalyticsPanel
      title="Titles earning attention"
      note="Up to ten titles returned by qualified views in the selected period."
      icon="film"
    >
      <div className="an-table-toolbar">
        <label>
          Find in top titles
          <input
            className="input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={120}
            placeholder="Search a title"
          />
        </label>
        <label>
          Content type
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="all">All types</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {titleCase(k)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="views">Most views</option>
            <option value="title">Title A-Z</option>
          </select>
        </label>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setQuery("");
            setKind("all");
            setSort("views");
          }}
        >
          Reset
        </button>
      </div>
      <AccessTable
        key={query + kind + sort}
        label="Top content"
        scope="titles in this report"
        rows={filtered}
        rowKey={(r) => r.kind + r.id}
        empty={
          rows.length
            ? "No top titles match these filters."
            : "No qualified views in this period yet."
        }
        columns={[
          {
            key: "title",
            label: "Content",
            render: (r) => (
              <Identity
                name={r.title}
                detail={titleCase(r.kind)}
                icon={contentLink(r.kind)?.icon ?? "film"}
              />
            ),
          },
          {
            key: "views",
            label: "Qualified views",
            render: (r) => (
              <div className="an-view-score">
                <strong>{count(r.views)}</strong>
                <meter
                  min="0"
                  max={max}
                  value={r.views}
                  aria-label={r.title + ": " + r.views + " qualified views"}
                />
              </div>
            ),
          },
          {
            key: "open",
            label: "Workspace",
            render: (r) => {
              const d = contentLink(r.kind, r.id);
              return d && can(d.permission) ? (
                <Link className="btn av-link" to={d.href}>
                  {r.kind === "episode" ? "Content library" : "Open"}
                  <MediaIcon name="arrow" size={15} />
                </Link>
              ) : (
                <span className="an-muted">
                  {d ? "Read access required" : "No workspace link"}
                </span>
              );
            },
          },
        ]}
      />
    </AnalyticsPanel>
  );
}
export function RecentActivity({
  rows,
  can,
}: {
  rows: AnalyticsReport["activity"];
  can: Permit;
}) {
  const [query, setQuery] = useState("");
  const filtered = rows.filter((r) =>
    (r.actor + " " + actionLabel(r.action))
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <AnalyticsPanel
      title="The latest in your workspace"
      note="Latest ten audited actions across the platform; independent of the audience period."
      icon="clock"
    >
      <div className="an-table-toolbar">
        <label>
          Find in recent activity
          <input
            className="input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={120}
            placeholder="Search staff or action"
          />
        </label>
        <button className="btn" type="button" onClick={() => setQuery("")}>
          Reset
        </button>
      </div>
      <AccessTable
        key={query}
        label="Recent staff activity"
        rows={filtered}
        rowKey={(r) => r.id}
        scope="recent actions"
        empty={
          rows.length
            ? "No recent actions match this search."
            : "No audited staff activity yet."
        }
        columns={[
          {
            key: "actor",
            label: "Staff / system",
            render: (r) => <Identity name={r.actor} icon="users" />,
          },
          {
            key: "action",
            label: "Action",
            render: (r) => (
              <span className="an-action-label">{actionLabel(r.action)}</span>
            ),
          },
          {
            key: "time",
            label: "Jamaica time",
            render: (r) => (
              <time dateTime={r.createdAt}>{momentLabel(r.createdAt)}</time>
            ),
          },
          {
            key: "open",
            label: "Record",
            render: (r) => {
              const d = activityLink(r);
              return d && can(d.permission) ? (
                <Link className="btn av-link" to={d.href}>
                  Open
                  <MediaIcon name="arrow" size={15} />
                </Link>
              ) : (
                <span className="an-muted">Audit record</span>
              );
            },
          },
        ]}
      />
    </AnalyticsPanel>
  );
}
