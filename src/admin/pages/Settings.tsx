import ConnectedSettings from "./ConnectedSettings";
import {connected} from "../api/client";
import React, { useState } from "react"
import { useDirtyGuard } from "../router"
import { PageActions } from "../components/PageHeader"
import { useOps } from "../store/ops/ops"
import { useStore } from "../store/store"
import { Card, SelectField, TextField } from "../ui"
import { Denied, Note, TIMEZONES, isEmail } from "../ui/ops"
import { fmtDate } from "../store/meta"
import type { Settings as S } from "../store/ops/types"

const LANGS = ["English", "French", "Spanish", "Portuguese", "Yoruba"]

function Toggle({ label, hint, checked, onChange, disabled }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", cursor: disabled ? "default" : "pointer" }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3 }} />
      <span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{label}</span>
        <span style={{ display: "block", fontSize: 12.5, color: "var(--text-secondary)" }}>{hint}</span>
      </span>
    </label>
  )
}

function PrototypeSettings() {
  const { settings, saveSettings, can } = useOps()
  const { toast } = useStore()
  const [draft, setDraft] = useState<S>(settings)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const allowed = can("settings.edit")
  const dirty = JSON.stringify({ ...draft, updatedAt: 0 }) !== JSON.stringify({ ...settings, updatedAt: 0 })
  useDirtyGuard(() => dirty)

  if (!can("settings.edit") && !can("records.edit") && !can("moderation.act")) return <Denied what="Platform Settings" cap="settings.edit" />

  const set = <K extends keyof S>(k: K, v: S[K]) => { setDraft((d) => ({ ...d, [k]: v })); setSaved(false); setErrors((e) => ({ ...e, [k]: "" })) }

  const save = () => {
    const e: Record<string, string> = {}
    if (!draft.orgName.trim()) e.orgName = "Organization name is required."
    if (!draft.supportEmail.trim()) e.supportEmail = "Support email is required."
    else if (!isEmail(draft.supportEmail)) e.supportEmail = "Enter a valid email address."
    if (!draft.defaultLanguage) e.defaultLanguage = "Choose a default language."
    if (!draft.defaultTimezone) e.defaultTimezone = "Choose a default timezone."
    setErrors(e)
    if (Object.keys(e).length) {
      toast("error", `Not saved. Fix ${Object.keys(e).length} field${Object.keys(e).length > 1 ? "s" : ""} first.`)
      return
    }
    saveSettings({ ...draft, orgName: draft.orgName.trim(), supportEmail: draft.supportEmail.trim(), updatedAt: new Date().toISOString() })
    setSaved(true)
    toast("success", "Settings saved in this browser.")
  }
  const discard = () => { setDraft(settings); setErrors({}); setSaved(false); toast("info", "Unsaved changes discarded.") }

  return (
    <div className="page-pad">
      <PageActions>
        <span role="status" style={{ fontSize: 12.5, color: dirty ? "var(--yellow)" : "var(--green)", alignSelf: "center" }}>
          {dirty ? "Unsaved changes" : saved ? "Saved just now" : `Saved ${fmtDate(settings.updatedAt)}`}
        </span>
        <button className="btn" disabled={!dirty} onClick={discard}>Discard changes</button>
        <button className="btn btn-primary" disabled={!allowed || !dirty} onClick={save}>Save settings</button>
      </PageActions>
      {!allowed && <Note tone="bad" title="Read-only">Your role can't change platform settings. Fields are disabled. Provisional example roles.</Note>}
      <fieldset disabled={!allowed} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <Card title="Organization">
          <div className="grid-2">
            <TextField label="Organization name" required value={draft.orgName} onChange={(e) => set("orgName", e.target.value)} error={errors.orgName} />
            <TextField label="Support email" required value={draft.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} error={errors.supportEmail} hint="Shown to customers who need help." />
            <SelectField label="Default language" required value={draft.defaultLanguage} onChange={(e) => set("defaultLanguage", e.target.value)} options={LANGS} error={errors.defaultLanguage} />
            <SelectField label="Default timezone" required value={draft.defaultTimezone} onChange={(e) => set("defaultTimezone", e.target.value)} options={TIMEZONES} error={errors.defaultTimezone} hint="Used when a new event does not set its own." />
          </div>
        </Card>
        <Card title="Alerts for associates">
          <Toggle label="New moderation reports" hint="Notify moderators when a report is opened." checked={draft.alertReports} onChange={(v) => set("alertReports", v)} />
          <Toggle label="Campaigns waiting for review" hint="Notify reviewers when a campaign is submitted." checked={draft.alertCampaignReview} onChange={(v) => set("alertCampaignReview", v)} />
          <Toggle label="Weekly activity digest" hint="A summary of content, events and reports." checked={draft.weeklyDigest} onChange={(v) => set("weeklyDigest", v)} />
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0 0" }}>Preferences are stored only. No alert emails are sent from this prototype.</p>
        </Card>
      </fieldset>
    </div>
  )
}

export default function Settings(){return connected?<ConnectedSettings/>:<PrototypeSettings/>;}
