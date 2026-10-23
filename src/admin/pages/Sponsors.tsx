import React, { useRef, useState } from "react"
import { Link, useDirtyGuard, useRouter } from "../router"
import { PageActions } from "../components/PageHeader"
import { useOps } from "../store/ops/ops"
import { useStore } from "../store/store"
import { Card, EmptyState, Modal, SelectField, TextField, ConfirmDialog } from "../ui"
import { ActivityLog, AssetSlot, Note, ReadOnlyNote, ReasonDialog, RouteTabs, StatusPill, Toolbar } from "../ui/ops"
import ContactsEditor from "../ui/Contacts"
import { genId } from "../store/meta"
import { logged, newLog } from "../store/ops/types"
import type { BrandAsset, BrandAssetKind, Sponsor } from "../store/ops/types"
import { ORG_STATUS, LIFECYCLE } from "./opsMeta"

const KINDS: BrandAssetKind[] = ["Logo (light background)", "Logo (dark background)", "Brand mark"]
type Tab = "details" | "contacts" | "assets" | "associations" | "activity"
const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Details" }, { id: "contacts", label: "Contacts" }, { id: "assets", label: "Brand assets" },
  { id: "associations", label: "Shows & events" }, { id: "activity", label: "Activity" },
]
const validUrl = (s: string) => { try { return /^https?:$/.test(new URL(s).protocol) } catch { return false } }

function List() {
  const { sponsors, can } = useOps()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const list = sponsors.filter((s) => (!status || s.status === status) && s.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="page-pad">
      <PageActions>{can("records.edit") ? <Link to="/admin/sponsors/new/details" className="btn btn-primary">Add sponsor</Link> : null}</PageActions>
      <ReadOnlyNote cap="records.edit" />
      <Toolbar>
        <div style={{ flex: "1 1 220px" }}><TextField label="Search sponsors" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Organization name" /></div>
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={["active", "inactive"]} placeholder="All statuses" />
      </Toolbar>
      {list.length === 0 ? (
        <EmptyState title="No sponsors match" body="Clear the filters or add a sponsor organization." action={can("records.edit") ? <Link to="/admin/sponsors/new/details" className="btn btn-primary">Add sponsor</Link> : undefined} />
      ) : (
        <div className="scroll-x" style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--card)" }}>
          <table className="tbl">
            <thead><tr><th>Sponsor</th><th>Status</th><th>Contacts</th><th>Shows</th><th>Events</th><th>Last activity</th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td><Link to={`/admin/sponsors/${s.id}/details`} style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>{s.name}</Link></td>
                  <td><StatusPill map={ORG_STATUS} value={s.status} /></td>
                  <td>{s.contacts.length}</td>
                  <td>{s.showIds.length}</td>
                  <td>{s.eventIds.length}</td>
                  <td style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{s.activity[0]?.action ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Details({ sponsor, isNew }: { sponsor: Sponsor; isNew: boolean }) {
  const { upsert, can } = useOps()
  const { toast } = useStore()
  const { navigate } = useRouter()
  const [d, setD] = useState({ name: sponsor.name, description: sponsor.description, website: sponsor.website })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<"deactivate" | "activate" | null>(null)
  const allowed = can("records.edit")
  const dirty = isNew ? d.name !== "" || d.description !== "" || d.website !== "" : d.name !== sponsor.name || d.description !== sponsor.description || d.website !== sponsor.website
  const leaving = useRef(false)
  useDirtyGuard(() => dirty && !leaving.current)

  const save = () => {
    const e: Record<string, string> = {}
    if (!d.name.trim()) e.name = "Enter the organization name."
    if (d.website.trim() && !validUrl(d.website.trim())) e.website = "Enter a full web address starting with https://"
    setErrs(e)
    if (Object.keys(e).length) return toast("error", "Not saved. Fix the highlighted fields.")
    const next = { ...sponsor, ...d, name: d.name.trim(), website: d.website.trim() }
    if (isNew) {
      upsert("sponsors", next)
      toast("success", `${next.name} created. Add contacts and brand assets next.`)
      leaving.current = true
      setTimeout(() => navigate(`/admin/sponsors/${next.id}/contacts`), 0)
    } else {
      upsert("sponsors", logged(next, "Details updated"))
      toast("success", "Sponsor details saved.")
    }
  }

  return (
    <>
      <PageActions>
        <span role="status" style={{ fontSize: 12.5, alignSelf: "center", color: dirty ? "var(--yellow)" : "var(--text-muted)" }}>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <button className="btn" disabled={!dirty} onClick={() => { setD({ name: sponsor.name, description: sponsor.description, website: sponsor.website }); setErrs({}) }}>Discard</button>
        <button className="btn btn-primary" disabled={!allowed || !dirty} onClick={save}>{isNew ? "Create sponsor" : "Save details"}</button>
      </PageActions>
      <fieldset disabled={!allowed} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <Card title="Organization">
          <div style={{ display: "grid", gap: 14, maxWidth: 640 }}>
            <TextField label="Organization name" required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} error={errs.name} />
            <TextField label="Website" value={d.website} onChange={(e) => setD({ ...d, website: e.target.value })} error={errs.website} placeholder="https://" />
            <TextField label="About" multiline rows={4} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} hint="Internal description of the partnership." />
          </div>
        </Card>
      </fieldset>
      {!isNew && (
        <Card title="Status">
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <StatusPill map={ORG_STATUS} value={sponsor.status} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {sponsor.status === "active" ? "Inactive sponsors keep their history but should not appear on new shows or events." : "This sponsor is inactive."}
            </span>
            {sponsor.status === "active"
              ? <button className="btn" disabled={!allowed} onClick={() => setStatus("deactivate")}>Deactivate sponsor…</button>
              : <button className="btn" disabled={!allowed} onClick={() => setStatus("activate")}>Reactivate sponsor…</button>}
          </div>
        </Card>
      )}
      {status && (
        <ReasonDialog title={status === "deactivate" ? `Deactivate ${sponsor.name}?` : `Reactivate ${sponsor.name}?`} confirmLabel={status === "deactivate" ? "Deactivate" : "Reactivate"} danger={status === "deactivate"} onCancel={() => setStatus(null)}
          onConfirm={(reason) => { upsert("sponsors", logged({ ...sponsor, status: status === "deactivate" ? "inactive" : "active" }, status === "deactivate" ? "Deactivated" : "Reactivated", reason)); setStatus(null); toast("info", status === "deactivate" ? "Sponsor deactivated." : "Sponsor reactivated.") }}>
          {status === "deactivate" ? "Associations and assets are kept. The change is recorded in the activity history." : "The sponsor becomes active again."}
        </ReasonDialog>
      )}
    </>
  )
}

function AssetModal({ initial, onSave, onClose }: { initial: BrandAsset; onSave: (a: BrandAsset) => void; onClose: () => void }) {
  const { assets } = useStore()
  const [a, setA] = useState(initial)
  const [err, setErr] = useState<Record<string, string>>({})
  const save = () => {
    const e: Record<string, string> = {}
    if (!a.label.trim()) e.label = "Give the asset a label."
    if (!a.mediaId) e.mediaId = "Choose an image from the Media Library."
    else if (assets[a.mediaId]?.status !== "ready") e.mediaId = "This file is still processing or failed. Choose a ready image."
    setErr(e)
    if (!Object.keys(e).length) onSave({ ...a, label: a.label.trim() })
  }
  return (
    <Modal title={initial.mediaId ? "Edit brand asset" : "Add brand asset"} onClose={onClose} width={520} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Save asset</button></>}>
      <div style={{ display: "grid", gap: 14 }}>
        <TextField label="Label" required value={a.label} onChange={(e) => setA({ ...a, label: e.target.value })} error={err.label} />
        <SelectField label="Type" value={a.kind} onChange={(e) => setA({ ...a, kind: e.target.value as BrandAssetKind })} options={KINDS} />
        <AssetSlot label="Image" kind="image" crop="square" value={a.mediaId || null} onChange={(id) => setA({ ...a, mediaId: id ?? "" })} />
        {err.mediaId && <span role="alert" style={{ color: "var(--red)", fontSize: 12 }}>{err.mediaId}</span>}
      </div>
    </Modal>
  )
}

function Assets({ sponsor }: { sponsor: Sponsor }) {
  const { upsert, can } = useOps()
  const { toast, assets } = useStore()
  const [edit, setEdit] = useState<BrandAsset | null>(null)
  const [del, setDel] = useState<BrandAsset | null>(null)
  const allowed = can("records.edit")
  const save = (a: BrandAsset) => {
    const exists = sponsor.brandAssets.some((x) => x.id === a.id)
    const list = exists ? sponsor.brandAssets.map((x) => (x.id === a.id ? a : x)) : [...sponsor.brandAssets, a]
    upsert("sponsors", logged({ ...sponsor, brandAssets: list }, `${exists ? "Updated" : "Added"} brand asset "${a.label}"`))
    toast("success", `Brand asset ${exists ? "updated" : "added"}.`)
    setEdit(null)
  }
  return (
    <Card title="Brand assets" aside={<button className="btn btn-sm btn-primary" disabled={!allowed} onClick={() => setEdit({ id: genId("ba"), label: "", kind: KINDS[0], mediaId: "" })}>Add brand asset</button>}>
      <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--text-secondary)" }}>Assets come from the Media Library. Changes here save immediately.</p>
      {sponsor.brandAssets.length === 0 ? <EmptyState title="No brand assets yet" body="Add a logo or brand mark so the sponsor can be shown with its association." /> : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {sponsor.brandAssets.map((b) => (
            <li key={b.id} style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{b.label}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{b.kind} · {assets[b.mediaId]?.name ?? "File missing from Media Library"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-sm" disabled={!allowed} onClick={() => setEdit(b)}>Edit</button>
                <button className="btn btn-sm btn-ghost" disabled={!allowed} onClick={() => setDel(b)}>Remove…</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {edit && <AssetModal initial={edit} onSave={save} onClose={() => setEdit(null)} />}
      {del && (
        <ConfirmDialog title="Remove this brand asset?" confirmLabel="Remove asset" danger onCancel={() => setDel(null)}
          onConfirm={() => { upsert("sponsors", logged({ ...sponsor, brandAssets: sponsor.brandAssets.filter((x) => x.id !== del.id) }, `Removed brand asset "${del.label}"`)); setDel(null); toast("info", "Brand asset removed. The file stays in the Media Library.") }}>
          "{del.label}" is detached from {sponsor.name}. The file itself is not deleted.
        </ConfirmDialog>
      )}
    </Card>
  )
}

function Associations({ sponsor }: { sponsor: Sponsor }) {
  const { events, upsert, can } = useOps()
  const { content, toast } = useStore()
  const allowed = can("records.edit")
  const shows = content.filter((c) => c.type === "show")
  const toggle = (kind: "showIds" | "eventIds", id: string, name: string) => {
    const has = sponsor[kind].includes(id)
    const next = has ? sponsor[kind].filter((x) => x !== id) : [...sponsor[kind], id]
    upsert("sponsors", logged({ ...sponsor, [kind]: next }, `${has ? "Removed association with" : "Associated with"} ${kind === "showIds" ? "show" : "event"} "${name}"`))
    toast("success", has ? `Removed ${name}.` : `Associated with ${name}.`)
  }
  return (
    <>
      {sponsor.status === "inactive" && <Note tone="warn">This sponsor is inactive. Existing associations are kept, but avoid adding new ones until it is reactivated.</Note>}
      <div className="grid-2">
        <Card title="Shows">
          {shows.length === 0 ? <p style={{ margin: 0, fontSize: 13 }}>No shows in the Content Library.</p> : shows.map((s) => (
            <label key={s.id} style={{ display: "flex", gap: 10, padding: "7px 0", alignItems: "center", fontSize: 14 }}>
              <input type="checkbox" disabled={!allowed} checked={sponsor.showIds.includes(s.id)} onChange={() => toggle("showIds", s.id, s.title)} />
              <span>{s.title} <span style={{ color: "var(--text-muted)", fontSize: 12 }}>({s.status})</span></span>
            </label>
          ))}
        </Card>
        <Card title="Events">
          {events.length === 0 ? <p style={{ margin: 0, fontSize: 13 }}>No events yet.</p> : events.map((e) => (
            <label key={e.id} style={{ display: "flex", gap: 10, padding: "7px 0", alignItems: "center", fontSize: 14 }}>
              <input type="checkbox" disabled={!allowed} checked={sponsor.eventIds.includes(e.id)} onChange={() => toggle("eventIds", e.id, e.title)} />
              <span>{e.title} <StatusPill map={LIFECYCLE} value={e.lifecycle} /></span>
            </label>
          ))}
        </Card>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Associations save immediately and also appear on the event's page.</p>
    </>
  )
}

function Detail({ id, tab }: { id: string; tab: Tab }) {
  const { sponsors, upsert, can } = useOps()
  const { toast } = useStore()
  const isNew = id === "new"
  const sponsor = isNew
    ? ({ id: genId("spo"), name: "", description: "", website: "", status: "active", contacts: [], brandAssets: [], showIds: [], eventIds: [], createdAt: new Date().toISOString(), activity: newLog("Created") } as Sponsor)
    : sponsors.find((s) => s.id === id)
  const [seedNew] = useState(sponsor)
  if (!sponsor) return <div className="page-pad"><EmptyState title="Sponsor not found" body="It may not exist after a demo reset." action={<Link to="/admin/sponsors" className="btn">Back to sponsors</Link>} /></div>
  const s = (isNew ? seedNew : sponsor) as Sponsor
  const t: Tab = isNew ? "details" : tab
  return (
    <div className="page-pad">
      <Link to="/admin/sponsors" style={{ fontSize: 13, color: "var(--text-secondary)" }}>← All sponsors</Link>
      <div style={{ height: 12 }} />
      <ReadOnlyNote cap="records.edit" />
      {!isNew && <RouteTabs label="Sponsor sections" base={`/admin/sponsors/${s.id}`} value={t} items={TABS.map((x) => ({ ...x, count: x.id === "contacts" ? s.contacts.length : x.id === "assets" ? s.brandAssets.length : undefined }))} />}
      <div style={{ height: 14 }} />
      {t === "details" && <Details sponsor={s} isNew={isNew} />}
      {t === "contacts" && (
        <Card title="Contacts">
          <ContactsEditor contacts={s.contacts} disabled={!can("records.edit")} onChange={(next, text) => { upsert("sponsors", logged({ ...s, contacts: next }, text)); toast("success", text + ".") }} />
        </Card>
      )}
      {t === "assets" && <Assets sponsor={s} />}
      {t === "associations" && <Associations sponsor={s} />}
      {t === "activity" && <Card title="Activity history"><ActivityLog items={s.activity} /></Card>}
    </div>
  )
}

export default function Sponsors() {
  const { route } = useRouter()
  const [id, tab] = route.parts
  if (!id) return <List />
  const t = (TABS.some((x) => x.id === tab) ? tab : "details") as Tab
  return <Detail key={id} id={id} tab={t} />
}
