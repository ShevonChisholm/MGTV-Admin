import LoadingState from "../components/LoadingState";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { useDirtyGuard } from "../router";
import { Card, TextField, SelectField, Modal } from "../ui";
import { PageActions } from "../components/PageHeader";
import { Note, TIMEZONES, isEmail } from "../ui/ops";
import StaffAuth from "./StaffAuth";
type Values = {
  orgName: string;
  supportEmail: string | null;
  defaultLanguage: string;
  defaultTimezone: string;
  alertReports: boolean;
  alertCampaignReview: boolean;
  weeklyDigest: boolean;
};
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
    <label
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "10px 0",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 3 }}
      />
      <span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>
          {label}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 12.5,
            color: "var(--text-secondary)",
          }}
        >
          {hint}
        </span>
      </span>
    </label>
  );
}
export default function ConnectedSettings() {
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
      const r = await api("/admin/settings");
      const h = await api("/admin/settings/history");
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
      <LoadingState label={<>Loading Platform Settings…</>} variant="form" />
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
    <div className="page-pad" aria-busy={busy}>
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
            : `Saved · v${record.version} · ${new Date(record.updatedAt).toLocaleString()}`}
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
          disabled={
            busy || !allowed || !dirty || reason.trim().length < 5 || conflict
          }
          onClick={() => void save()}
        >
          Save settings
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
        <Card title="Organization">
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
        <Card title="Alerts for associates">
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
        <Card title="Change record">
          <TextField
            label="Reason for change"
            required
            value={reason}
            minLength={5}
            maxLength={1000}
            onChange={(e) => setReason(e.target.value)}
            hint="At least five characters. Saved changes and their reasons remain in the audit history."
          />
        </Card>
      </fieldset>
      <Card title="Settings history">
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Newest versions first. History is immutable; restoring an earlier
          configuration requires saving a new version.
        </p>
        {history.map((h) => (
          <details
            key={h.version}
            style={{
              padding: "12px 0",
              borderTop: "1px solid var(--border)",
              overflowWrap: "anywhere",
            }}
          >
            <summary style={{ cursor: "pointer", fontSize: 13 }}>
              v{h.version} · {h.actor} ·{" "}
              {new Date(h.createdAt).toLocaleString()}
            </summary>
            <p>{h.reason}</p>
            <dl
              style={{
                fontSize: 12,
                display: "grid",
                gridTemplateColumns: "minmax(100px,1fr) minmax(0,2fr)",
                gap: 8,
              }}
            >
              {Object.entries(fields(h.body)).map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <dt>{k.replace(/([A-Z])/g, " $1")}</dt>
                  <dd style={{ margin: 0, overflowWrap: "anywhere" }}>
                    {v === null
                      ? "Not configured"
                      : typeof v === "boolean"
                        ? v
                          ? "Enabled"
                          : "Disabled"
                        : String(v)}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
        {next && (
          <button className="btn" disabled={busy} onClick={() => void more()}>
            Load earlier changes
          </button>
        )}
      </Card>
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
