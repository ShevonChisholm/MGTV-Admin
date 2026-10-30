import MediaIcon from "./MediaIcon";
export type SettingValues = {
  orgName: string;
  supportEmail: string | null;
  defaultLanguage: string;
  defaultTimezone: string;
  alertReports: boolean;
  alertCampaignReview: boolean;
  weeklyDigest: boolean;
};
export const settingLabels: Record<keyof SettingValues, string> = {
  orgName: "Organization name",
  supportEmail: "Support email",
  defaultLanguage: "Default language",
  defaultTimezone: "Default timezone",
  alertReports: "New moderation reports",
  alertCampaignReview: "Campaigns waiting for review",
  weeklyDigest: "Weekly activity digest",
};
export const settingValue = (value: unknown) =>
  value === null || value === ""
    ? "Not configured"
    : typeof value === "boolean"
      ? value
        ? "Preference on"
        : "Preference off"
      : String(value);
export const settingsDate = (value: string) =>
  new Date(value).toLocaleString("en-JM", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Jamaica",
  });
export default function SettingsHero({
  record,
}: {
  record: SettingValues & { version: number };
}) {
  return (
    <header className="platform-v-hero">
      <div>
        <span className="platform-v-eyebrow">
          <MediaIcon name="grid" size={16} />
          PLATFORM DEFAULTS
        </span>
        <h2>A clear foundation for MGTV.</h2>
        <p>
          Keep your organization details, default preferences and recorded
          changes easy to understand.
        </p>
      </div>
      <div className="platform-v-version">
        <MediaIcon name="archive" size={26} />
        <strong>v{record.version}</strong>
        <span>Saved configuration</span>
      </div>
    </header>
  );
}
export function SettingsSavedSummary({ record }: { record: SettingValues }) {
  return (
    <section className="platform-v-saved" aria-label="Saved platform defaults">
      {[
        { icon: "brand", label: "Organization", value: record.orgName },
        {
          icon: "mail",
          label: "Support email",
          value: record.supportEmail || "Not configured",
        },
        {
          icon: "globe",
          label: "Language preference",
          value: record.defaultLanguage,
        },
        {
          icon: "clock",
          label: "Default timezone",
          value: record.defaultTimezone,
        },
      ].map((s) => (
        <div key={s.label}>
          <span className="platform-v-icon">
            <MediaIcon name={s.icon} />
          </span>
          <div>
            <small>{s.label}</small>
            <strong>{s.value}</strong>
          </div>
        </div>
      ))}
    </section>
  );
}
export function SettingsSectionTitle({
  icon,
  title,
  note,
}: {
  icon: string;
  title: string;
  note: string;
}) {
  return (
    <header className="platform-v-section-title">
      <span className="platform-v-icon">
        <MediaIcon name={icon} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{note}</p>
      </div>
    </header>
  );
}
export function SettingsDiff({
  before,
  after,
}: {
  before: SettingValues;
  after: SettingValues;
}) {
  const changed = (
    Object.keys(settingLabels) as (keyof SettingValues)[]
  ).filter((k) => before[k] !== after[k]);
  return (
    <section className="platform-v-diff" aria-label="Pending setting changes">
      <div className="platform-v-diff-heading">
        <MediaIcon name="review" />
        <div>
          <h3>
            {changed.length
              ? changed.length +
                " pending " +
                (changed.length === 1 ? "change" : "changes")
              : "No pending changes"}
          </h3>
          <p>Compare your draft with the currently loaded saved version.</p>
        </div>
      </div>
      {changed.length ? (
        <ol>
          {changed.map((k) => (
            <li key={k}>
              <strong>{settingLabels[k]}</strong>
              <div>
                <span>
                  <small>Saved</small>
                  {settingValue(before[k])}
                </span>
                <MediaIcon name="arrow" size={16} />
                <span>
                  <small>Draft</small>
                  {settingValue(after[k])}
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="platform-v-muted">
          Edit organization details or staff preferences, then return here to
          review and save.
        </p>
      )}
    </section>
  );
}
export function SettingsHistory({ items }: { items: any[] }) {
  return (
    <section className="platform-v-history">
      <SettingsSectionTitle
        icon="clock"
        title="Configuration history"
        note="Newest versions first. Earlier versions remain immutable; restoring values requires a new save."
      />
      {items.map((h) => (
        <details key={h.version}>
          <summary>
            <span className="platform-v-history-version">v{h.version}</span>
            <strong>{h.actor}</strong>
            <time dateTime={h.createdAt}>{settingsDate(h.createdAt)}</time>
          </summary>
          <div>
            <p className="platform-v-history-reason">{h.reason}</p>
            <dl>
              {(Object.keys(settingLabels) as (keyof SettingValues)[]).map(
                (k) => (
                  <div key={k}>
                    <dt>{settingLabels[k]}</dt>
                    <dd>{settingValue(h.body[k])}</dd>
                  </div>
                ),
              )}
            </dl>
          </div>
        </details>
      ))}
      {!items.length && (
        <p className="platform-v-muted">No history entries loaded.</p>
      )}
    </section>
  );
}
