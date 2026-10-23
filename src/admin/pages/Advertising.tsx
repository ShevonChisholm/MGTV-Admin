import React, { useRef, useState } from "react"
import { Link, useDirtyGuard, useRouter } from "../router"
import { PageActions } from "../components/PageHeader"
import { useOps } from "../store/ops/ops"
import { useStore } from "../store/store"
import { Card, EmptyState, SelectField, TextField } from "../ui"
import MediaPicker from "../ui/MediaPicker"
import ContactsEditor from "../ui/Contacts"
import { ActivityLog, MockNote, Note, ReadOnlyNote, ReasonDialog, RouteTabs, StatusPill, Toolbar, fmtDay } from "../ui/ops"
import { CustomerCard } from "./content/Preview"
import { genId } from "../store/meta"
import { logged, newLog, ACTOR } from "../store/ops/types"
import type { Advertiser, Campaign } from "../store/ops/types"
import type { MediaKind } from "../store/types"
import { CAMPAIGN_STATUS, ORG_STATUS } from "./opsMeta"
import { dateOnly } from "../store/ops/seed"

type Tab = "campaigns" | "advertisers" | "reporting"
const TABS: { id: Tab; label: string }[] = [{ id: "campaigns", label: "Campaigns" }, { id: "advertisers", label: "Advertisers" }, { id: "reporting", label: "Reporting" }]
const validUrl = (s: string) => { try { return /^https?:$/.test(new URL(s).protocol) } catch { return false } }

function TabBar({ tab }: { tab: Tab }) {
  return <><RouteTabs label="Advertising sections" base="/admin/advertising" value={tab} items={TABS} /><div style={{ height: 14 }} /></>
}

function CampaignList() {
  const { campaigns, advertisers, can } = useOps()
  const [q, setQ] = useState("")
  const [st, setSt] = useState("")
  const name = (id: string) => advertisers.find((a) => a.id === id)?.name ?? "Unknown advertiser"
  const list = campaigns.filter((c) => (!st || c.status === st) && (c.name + name(c.advertiserId)).toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageActions>{can("records.edit") && <Link to="/admin/advertising/campaigns/new" className="btn btn-primary">Create campaign</Link>}</PageActions>
      <Toolbar>
        <div style={{ flex: "1 1 220px" }}><TextField label="Search campaigns" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <SelectField label="Status" value={st} onChange={(e) => setSt(e.target.value)} options={Object.keys(CAMPAIGN_STATUS)} placeholder="All statuses" />
      </Toolbar>
      {list.length === 0 ? <EmptyState title="No campaigns match" body="Clear the filters or create a campaign." /> : (
        <div className="scroll-x" style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--card)" }}>
          <table className="tbl">
            <thead><tr><th>Campaign</th><th>Advertiser</th><th>Dates</th><th>Placements</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/admin/advertising/campaigns/${c.id}`} style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>{c.name}</Link></td>
                  <td>{name(c.advertiserId)}</td>
                  <td style={{ fontSize: 13 }}>{fmtDay(c.startDate)} to {fmtDay(c.endDate)}</td>
                  <td>{c.contentIds.length + c.sectionIds.length}</td>
                  <td><StatusPill map={CAMPAIGN_STATUS} value={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function AdvertiserList() {
  const { advertisers, campaigns, can } = useOps()
  return (
    <>
      <PageActions>{can("records.edit") && <Link to="/admin/advertising/advertisers/new" className="btn btn-primary">Add advertiser</Link>}</PageActions>
      {advertisers.length === 0 ? <EmptyState title="No advertisers" body="Add an advertiser before creating campaigns." /> : (
        <div className="scroll-x" style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--card)" }}>
          <table className="tbl">
            <thead><tr><th>Advertiser</th><th>Status</th><th>Contacts</th><th>Campaigns</th></tr></thead>
            <tbody>
              {advertisers.map((a) => (
                <tr key={a.id}>
                  <td><Link to={`/admin/advertising/advertisers/${a.id}`} style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>{a.name}</Link></td>
                  <td><StatusPill map={ORG_STATUS} value={a.status} /></td>
                  <td>{a.contacts.length}</td>
                  <td>{campaigns.filter((c) => c.advertiserId === a.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function Reporting() {
  const { campaigns, advertisers } = useOps()
  const rows = campaigns.filter((c) => c.status === "active" || c.status === "completed")
  const sum = (k: "impressions" | "clicks" | "completions") => rows.reduce((s, c) => s + c.engagement[k], 0)
  const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—")
  return (
    <>
      <MockNote>Impressions, clicks and completions are sample numbers for demonstration. Nothing here is measured. Only active and completed campaigns appear.</MockNote>
      {rows.length === 0 ? <EmptyState title="No active or completed campaigns" body="Reporting appears after a campaign is activated." /> : (
        <div className="scroll-x" style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--card)" }}>
          <table className="tbl">
            <thead><tr><th>Campaign</th><th>Status</th><th>Impressions (mock)</th><th>Clicks (mock)</th><th>Click rate (mock)</th><th>Video completions (mock)</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/admin/advertising/campaigns/${c.id}`} style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>{c.name}</Link><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{advertisers.find((a) => a.id === c.advertiserId)?.name}</div></td>
                  <td><StatusPill map={CAMPAIGN_STATUS} value={c.status} /></td>
                  <td>{c.engagement.impressions.toLocaleString()}</td>
                  <td>{c.engagement.clicks.toLocaleString()}</td>
                  <td>{pct(c.engagement.clicks, c.engagement.impressions)}</td>
                  <td>{c.engagement.completions.toLocaleString()}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700 }}>
                <td>Total</td><td />
                <td>{sum("impressions").toLocaleString()}</td><td>{sum("clicks").toLocaleString()}</td><td>{pct(sum("clicks"), sum("impressions"))}</td><td>{sum("completions").toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function AdvertiserEditor({ id }: { id: string }) {
  const { advertisers, campaigns, upsert, can } = useOps()
  const { toast } = useStore()
  const { navigate } = useRouter()
  const isNew = id === "new"
  const [fresh] = useState<Advertiser>(() => ({ id: genId("adv"), name: "", website: "", notes: "", status: "active", contacts: [], createdAt: new Date().toISOString(), activity: newLog("Created advertiser") }))
  const saved = isNew ? fresh : advertisers.find((a) => a.id === id)
  const [d, setD] = useState({ name: saved?.name ?? "", website: saved?.website ?? "", notes: saved?.notes ?? "" })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [dlg, setDlg] = useState(false)
  const leaving = useRef(false)
  const allowed = can("records.edit")
  const dirty = !!saved && (isNew ? !!(d.name || d.website || d.notes) : d.name !== saved.name || d.website !== saved.website || d.notes !== saved.notes)
  useDirtyGuard(() => dirty && !leaving.current)
  if (!saved) return <div className="page-pad"><EmptyState title="Advertiser not found" body="It may not exist after a demo reset." action={<Link to="/admin/advertising/advertisers" className="btn">Back to advertisers</Link>} /></div>

  const save = () => {
    const e: Record<string, string> = {}
    if (!d.name.trim()) e.name = "Enter the advertiser name."
    if (d.website.trim() && !validUrl(d.website.trim())) e.website = "Enter a full web address starting with https://"
    setErrs(e)
    if (Object.keys(e).length) return toast("error", "Not saved. Fix the highlighted fields.")
    const next = { ...saved, ...d, name: d.name.trim(), website: d.website.trim() }
    if (isNew) {
      upsert("advertisers", next)
      toast("success", `${next.name} added.`)
      leaving.current = true
      setTimeout(() => navigate(`/admin/advertising/advertisers/${next.id}`), 0)
    } else {
      upsert("advertisers", logged(next, "Details updated"))
      toast("success", "Advertiser saved.")
    }
  }
  const mine = campaigns.filter((c) => c.advertiserId === saved.id)

  return (
    <div className="page-pad">
      <Link to="/admin/advertising/advertisers" style={{ fontSize: 13, color: "var(--text-secondary)" }}>← All advertisers</Link>
      <div style={{ height: 12 }} />
      <ReadOnlyNote cap="records.edit" />
      <PageActions>
        <span role="status" style={{ fontSize: 12.5, alignSelf: "center", color: dirty ? "var(--yellow)" : "var(--text-muted)" }}>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <button className="btn" disabled={!dirty} onClick={() => { setD({ name: saved.name, website: saved.website, notes: saved.notes }); setErrs({}) }}>Discard</button>
        <button className="btn btn-primary" disabled={!allowed || !dirty} onClick={save}>{isNew ? "Add advertiser" : "Save details"}</button>
      </PageActions>
      <fieldset disabled={!allowed} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <Card title="Organization">
          <div style={{ display: "grid", gap: 14, maxWidth: 640 }}>
            <TextField label="Advertiser name" required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} error={errs.name} />
            <TextField label="Website" placeholder="https://" value={d.website} onChange={(e) => setD({ ...d, website: e.target.value })} error={errs.website} />
            <TextField label="Internal notes" multiline rows={3} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
          </div>
        </Card>
      </fieldset>
      {!isNew && (
        <>
          <Card title="Contacts"><ContactsEditor contacts={saved.contacts} disabled={!allowed} onChange={(next, text) => { upsert("advertisers", logged({ ...saved, contacts: next }, text)); toast("success", text + ".") }} /></Card>
          <Card title="Status">
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <StatusPill map={ORG_STATUS} value={saved.status} />
              <button className="btn" disabled={!allowed} onClick={() => setDlg(true)}>{saved.status === "active" ? "Deactivate…" : "Reactivate…"}</button>
              {saved.status === "inactive" && <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Inactive advertisers can't be chosen for new campaigns.</span>}
            </div>
          </Card>
          <Card title={`Campaigns (${mine.length})`}>
            {mine.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>No campaigns yet.</p> : <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>{mine.map((c) => <li key={c.id}><Link to={`/admin/advertising/campaigns/${c.id}`} style={{ color: "var(--accent-hover)" }}>{c.name}</Link> <StatusPill map={CAMPAIGN_STATUS} value={c.status} /></li>)}</ul>}
          </Card>
          <Card title="Activity history"><ActivityLog items={saved.activity} /></Card>
        </>
      )}
      {dlg && (
        <ReasonDialog title={saved.status === "active" ? "Deactivate advertiser?" : "Reactivate advertiser?"} confirmLabel={saved.status === "active" ? "Deactivate" : "Reactivate"} danger={saved.status === "active"} onCancel={() => setDlg(false)}
          onConfirm={(r) => { upsert("advertisers", logged({ ...saved, status: saved.status === "active" ? "inactive" : "active" }, saved.status === "active" ? "Deactivated" : "Reactivated", r)); setDlg(false); toast("info", "Advertiser status updated.") }}>
          Existing campaigns keep running through their own review states. This only affects choosing the advertiser for new campaigns.
        </ReasonDialog>
      )}
    </div>
  )
}

function CampaignEditor({ id }: { id: string }) {
  const { campaigns, advertisers, upsert, can } = useOps()
  const { toast, content, homepage, assets } = useStore()
  const { navigate } = useRouter()
  const isNew = id === "new"
  const [fresh] = useState<Campaign>(() => ({
    id: genId("cmp"), advertiserId: "", name: "", headline: "", objective: "", contentIds: [], sectionIds: [], creativeIds: [], startDate: dateOnly(7), endDate: dateOnly(37),
    status: "draft", engagement: { impressions: 0, clicks: 0, completions: 0 }, createdAt: new Date().toISOString(), activity: newLog("Created draft"),
  }))
  const saved = isNew ? fresh : campaigns.find((c) => c.id === id)
  const [d, setD] = useState<Campaign | null>(saved ?? null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [picker, setPicker] = useState<MediaKind | null>(null)
  const [dlg, setDlg] = useState<null | "approve" | "reject" | "activate" | "complete">(null)
  const leaving = useRef(false)
  const fields = ["advertiserId", "name", "headline", "objective", "contentIds", "sectionIds", "creativeIds", "startDate", "endDate"] as const
  const dirty = !!saved && !!d && (isNew ? !!(d.name || d.headline || d.advertiserId) : fields.some((k) => JSON.stringify(d[k]) !== JSON.stringify(saved[k])))
  useDirtyGuard(() => dirty && !leaving.current)
  if (!saved || !d) return <div className="page-pad"><EmptyState title="Campaign not found" body="It may not exist after a demo reset." action={<Link to="/admin/advertising/campaigns" className="btn">Back to campaigns</Link>} /></div>

  const editable = saved.status === "draft"
  const allowed = can("records.edit") && editable
  const reviewer = can("campaigns.review")
  const set = <K extends (typeof fields)[number]>(k: K, v: Campaign[K]) => { setD({ ...d, [k]: v }); setErrs((e) => ({ ...e, [k]: "" })) }
  const toggle = (k: "contentIds" | "sectionIds", v: string) => set(k, d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v])
  const activeAdv = advertisers.filter((a) => a.status === "active" || a.id === d.advertiserId)

  const validate = (x: Campaign, strict: boolean) => {
    const e: Record<string, string> = {}
    if (!x.name.trim()) e.name = "Enter a campaign name."
    if (!x.advertiserId) e.advertiserId = "Choose an advertiser."
    if (x.startDate && x.endDate && x.endDate <= x.startDate) e.endDate = "End date must be after the start date."
    if (strict) {
      if (!x.headline.trim()) e.headline = "Enter the headline shown with the placement."
      if (!x.startDate) e.startDate = "Choose a start date."
      if (!x.endDate) e.endDate = e.endDate || "Choose an end date."
      if (x.contentIds.length + x.sectionIds.length === 0) e.placements = "Select at least one placement."
      if (x.creativeIds.length === 0) e.creative = "Attach at least one creative image or video."
      else if (x.creativeIds.some((c) => assets[c]?.status !== "ready")) e.creative = "Every creative must be a ready file. Remove or replace files that are processing or failed."
    }
    return e
  }

  const save = () => {
    const e = validate(d, false)
    setErrs(e)
    if (Object.keys(e).length) return toast("error", "Not saved. Fix the highlighted fields.")
    const next: Campaign = { ...saved, name: d.name.trim() }
    fields.forEach((k) => { if (k !== "name") (next as unknown as Record<string, unknown>)[k] = d[k] })
    if (isNew) {
      upsert("campaigns", next)
      toast("success", "Draft saved. Submit it for review when it is complete.")
      leaving.current = true
      setTimeout(() => navigate(`/admin/advertising/campaigns/${next.id}`), 0)
    } else {
      upsert("campaigns", logged(next, "Draft updated"))
      toast("success", "Campaign draft saved.")
    }
  }
  const move = (p: Partial<Campaign>, action: string, reason?: string, msg?: string, tone: "success" | "info" | "error" = "success") => {
    upsert("campaigns", logged({ ...saved, ...p }, action, reason))
    if (msg) toast(tone, msg)
    setDlg(null)
  }
  const submit = () => {
    if (dirty) return toast("error", "Save your changes before submitting.")
    const e = validate(saved, true)
    setErrs(e)
    if (Object.keys(e).length) return toast("error", `Can't submit yet. ${Object.keys(e).length} item${Object.keys(e).length > 1 ? "s need" : " needs"} attention.`)
    move({ status: "in_review", review: undefined }, "Submitted for review", undefined, "Submitted. A reviewer must approve or reject it.")
  }

  const placedContent = content.filter((c) => d.contentIds.includes(c.id))
  const placedSections = homepage.filter((s) => d.sectionIds.includes(s.id))
  const creativeAssets = d.creativeIds.map((c) => assets[c]).filter(Boolean)
  const heroCreative = creativeAssets.find((a) => a.kind === "image")

  return (
    <div className="page-pad">
      <Link to="/admin/advertising/campaigns" style={{ fontSize: 13, color: "var(--text-secondary)" }}>← All campaigns</Link>
      <div style={{ height: 12 }} />
      <ReadOnlyNote cap="records.edit" />
      <PageActions>
        <span role="status" style={{ fontSize: 12.5, alignSelf: "center", color: dirty ? "var(--yellow)" : "var(--text-muted)" }}>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <button className="btn" disabled={!dirty} onClick={() => { setD(saved); setErrs({}) }}>Discard</button>
        <button className="btn btn-primary" disabled={!allowed || !dirty} onClick={save}>{isNew ? "Save draft" : "Save draft changes"}</button>
      </PageActions>

      {saved.review && saved.status === "rejected" && <Note tone="bad" title="Rejected">{saved.review.reason} ({saved.review.by}, {new Date(saved.review.at).toLocaleDateString()}). Use "Revise as draft" to edit and resubmit.</Note>}
      {saved.review && saved.status === "approved" && <Note tone="ok" title="Approved">{saved.review.reason} ({saved.review.by}, {new Date(saved.review.at).toLocaleDateString()}). Activate it to start the placement (simulated).</Note>}
      {saved.status === "in_review" && <Note tone="warn" title="Awaiting review">The campaign is locked while it is in review.</Note>}
      {!editable && saved.status !== "rejected" && saved.status !== "in_review" && <Note tone="info">Campaign details are locked in this state.</Note>}

      <div className="editor-layout">
        <div>
          <fieldset disabled={!allowed} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <Card title="Campaign">
              <div style={{ display: "grid", gap: 14 }}>
                <TextField label="Campaign name" required value={d.name} onChange={(e) => set("name", e.target.value)} error={errs.name} />
                <SelectField label="Advertiser" required value={advertisers.find((a) => a.id === d.advertiserId)?.name ?? ""} onChange={(e) => set("advertiserId", advertisers.find((a) => a.name === e.target.value)?.id ?? "")} options={activeAdv.map((a) => a.name)} error={errs.advertiserId} hint="Only active advertisers are listed." />
                <TextField label="Headline" value={d.headline} onChange={(e) => set("headline", e.target.value)} error={errs.headline} hint="Required for review. Shown with the placement." />
                <TextField label="Objective" multiline rows={2} value={d.objective} onChange={(e) => set("objective", e.target.value)} />
                <div className="grid-2">
                  <TextField label="Start date" type="date" value={d.startDate} onChange={(e) => set("startDate", e.target.value)} error={errs.startDate} />
                  <TextField label="End date" type="date" value={d.endDate} onChange={(e) => set("endDate", e.target.value)} error={errs.endDate} />
                </div>
              </div>
            </Card>
            <Card title="Placements">
              {errs.placements && <p role="alert" style={{ color: "var(--red)", fontSize: 12.5, margin: "0 0 10px" }}>{errs.placements}</p>}
              <div className="grid-2">
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Content items</div>
                  {content.map((c) => (
                    <label key={c.id} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 13.5, alignItems: "center" }}>
                      <input type="checkbox" checked={d.contentIds.includes(c.id)} onChange={() => toggle("contentIds", c.id)} />
                      <span>{c.title || "Untitled"} <span style={{ color: c.status === "published" ? "var(--text-muted)" : "var(--yellow)", fontSize: 12 }}>({c.status})</span></span>
                    </label>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Homepage sections</div>
                  {homepage.map((s) => (
                    <label key={s.id} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 13.5, alignItems: "center" }}>
                      <input type="checkbox" checked={d.sectionIds.includes(s.id)} onChange={() => toggle("sectionIds", s.id)} />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {placedContent.some((c) => c.status !== "published") && <Note tone="warn"><br />Some selected content is not published, so the placement would not reach customers yet.</Note>}
            </Card>
            <Card title="Creative" aside={<span style={{ display: "flex", gap: 6 }}><button className="btn btn-sm" disabled={!allowed} onClick={() => setPicker("image")}>Attach image</button><button className="btn btn-sm" disabled={!allowed} onClick={() => setPicker("video")}>Attach video</button></span>}>
              {errs.creative && <p role="alert" style={{ color: "var(--red)", fontSize: 12.5, margin: "0 0 10px" }}>{errs.creative}</p>}
              {d.creativeIds.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>No creative attached. Choose files from the Media Library.</p> : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                  {d.creativeIds.map((cid) => {
                    const a = assets[cid]
                    return (
                      <li key={cid} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 13.5 }}>
                        <span>{a ? `${a.name} (${a.kind})` : "Missing file"}{a && a.status !== "ready" && <span style={{ color: "var(--yellow)" }}> · {a.status}</span>}</span>
                        <button className="btn btn-sm btn-ghost" disabled={!allowed} onClick={() => set("creativeIds", d.creativeIds.filter((x) => x !== cid))}>Remove</button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </fieldset>
          <Card title="Activity history"><ActivityLog items={saved.activity} /></Card>
        </div>

        <aside>
          {!isNew && (
            <Card title="Review and status">
              <div style={{ display: "grid", gap: 10 }}>
                <StatusPill map={CAMPAIGN_STATUS} value={saved.status} />
                {saved.status === "draft" && <button className="btn btn-primary" disabled={!can("records.edit")} onClick={submit}>Submit for review</button>}
                {saved.status === "in_review" && (
                  <>
                    <button className="btn btn-primary" disabled={!reviewer} onClick={() => setDlg("approve")}>Approve…</button>
                    <button className="btn btn-danger" disabled={!reviewer} onClick={() => setDlg("reject")}>Reject…</button>
                    {!reviewer && <p style={{ margin: 0, fontSize: 12.5, color: "var(--red)" }}>Your role can't review campaigns (provisional example roles).</p>}
                  </>
                )}
                {saved.status === "approved" && <button className="btn btn-primary" disabled={!can("records.edit")} onClick={() => setDlg("activate")}>Activate placement…</button>}
                {saved.status === "active" && <button className="btn" disabled={!can("records.edit")} onClick={() => setDlg("complete")}>Mark completed…</button>}
                {saved.status === "rejected" && <button className="btn" disabled={!can("records.edit")} onClick={() => move({ status: "draft" }, "Reopened as draft for revision", undefined, "Campaign is a draft again. Edit and resubmit.", "info")}>Revise as draft</button>}
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Draft, in review, approved or rejected, then active and completed. Review outcomes and activation are simulated.</p>
              </div>
            </Card>
          )}
          <Card title="Placement preview">
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--text-muted)" }}>Prototype approximation, not a live customer view.</p>
            {placedContent.length + placedSections.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Select a placement to preview it.</p> : (
              <div style={{ display: "grid", gap: 14 }}>
                {placedContent.map((c) => (
                  <div key={c.id}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>On the {c.title || "Untitled"} page</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <CustomerCard item={c} width={110} />
                      <div style={{ flex: "1 1 120px", border: "1px solid var(--border-light)", borderRadius: 8, padding: 10, background: "var(--bg)" }}>
                        <span style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-hover)", fontWeight: 700 }}>Sponsored</span>
                        <div style={{ fontWeight: 700, margin: "4px 0", fontSize: 14 }}>{d.headline || "Headline appears here"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{heroCreative ? heroCreative.name : "No image creative yet"}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {placedSections.map((s) => (
                  <div key={s.id} style={{ fontSize: 13 }}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Homepage: {s.label} ({s.layout})</div>
                    <div style={{ border: "1px dashed var(--border-light)", borderRadius: 8, padding: 10 }}><strong>Sponsored:</strong> {d.headline || "Headline appears here"}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          {(saved.status === "active" || saved.status === "completed") && (
            <Card title="Engagement">
              <MockNote>Sample numbers for demonstration, not measured.</MockNote>
              <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 12px", fontSize: 13.5 }}>
                <dt>Impressions</dt><dd style={{ margin: 0 }}>{saved.engagement.impressions.toLocaleString()}</dd>
                <dt>Clicks</dt><dd style={{ margin: 0 }}>{saved.engagement.clicks.toLocaleString()}</dd>
                <dt>Video completions</dt><dd style={{ margin: 0 }}>{saved.engagement.completions.toLocaleString()}</dd>
              </dl>
            </Card>
          )}
        </aside>
      </div>

      {picker && <MediaPicker kind={picker} value={null} crop="landscape" onSelect={(mid) => { if (!d.creativeIds.includes(mid)) set("creativeIds", [...d.creativeIds, mid]); setPicker(null) }} onClose={() => setPicker(null)} />}
      {dlg === "approve" && (
        <ReasonDialog title="Approve this campaign?" confirmLabel="Approve campaign" onCancel={() => setDlg(null)} reasonLabel="Approval note (recorded)"
          onConfirm={(r) => move({ status: "approved", review: { decision: "approved", reason: r, by: ACTOR, at: new Date().toISOString() } }, "Approved", r, "Campaign approved. It can now be activated.")}>
          The creative and copy meet placement guidelines. Approval does not start the placement; activation is a separate step.
        </ReasonDialog>
      )}
      {dlg === "reject" && (
        <ReasonDialog title="Reject this campaign?" confirmLabel="Reject campaign" danger onCancel={() => setDlg(null)} reasonLabel="What must change? (shown to the submitter)"
          onConfirm={(r) => move({ status: "rejected", review: { decision: "rejected", reason: r, by: ACTOR, at: new Date().toISOString() } }, "Rejected", r, "Campaign rejected. The reason is shown on the campaign.", "error")}>
          The campaign returns to its owner with your reason. They can revise it as a draft and resubmit.
        </ReasonDialog>
      )}
      {dlg === "activate" && (
        <ReasonDialog title="Activate this placement?" confirmLabel="Activate (simulated)" required={false} reasonLabel="Note (optional)" onCancel={() => setDlg(null)}
          onConfirm={(r) => move({ status: "active", engagement: { impressions: 1240, clicks: 31, completions: 18 } }, "Activated", r, "Campaign is active (simulated). Sample engagement is now shown.")}>
          Nothing is published to customers. Activation is simulated and adds sample engagement numbers.
        </ReasonDialog>
      )}
      {dlg === "complete" && (
        <ReasonDialog title="Mark campaign completed?" confirmLabel="Mark completed" required={false} reasonLabel="Note (optional)" onCancel={() => setDlg(null)}
          onConfirm={(r) => move({ status: "completed" }, "Marked completed", r, "Campaign completed.")}>
          Completed campaigns are read-only and keep their engagement summary.
        </ReasonDialog>
      )}
    </div>
  )
}

export default function Advertising() {
  const { route } = useRouter()
  const [a, b] = route.parts
  const tab: Tab = a === "advertisers" || a === "reporting" ? a : "campaigns"
  if (b && tab === "campaigns") return <CampaignEditor key={b} id={b} />
  if (b && tab === "advertisers") return <AdvertiserEditor key={b} id={b} />
  return (
    <div className="page-pad">
      <TabBar tab={tab} />
      {tab === "campaigns" && <CampaignList />}
      {tab === "advertisers" && <AdvertiserList />}
      {tab === "reporting" && <Reporting />}
    </div>
  )
}
