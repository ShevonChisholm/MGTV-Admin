import {connected} from "../api/client"
import ConnectedAwards from "./ConnectedAwards"
import React, { useRef, useState } from "react"
import { Link, useDirtyGuard, useRouter } from "../router"
import { PageActions } from "../components/PageHeader"
import { useOps } from "../store/ops/ops"
import { useStore } from "../store/store"
import { Card, ConfirmDialog, EmptyState, Modal, SelectField, TextField } from "../ui"
import { ActivityLog, AssetSlot, MockNote, Note, ReadOnlyNote, ReasonDialog, RouteTabs, StatusPill, fmtLocal } from "../ui/ops"
import { genId } from "../store/meta"
import { logged, newLog } from "../store/ops/types"
import type { Award, AwardCategory, Nominee } from "../store/ops/types"
import { RESULTS, VOTING } from "./opsMeta"
import { dl } from "../store/ops/seed"

type Tab = "overview" | "categories" | "nominees" | "activity"
const TABS: { id: Tab; label: string }[] = [{ id: "overview", label: "Overview" }, { id: "categories", label: "Categories" }, { id: "nominees", label: "Nominees" }, { id: "activity", label: "Activity" }]

const RulesNote = () => <Note tone="warn" title="Voting rules awaiting product decision">Eligibility, one-vote-per-person limits, tie-breaks and how winners are chosen are not defined yet. This prototype only manages the windows and release states.</Note>

function checklist(a: Award) {
  const active = a.categories.filter((c) => !c.archived)
  const items: { ok: boolean; text: string }[] = [
    { ok: !!a.votingOpens && !!a.votingCloses && a.votingOpens < a.votingCloses, text: "Voting opens before it closes" },
    { ok: active.length > 0, text: "At least one active category" },
    ...active.map((c) => ({ ok: c.nominees.length >= 2, text: `${c.name}: at least 2 nominees (has ${c.nominees.length})` })),
  ]
  return items
}

function mockTally(c: AwardCategory) {
  const raw = c.nominees.map((n) => ({ n, v: 200 + ([...n.id].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) % 800) }))
  const total = raw.reduce((s, r) => s + r.v, 0) || 1
  return raw.map((r) => ({ ...r, pct: Math.round((r.v / total) * 100) })).sort((a, b) => b.v - a.v)
}

function List() {
  const { awards, can } = useOps()
  return (
    <div className="page-pad">
      <PageActions>{can("records.edit") && <Link to="/admin/awards/new/overview" className="btn btn-primary">Create award program</Link>}</PageActions>
      <ReadOnlyNote cap="records.edit" />
      {awards.length === 0 ? <EmptyState title="No award programs" body="Create a program to add categories and nominees." /> : (
        <div className="scroll-x" style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--card)" }}>
          <table className="tbl">
            <thead><tr><th>Program</th><th>Voting window</th><th>Categories</th><th>Voting</th><th>Results</th></tr></thead>
            <tbody>
              {awards.map((a) => (
                <tr key={a.id}>
                  <td><Link to={`/admin/awards/${a.id}/overview`} style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>{a.name}</Link></td>
                  <td style={{ fontSize: 13 }}>{fmtLocal(a.votingOpens)} to {fmtLocal(a.votingCloses)}</td>
                  <td>{a.categories.filter((c) => !c.archived).length}</td>
                  <td><StatusPill map={VOTING} value={a.voting} /></td>
                  <td><StatusPill map={RESULTS} value={a.results} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TypedConfirm({ title, phrase, children, confirmLabel, onConfirm, onCancel }: { title: string; phrase: string; children: React.ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const [v, setV] = useState("")
  const ok = v.trim().toLowerCase() === phrase.toLowerCase()
  return (
    <Modal title={title} onClose={onCancel} width={520} footer={<><button className="btn" onClick={onCancel}>Cancel</button><button className="btn btn-danger" disabled={!ok} onClick={onConfirm}>{confirmLabel}</button></>}>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: 14 }}>{children}</div>
      <TextField label={`Type "${phrase}" to confirm`} value={v} onChange={(e) => setV(e.target.value)} />
    </Modal>
  )
}

function Overview({ award, isNew }: { award: Award; isNew: boolean }) {
  const { upsert, can } = useOps()
  const { toast } = useStore()
  const { navigate } = useRouter()
  const [d, setD] = useState({ name: award.name, year: String(award.year), opens: award.votingOpens, closes: award.votingCloses })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [dlg, setDlg] = useState<null | "open" | "close" | "preview" | "release" | "withdraw">(null)
  const leaving = useRef(false)
  const allowed = can("records.edit")
  const mayRelease = can("awards.release")
  const editable = award.voting === "not_open"
  const dirty = isNew ? !!d.name : d.name !== award.name || d.year !== String(award.year) || d.opens !== award.votingOpens || d.closes !== award.votingCloses
  useDirtyGuard(() => dirty && !leaving.current)
  const checks = checklist(award)
  const ready = checks.every((c) => c.ok)

  const save = () => {
    const e: Record<string, string> = {}
    if (!d.name.trim()) e.name = "Enter the program name."
    if (!/^\d{4}$/.test(d.year)) e.year = "Enter a four-digit year."
    if (!d.opens) e.opens = "Choose when voting opens."
    if (!d.closes) e.closes = "Choose when voting closes."
    else if (d.opens && d.closes <= d.opens) e.closes = "Voting must close after it opens."
    setErrs(e)
    if (Object.keys(e).length) return toast("error", "Not saved. Fix the highlighted fields.")
    const next = { ...award, name: d.name.trim(), year: Number(d.year), votingOpens: d.opens, votingCloses: d.closes }
    if (isNew) {
      upsert("awards", next)
      toast("success", "Program created. Add categories next.")
      leaving.current = true
      setTimeout(() => navigate(`/admin/awards/${next.id}/categories`), 0)
    } else {
      upsert("awards", logged(next, `Voting window set: ${fmtLocal(next.votingOpens)} to ${fmtLocal(next.votingCloses)}`))
      toast("success", "Program saved.")
    }
  }
  const patch = (p: Partial<Award>, action: string, reason?: string, msg?: string, tone: "success" | "info" = "success") => {
    upsert("awards", logged({ ...award, ...p }, action, reason))
    if (msg) toast(tone, msg)
    setDlg(null)
  }

  return (
    <>
      <PageActions>
        <span role="status" style={{ fontSize: 12.5, alignSelf: "center", color: dirty ? "var(--yellow)" : "var(--text-muted)" }}>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <button className="btn" disabled={!dirty} onClick={() => { setD({ name: award.name, year: String(award.year), opens: award.votingOpens, closes: award.votingCloses }); setErrs({}) }}>Discard</button>
        <button className="btn btn-primary" disabled={!allowed || !dirty || (!editable && !isNew)} onClick={save}>{isNew ? "Create program" : "Save program"}</button>
      </PageActions>
      <RulesNote />
      {!editable && !isNew && <Note tone="info">The voting window is locked once voting has opened.</Note>}
      <fieldset disabled={!allowed || (!editable && !isNew)} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <Card title="Program and voting window">
          <div style={{ display: "grid", gap: 14, maxWidth: 640 }}>
            <div className="grid-2">
              <TextField label="Program name" required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} error={errs.name} />
              <TextField label="Year" required inputMode="numeric" value={d.year} onChange={(e) => setD({ ...d, year: e.target.value })} error={errs.year} />
            </div>
            <div className="grid-2">
              <TextField label="Voting opens" required type="datetime-local" value={d.opens} onChange={(e) => setD({ ...d, opens: e.target.value })} error={errs.opens} />
              <TextField label="Voting closes" required type="datetime-local" value={d.closes} onChange={(e) => setD({ ...d, closes: e.target.value })} error={errs.closes} />
            </div>
          </div>
        </Card>
      </fieldset>

      {!isNew && (
        <>
          <Card title="Voting">
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <StatusPill map={VOTING} value={award.voting} />
                {award.voting === "not_open" && <button className="btn btn-primary" disabled={!mayRelease || dirty} title={dirty ? "Save the window first" : undefined} onClick={() => setDlg("open")}>Open voting…</button>}
                {award.voting === "open" && <button className="btn" disabled={!mayRelease} onClick={() => setDlg("close")}>Close voting…</button>}
              </div>
              {award.voting === "not_open" && (
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Checks before voting can open</div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4, fontSize: 13 }}>
                    {checks.map((c, i) => <li key={i} style={{ color: c.ok ? "var(--green)" : "var(--red)" }}>{c.ok ? "Pass" : "Fix"}: <span style={{ color: "var(--text-secondary)" }}>{c.text}</span></li>)}
                  </ul>
                </div>
              )}
              {!mayRelease && <Note tone="bad">Your role can't open or close voting or release results (provisional example roles).</Note>}
            </div>
          </Card>

          <Card title="Results release">
            <div style={{ display: "grid", gap: 12 }}>
              <StatusPill map={RESULTS} value={award.results} />
              {award.voting !== "closed" ? <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Results can be previewed after voting closes. Nothing is public until released.</p> : (
                <>
                  <MockNote>Tallies below are generated sample numbers, not real votes. They only demonstrate the preview and release steps.</MockNote>
                  {award.categories.filter((c) => !c.archived).map((c) => (
                    <div key={c.id}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{c.name}</div>
                      {mockTally(c).map((r, i) => (
                        <div key={r.n.id} style={{ display: "grid", gridTemplateColumns: "minmax(110px,200px) 1fr 70px", gap: 10, alignItems: "center", fontSize: 13, marginBottom: 4 }}>
                          <span>{r.n.name}{i === 0 ? " (leading, sample)" : ""}</span>
                          <span style={{ background: "var(--border)", borderRadius: 4, height: 8 }}><span style={{ display: "block", width: `${r.pct}%`, height: 8, background: "var(--accent)", borderRadius: 4 }} /></span>
                          <span style={{ color: "var(--text-secondary)" }}>{r.pct}%</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(award.results === "hidden" || award.results === "withdrawn") && <button className="btn" disabled={!mayRelease} onClick={() => setDlg("preview")}>Mark preview as checked…</button>}
                    {award.results === "previewed" && <button className="btn btn-primary" disabled={!mayRelease} onClick={() => setDlg("release")}>Release results…</button>}
                    {award.results === "released" && <button className="btn btn-danger" disabled={!mayRelease} onClick={() => setDlg("withdraw")}>Withdraw results…</button>}
                  </div>
                </>
              )}
            </div>
          </Card>
        </>
      )}

      {dlg === "open" && (
        <ConfirmDialog title="Open voting now?" confirmLabel={ready ? "Open voting" : "Checks failed"} onCancel={() => setDlg(null)} onConfirm={() => {
          if (!ready) { setDlg(null); return toast("error", "Voting can't open until every check passes.") }
          patch({ voting: "open" }, "Voting opened", undefined, "Voting is open (simulated). Categories and nominees are now locked.")
        }}>
          {ready ? `${award.categories.filter((c) => !c.archived).length} categories will be locked. Window: ${fmtLocal(award.votingOpens)} to ${fmtLocal(award.votingCloses)}. This simulates opening; no public ballot exists.` : "One or more checks are failing. Review the checklist."}
        </ConfirmDialog>
      )}
      {dlg === "close" && (
        <ReasonDialog title="Close voting?" confirmLabel="Close voting" danger onCancel={() => setDlg(null)} onConfirm={(r) => patch({ voting: "closed" }, "Voting closed", r, "Voting closed. Results stay hidden until released.", "info")}>
          Voting can't be reopened in this prototype. Results stay hidden.
        </ReasonDialog>
      )}
      {dlg === "preview" && (
        <ConfirmDialog title="Mark the preview as checked?" confirmLabel="Mark checked" onCancel={() => setDlg(null)} onConfirm={() => patch({ results: "previewed" }, "Results preview checked", undefined, "Preview checked. You can now release results.")}>
          This confirms a person reviewed the sample preview. It does not publish anything.
        </ConfirmDialog>
      )}
      {dlg === "release" && (
        <TypedConfirm title="Release results?" phrase="release" confirmLabel="Release results" onCancel={() => setDlg(null)} onConfirm={() => patch({ results: "released" }, "Results released", undefined, "Results released (simulated). Nothing was published outside this browser.")}>
          {award.categories.filter((c) => !c.archived).length} categories would become visible to customers. This is simulated here, but treat it as a significant action.
        </TypedConfirm>
      )}
      {dlg === "withdraw" && (
        <ReasonDialog title="Withdraw released results?" confirmLabel="Withdraw results" danger onCancel={() => setDlg(null)} onConfirm={(r) => patch({ results: "withdrawn" }, "Results withdrawn", r, "Results withdrawn.", "info")}>
          Results are hidden again. The reason is recorded. You can re-check the preview and release again.
        </ReasonDialog>
      )}
    </>
  )
}

function Categories({ award }: { award: Award }) {
  const { upsert, can } = useOps()
  const { toast } = useStore()
  const [edit, setEdit] = useState<{ id: string; name: string } | null>(null)
  const [err, setErr] = useState("")
  const locked = award.voting !== "not_open"
  const allowed = can("records.edit") && !locked
  const write = (cats: AwardCategory[], action: string) => upsert("awards", logged({ ...award, categories: cats }, action))
  const move = (i: number, dir: number) => { const c = [...award.categories]; const j = i + dir; if (j < 0 || j >= c.length) return; [c[i], c[j]] = [c[j], c[i]]; write(c, `Reordered category "${c[j].name}"`) }
  const save = () => {
    if (!edit) return
    const name = edit.name.trim()
    if (!name) return setErr("Enter a category name.")
    if (award.categories.some((c) => c.id !== edit.id && c.name.toLowerCase() === name.toLowerCase())) return setErr("A category with this name already exists.")
    const exists = award.categories.some((c) => c.id === edit.id)
    write(exists ? award.categories.map((c) => (c.id === edit.id ? { ...c, name } : c)) : [...award.categories, { id: edit.id, name, archived: false, nominees: [] }], `${exists ? "Renamed" : "Added"} category "${name}"`)
    toast("success", exists ? "Category renamed." : "Category added.")
    setEdit(null); setErr("")
  }
  return (
    <>
      {locked && <Note tone="info">Categories are locked because voting is {award.voting === "open" ? "open" : "closed"}.</Note>}
      <Card title="Categories" aside={<button className="btn btn-sm btn-primary" disabled={!allowed} onClick={() => setEdit({ id: genId("cat"), name: "" })}>Add category</button>}>
        {award.categories.length === 0 ? <EmptyState title="No categories yet" body="Add a category, then add nominees to it." /> : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {award.categories.map((c, i) => (
              <li key={c.id} style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", opacity: c.archived ? 0.6 : 1 }}>
                <div>
                  <strong style={{ fontSize: 14 }}>{c.name}</strong> {c.archived && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>(archived)</span>}
                  <div style={{ fontSize: 12.5, color: c.nominees.length < 2 && !c.archived ? "var(--yellow)" : "var(--text-secondary)" }}>{c.nominees.length} nominee{c.nominees.length === 1 ? "" : "s"}{c.nominees.length < 2 && !c.archived ? " (needs at least 2)" : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-sm" aria-label={`Move ${c.name} up`} disabled={!allowed || i === 0} onClick={() => move(i, -1)}>Up</button>
                  <button className="btn btn-sm" aria-label={`Move ${c.name} down`} disabled={!allowed || i === award.categories.length - 1} onClick={() => move(i, 1)}>Down</button>
                  <button className="btn btn-sm" disabled={!allowed} onClick={() => setEdit({ id: c.id, name: c.name })}>Rename</button>
                  <button className="btn btn-sm btn-ghost" disabled={!allowed} onClick={() => write(award.categories.map((x) => (x.id === c.id ? { ...x, archived: !x.archived } : x)), `${c.archived ? "Restored" : "Archived"} category "${c.name}"`)}>{c.archived ? "Restore" : "Archive"}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {edit && (
        <Modal title={award.categories.some((c) => c.id === edit.id) ? "Rename category" : "Add category"} onClose={() => { setEdit(null); setErr("") }} width={440} footer={<><button className="btn" onClick={() => { setEdit(null); setErr("") }}>Cancel</button><button className="btn btn-primary" onClick={save}>Save category</button></>}>
          <TextField label="Category name" required value={edit.name} onChange={(e) => { setEdit({ ...edit, name: e.target.value }); setErr("") }} error={err} />
        </Modal>
      )}
    </>
  )
}

function Nominees({ award }: { award: Award }) {
  const { upsert, can } = useOps()
  const { toast, content } = useStore()
  const [edit, setEdit] = useState<{ catId: string; n: Nominee } | null>(null)
  const [del, setDel] = useState<{ catId: string; n: Nominee } | null>(null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const locked = award.voting !== "not_open"
  const allowed = can("records.edit") && !locked
  const active = award.categories.filter((c) => !c.archived)
  const write = (cats: AwardCategory[], action: string) => upsert("awards", logged({ ...award, categories: cats }, action))
  const save = () => {
    if (!edit) return
    const e: Record<string, string> = {}
    const cat = award.categories.find((c) => c.id === edit.catId)!
    const name = edit.n.name.trim()
    if (!name) e.name = "Enter the nominee's name."
    else if (cat.nominees.some((x) => x.id !== edit.n.id && x.name.toLowerCase() === name.toLowerCase())) e.name = "This nominee is already in the category."
    setErrs(e)
    if (Object.keys(e).length) return
    const exists = cat.nominees.some((x) => x.id === edit.n.id)
    const n = { ...edit.n, name }
    write(award.categories.map((c) => (c.id === cat.id ? { ...c, nominees: exists ? c.nominees.map((x) => (x.id === n.id ? n : x)) : [...c.nominees, n] } : c)), `${exists ? "Updated" : "Added"} nominee "${name}" in ${cat.name}`)
    toast("success", exists ? "Nominee updated." : "Nominee added.")
    setEdit(null)
  }
  return (
    <>
      {locked && <Note tone="info">Nominees are locked because voting is {award.voting === "open" ? "open" : "closed"}.</Note>}
      {active.length === 0 && <EmptyState title="No active categories" body="Add a category first." action={<Link to={`/admin/awards/${award.id}/categories`} className="btn">Go to categories</Link>} />}
      {active.map((c) => (
        <Card key={c.id} title={c.name} aside={<button className="btn btn-sm btn-primary" disabled={!allowed} onClick={() => { setErrs({}); setEdit({ catId: c.id, n: { id: genId("nom"), name: "", note: "", imageId: null, contentId: null } }) }}>Add nominee</button>}>
          {c.nominees.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>No nominees yet.</p> : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {c.nominees.map((n) => (
                <li key={n.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14 }}>{n.name} {n.contentId && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· linked to {content.find((x) => x.id === n.contentId)?.title ?? "missing content"}</span>}</span>
                  <span style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm" disabled={!allowed} onClick={() => { setErrs({}); setEdit({ catId: c.id, n }) }}>Edit</button>
                    <button className="btn btn-sm btn-ghost" disabled={!allowed} onClick={() => setDel({ catId: c.id, n })}>Remove…</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
      {edit && (
        <Modal title="Nominee" onClose={() => setEdit(null)} width={520} footer={<><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save nominee</button></>}>
          <div style={{ display: "grid", gap: 14 }}>
            <TextField label="Name" required value={edit.n.name} onChange={(e) => setEdit({ ...edit, n: { ...edit.n, name: e.target.value } })} error={errs.name} />
            <SelectField label="Linked content (optional)" value={content.find((x) => x.id === edit.n.contentId)?.title ?? ""} onChange={(e) => setEdit({ ...edit, n: { ...edit.n, contentId: content.find((x) => x.title === e.target.value)?.id ?? null } })} options={content.map((x) => x.title)} placeholder="None" />
            <TextField label="Note" multiline value={edit.n.note} onChange={(e) => setEdit({ ...edit, n: { ...edit.n, note: e.target.value } })} />
            <AssetSlot label="Image" kind="image" crop="square" value={edit.n.imageId} onChange={(id) => setEdit({ ...edit, n: { ...edit.n, imageId: id } })} />
          </div>
        </Modal>
      )}
      {del && (
        <ConfirmDialog title="Remove nominee?" confirmLabel="Remove nominee" danger onCancel={() => setDel(null)} onConfirm={() => { write(award.categories.map((c) => (c.id === del.catId ? { ...c, nominees: c.nominees.filter((x) => x.id !== del.n.id) } : c)), `Removed nominee "${del.n.name}"`); setDel(null); toast("info", "Nominee removed.") }}>
          "{del.n.name}" will be removed from the category.
        </ConfirmDialog>
      )}
    </>
  )
}

function Detail({ id, tab }: { id: string; tab: Tab }) {
  const { awards } = useOps()
  const isNew = id === "new"
  const [fresh] = useState<Award>(() => ({ id: genId("awd"), name: "", year: new Date().getFullYear(), votingOpens: dl(20, 9), votingCloses: dl(34, 18), voting: "not_open", results: "hidden", categories: [], createdAt: new Date().toISOString(), activity: newLog("Created award program") }))
  const award = isNew ? fresh : awards.find((a) => a.id === id)
  if (!award) return <div className="page-pad"><EmptyState title="Award program not found" body="It may not exist after a demo reset." action={<Link to="/admin/awards" className="btn">Back to awards</Link>} /></div>
  const t: Tab = isNew ? "overview" : tab
  return (
    <div className="page-pad">
      <Link to="/admin/awards" style={{ fontSize: 13, color: "var(--text-secondary)" }}>← All award programs</Link>
      <div style={{ height: 12 }} />
      <ReadOnlyNote cap="records.edit" />
      {!isNew && <RouteTabs label="Award sections" base={`/admin/awards/${award.id}`} value={t} items={TABS} />}
      <div style={{ height: 14 }} />
      {t === "overview" && <Overview award={award} isNew={isNew} />}
      {t === "categories" && <Categories award={award} />}
      {t === "nominees" && <Nominees award={award} />}
      {t === "activity" && <Card title="Activity history"><ActivityLog items={award.activity} /></Card>}
    </div>
  )
}

export default function Awards() { return connected ? <ConnectedAwards/> : <PrototypeAwards/> }
function PrototypeAwards() {
  const { route } = useRouter()
  const [id, tab] = route.parts
  if (!id) return <List />
  return <Detail key={id} id={id} tab={(TABS.some((x) => x.id === tab) ? tab : "overview") as Tab} />
}
