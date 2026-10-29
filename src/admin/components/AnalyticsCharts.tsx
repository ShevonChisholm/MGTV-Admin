import { useState, type ReactNode } from "react";
import AccessTable from "./AccessVisual";
import MediaIcon from "./MediaIcon";
import {
  count,
  decimal,
  dayLabel,
  metricLabel,
  metricValue,
  type Daily,
  type Metric,
  type AnalyticsReport,
} from "./analytics-model";
export function AnalyticsPanel({
  title,
  note,
  icon = "grid",
  children,
  className = "",
}: {
  title: string;
  note?: string;
  icon?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={"an-panel " + className}>
      <header className="an-panel-heading">
        <span className="an-icon">
          <MediaIcon name={icon} />
        </span>
        <div>
          <h3>{title}</h3>
          {note && <p>{note}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
export function DailyTrend({
  daily,
  initialMetric = "views",
}: {
  daily: Daily[];
  initialMetric?: Metric;
}) {
  const [metric, setMetric] = useState<Metric>(initialMetric),
    [selection, setSelection] = useState(-1),
    [query, setQuery] = useState("");
  const index = Math.max(
      0,
      Math.min(daily.length - 1, selection < 0 ? daily.length - 1 : selection),
    ),
    selected = daily[index];
  const values = daily.map((d) => metricValue(d, metric)),
    peak = Math.max(0, ...values),
    ceiling = Math.max(4, Math.ceil(peak / 4) * 4);
  const x = (i: number) => 52 + (i / Math.max(1, daily.length - 1)) * 680,
    y = (n: number) => 214 - (n / ceiling) * 184;
  const points = values.map((v, i) => x(i) + "," + y(v)).join(" ");
  const rows = daily.filter((d) => d.day.includes(query.trim()));
  return (
    <AnalyticsPanel
      title="Audience over time"
      note="Jamaica calendar days. Today is still in progress."
      icon="chart"
    >
      <div className="an-chart-toolbar">
        <div className="an-segments" role="group" aria-label="Chart metric">
          {(["views", "active", "minutes"] as Metric[]).map((m) => (
            <button
              type="button"
              key={m}
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
            >
              {metricLabel[m]}
            </button>
          ))}
        </div>
        <div className="an-chart-total">
          <small>Daily peak</small>
          <strong>{metric === "minutes" ? decimal(peak) : count(peak)}</strong>
        </div>
      </div>
      <div className="an-chart">
        <svg
          viewBox="0 0 760 250"
          role="img"
          aria-label={
            metricLabel[metric] +
            " by day. Exact daily values are available in the date inspector and daily data table."
          }
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line
                x1="52"
                x2="732"
                y1={y((ceiling * i) / 4)}
                y2={y((ceiling * i) / 4)}
                stroke="currentColor"
                className="an-grid-line"
              />
              <text
                x="42"
                y={y((ceiling * i) / 4) + 4}
                textAnchor="end"
                className="an-axis-label"
              >
                {count((ceiling * i) / 4)}
              </text>
            </g>
          ))}
          {daily.length > 0 && (
            <>
              <polygon
                points={"52,214 " + points + " 732,214"}
                fill="currentColor"
                opacity=".09"
              />
              <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinejoin="round"
              />
              {selected && (
                <>
                  <line
                    x1={x(index)}
                    x2={x(index)}
                    y1="24"
                    y2="214"
                    stroke="currentColor"
                    strokeDasharray="4 5"
                    opacity=".4"
                  />
                  <circle
                    cx={x(index)}
                    cy={y(metricValue(selected, metric))}
                    r="5"
                    fill="currentColor"
                    stroke="var(--card)"
                    strokeWidth="2"
                  />
                </>
              )}
            </>
          )}
          <text x="52" y="242" className="an-axis-label">
            {daily[0] ? dayLabel(daily[0].day) : ""}
          </text>
          <text x="732" y="242" textAnchor="end" className="an-axis-label">
            {daily.at(-1) ? dayLabel(daily.at(-1)!.day) : ""}
          </text>
        </svg>
      </div>
      {peak === 0 && (
        <p className="an-empty-note">
          <MediaIcon name="chart" size={17} />
          No {metricLabel[metric].toLowerCase()} recorded in this period. Zero
          is shown as zero.
        </p>
      )}
      {selected && (
        <div className="an-inspector">
          <label>
            Inspect a day
            <input
              type="range"
              min="0"
              max={daily.length - 1}
              value={index}
              onChange={(e) => setSelection(Number(e.target.value))}
              aria-valuetext={
                dayLabel(selected.day) +
                ": " +
                decimal(metricValue(selected, metric)) +
                " " +
                metricLabel[metric]
              }
            />
          </label>
          <output>
            <strong>{dayLabel(selected.day)}</strong>
            <span>{count(selected.views)} views</span>
            <span>{count(selected.active)} viewers</span>
            <span>{decimal(selected.seconds / 60)} min</span>
          </output>
        </div>
      )}
      <details className="an-details">
        <summary>
          Daily data <span>{daily.length} days</span>
        </summary>
        <label className="an-search">
          Filter daily rows by date
          <input
            className="input"
            type="search"
            value={query}
            placeholder="YYYY-MM-DD"
            maxLength={10}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <AccessTable
          key={query}
          label="Daily playback data"
          rows={rows}
          rowKey={(r) => r.day}
          scope="days in this report"
          columns={[
            { key: "day", label: "Jamaica date", render: (r) => r.day },
            { key: "active", label: "Viewers", render: (r) => count(r.active) },
            { key: "views", label: "Views", render: (r) => count(r.views) },
            {
              key: "minutes",
              label: "Minutes",
              render: (r) => decimal(r.seconds / 60),
            },
          ]}
        />
      </details>
    </AnalyticsPanel>
  );
}
export function DeviceBreakdown({ devices }: Pick<AnalyticsReport, "devices">) {
  const total = devices.reduce((sum, d) => sum + d.sessions, 0),
    colors = ["#c9a84c", "#72b8b0", "#9a92d0", "#aeb4c0"];
  let offset = 0;
  return (
    <AnalyticsPanel
      title="Where people play"
      note="Reported browser size, not identified hardware."
      icon="devices"
    >
      <div className="an-device-ring">
        <svg
          viewBox="0 0 180 180"
          role="img"
          aria-label={
            total
              ? count(total) + " credited sessions by browser form factor"
              : "No browser form-factor observations"
          }
        >
          <circle
            cx="90"
            cy="90"
            r="63"
            fill="none"
            stroke="var(--border)"
            strokeWidth="16"
          />
          {devices.map((d, i) => {
            const length = total ? (d.sessions / total) * 396 : 0,
              start = offset;
            offset += length;
            return (
              <circle
                key={d.device}
                cx="90"
                cy="90"
                r="63"
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="16"
                strokeDasharray={length + " " + (396 - length)}
                strokeDashoffset={-start}
                transform="rotate(-90 90 90)"
              />
            );
          })}
          <text x="90" y="88" textAnchor="middle" className="an-ring-value">
            {count(total)}
          </text>
          <text x="90" y="108" textAnchor="middle" className="an-axis-label">
            sessions
          </text>
        </svg>
      </div>
      <div className="an-device-list">
        {devices.map((d, i) => (
          <div key={d.device}>
            <span
              className="an-dot"
              style={{ background: colors[i % colors.length] }}
            />
            <span>{title(d.device)}</span>
            <strong>{count(d.sessions)}</strong>
            <small>{total ? decimal((d.sessions / total) * 100) : "0"}%</small>
          </div>
        ))}
      </div>
      {!total && (
        <p className="an-empty-note">No credited sessions to group yet.</p>
      )}
    </AnalyticsPanel>
  );
}
function title(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function Retention({ rows }: { rows: AnalyticsReport["retention"] }) {
  return (
    <AnalyticsPanel
      title="Returning month after month"
      icon="refresh"
      note="Six completed months. Each rate compares with the preceding month."
    >
      <div className="an-retention">
        {rows.map((r) => (
          <div key={r.month}>
            <strong>
              {r.percent === null ? "Unavailable" : decimal(r.percent) + "%"}
            </strong>
            <div className="an-retention-track">
              <span
                style={{ height: r.percent === null ? "0" : r.percent + "%" }}
              />
            </div>
            <time dateTime={r.month}>
              {new Date(r.month + "T12:00:00Z").toLocaleDateString("en-JM", {
                month: "short",
                year: "2-digit",
                timeZone: "America/Jamaica",
              })}
            </time>
            <small>
              {count(r.retained)} / {count(r.previous)} returned
            </small>
          </div>
        ))}
      </div>
      <p className="an-footnote">
        No preceding audience means unavailable, rather than a zero-percent
        return rate.
      </p>
    </AnalyticsPanel>
  );
}
