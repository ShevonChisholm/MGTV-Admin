import LoadingState from "../components/LoadingState";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { useDirtyGuard } from "../router";
import { Card, TextField, SelectField, Modal } from "../ui";
import { PageActions } from "../components/PageHeader";
import { Note, TIMEZONES, isEmail } from "../ui/ops";
import StaffAuth from "./StaffAuth";
import MediaIcon from "../components/MediaIcon";
import SettingsHero, {
  SettingsSavedSummary,
  SettingsSectionTitle,
  SettingsDiff,
  SettingsHistory,
  settingsDate,
  type SettingValues,
} from "../components/SettingsVisual";
import "./platform-settings.css";
type Values = SettingValues;
const fields = (r: any): Values => ({
  orgName: r.orgName,
  supportEmail: r.supportEmail,
  defaultLanguage: r.defaultLanguage,
  defaultTimezone: r.defaultTimezone,
  alertReports: r.alertReports,
  alertCampaignReview: r.alertCampaignReview,
  weeklyDigest: r.weeklyDigest,
});
function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="platform-v-toggle">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="platform-v-switch" aria-hidden="true" />
      <span className="platform-v-toggle-copy">
        <strong>{label}</strong>
        <small>{hint}</small>
        <span>
          {checked ? "Preference on" : "Preference off"} / delivery pending
        </span>
      </span>
    </label>
  );
}
export default function ConnectedSettings() {
  const [section, setSection] = useState("organization");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [session, setSession] = useState<any>(null),
    [record, setRecord] = useState<any>(null),
    [draft, setDraft] = useState<Values | null>(null),
    [history, setHistory] = useState<any[]>([]),
    [next, setNext] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [unauth, setUnauth] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [conflict, setConflict] = useState(false),
    [reload, setReload] = useState(false);
  const key = useRef<{ body: string; key: string } | null>(null);
  const dirty =
    !!draft &&
    !!record &&
    JSON.stringify(draft) !== JSON.stringify(fields(record));
  useDirtyGuard(() => dirty);
  const allowed =
    session?.permissions.includes("settings.manage") &&
    session?.permissions.includes("settings.read");
  async function load() {
    setBusy(true);
    setError("");
    setUnauth(false);
    setFieldErrors({});
    try {
      const s = await api("/admin/session");
      setSession(s);
      if (!s.permissions.includes("settings.read"))
        throw Error(
          "You need the explicit settings.read permission to view Platform Settings.",
        );
      const [r, h] = await Promise.all([
        api("/admin/settings"),
        api("/admin/settings/history"),
      ]);
      setRecord(r);
      setDraft(fields(r));
      setHistory(h.items);
      setNext(h.nextBefore);
      setReason("");
      setConflict(false);
      key.current = null;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setUnauth(true);
      setError(
        e instanceof ApiError && e.payload.issues?.length
          ? e.payload.issues.map((x: any) => x.message).join(" ")
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
      setLoaded(true);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const set = <K extends keyof Values>(k: K, v: Values[K]) => {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
    setNotice("");
    setFieldErrors((e) => ({ ...e, [k]: "" }));
  };
  async function save() {
    if (!draft || !record || !allowed) return;
    const errors: Record<string, string> = {};
    if (!draft.orgName.trim())
      errors.orgName = "Organization name is required.";
    if (draft.supportEmail?.trim() && !isEmail(draft.supportEmail.trim()))
      errors.supportEmail =
        "Enter a valid support email address or leave it blank.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setSection("organization");
      setError("Review the highlighted fields before saving.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const body = {
        ...draft,
        orgName: draft.orgName.trim(),
        supportEmail: draft.supportEmail?.trim() || null,
        reason: reason.trim(),
      },
      fingerprint = JSON.stringify({ version: record.version, ...body });
    if (!key.current || key.current.body !== fingerprint)
      key.current = { body: fingerprint, key: crypto.randomUUID() };
    try {
      const r = await api(
        "/admin/settings",
        "PUT",
        body,
        record.version,
        key.current.key,
      );
      setRecord(r);
      setDraft(fields(r));
      setReason("");
      setConflict(false);
      key.current = null;
      setNotice("Settings saved to the database.");
      try {
        const h = await api("/admin/settings/history");
        setHistory(h.items);
        setNext(h.nextBefore);
      } catch {
        setNotice(
          "Settings saved. Change history could not refresh; reload to view it.",
        );
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 412) setConflict(true);
      setError(
        e instanceof ApiError && e.payload.issues?.length
          ? e.payload.issues.map((x: any) => x.message).join(" ")
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function more() {
    if (!next) return;
    setBusy(true);
    setError("");
    try {
      const h = await api("/admin/settings/history?before=" + next);
      setHistory((x) => [...x, ...h.items]);
      setNext(h.nextBefore);
    } catch (e) {
      setError(
        e instanceof ApiError && e.payload.issues?.length
          ? e.payload.issues.map((x: any) => x.message).join(" ")
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  if (!loaded)
    return (
      <LoadingState label={<>Loading Platform Settings...</>} variant="form" />
    );
  if (unauth) return <StaffAuth onAuthenticated={load} />;
  if (!record || !draft)
    return (
      <div className="page-pad">
        <p role="alert">{error}</p>
        <button className="btn" disabled={busy} onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  return (
    <div className="platform-v-workspace av-workspace" aria-busy={busy}>
      <SettingsHero record={record} />
      <SettingsSavedSummary record={record} />
      <nav className="platform-v-nav" aria-label="Settings sections">
        {[
          {
            id: "organization",
            label: "Organization & defaults",
            icon: "brand",
          },
          { id: "alerts", label: "Staff preferences", icon: "bell" },
          { id: "review", label: "Review & history", icon: "review" },
        ].map((item) => (
          <button
            type="button"
            className="btn"
            key={item.id}
            aria-pressed={section === item.id}
            onClick={() => setSection(item.id)}
          >
            <MediaIcon name={item.icon} size={17} />
            {item.label}
          </button>
        ))}
      </nav>
      <PageActions>
        <span
          role="status"
          style={{
            fontSize: 12.5,
            color: dirty ? "var(--yellow)" : "var(--green)",
            alignSelf: "center",
          }}
        >
          {dirty
            ? "Unsaved changes"
            : `Saved / v${record.version} / ${settingsDate(record.updatedAt)}`}
        </span>
        <button
          className="btn"
          disabled={busy || !dirty}
          onClick={() => {
            setDraft(fields(record));
            setReason("");
            setError("");
            setNotice("Unsaved changes discarded.");
            setFieldErrors({});
          }}
        >
          Discard changes
        </button>
        <button
          className="btn btn-primary"
          disabled={busy || !dirty}
          onClick={() => setSection("review")}
        >
          <MediaIcon name="review" size={16} />
          Review changes
        </button>
      </PageActions>
      {error && (
        <p
          role="alert"
          style={{ color: "var(--red)", overflowWrap: "anywhere" }}
        >
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {conflict && (
        <Note tone="bad" title="A newer version exists">
          Your draft is preserved. Reload the latest settings and review the
          changes before editing again.{" "}
          <button
            className="btn btn-sm"
            disabled={busy}
            onClick={() => setReload(true)}
          >
            Reload latest settings
          </button>
        </Note>
      )}
      {!allowed && (
        <Note title="Read-only" tone="bad">
          You have settings.read permission. Changing settings also requires the
          explicit settings.manage permission.
        </Note>
      )}
      <fieldset
        disabled={!allowed || busy}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        {section === "organization" && (
          <Card>
            <SettingsSectionTitle
              icon="brand"
              title="Organization & defaults"
              note="Changes stay in your draft until reviewed and saved."
            />
            <div className="grid-2">
              <TextField
                label="Organization name"
                error={fieldErrors.orgName}
                required
                maxLength={160}
                value={draft.orgName}
                onChange={(e) => set("orgName", e.target.value)}
                hint="Public organization name. The MGTV logo and legal policies are managed separately."
              />
              <TextField
                label="Support email"
                error={fieldErrors.supportEmail}
                type="email"
                maxLength={254}
                value={draft.supportEmail ?? ""}
                onChange={(e) => set("supportEmail", e.target.value || null)}
                hint="Public customer support address. Leave blank until confirmed; no email is sent by this setting."
              />
              <SelectField
                label="Default language"
                required
                value={draft.defaultLanguage}
                onChange={(e) => set("defaultLanguage", e.target.value)}
                options={record.languages}
                hint="Stored locale preference. This does not translate the interface or change existing profiles."
              />
              <SelectField
                label="Default timezone"
                required
                value={draft.defaultTimezone}
                onChange={(e) => set("defaultTimezone", e.target.value)}
                options={[...new Set([...TIMEZONES, draft.defaultTimezone])]}
                hint="Default for new event drafts without an explicit timezone. Existing events and Analytics remain unchanged."
              />
            </div>
          </Card>
        )}
        {section === "alerts" && (
          <Card>
            <SettingsSectionTitle
              icon="bell"
              title="Staff alert preferences"
              note="Store preferences now. Delivery and scheduled digests remain deferred."
            />
            <Toggle
              label="New moderation reports"
              hint="Save the preference for future staff alerts when a report opens."
              checked={draft.alertReports}
              onChange={(v) => set("alertReports", v)}
            />
            <Toggle
              label="Campaigns waiting for review"
              hint="Save the preference for future staff alerts when a campaign is submitted."
              checked={draft.alertCampaignReview}
              onChange={(v) => set("alertCampaignReview", v)}
            />
            <Toggle
              label="Weekly activity digest"
              hint="Save the preference for a future content, events and reports digest."
              checked={draft.weeklyDigest}
              onChange={(v) => set("weeklyDigest", v)}
            />
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                margin: "6px 0 0",
              }}
            >
              Preferences are stored in the database. Staff alert delivery and
              scheduled digests remain deferred; enabling a preference does not
              send anything.
            </p>
          </Card>
        )}
        {section === "review" && (
          <Card>
            <SettingsDiff before={fields(record)} after={draft} />
            <SettingsSectionTitle
              icon="edit"
              title="Record your decision"
              note="A saved update creates a new audited configuration version."
            />
            <TextField
              label="Reason for change"
              required
              value={reason}
              minLength={5}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
              hint="At least five characters. Saved changes and their reasons remain in the audit history."
            />
            <div className="platform-v-save-actions">
              <button
                className="btn btn-primary"
                disabled={
                  busy ||
                  !allowed ||
                  !dirty ||
                  reason.trim().length < 5 ||
                  conflict
                }
                onClick={() => void save()}
              >
                <MediaIcon name="check" size={16} />
                Save settings
              </button>
              <span>
                Save applies all pending fields, across every settings section.
              </span>
            </div>
          </Card>
        )}
      </fieldset>
      {section === "review" && (
        <Card>
          <SettingsHistory items={history} />
          {next && (
            <button className="btn" disabled={busy} onClick={() => void more()}>
              Load earlier changes
            </button>
          )}
        </Card>
      )}
      {reload && (
        <Modal title="Reload latest settings?" onClose={() => setReload(false)}>
          <p>
            This discards your unsaved draft and loads the current database
            version.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => setReload(false)}>
              Keep editing
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setReload(false);
                void load();
              }}
            >
              Discard draft and reload
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
