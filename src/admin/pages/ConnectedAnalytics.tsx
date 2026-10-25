import LoadingState from "../components/LoadingState";
import StaffAuth from "./StaffAuth";
import { useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "../api/client";
import { Link } from "../router";
import "./analytics.css";
const colors = [
  "#C9A84C",
  "#3b82f6",
  "#a855f7",
  "#22c55e",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
];
const number = (n: number) => new Intl.NumberFormat().format(Math.round(n));
const percent = (n: number | null) => (n === null ? "—" : `${n}%`);
const date = (s: string) =>
  new Date(s + "T12:00:00Z").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="analytics-panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function Line({
  values,
  color,
  label,
}: {
  values: number[];
  color: string;
  label: string;
}) {
  const max = Math.max(1, ...values),
    points = values
      .map(
        (v, i) =>
          `${8 + (i / Math.max(1, values.length - 1)) * 584},${128 - (v / max) * 112}`,
      )
      .join(" ");
  return (
    <svg
      viewBox="0 0 600 140"
      width="100%"
      height="140"
      role="img"
      aria-label={label}
    >
      <polygon points={`8,132 ${points} 592,132`} fill={color} opacity="0.14" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function ConnectedAnalytics({
  dashboard = false,
}: {
  dashboard?: boolean;
}) {
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [days, setDays] = useState("30"),
    [source, setSource] = useState("observed"),
    [report, setReport] = useState<any>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0),
    [developmentAvailable, setDevelopmentAvailable] = useState(false);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setReport(null);
    setError("");
    setUnauthenticated(false);
    void api("/admin/analytics/report?days=" + days + "&source=" + source)
      .then((r) => {
        if (live) {
          setReport(r);
          setDevelopmentAvailable(r.developmentAvailable);
        }
      })
      .catch((e) => {
        if (live && e instanceof ApiError && e.status === 401)
          setUnauthenticated(true);
        if (live)
          setError(
            e instanceof ApiError && e.status === 403
              ? "You need the explicit analytics.read permission to view this page."
              : (e.message ?? "Analytics could not be loaded."),
          );
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [days, source, revision]);
  if (unauthenticated && !loading)
    return (
      <StaffAuth
        onAuthenticated={async () => {
          setRevision((x) => x + 1);
        }}
      />
    );
  const s = report?.summary,
    inventory = report?.inventory ?? [],
    total = inventory.reduce((n: number, x: any) => n + x.count, 0),
    devices = report?.devices ?? [],
    deviceTotal = devices.reduce((n: number, x: any) => n + x.sessions, 0);
  const kpis = report
    ? dashboard
      ? [
          ["Qualified Views", number(s.views), "Selected period"],
          ["Active Viewers", number(s.active), "Distinct customer accounts"],
          ["Published Content", number(total), "Current catalog inventory"],
          [
            "Open Reports",
            number(report.operations.openReports),
            "Current moderation queue",
          ],
        ]
      : [
          [
            "Avg. Daily Active Viewers",
            new Intl.NumberFormat(undefined, {
              maximumFractionDigits: 2,
            }).format(s.averageDailyActive),
            "Full-content playback accounts",
          ],
          [
            "Avg. Playback Time",
            `${(s.averageWatchSeconds / 60).toFixed(1)} min`,
            "Per session with credited activity",
          ],
          [
            "Content Completion Rate",
            percent(s.completionPercent),
            "90% of runtime credited",
          ],
          ["Subscriber Growth", "—", "Provider reporting deferred"],
        ]
    : [];
  let deviceOffset = 0;
  return (
    <div className="analytics-page" aria-busy={loading}>
      <div className="analytics-toolbar">
        <p>
          {report
            ? `${date(report.range.start)} – ${date(new Date(new Date(report.range.endExclusive + "T12:00:00Z").getTime() - 86400000).toISOString().slice(0, 10))} · Jamaica time`
            : "Audience & operations"}
        </p>
        <div>
          <label>
            Period{" "}
            <select value={days} onChange={(e) => setDays(e.target.value)}>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </label>
          <label>
            Audience data{" "}
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="observed">Observed activity</option>
              {developmentAvailable && (
                <option value="development">Development sample</option>
              )}
            </select>
          </label>
          <button
            className="btn btn-sm"
            onClick={() => setRevision((x) => x + 1)}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      {loading && (
        <LoadingState label={<>Loading analytics…</>} variant="dashboard" />
      )}
      {error && (
        <div role="alert" className="analytics-panel">
          {error}
          <button
            className="btn btn-sm"
            onClick={() => setRevision((x) => x + 1)}
          >
            Retry
          </button>
        </div>
      )}
      {report && (
        <>
          <p className="analytics-notice">
            {source === "development"
              ? "Development sample: synthetic audience figures only. Operational counts and staff activity below remain real database records."
              : "Observed full-content playback only. Previews, hero clips, advertisements and sign-ins are excluded."}{" "}
            Today is partial.
          </p>
          {dashboard && (
            <nav
              className="analytics-attention"
              aria-label="Waiting for attention"
            >
              <Link to="/admin/moderation" className="btn btn-sm">
                {report.operations.openReports} open reports
              </Link>
              <Link to="/admin/advertising/campaigns" className="btn btn-sm">
                {report.operations.campaignsInReview} campaigns awaiting review
              </Link>
              <Link to="/admin/events" className="btn btn-sm">
                {report.operations.scheduledEvents} published scheduled events
              </Link>
            </nav>
          )}
          <div className="analytics-kpis">
            {kpis.map(([label, value, note]) => (
              <section key={label} className="analytics-panel">
                <h2>{label}</h2>
                <strong>{value}</strong>
                <p>{note}</p>
              </section>
            ))}
          </div>
          {!s.sessions && (
            <p role="status" className="analytics-notice">
              No credited playback in this period. Start full-content playback
              to record activity
              {developmentAvailable
                ? ", or choose Development sample to review the charts"
                : ""}
              .
            </p>
          )}
          <div className={dashboard ? "analytics-columns" : "analytics-full"}>
            <Panel
              title={
                dashboard
                  ? "Daily Qualified Views"
                  : `Daily Active Viewers — Last ${days} days`
              }
            >
              <p>
                {dashboard
                  ? `${number(s.views)} qualified sessions`
                  : `Peak: ${number(Math.max(...report.daily.map((x: any) => x.active)))} · Today: ${number(report.daily.at(-1).active)}`}
              </p>
              <Line
                values={report.daily.map((x: any) =>
                  dashboard ? x.views : x.active,
                )}
                color={dashboard ? colors[0] : colors[1]}
                label={
                  dashboard
                    ? "Daily qualified playback sessions"
                    : "Distinct playback accounts per day"
                }
              />
              <div className="analytics-axis">
                <span>{date(report.range.start)}</span>
                <span>{date(report.daily.at(-1).day)}</span>
              </div>
              <details>
                <summary>View daily data</summary>
                <div className="analytics-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Viewers</th>
                        <th>Views</th>
                        <th>Minutes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.daily.map((x: any) => (
                        <tr key={x.day}>
                          <td>{x.day}</td>
                          <td>{x.active}</td>
                          <td>{x.views}</td>
                          <td>{(x.seconds / 60).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </Panel>
            {dashboard && (
              <Panel title="Published Content by Type">
                {inventory.length ? (
                  inventory.map((x: any, i: number) => (
                    <div className="analytics-bar" key={x.kind}>
                      <div>
                        <span>{x.kind}</span>
                        <span>{number(x.count)}</span>
                      </div>
                      <meter
                        min="0"
                        max={total}
                        value={x.count}
                        aria-label={`${x.kind}: ${x.count}`}
                        style={{ accentColor: colors[i % colors.length] }}
                      />
                    </div>
                  ))
                ) : (
                  <p>No published catalog records.</p>
                )}
                <p>
                  Inventory distribution; not viewing interest. Shop products
                  are managed separately.
                </p>
              </Panel>
            )}
          </div>
          {!dashboard && (
            <>
              <div className="analytics-columns">
                <Panel title="Top Content by Qualified Views">
                  {report.top.length ? (
                    report.top.map((x: any, i: number) => (
                      <div className="analytics-bar" key={x.kind + x.id}>
                        <div>
                          <span>
                            {x.title} <small>· {x.kind}</small>
                          </span>
                          <span>{number(x.views)}</span>
                        </div>
                        <meter
                          min="0"
                          max={Math.max(
                            1,
                            ...report.top.map((t: any) => t.views),
                          )}
                          value={x.views}
                          aria-label={`${x.title}: ${x.views} views`}
                          style={{ accentColor: colors[i % colors.length] }}
                        />
                      </div>
                    ))
                  ) : (
                    <p>No qualified views yet.</p>
                  )}
                </Panel>
                <Panel title="Browser Form Factor">
                  <div className="analytics-donut">
                    <svg
                      viewBox="0 0 160 160"
                      width="160"
                      height="160"
                      role="img"
                      aria-label={
                        deviceTotal
                          ? "Playback sessions by reported browser form factor"
                          : "No device observations"
                      }
                    >
                      <circle
                        cx="80"
                        cy="80"
                        r="60"
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="18"
                      />
                      {devices.map((d: any, i: number) => {
                        const len = (d.sessions / deviceTotal) * 377,
                          offset = deviceOffset;
                        deviceOffset += len;
                        return (
                          <circle
                            key={d.device}
                            cx="80"
                            cy="80"
                            r="60"
                            fill="none"
                            stroke={colors[i % colors.length]}
                            strokeWidth="18"
                            strokeDasharray={`${len} ${377 - len}`}
                            strokeDashoffset={-offset}
                            transform="rotate(-90 80 80)"
                          />
                        );
                      })}
                      <text
                        x="80"
                        y="80"
                        textAnchor="middle"
                        fill="var(--text-primary)"
                        fontSize="18"
                      >
                        {number(deviceTotal)}
                      </text>
                      <text
                        x="80"
                        y="97"
                        textAnchor="middle"
                        fill="var(--text-muted)"
                        fontSize="10"
                      >
                        sessions
                      </text>
                    </svg>
                  </div>
                  {devices.map((d: any, i: number) => (
                    <div className="analytics-device" key={d.device}>
                      <span>
                        <i style={{ background: colors[i % colors.length] }} />
                        {d.device}
                      </span>
                      <span>
                        {((100 * d.sessions) / deviceTotal).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  {!devices.length && <p>No device observations.</p>}
                </Panel>
              </div>
              <Panel title="Monthly Returning Viewer Rate">
                <p>
                  Six completed months · audience active in the preceding month
                  who returned.
                </p>
                <div className="analytics-retention">
                  {report.retention.map((x: any) => (
                    <div key={x.month}>
                      <span>{percent(x.percent)}</span>
                      <div
                        style={{
                          height:
                            x.percent === null
                              ? 2
                              : Math.max(2, x.percent * 0.65),
                          background:
                            x.percent === null ? "var(--border)" : "#3b82f6",
                        }}
                      />
                      <span>
                        {new Date(x.month + "T12:00:00Z").toLocaleDateString(
                          undefined,
                          { month: "short", year: "2-digit" },
                        )}
                      </span>
                      <small>
                        {x.retained}/{x.previous}
                      </small>
                    </div>
                  ))}
                </div>
                <p>— means no preceding audience; the rate is unavailable.</p>
              </Panel>
            </>
          )}
          {dashboard && (
            <Panel title="Recent Staff Activity">
              <p>Latest audited operations · current database</p>
              {report.activity.length ? (
                report.activity.map((x: any) => (
                  <div className="analytics-activity" key={x.id}>
                    <span className="analytics-avatar" aria-hidden="true">
                      {x.actor
                        .split(" ")
                        .map((v: string) => v[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <b>{x.actor}</b>
                      <span>
                        {x.action.replaceAll(".", " · ").replaceAll("_", " ")}
                      </span>
                    </div>
                    <time dateTime={x.createdAt}>
                      {new Date(x.createdAt).toLocaleString(undefined, {
                        timeZone: "America/Jamaica",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                ))
              ) : (
                <p>No audited staff activity.</p>
              )}
            </Panel>
          )}
          <details className="analytics-panel">
            <summary>Metric definitions & coverage</summary>
            {Object.entries(report.definitions).map(([key, value]) => (
              <p key={key}>
                <b className="analytics-capitalize">{key}: </b>
                {String(value)}
              </p>
            ))}
            <p>
              First recorded session:{" "}
              {s.availableFrom
                ? new Date(s.availableFrom).toLocaleString()
                : "None"}
              . Refreshed: {new Date(report.generatedAt).toLocaleString()}.
            </p>
          </details>
        </>
      )}
    </div>
  );
}
