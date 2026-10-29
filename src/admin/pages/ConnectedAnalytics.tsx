import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link } from "../router";
import LoadingState, { ErrorState } from "../components/LoadingState";
import MediaIcon from "../components/MediaIcon";
import {
  DailyTrend,
  DeviceBreakdown,
  Retention,
  AnalyticsPanel,
} from "../components/AnalyticsCharts";
import {
  AttentionQueue,
  CatalogBreakdown,
  TopContent,
  RecentActivity,
} from "../components/AnalyticsTables";
import {
  count,
  decimal,
  dayLabel,
  lastDay,
  momentLabel,
  durationLabel,
  titleCase,
  type AnalyticsReport,
} from "../components/analytics-model";
import "./analytics.css";
export default function ConnectedAnalytics({
  dashboard = false,
}: {
  dashboard?: boolean;
}) {
  const [days, setDays] = useState("30"),
    [source, setSource] = useState("observed"),
    [revision, setRevision] = useState(0);
  const [report, setReport] = useState<AnalyticsReport | null>(null),
    [permissions, setPermissions] = useState<string[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [denied, setDenied] = useState(false),
    [developmentAvailable, setDevelopmentAvailable] = useState(false);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setReport(null);
    setError("");
    setDenied(false);
    void Promise.all([
      api("/admin/analytics/report?days=" + days + "&source=" + source),
      api("/admin/session"),
    ])
      .then(([r, staff]) => {
        if (live) {
          setReport(r);
          setPermissions(staff.permissions ?? []);
          setDevelopmentAvailable(r.developmentAvailable);
        }
      })
      .catch((e) => {
        if (!live) return;
        setDenied(e instanceof ApiError && e.status === 403);
        setError(
          e instanceof ApiError && e.status === 403
            ? "This workspace requires the explicit analytics.read permission."
            : e instanceof ApiError && e.status === 401
              ? "Your staff session has ended. Sign in again to continue."
              : "The report could not be loaded. Please try again.",
        );
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [days, source, revision]);
  const can = (permission: string) => permissions.includes(permission),
    s = report?.summary,
    total = report?.inventory.reduce((n, r) => n + r.count, 0) ?? 0;
  const kpis =
    report && s
      ? dashboard
        ? [
            {
              label: "Qualified views",
              value: count(s.views),
              note: "Selected audience period",
              icon: "video",
            },
            {
              label: "Active viewers",
              value: count(s.active),
              note: "Distinct customer accounts",
              icon: "users",
            },
            {
              label: "Discoverable catalog",
              value: count(total),
              note: "Current Discovery index",
              icon: "grid",
            },
            {
              label: "Open reports",
              value: count(report.operations.openReports),
              note: "Current moderation queue",
              icon: "review",
            },
          ]
        : [
            {
              label: "Qualified views",
              value: count(s.views),
              note: "Full-content sessions meeting the threshold",
              icon: "video",
            },
            {
              label: "Active viewers",
              value: count(s.active),
              note: "Distinct customer accounts",
              icon: "users",
            },
            {
              label: "Credited watch time",
              value: durationLabel(s.seconds),
              note: "Bounded full-content playback time",
              icon: "clock",
            },
            {
              label: "Session completion",
              value:
                s.completionPercent === null
                  ? "Unavailable"
                  : decimal(s.completionPercent) + "%",
              note:
                s.completionPercent === null
                  ? "No qualifying sessions to compare"
                  : "Qualifying sessions reaching 90%",
              icon: "check",
            },
          ]
      : [];
  return (
    <div className="analytics-page av-workspace">
      <header className="an-hero">
        <div>
          <span className="an-eyebrow">
            <MediaIcon name={dashboard ? "grid" : "chart"} size={16} />
            {dashboard ? "MGTV WORKSPACE" : "AUDIENCE INTELLIGENCE"}
          </span>
          <h2>
            {dashboard
              ? "Your platform, at a glance."
              : "Every play, in perspective."}
          </h2>
          <p>
            {dashboard
              ? "Follow the audience, see what needs attention and pick up where your team left off."
              : "Explore qualified playback and returning viewers with a clear view of what each number means."}
          </p>
        </div>
        <Link
          to={dashboard ? "/admin/analytics" : "/admin/dashboard"}
          className="btn"
        >
          {dashboard ? "Open audience report" : "Back to dashboard"}
          <MediaIcon name="arrow" size={17} />
        </Link>
      </header>
      <section
        className="an-report-controls"
        aria-label="Audience report controls"
      >
        <div className="an-period-fields">
          <label>
            Audience period
            <select
              className="input"
              value={days}
              disabled={loading}
              onChange={(e) => setDays(e.target.value)}
            >
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </label>
          <label>
            Audience source
            <select
              className="input"
              value={source}
              disabled={loading}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="observed">Observed activity</option>
              {developmentAvailable && (
                <option value="development">Synthetic development data</option>
              )}
            </select>
          </label>
        </div>
        <button
          className="btn"
          type="button"
          disabled={loading}
          onClick={() => setRevision((v) => v + 1)}
        >
          <MediaIcon name="refresh" size={17} />
          {loading ? "Refreshing..." : "Refresh report"}
        </button>
      </section>
      {loading ? (
        <div className="an-loading" aria-busy="true">
          <LoadingState
            variant="dashboard"
            label="Loading audience and current operations"
          />
          <div className="an-main-grid" aria-hidden="true">
            <div className="an-panel an-chart-placeholder">
              <span className="ui-skeleton ui-skeleton-line" />
              <div className="ui-skeleton" />
            </div>
            <div className="an-panel an-chart-placeholder">
              <span className="ui-skeleton ui-skeleton-line" />
              <div className="ui-skeleton" />
            </div>
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title={denied ? "Analytics access required" : "Report unavailable"}
          message={error}
          onRetry={denied ? undefined : () => setRevision((v) => v + 1)}
        />
      ) : (
        report &&
        s && (
          <>
            <div className="an-report-meta">
              <div>
                <span
                  className={
                    "an-source " +
                    (report.source === "development" ? "an-source-demo" : "")
                  }
                >
                  <span className="an-dot" />
                  {report.source === "development"
                    ? "Synthetic audience data"
                    : "Observed audience activity"}
                </span>
                <span>
                  {dayLabel(report.range.start)} -{" "}
                  {dayLabel(lastDay(report.range.endExclusive))}{" "}
                  <span className="an-muted">
                    / Jamaica time / today is partial
                  </span>
                </span>
              </div>
              <small>Updated {momentLabel(report.generatedAt)}</small>
            </div>
            {report.source === "development" && (
              <p className="an-notice">
                <MediaIcon name="review" />
                Audience charts use fictional development activity. Operational
                counts and staff activity remain current database records.
              </p>
            )}
            {dashboard && (
              <>
                <div className="an-section-label">
                  <h3>Keep things moving</h3>
                  <span>
                    Current queues, independent of the audience period
                  </span>
                </div>
                <AttentionQueue operations={report.operations} can={can} />
              </>
            )}
            <section className="an-kpis" aria-label="Report summary">
              {kpis.map((k) => (
                <article key={k.label}>
                  <span className="an-icon">
                    <MediaIcon name={k.icon} />
                  </span>
                  <span className="an-kpi-label">{k.label}</span>
                  <strong>{k.value}</strong>
                  <small>{k.note}</small>
                </article>
              ))}
            </section>
            <div className="an-main-grid">
              <DailyTrend
                key={source + days}
                daily={report.daily}
                initialMetric={dashboard ? "views" : "active"}
              />
              {dashboard ? (
                <CatalogBreakdown inventory={report.inventory} can={can} />
              ) : (
                <DeviceBreakdown devices={report.devices} />
              )}
            </div>
            {!dashboard && (
              <>
                <section className="an-insights" aria-label="Audience context">
                  <div>
                    <MediaIcon name="users" />
                    <span>
                      Average daily active viewers
                      <strong>{decimal(s.averageDailyActive, 2)}</strong>
                    </span>
                  </div>
                  <div>
                    <MediaIcon name="clock" />
                    <span>
                      Average credited session
                      <strong>{durationLabel(s.averageWatchSeconds)}</strong>
                    </span>
                  </div>
                  <div>
                    <MediaIcon name="video" />
                    <span>
                      Credited sessions<strong>{count(s.sessions)}</strong>
                    </span>
                  </div>
                </section>
                <TopContent key={source + days} rows={report.top} can={can} />
                <Retention rows={report.retention} />
              </>
            )}
            {dashboard && <RecentActivity rows={report.activity} can={can} />}
            <AnalyticsPanel
              title="Know what you are measuring"
              icon="review"
              note="Definitions, coverage and current reporting limits."
            >
              <div className="an-coverage">
                <MediaIcon name="calendar" />
                <p>
                  {s.availableFrom
                    ? "Playback observations available from " +
                      momentLabel(s.availableFrom) +
                      "."
                    : "No playback observations are available yet."}{" "}
                  Counts reflect captured activity, not historical traffic
                  imported from another service.
                </p>
              </div>
              <details className="an-details">
                <summary>
                  Metric definitions{" "}
                  <span>{Object.keys(report.definitions).length} notes</span>
                </summary>
                <dl className="an-definitions">
                  {Object.entries(report.definitions).map(([key, value]) => (
                    <div key={key}>
                      <dt>{titleCase(key)}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </details>
              <p className="an-footnote">
                Subscriber growth and commercial revenue reporting are not
                included in this audience report. Sandbox orders do not
                establish real revenue.
              </p>
            </AnalyticsPanel>
          </>
        )
      )}
    </div>
  );
}
