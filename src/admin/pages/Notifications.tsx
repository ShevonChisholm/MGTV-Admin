import React, { useRef, useState } from "react"
import { Link, useDirtyGuard, useRouter } from "../router"
import { PageActions } from "../components/PageHeader"
import { useOps } from "../store/ops/ops"
import { useStore } from "../store/store"
import { Card, ConfirmDialog, EmptyState, Modal, TextField } from "../ui"
import { ActivityLog, Denied, MockNote, Note, RouteTabs, Stepper, StatusPill } from "../ui/ops"
import { genId } from "../store/meta"
import { logged, newLog, SEGMENTS } from "../store/ops/types"
import type { Channel, Notification, Template } from "../store/ops/types"
import { CHANNEL_LABEL, NOTIF_STATUS } from "./opsMeta"

type Tab = "messages" | "templates" | "history"
const TABS: { id: Tab; label: string }[] = [{ id: "messages", label: "Messages" }, { id: "templates", label: "Templates" }, { id: "history", label: "History" }]
const CHANNELS: Channel[] = ["push", "email", "in_app"]
const LIMITS: Record<Channel, number> = { push: 120, email: 5000, in_app: 400 }
const segLabel = (id: string) => SEGMENTS.find((s) => s.id === id)?.label ?? "Unknown audience"
const chLabel = (c: Channel[]) => c.map((x) => CHANNEL_LABEL[x]).join(" + ") || "No channel"

const MOCK_BANNER = "MOCK DELIVERY. No message was sent to anyone. Counts below are generated for demonstration."

function Tabs({ tab }: { tab: Tab }) {
  return <><RouteTabs label="Notification sections" base="/admin/notifications" value={tab} items={TABS} /><div style={{ height: 14 }} /></>
}

function Messages() {
  const { notifications, can } = useOps()
  const rows = notifications.filter((n) => n.status === "draft" || n.status === "scheduled")
  return (
    <>
      <PageActions>{can("notifications.send") && <Link to="/admin/notifications/new" className="btn btn-primary">Compose message</Link>}</PageActions>
      <Note tone="mock" title="Local simulation">Nothing in this section sends real push, email or in-app messages.</Note>
      {rows.length === 0 ? <EmptyState title="No drafts or scheduled messages" body="Compose a message to start." /> : (
        <div className="scroll-x" style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--card)" }}>
          <table className="tbl">
            <thead><tr><th>Message</th><th>Audience</th><th>Channels</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((n) => (
                <tr key={n.id}>
                  <td><Link to={`/admin/notifications/${n.id}`} style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>{n.title || "Untitled draft"}</Link></td>
                  <td>{segLabel(n.audienceId)}</td>
                  <td>{chLabel(n.channels)}</td>
                  <td><StatusPill map={NOTIF_STATUS} value={n.status} />{n.status === "scheduled" && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(n.scheduleAt).toLocaleString()}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function History() {
  const { notifications } = useOps()
  const rows = notifications.filter((n) => n.status === "sent" || n.status === "cancelled")
  return (
    <>
      <MockNote>Every entry is a simulation. Delivered, opened and failed counts are generated, not measured.</MockNote>
      {rows.length === 0 ? <EmptyState title="Nothing sent yet" body="Simulated sends appear here with their outcome." /> : (
        <div className="scroll-x" style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--card)" }}>
          <table className="tbl">
            <thead><tr><th>Message</th><th>Audience</th><th>Channels</th><th>Outcome</th><th>Delivered (mock)</th><th>Opened (mock)</th><th>Failed (mock)</th></tr></thead>
            <tbody>
              {rows.map((n) => (
                <tr key={n.id}>
                  <td><Link to={`/admin/notifications/${n.id}`} style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>{n.title}</Link><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{n.sentAt ? new Date(n.sentAt).toLocaleString() : ""}</div></td>
                  <td>{segLabel(n.audienceId)}</td>
                  <td>{chLabel(n.channels)}</td>
                  <td><StatusPill map={NOTIF_STATUS} value={n.status} /></td>
                  <td>{n.result?.delivered.toLocaleString() ?? "—"}</td>
                  <td>{n.result?.opened.toLocaleString() ?? "—"}</td>
                  <td>{n.result?.failed.toLocaleString() ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function TemplateModal({ tpl, onClose }: { tpl: Template | null; onClose: () => void }) {
  const { upsert } = useOps()
  const { toast } = useStore()
  const [d, setD] = useState<Template>(tpl ?? { id: genId("tpl"), name: "", title: "", body: "", channels: ["push"] })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const save = () => {
    const e: Record<string, string> = {}
    if (!d.name.trim()) e.name = "Name the template."
    if (!d.title.trim()) e.title = "Enter a title."
    if (!d.body.trim()) e.body = "Enter the message text."
    if (d.channels.length === 0) e.channels = "Choose at least one channel."
    setErrs(e)
    if (Object.keys(e).length) return
    upsert("templates", { ...d, name: d.name.trim() })
    toast("success", tpl ? "Template saved." : "Template created.")
    onClose()
  }
  return (
    <Modal title={tpl ? "Edit template" : "New template"} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Save template</button></>}>
      <div style={{ display: "grid", gap: 14 }}>
        <TextField label="Template name" required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} error={errs.name} />
        <TextField label="Title" required value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} error={errs.title} />
        <TextField label="Message" required multiline rows={3} value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} error={errs.body} />
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Default channels</legend>
          {CHANNELS.map((c) => (
            <label key={c} style={{ display: "inline-flex", gap: 6, marginRight: 16, fontSize: 14 }}>
              <input type="checkbox" checked={d.channels.includes(c)} onChange={() => setD({ ...d, channels: d.channels.includes(c) ? d.channels.filter((x) => x !== c) : [...d.channels, c] })} />{CHANNEL_LABEL[c]}
            </label>
          ))}
          {errs.channels && <p role="alert" style={{ color: "var(--red)", fontSize: 12.5, margin: "6px 0 0" }}>{errs.channels}</p>}
        </fieldset>
      </div>
    </Modal>
  )
}

function Templates() {
  const { templates, remove, can } = useOps()
  const { toast } = useStore()
  const { navigate } = useRouter()
  const [edit, setEdit] = useState<Template | null | "new">(null)
  const [del, setDel] = useState<Template | null>(null)
  const allowed = can("notifications.send")
  return (
    <>
      <PageActions>{allowed && <button className="btn btn-primary" onClick={() => setEdit("new")}>New template</button>}</PageActions>
      {templates.length === 0 ? <EmptyState title="No templates" body="Create a template to reuse message copy." /> : (
        <div style={{ display: "grid", gap: 10 }}>
          {templates.map((t) => (
            <Card key={t.id} title={t.name}>
              <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 14 }}>{t.title}</p>
              <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "var(--text-secondary)" }}>{t.body}</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)", marginRight: "auto" }}>{chLabel(t.channels)}</span>
                <button className="btn btn-sm btn-primary" disabled={!allowed} onClick={() => navigate(`/admin/notifications/new/${t.id}`)}>Use in new message</button>
                <button className="btn btn-sm" disabled={!allowed} onClick={() => setEdit(t)}>Edit</button>
                <button className="btn btn-sm btn-ghost" disabled={!allowed} onClick={() => setDel(t)}>Delete…</button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {edit && <TemplateModal tpl={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      {del && <ConfirmDialog title={`Delete "${del.name}"?`} confirmLabel="Delete template" danger onCancel={() => setDel(null)} onConfirm={() => { remove("templates", del.id); setDel(null); toast("info", "Template deleted. Messages already created from it are unchanged.") }}>Existing messages keep their own copy of the text.</ConfirmDialog>}
    </>
  )
}

const STEPS = ["Compose", "Audience and channel", "Preview", "Test locally", "Schedule or send"]

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }

function Composer({ id, tplId }: { id: string; tplId?: string }) {
  const { notifications, templates, upsert, can } = useOps()
  const { toast } = useStore()
  const { navigate } = useRouter()
  const isNew = id === "new"
  const tpl = tplId ? templates.find((t) => t.id === tplId) : undefined
  const [fresh] = useState<Notification>(() => ({
    id: genId("ntf"), title: tpl?.title ?? "", body: tpl?.body ?? "", channels: tpl?.channels ?? ["push"], audienceId: "", scheduleAt: "", status: "draft",
    createdAt: new Date().toISOString(), activity: newLog(tpl ? `Created from template "${tpl.name}"` : "Created draft"),
  }))
  const saved = isNew ? fresh : notifications.find((n) => n.id === id)
  const [d, setD] = useState<Notification | null>(saved ?? null)
  const [step, setStep] = useState(0)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [previewCh, setPreviewCh] = useState<Channel>(saved?.channels[0] ?? "push")
  const [dlg, setDlg] = useState<null | "send" | "schedule" | "cancel">(null)
  const [persisted, setPersisted] = useState(!isNew)
  const leaving = useRef(false)
  const fields = ["title", "body", "channels", "audienceId", "scheduleAt"] as const
  const dirty = !!saved && !!d && (persisted ? fields.some((k) => JSON.stringify(d[k]) !== JSON.stringify(saved[k])) : !!(d.title || d.body))
  useDirtyGuard(() => dirty && !leaving.current)

  if (!saved || !d) return <div className="page-pad"><EmptyState title="Message not found" body="It may not exist after a demo reset." action={<Link to="/admin/notifications" className="btn">Back to messages</Link>} /></div>
  if (!can("notifications.send") && isNew) return <Denied what="Composing messages" cap="notifications.send" />

  const closed = saved.status === "sent" || saved.status === "cancelled"
  const allowed = can("notifications.send") && !closed
  const set = <K extends (typeof fields)[number]>(k: K, v: Notification[K]) => { setD({ ...d, [k]: v }); setErrs((e) => ({ ...e, [k]: "" })) }
  const seg = SEGMENTS.find((s) => s.id === d.audienceId)

  const check = (upTo: number) => {
    const e: Record<string, string> = {}
    if (upTo >= 0) {
      if (!d.title.trim()) e.title = "Enter a title."
      if (!d.body.trim()) e.body = "Enter the message text."
    }
    if (upTo >= 1) {
      if (!d.audienceId) e.audienceId = "Choose an audience."
      if (d.channels.length === 0) e.channels = "Choose at least one channel."
      d.channels.forEach((c) => { if (c === "push" && d.body.length > LIMITS.push) e.body = `Push text is limited to ${LIMITS.push} characters in this example. Shorten it or remove Push.` })
    }
    setErrs(e)
    return Object.keys(e).length === 0
  }
  const persist = (next: Notification, action: string, reason?: string) => {
    const withLog = persisted || !isNew ? logged(next, action, reason) : next
    upsert("notifications", withLog)
    setPersisted(true)
    return withLog
  }
  const saveDraft = () => {
    if (!d.title.trim()) { setErrs({ title: "Enter a title before saving." }); return toast("error", "Not saved. Add a title.") }
    const next = { ...saved, ...Object.fromEntries(fields.map((k) => [k, d[k]])) } as Notification
    // content changed after a test: the test no longer applies
    if (next.title !== saved.title || next.body !== saved.body) next.testedAt = undefined
    persist(next, isNew && !persisted ? "Draft saved" : "Draft updated")
    toast("success", "Draft saved.")
    if (isNew) { leaving.current = true; setTimeout(() => navigate(`/admin/notifications/${next.id}`), 0) }
  }
  const go = (to: number) => {
    if (to > step && !check(step)) return toast("error", "Complete the required fields first.")
    if (to > step && step < 1 && !check(1) && to > 1) return
    setStep(to)
  }
  const next = () => { if (check(step)) setStep(step + 1) }

  const runTest = () => {
    if (!check(1)) return setStep(1)
    const n = persist({ ...saved, ...Object.fromEntries(fields.map((k) => [k, d[k]])), testedAt: new Date().toISOString() } as Notification, "Local test run (not sent)")
    toast("info", "Local test rendered. Nothing was sent.")
    if (isNew) { leaving.current = true; setTimeout(() => navigate(`/admin/notifications/${n.id}`), 0) }
  }
  const base = () => ({ ...saved, ...Object.fromEntries(fields.map((k) => [k, d[k]])) }) as Notification
  const simulateSend = () => {
    const est = seg?.estimate ?? 0
    const h = hash(d.title + d.body)
    const failed = Math.round(est * (0.01 + (h % 20) / 1000))
    const delivered = est - failed
    const opened = Math.round(delivered * (0.25 + (h % 30) / 100))
    const n = persist({ ...base(), status: "sent", sentAt: new Date().toISOString(), result: { delivered, opened, failed } }, "Send simulated (no real message sent)")
    setDlg(null)
    toast("info", "Send simulated. No real message was delivered.")
    if (isNew) { leaving.current = true; setTimeout(() => navigate(`/admin/notifications/${n.id}`), 0) }
  }
  const simulateSchedule = (when: string) => {
    persist({ ...base(), status: "scheduled", scheduleAt: when }, `Scheduled for ${new Date(when).toLocaleString()} (simulated)`)
    setDlg(null)
    toast("info", "Scheduled in the prototype only. Nothing will be sent.")
    if (isNew) { leaving.current = true; setTimeout(() => navigate(`/admin/notifications/${saved.id}`), 0) }
  }

  const preview = (
    <div style={{ border: "1px solid var(--border-light)", borderRadius: 12, padding: 14, background: "var(--bg)", maxWidth: 360 }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{CHANNEL_LABEL[previewCh]} preview (approximation)</div>
      {previewCh === "email" && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Subject:</div>}
      <div style={{ fontWeight: 700, fontSize: 15 }}>{d.title || "Title appears here"}</div>
      <div style={{ fontSize: 13.5, marginTop: 4, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{d.body || "Message text appears here"}</div>
      {previewCh === "push" && <div style={{ fontSize: 11.5, marginTop: 8, color: d.body.length > LIMITS.push ? "var(--red)" : "var(--text-muted)" }}>{d.body.length}/{LIMITS.push} characters</div>}
    </div>
  )

  return (
    <div className="page-pad">
      <Link to="/admin/notifications" style={{ fontSize: 13, color: "var(--text-secondary)" }}>← All messages</Link>
      <div style={{ height: 12 }} />
      <PageActions>
        <span role="status" style={{ fontSize: 12.5, alignSelf: "center", color: dirty ? "var(--yellow)" : "var(--text-muted)" }}>{dirty ? "Unsaved changes" : persisted ? "Saved" : ""}</span>
        {!closed && <button className="btn" disabled={!allowed || !dirty} onClick={saveDraft}>Save draft</button>}
      </PageActions>
      {!can("notifications.send") && <Note tone="bad" title="View only">Your role can't send or schedule notifications (provisional example roles).</Note>}

      {closed ? (
        <>
          <Note tone="mock" title="Mock delivery">{MOCK_BANNER}</Note>
          <Card title={saved.title}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}><StatusPill map={NOTIF_STATUS} value={saved.status} /><span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{segLabel(saved.audienceId)} · {chLabel(saved.channels)}</span></div>
            <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{saved.body}</p>
            {saved.result && (
              <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, margin: "14px 0 0" }}>
                {([["Delivered (mock)", saved.result.delivered], ["Opened (mock)", saved.result.opened], ["Failed (mock)", saved.result.failed]] as const).map(([k, v]) => (
                  <div key={k}><dt style={{ fontSize: 12, color: "var(--text-muted)" }}>{k}</dt><dd style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{v.toLocaleString()}</dd></div>
                ))}
              </dl>
            )}
            {saved.status === "cancelled" && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>This scheduled message was cancelled and was never sent.</p>}
          </Card>
          <Card title="Activity history"><ActivityLog items={saved.activity} /></Card>
        </>
      ) : (
        <>
          {saved.status === "scheduled" && (
            <Note tone="warn" title={`Scheduled for ${new Date(saved.scheduleAt).toLocaleString()} (simulated)`}>
              Nothing will actually be sent. <button className="btn btn-sm" disabled={!allowed} onClick={() => setDlg("cancel")} style={{ marginLeft: 8 }}>Cancel schedule…</button>
            </Note>
          )}
          <Stepper steps={STEPS} current={step} onGo={go} />
          <fieldset disabled={!allowed} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            {step === 0 && (
              <Card title="Compose">
                <div style={{ display: "grid", gap: 14, maxWidth: 560 }}>
                  <TextField label="Title" required value={d.title} onChange={(e) => set("title", e.target.value)} error={errs.title} />
                  <TextField label="Message" required multiline rows={4} value={d.body} onChange={(e) => set("body", e.target.value)} error={errs.body} />
                  {templates.length > 0 && isNew && (
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Start from a template: {templates.map((t) => <button key={t.id} className="btn btn-sm" style={{ marginRight: 6 }} onClick={() => setD({ ...d, title: t.title, body: t.body, channels: t.channels })}>{t.name}</button>)}</div>
                  )}
                </div>
              </Card>
            )}
            {step === 1 && (
              <Card title="Audience and channel">
                <div style={{ display: "grid", gap: 16, maxWidth: 560 }}>
                  <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                    <legend style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Audience <span aria-hidden="true">*</span></legend>
                    {SEGMENTS.map((s) => (
                      <label key={s.id} style={{ display: "flex", gap: 8, padding: "4px 0", fontSize: 14 }}>
                        <input type="radio" name="aud" checked={d.audienceId === s.id} onChange={() => set("audienceId", s.id)} />{s.label} <span style={{ color: "var(--text-muted)" }}>(about {s.estimate.toLocaleString()}, sample estimate)</span>
                      </label>
                    ))}
                    {errs.audienceId && <p role="alert" style={{ color: "var(--red)", fontSize: 12.5, margin: "6px 0 0" }}>{errs.audienceId}</p>}
                  </fieldset>
                  <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                    <legend style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Channels <span aria-hidden="true">*</span></legend>
                    {CHANNELS.map((c) => (
                      <label key={c} style={{ display: "inline-flex", gap: 6, marginRight: 16, fontSize: 14 }}>
                        <input type="checkbox" checked={d.channels.includes(c)} onChange={() => set("channels", d.channels.includes(c) ? d.channels.filter((x) => x !== c) : [...d.channels, c])} />{CHANNEL_LABEL[c]}
                      </label>
                    ))}
                    {errs.channels && <p role="alert" style={{ color: "var(--red)", fontSize: 12.5, margin: "6px 0 0" }}>{errs.channels}</p>}
                    {errs.body && <p role="alert" style={{ color: "var(--red)", fontSize: 12.5, margin: "6px 0 0" }}>{errs.body}</p>}
                  </fieldset>
                </div>
              </Card>
            )}
            {step === 2 && (
              <Card title="Preview">
                <div role="tablist" aria-label="Preview channel" style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {d.channels.map((c) => <button key={c} role="tab" aria-selected={previewCh === c} className={previewCh === c ? "btn btn-sm btn-primary" : "btn btn-sm"} onClick={() => setPreviewCh(c)}>{CHANNEL_LABEL[c]}</button>)}
                </div>
                {preview}
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>To {seg?.label ?? "no audience"} (about {(seg?.estimate ?? 0).toLocaleString()}).</p>
              </Card>
            )}
            {step === 3 && (
              <Card title="Test locally">
                <Note tone="mock" title="Not sent">A local test only renders the message here, in this browser. No email, push or in-app message goes to a device or inbox.</Note>
                <button className="btn btn-primary" onClick={runTest}>Run local test</button>
                {saved.testedAt && <p role="status" style={{ fontSize: 13, color: "var(--green)" }}>Last local test: {new Date(saved.testedAt).toLocaleString()} (not sent)</p>}
                {!saved.testedAt && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>A local test is recommended before sending. Editing the title or text clears it.</p>}
                <div style={{ marginTop: 12 }}>{preview}</div>
              </Card>
            )}
            {step === 4 && (
              <Card title="Schedule or send">
                <MockNote>{MOCK_BANNER}</MockNote>
                <p style={{ fontSize: 14 }}>"{d.title}" to {seg?.label ?? "no audience"} via {chLabel(d.channels)}.</p>
                {!saved.testedAt && <p style={{ fontSize: 13, color: "var(--yellow)" }}>No local test has been run for this version.</p>}
                {dirty && <p style={{ fontSize: 13, color: "var(--yellow)" }}>You have unsaved changes. They are included when you send or schedule.</p>}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  <button className="btn btn-primary" onClick={() => { if (check(1)) setDlg("send") }}>Simulate send now…</button>
                  <button className="btn" onClick={() => { if (check(1)) setDlg("schedule") }}>Schedule (simulated)…</button>
                </div>
              </Card>
            )}
          </fieldset>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
            {step < STEPS.length - 1 && <button className="btn btn-primary" onClick={next}>Continue to {STEPS[step + 1].toLowerCase()}</button>}
          </div>
          <Card title="Activity history"><ActivityLog items={saved.activity} /></Card>
        </>
      )}

      {dlg === "send" && (
        <ConfirmDialog title="Simulate sending this message?" confirmLabel="Simulate send" onCancel={() => setDlg(null)} onConfirm={simulateSend}>
          This creates a history entry with generated delivery counts for about {(seg?.estimate ?? 0).toLocaleString()} recipients. No real message is sent.
        </ConfirmDialog>
      )}
      {dlg === "schedule" && <ScheduleDialog onCancel={() => setDlg(null)} onConfirm={simulateSchedule} />}
      {dlg === "cancel" && (
        <ConfirmDialog title="Cancel this scheduled message?" confirmLabel="Cancel schedule" danger cancelLabel="Keep schedule" onCancel={() => setDlg(null)}
          onConfirm={() => { upsert("notifications", logged({ ...saved, status: "cancelled" }, "Schedule cancelled")); setDlg(null); toast("info", "Schedule cancelled. It was never sent.") }}>
          The message moves to History as cancelled and cannot be edited afterwards.
        </ConfirmDialog>
      )}
    </div>
  )
}

function ScheduleDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (iso: string) => void }) {
  const [v, setV] = useState("")
  const [err, setErr] = useState("")
  return (
    <ConfirmDialog title="Schedule (simulated)" confirmLabel="Schedule" onCancel={onCancel} onConfirm={() => {
      if (!v) return setErr("Choose a date and time.")
      if (new Date(v).getTime() <= Date.now()) return setErr("Choose a time in the future.")
      onConfirm(new Date(v).toISOString())
    }}>
      <p style={{ marginTop: 0 }}>Scheduling is simulated. Nothing is sent at that time.</p>
      <TextField label="Send at (your local time)" type="datetime-local" value={v} onChange={(e) => { setV(e.target.value); setErr("") }} error={err} />
    </ConfirmDialog>
  )
}

export default function Notifications() {
  const { route } = useRouter()
  const [a, b] = route.parts
  if (a === "new") return <Composer key={"new" + (b ?? "")} id="new" tplId={b} />
  if (a && a !== "templates" && a !== "history") return <Composer key={a} id={a} />
  const tab: Tab = a === "templates" || a === "history" ? a : "messages"
  return (
    <div className="page-pad">
      <Tabs tab={tab} />
      {tab === "messages" && <Messages />}
      {tab === "templates" && <Templates />}
      {tab === "history" && <History />}
    </div>
  )
}
