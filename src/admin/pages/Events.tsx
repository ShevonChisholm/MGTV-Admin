import React, { useRef, useState } from "react"
import { Link, useDirtyGuard, useRouter } from "../router"
import { PageActions } from "../components/PageHeader"
import { useOps } from "../store/ops/ops"
import { useStore } from "../store/store"
import { Card, EmptyState, Modal, SelectField, TextField } from "../ui"
import { ActivityLog, AssetSlot, Note, ReadOnlyNote, ReasonDialog, StatusPill, TIMEZONES, Toolbar, fmtLocal } from "../ui/ops"
import { genId } from "../store/meta"
import { logged, newLog } from "../store/ops/types"
import type { EventFormat, OpsEvent } from "../store/ops/types"
import { BROADCAST, FORMAT_LABEL, LIFECYCLE } from "./opsMeta"
import { dl } from "../store/ops/seed"

const validUrl = (s: string) => { try { return /^https?:$/.test(new URL(s).protocol) } catch { return false } }
const needsVenue = (f: EventFormat) => f !== "online"
const needsOnline = (f: EventFormat) => f !== "in_person"

function blank(): OpsEvent {
  return {
    id: genId("evt"), title: "", description: "", format: "in_person", venue: "", onlineUrl: "", timezone: "America/New_York", start: dl(30), end: dl(30, 21),
    lifecycle: "draft", broadcast: "not_configured", posterId: null, trailerId: null, replayId: null, ticketUrl: "", createdAt: new Date().toISOString(), activity: newLog("Created draft"),
  }
}

function List() {
  const { events, can } = useOps()
  const [q, setQ] = useState("")
  const [lc, setLc] = useState("")
  const list = events.filter((e) => (!lc || e.lifecycle === lc) && e.title.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.start.localeCompare(b.start))
  return (
    <div className="page-pad">
      <PageActions>{can("records.edit") && <Link to="/admin/events/new" className="btn btn-primary">Create event</Link>}</PageActions>
      <ReadOnlyNote cap="records.edit" />
      <Toolbar>
        <div style={{ flex: "1 1 220px" }}><TextField label="Search events" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <SelectField label="Lifecycle" value={lc} onChange={(e) => setLc(e.target.value)} options={["draft", "scheduled", "postponed", "cancelled", "completed"]} placeholder="All" />
      </Toolbar>
      {list.length === 0 ? <EmptyState title="No events match" body="Clear the filters or create an event." /> : (
        <div className="scroll-x" style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--card)" }}>
          <table className="tbl">
            <thead><tr><th>Event</th><th>Starts</th><th>Format</th><th>Lifecycle</th><th>Broadcast</th></tr></thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td><Link to={`/admin/events/${e.id}`} style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>{e.title}</Link></td>
                  <td style={{ fontSize: 13 }}>{fmtLocal(e.start, e.timezone)}</td>
                  <td>{FORMAT_LABEL[e.format]}</td>
                  <td><StatusPill map={LIFECYCLE} value={e.lifecycle} /></td>
                  <td><StatusPill map={BROADCAST} value={e.broadcast} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DateDialog({ event, onClose, onConfirm }: { event: OpsEvent; onClose: () => void; onConfirm: (start: string, end: string, reason: string) => void }) {
  const [start, setStart] = useState(event.start)
  const [end, setEnd] = useState(event.end)
  const [reason, setReason] = useState("")
  const [err, setErr] = useState<Record<string, string>>({})
  const go = () => {
    const e: Record<string, string> = {}
    if (!start) e.start = "Choose a new start."
    if (!end) e.end = "Choose a new end."
    else if (start && end <= start) e.end = "End must be after the start."
    if (start && start === event.start) e.start = "Choose a date different from the current start."
    if (reason.trim().length < 5) e.reason = "Enter a reason of at least 5 characters."
    setErr(e)
    if (!Object.keys(e).length) onConfirm(start, end, reason.trim())
  }
  return (
    <Modal title="Postpone event" onClose={onClose} width={500} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={go}>Postpone event</button></>}>
      <div style={{ display: "grid", gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>The event moves to Postponed and keeps its original date for reference. Enter the new schedule in {event.timezone}.</p>
        <TextField label="New start" required type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} error={err.start} />
        <TextField label="New end" required type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} error={err.end} />
        <TextField label="Reason" required multiline value={reason} onChange={(e) => setReason(e.target.value)} error={err.reason} />
      </div>
    </Modal>
  )
}

function Editor({ id }: { id: string }) {
  const { events, sponsors, upsert, can } = useOps()
  const { toast, assets } = useStore()
  const { navigate } = useRouter()
  const isNew = id === "new"
  const [fresh] = useState(blank)
  const saved = isNew ? fresh : events.find((e) => e.id === id)
  const [d, setD] = useState<OpsEvent | null>(saved ?? null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [dlg, setDlg] = useState<null | "postpone" | "cancel" | "complete" | "unlink">(null)
  const leaving = useRef(false)
  const allowed = can("records.edit")
  const fields: (keyof OpsEvent)[] = ["title", "description", "format", "venue", "onlineUrl", "timezone", "start", "end", "posterId", "trailerId", "ticketUrl"]
  const dirty = !!saved && !!d && (isNew ? !!(d.title || d.description) : fields.some((k) => d[k] !== saved[k]))
  useDirtyGuard(() => dirty && !leaving.current)

  if (!saved || !d) return <div className="page-pad"><EmptyState title="Event not found" body="It may not exist after a demo reset." action={<Link to="/admin/events" className="btn">Back to events</Link>} /></div>
  const set = <K extends keyof OpsEvent>(k: K, v: OpsEvent[K]) => { setD({ ...d, [k]: v }); setErrs((e) => ({ ...e, [k]: "" })) }
  const locked = saved.lifecycle === "cancelled" || saved.lifecycle === "completed"

  const validate = (x: OpsEvent, strict: boolean) => {
    const e: Record<string, string> = {}
    if (!x.title.trim()) e.title = "Enter an event title."
    if (strict || x.start || x.end) {
      if (!x.start) e.start = "Choose a start date and time."
      if (!x.end) e.end = "Choose an end date and time."
      else if (x.start && x.end <= x.start) e.end = "End must be after the start."
    }
    if (x.ticketUrl.trim() && !validUrl(x.ticketUrl.trim())) e.ticketUrl = "Enter a full web address starting with https://"
    if (strict) {
      if (needsVenue(x.format) && !x.venue.trim()) e.venue = "A venue is required for in-person and hybrid events."
      if (needsOnline(x.format) && !x.onlineUrl.trim()) e.onlineUrl = "An online link is required for online and hybrid events."
    }
    if (x.onlineUrl.trim() && !validUrl(x.onlineUrl.trim())) e.onlineUrl = "Enter a full web address starting with https://"
    return e
  }

  const save = () => {
    const e = validate(d, false)
    setErrs(e)
    if (Object.keys(e).length) return toast("error", "Not saved. Fix the highlighted fields.")
    const next: OpsEvent = { ...saved, title: d.title.trim() }
    fields.forEach((k) => { if (k !== "title") (next as unknown as Record<string, unknown>)[k] = d[k] })
    if (isNew) {
      upsert("events", next)
      toast("success", "Draft saved. Schedule it when the details are complete.")
      leaving.current = true
      setTimeout(() => navigate(`/admin/events/${next.id}`), 0)
    } else {
      upsert("events", logged(next, "Details updated"))
      toast("success", "Event details saved.")
    }
  }

  const patch = (p: Partial<OpsEvent>, action: string, reason?: string, msg?: string) => {
    upsert("events", logged({ ...saved, ...p }, action, reason))
    if (msg) toast("success", msg)
  }

  const schedule = () => {
    if (dirty) return toast("error", "Save your changes before scheduling.")
    const e = validate(saved, true)
    setErrs(e)
    if (Object.keys(e).length) return toast("error", "Can't schedule yet. Complete the highlighted fields.")
    patch({ lifecycle: "scheduled", statusReason: undefined }, "Scheduled event", undefined, "Event scheduled. Broadcast is managed separately below.")
  }
  const confirmDates = () => patch({ lifecycle: "scheduled", statusReason: undefined, previousStart: undefined }, "Confirmed new date", undefined, "Event is scheduled for its new date.")

  const bc = saved.broadcast
  const bcBlocked = saved.lifecycle !== "scheduled"
  const bcReason = saved.lifecycle === "cancelled" ? "The event is cancelled, so it can't be broadcast." : saved.lifecycle === "postponed" ? "The event is postponed. Confirm the new date before broadcasting." : saved.lifecycle === "draft" ? "Schedule the event first." : saved.lifecycle === "completed" ? "The event is completed." : ""
  const replay = saved.replayId ? assets[saved.replayId] : undefined
  const eventSponsors = sponsors.filter((s) => s.eventIds.includes(saved.id))

  return (
    <div className="page-pad">
      <Link to="/admin/events" style={{ fontSize: 13, color: "var(--text-secondary)" }}>← All events</Link>
      <div style={{ height: 12 }} />
      <ReadOnlyNote cap="records.edit" />
      <PageActions>
        <span role="status" style={{ fontSize: 12.5, alignSelf: "center", color: dirty ? "var(--yellow)" : "var(--text-muted)" }}>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <button className="btn" disabled={!dirty} onClick={() => { setD(saved); setErrs({}) }}>Discard</button>
        <button className="btn btn-primary" disabled={!allowed || !dirty || locked} onClick={save}>{isNew ? "Save draft" : "Save details"}</button>
      </PageActions>

      {saved.lifecycle === "postponed" && <Note tone="warn" title="Postponed">Originally {fmtLocal(saved.previousStart ?? "", saved.timezone)}. Reason: {saved.statusReason}</Note>}
      {saved.lifecycle === "cancelled" && <Note tone="bad" title="Cancelled">{saved.statusReason}. Details are locked. The history below keeps the record.</Note>}

      <div className="editor-layout">
        <div>
          <fieldset disabled={!allowed || locked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <Card title="Details">
              <div style={{ display: "grid", gap: 14 }}>
                <TextField label="Title" required value={d.title} onChange={(e) => set("title", e.target.value)} error={errs.title} />
                <TextField label="Description" multiline rows={3} value={d.description} onChange={(e) => set("description", e.target.value)} />
                <TextField label="Ticket or registration link" placeholder="https://" value={d.ticketUrl} onChange={(e) => set("ticketUrl", e.target.value)} error={errs.ticketUrl} hint="Optional link to an external page. Not processed here." />
              </div>
            </Card>
            <Card title="Where and when">
              <div style={{ display: "grid", gap: 14 }}>
                <SelectField label="Format" value={FORMAT_LABEL[d.format]} onChange={(e) => set("format", (Object.keys(FORMAT_LABEL) as EventFormat[]).find((k) => FORMAT_LABEL[k] === e.target.value) ?? "in_person")} options={Object.values(FORMAT_LABEL)} />
                {needsVenue(d.format) ? <TextField label="Venue" required value={d.venue} onChange={(e) => set("venue", e.target.value)} error={errs.venue} /> : <Note tone="info">Online only: no venue needed.</Note>}
                {needsOnline(d.format) ? <TextField label="Online link" required placeholder="https://" value={d.onlineUrl} onChange={(e) => set("onlineUrl", e.target.value)} error={errs.onlineUrl} /> : <Note tone="info">In person only: no online link needed.</Note>}
                <SelectField label="Timezone" value={d.timezone} onChange={(e) => set("timezone", e.target.value)} options={TIMEZONES} hint="Start and end times are entered in this timezone." />
                <div className="grid-2">
                  <TextField label="Start" required type="datetime-local" value={d.start} onChange={(e) => set("start", e.target.value)} error={errs.start} />
                  <TextField label="End" required type="datetime-local" value={d.end} onChange={(e) => set("end", e.target.value)} error={errs.end} />
                </div>
              </div>
            </Card>
            <Card title="Linked media">
              <div className="grid-2">
                <AssetSlot label="Poster" kind="image" value={d.posterId} onChange={(v) => set("posterId", v)} disabled={!allowed || locked} />
                <AssetSlot label="Trailer" kind="video" value={d.trailerId} onChange={(v) => set("trailerId", v)} disabled={!allowed || locked} />
              </div>
            </Card>
          </fieldset>
          <Card title="Activity history"><ActivityLog items={saved.activity} /></Card>
        </div>

        {!isNew && (
          <aside>
            <Card title="Event lifecycle">
              <div style={{ display: "grid", gap: 10 }}>
                <StatusPill map={LIFECYCLE} value={saved.lifecycle} />
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-secondary)" }}>Whether the event happens, and when. Separate from the broadcast.</p>
                {saved.lifecycle === "draft" && <button className="btn btn-primary" disabled={!allowed} onClick={schedule}>Schedule event</button>}
                {saved.lifecycle === "postponed" && <button className="btn btn-primary" disabled={!allowed} onClick={confirmDates}>Confirm new date</button>}
                {(saved.lifecycle === "scheduled" || saved.lifecycle === "postponed") && (
                  <>
                    {saved.lifecycle === "scheduled" && <button className="btn" disabled={!allowed} onClick={() => setDlg("postpone")}>Postpone…</button>}
                    <button className="btn" disabled={!allowed} onClick={() => setDlg("complete")}>Mark completed…</button>
                    <button className="btn btn-danger" disabled={!allowed} onClick={() => setDlg("cancel")}>Cancel event…</button>
                  </>
                )}
              </div>
            </Card>
            <Card title="Broadcast">
              <div style={{ display: "grid", gap: 10 }}>
                <StatusPill map={BROADCAST} value={bc} />
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-secondary)" }}>Simulated. No stream is started anywhere.</p>
                {bcBlocked && bc !== "replay_available" && bc !== "ended" && <Note tone="warn">{bcReason}</Note>}
                {bc === "not_configured" && <button className="btn" disabled={!allowed || bcBlocked} onClick={() => patch({ broadcast: "scheduled" }, "Broadcast scheduled", undefined, "Broadcast scheduled (simulated).")}>Schedule broadcast</button>}
                {bc === "scheduled" && <button className="btn btn-primary" disabled={!allowed || bcBlocked} onClick={() => patch({ broadcast: "live" }, "Broadcast went live (simulated)", undefined, "Broadcast is live (simulated).")}>Go live (simulated)</button>}
                {bc === "live" && <button className="btn" disabled={!allowed} onClick={() => patch({ broadcast: "ended" }, "Broadcast ended", undefined, "Broadcast ended.")}>End broadcast</button>}
                {bc === "ended" && (
                  <>
                    <AssetSlot label="Replay video" kind="video" value={saved.replayId} onChange={(v) => { if (v) patch({ replayId: v, broadcast: "replay_available" }, "Replay linked", undefined, "Replay linked to this event.") }} disabled={!allowed} hint="Choose a ready video from the Media Library." />
                  </>
                )}
                {bc === "replay_available" && (
                  <>
                    <div style={{ fontSize: 13 }}>Replay: <strong>{replay?.name ?? "File missing from Media Library"}</strong></div>
                    {replay && replay.status !== "ready" && <Note tone="warn">The replay file is not ready ({replay.status}).</Note>}
                    <button className="btn btn-sm" disabled={!allowed} onClick={() => setDlg("unlink")}>Unlink replay…</button>
                  </>
                )}
                {bc === "scheduled" && saved.lifecycle !== "scheduled" && <button className="btn btn-sm" disabled={!allowed} onClick={() => patch({ broadcast: "not_configured" }, "Broadcast schedule cleared")}>Clear broadcast schedule</button>}
              </div>
            </Card>
            <Card title="Sponsors">
              {eventSponsors.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>No sponsors associated. Add one from a sponsor's Shows & events tab.</p> : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5 }}>{eventSponsors.map((s) => <li key={s.id}><Link to={`/admin/sponsors/${s.id}/associations`} style={{ color: "var(--accent-hover)" }}>{s.name}</Link>{s.status === "inactive" ? " (inactive)" : ""}</li>)}</ul>
              )}
            </Card>
          </aside>
        )}
      </div>

      {dlg === "postpone" && (
        <DateDialog event={saved} onClose={() => setDlg(null)} onConfirm={(start, end, reason) => {
          upsert("events", logged({ ...saved, lifecycle: "postponed", previousStart: saved.start, start, end, statusReason: reason }, `Postponed to ${fmtLocal(start, saved.timezone)}`, reason))
          setD({ ...d, start, end })
          setDlg(null); toast("info", "Event postponed. Confirm the new date when it is final.")
        }} />
      )}
      {dlg === "cancel" && (
        <ReasonDialog title="Cancel this event?" confirmLabel="Cancel event" danger onCancel={() => setDlg(null)}
          onConfirm={(reason) => {
            const clearsBroadcast = bc === "scheduled" || bc === "live"
            upsert("events", logged({ ...saved, lifecycle: "cancelled", statusReason: reason, broadcast: clearsBroadcast ? "not_configured" : bc }, clearsBroadcast ? "Cancelled event and cleared broadcast" : "Cancelled event", reason))
            setDlg(null); toast("error", "Event cancelled. Details are now locked.")
          }}>
          Cancelling locks the event details and clears any scheduled or live broadcast. Postponing keeps the event alive. Notify attendees from Notifications (not automatic).
        </ReasonDialog>
      )}
      {dlg === "complete" && (
        <ReasonDialog title="Mark event completed?" confirmLabel="Mark completed" required={false} reasonLabel="Note (optional)" onCancel={() => setDlg(null)}
          onConfirm={(reason) => { patch({ lifecycle: "completed", broadcast: bc === "live" ? "ended" : bc }, "Marked completed", reason, "Event marked completed."); setDlg(null) }}>
          Completed events can't be edited. A live broadcast is ended. You can still link a replay.
        </ReasonDialog>
      )}
      {dlg === "unlink" && (
        <ReasonDialog title="Unlink the replay?" confirmLabel="Unlink replay" onCancel={() => setDlg(null)}
          onConfirm={(reason) => { patch({ replayId: null, broadcast: "ended" }, "Replay unlinked", reason, "Replay unlinked."); setDlg(null) }}>
          The file stays in the Media Library. The broadcast returns to Ended.
        </ReasonDialog>
      )}
    </div>
  )
}

export default function Events() {
  const { route } = useRouter()
  const id = route.parts[0]
  return id ? <Editor key={id} id={id} /> : <List />
}
