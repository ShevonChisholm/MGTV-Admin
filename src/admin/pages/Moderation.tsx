import {connected} from "../api/client"
import ConnectedModeration from "./ConnectedModeration"
import React, { useState } from "react"
import { Link, useRouter } from "../router"
import { useOps } from "../store/ops/ops"
import { useStore } from "../store/store"
import { Card, EmptyState, SelectField, Tabs, TextField, Badge } from "../ui"
import { ActivityLog, Note, ReadOnlyNote, ReasonDialog, StatusPill, Toolbar } from "../ui/ops"
import { fmtDate, TYPE_META, STATUS_META } from "../store/meta"
import { logged } from "../store/ops/types"
import type { Report, ReportOutcome } from "../store/ops/types"
import { PRIORITY, REPORT_OUTCOME } from "./opsMeta"

const OUTCOME_COPY: Record<ReportOutcome, { button: string; confirm: string; effect: string; toast: string; danger?: boolean }> = {
  approved: {
    button: "Approve content",
    confirm: "Approve content",
    effect: "The content stays live. This report and any other open reports on the same item are closed as \"content approved\".",
    toast: "Content approved. It stays live and the open reports on it are closed.",
  },
  dismissed: {
    button: "Dismiss report",
    confirm: "Dismiss report",
    effect: "Only this report is closed, as \"no violation\". The content stays live and other reports on the item stay open for review.",
    toast: "Report dismissed. The content is unchanged.",
  },
  removed: {
    button: "Remove content",
    confirm: "Remove content",
    effect: "The content is taken down for customers. All open reports on the item are closed as \"content removed\". If it is a catalogue item it is set to Unpublished in the Content Library.",
    toast: "Content removed and the open reports on it were closed.",
    danger: true,
  },
}

function useResolve() {
  const { reports, upsert } = useOps()
  const { getContent, saveContent } = useStore()
  return (report: Report, outcome: ReportOutcome, reason: string) => {
    const targets = outcome === "dismissed" ? [report] : reports.filter((r) => r.targetKey === report.targetKey && r.status === "open")
    const now = new Date().toISOString()
    targets.forEach((r) => {
      const label = outcome === "dismissed" ? "Dismissed report" : outcome === "approved" ? "Approved content" : "Removed content"
      upsert("reports", logged({ ...r, status: "resolved", outcome, outcomeReason: reason, resolvedAt: now, targetRemoved: outcome === "removed" ? true : r.targetRemoved }, label, reason))
    })
    if (outcome === "removed") {
      reports.filter((r) => r.targetKey === report.targetKey && r.status === "resolved" && !targets.includes(r)).forEach((r) => upsert("reports", logged({ ...r, targetRemoved: true }, "Content removed (via another report)", reason)))
      const c = report.contentId ? getContent(report.contentId) : undefined
      if (c && (c.status === "published" || c.status === "scheduled")) saveContent({ ...c, status: "unpublished", updatedAt: now })
    }
    return targets.length
  }
}

function Queue() {
  const { reports } = useOps()
  const [tab, setTab] = useState<"open" | "resolved">("open")
  const [type, setType] = useState("")
  const [prio, setPrio] = useState("")
  const [q, setQ] = useState("")
  const count = (key: string) => reports.filter((r) => r.targetKey === key).length
  const list = reports
    .filter((r) => r.status === tab && (!type || r.type === type) && (!prio || r.priority === prio) && (r.targetTitle + r.targetSnippet + r.category).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const openN = reports.filter((r) => r.status === "open").length
  return (
    <div className="page-pad">
      <Tabs label="Report status" value={tab} onChange={setTab} items={[{ id: "open", label: "Open", count: openN }, { id: "resolved", label: "Resolved", count: reports.length - openN }]} />
      <div style={{ height: 14 }} />
      <Toolbar>
        <div style={{ flex: "1 1 220px" }}><TextField label="Search reports" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, text or category" /></div>
        <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value)} options={["Comment", "Profile", "Review", "Video"]} placeholder="All types" />
        <SelectField label="Priority" value={prio} onChange={(e) => setPrio(e.target.value)} options={["high", "medium", "low"]} placeholder="All priorities" />
      </Toolbar>
      {list.length === 0 ? (
        <EmptyState title={tab === "open" ? "No open reports match" : "No resolved reports match"} body={tab === "open" ? "Clear the filters, or switch to Resolved to see past decisions." : "Resolved reports stay here with their outcome and reason."} />
      ) : (
        <div className="scroll-x" style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--card)" }}>
          <table className="tbl">
            <thead><tr><th>Reported item</th><th>Type</th><th>Priority</th><th>Reports on item</th><th>{tab === "open" ? "Received" : "Outcome"}</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td style={{ maxWidth: 380 }}>
                    <Link to={`/admin/moderation/${r.id}`} style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>{r.targetTitle}</Link>
                    <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>{r.category}</div>
                  </td>
                  <td>{r.type}</td>
                  <td><StatusPill map={PRIORITY} value={r.priority} /></td>
                  <td>{count(r.targetKey)}</td>
                  <td>
                    {tab === "open" ? fmtDate(r.createdAt) : (
                      <div style={{ display: "grid", gap: 4 }}>
                        <StatusPill map={REPORT_OUTCOME} value={r.outcome ?? "approved"} />
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDate(r.resolvedAt)}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ReportDetail({ id }: { id: string }) {
  const { reports, can, upsert } = useOps()
  const { getContent, toast } = useStore()
  const { navigate } = useRouter()
  const resolve = useResolve()
  const [action, setAction] = useState<ReportOutcome | "reopen" | null>(null)
  const r = reports.find((x) => x.id === id)
  if (!r) return <div className="page-pad"><EmptyState title="Report not found" body="It may have been removed by resetting demo data." action={<Link to="/admin/moderation" className="btn">Back to the queue</Link>} /></div>
  const same = reports.filter((x) => x.targetKey === r.targetKey)
  const openSame = same.filter((x) => x.status === "open")
  const content = r.contentId ? getContent(r.contentId) : undefined
  const allowed = can("moderation.act")
  const nextOpen = reports.find((x) => x.status === "open" && x.id !== r.id)

  const confirm = (reason: string) => {
    if (action === "reopen") {
      upsert("reports", logged({ ...r, status: "open", outcome: undefined, outcomeReason: undefined, resolvedAt: undefined }, "Reopened report", reason))
      toast("info", r.outcome === "removed" ? "Report reopened. The content stays unpublished; republish it from the Content Library if it was removed in error." : "Report reopened.")
    } else if (action) {
      resolve(r, action, reason)
      toast(action === "removed" ? "error" : "success", OUTCOME_COPY[action].toast)
    }
    setAction(null)
  }

  return (
    <div className="page-pad">
      <Link to="/admin/moderation" style={{ fontSize: 13, color: "var(--text-secondary)" }}>← Back to the queue</Link>
      <div style={{ height: 14 }} />
      <ReadOnlyNote cap="moderation.act" />
      <div className="editor-layout">
        <div>
          <Card title="Reported item">
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Badge color="#C9A84C">{r.type}</Badge>
                <StatusPill map={PRIORITY} value={r.priority} />
                {r.targetRemoved && <Badge color="#f87171">Removed from customer view</Badge>}
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontFamily: "var(--font-sans)" }}>{r.targetTitle}</h3>
              <blockquote style={{ margin: 0, padding: "10px 14px", borderLeft: "3px solid var(--border-light)", background: "var(--bg)", borderRadius: 6, fontSize: 14, lineHeight: 1.6, textDecoration: r.targetRemoved ? "line-through" : undefined, color: r.targetRemoved ? "var(--text-muted)" : "var(--text-primary)" }}>
                {r.targetSnippet}
              </blockquote>
              <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 13 }}>
                <dt style={{ color: "var(--text-muted)" }}>Author</dt><dd style={{ margin: 0 }}>{r.targetAuthor}</dd>
                {content && (
                  <>
                    <dt style={{ color: "var(--text-muted)" }}>Linked content</dt>
                    <dd style={{ margin: 0 }}>
                      <Link to={`/admin/content/${TYPE_META[content.type].tab}/${content.id}`} style={{ color: "var(--accent-hover)" }}>{content.title}</Link>{" "}
                      <Badge color={STATUS_META[content.status].color}>{STATUS_META[content.status].label}</Badge>
                    </dd>
                  </>
                )}
              </dl>
            </div>
          </Card>
          <Card title="This report">
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 13 }}>
              <dt style={{ color: "var(--text-muted)" }}>Reason</dt><dd style={{ margin: 0 }}>{r.category}</dd>
              <dt style={{ color: "var(--text-muted)" }}>Reporter</dt><dd style={{ margin: 0 }}>{r.reporter}</dd>
              <dt style={{ color: "var(--text-muted)" }}>Received</dt><dd style={{ margin: 0 }}>{fmtDate(r.createdAt)}</dd>
              <dt style={{ color: "var(--text-muted)" }}>Reporter's note</dt><dd style={{ margin: 0 }}>{r.detail || "None provided"}</dd>
            </dl>
          </Card>
          <Card title={`Reports on this item (${same.length})`}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {same.map((x) => (
                <li key={x.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
                  {x.id === r.id ? <strong>{x.category} (this report)</strong> : <Link to={`/admin/moderation/${x.id}`} style={{ color: "var(--accent-hover)" }}>{x.category}</Link>}
                  <span style={{ color: "var(--text-muted)" }}>by {x.reporter}</span>
                  {x.status === "open" ? <Badge color="#fbbf24">Open</Badge> : <StatusPill map={REPORT_OUTCOME} value={x.outcome ?? "approved"} />}
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Activity history"><ActivityLog items={r.activity} /></Card>
        </div>

        <aside>
          <Card title="Decision">
            {r.status === "open" ? (
              <div style={{ display: "grid", gap: 14 }}>
                {(Object.keys(OUTCOME_COPY) as ReportOutcome[]).map((k) => (
                  <div key={k}>
                    <button className={`btn ${OUTCOME_COPY[k].danger ? "btn-danger" : k === "approved" ? "btn-primary" : ""}`} style={{ width: "100%" }} disabled={!allowed} onClick={() => setAction(k)}>{OUTCOME_COPY[k].button}</button>
                    <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>{OUTCOME_COPY[k].effect}</p>
                  </div>
                ))}
                {openSame.length > 1 && <Note tone="info">{openSame.length} open reports exist on this item.</Note>}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                <StatusPill map={REPORT_OUTCOME} value={r.outcome ?? "approved"} />
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>{r.outcomeReason}</p>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Resolved {fmtDate(r.resolvedAt)}</span>
                <button className="btn" disabled={!allowed} onClick={() => setAction("reopen")}>Reopen report</button>
                {nextOpen && <button className="btn btn-ghost" onClick={() => navigate(`/admin/moderation/${nextOpen.id}`)}>Next open report</button>}
              </div>
            )}
          </Card>
        </aside>
      </div>

      {action && (
        <ReasonDialog
          title={action === "reopen" ? "Reopen this report?" : `${OUTCOME_COPY[action].button}?`}
          confirmLabel={action === "reopen" ? "Reopen report" : OUTCOME_COPY[action].confirm}
          danger={action === "removed"}
          reasonLabel={action === "removed" ? "Reason for removal (recorded, visible to other moderators)" : "Reason (recorded in the activity history)"}
          onCancel={() => setAction(null)}
          onConfirm={confirm}
        >
          {action === "reopen" ? "The report returns to the open queue." : OUTCOME_COPY[action].effect}
        </ReasonDialog>
      )}
    </div>
  )
}

export default function Moderation() {
 if(connected)return <ConnectedModeration/>;
 return <PrototypeModeration/>;
}
function PrototypeModeration() {
  const { route } = useRouter()
  const { can } = useOps()
  void can
  return route.parts[0] ? <ReportDetail id={route.parts[0]} /> : <Queue />
}
