import React, { useRef, useState } from "react"
import { PageActions } from "../../components/PageHeader"
import { useRouter, useDirtyGuard } from "../../router"
import { useStore, homepageUsage } from "../../store/store"
import { Badge, Card, ConfirmDialog, EmptyState } from "../../ui"
import { TYPE_META, STATUS_META, emptyContent, fmtDate } from "../../store/meta"
import { transition, TRANSITION_TOAST, validateDraft, validateForPublish, type Issue } from "../../store/validate"
import type { ContentItem, ContentType, TransitionAction } from "../../store/types"
import ContentPreview from "./Preview"
import { ArtworkSection, ArticleDetails, AudioDetails, BasicsSection, EventDetails, MediaSlot, MovieDetails, MusicVideoDetails, SeasonsSection, type Errs } from "./sections"
import { Link } from "../../router"

const toLocalInput = (iso: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function focusField(field: string) {
  const el = document.getElementById(field)
  if (!el) return
  el.scrollIntoView({ block: "center", behavior: "smooth" })
  el.focus({ preventScroll: true })
}

type Attempt = null | "save" | "publish" | "schedule"

export default function Editor({ type, id }: { type: ContentType; id: string }) {
  const { getContent, assets, homepage, saveContent, toast } = useStore()
  const { navigate } = useRouter()
  const existing = id === "new" ? undefined : getContent(id)

  const [draft, setDraft] = useState<ContentItem>(() => existing ?? emptyContent(type))
  const draftRef = useRef(draft)
  draftRef.current = draft
  const baseline = useRef(JSON.stringify(draft))
  const [attempt, setAttempt] = useState<Attempt>(null)
  const [preview, setPreview] = useState(false)
  const [confirm, setConfirm] = useState<TransitionAction | null>(null)

  useDirtyGuard(() => JSON.stringify(draftRef.current) !== baseline.current)

  if (id !== "new" && !existing) {
    return (
      <div className="page-pad">
        <EmptyState
          title="This item doesn't exist"
          body="It may have been removed when demo data was reset. Return to the Content Library to pick another item."
          action={<Link to={`/admin/content/${TYPE_META[type].tab}`} className="btn btn-primary" style={{ textDecoration: "none" }}>Back to {TYPE_META[type].plural.toLowerCase()}</Link>}
        />
      </div>
    )
  }

  const meta = TYPE_META[draft.type]
  const dirty = JSON.stringify(draft) !== baseline.current
  const archived = draft.status === "archived"
  const published = draft.status === "published"
  const set = (patch: Partial<ContentItem>) => setDraft((d) => ({ ...d, ...patch }))

  const publishIssues = validateForPublish(draft, assets)
  const scheduleIssue: Issue | null = draft.scheduledAt && new Date(draft.scheduledAt).getTime() <= Date.now() ? { field: "scheduledAt", message: "Scheduled time must be in the future." } : !draft.scheduledAt && attempt === "schedule" ? { field: "scheduledAt", message: "Pick a publish date and time to schedule." } : null

  let shown: Issue[] = []
  if (attempt === "publish") shown = publishIssues
  else if (attempt === "schedule") shown = [...publishIssues, ...(scheduleIssue ? [scheduleIssue] : [])]
  else if (attempt === "save") shown = published ? publishIssues : validateDraft(draft)
  const errs: Errs = {}
  shown.forEach((i) => {
    if (!errs[i.field]) errs[i.field] = i.message
  })
  const usage = homepageUsage(draft.id, homepage)

  const commit = (item: ContentItem, message: string) => {
    saveContent(item)
    draftRef.current = item
    baseline.current = JSON.stringify(item)
    setDraft(item)
    setAttempt(null)
    toast("success", message)
    if (id === "new") navigate(`/admin/content/${meta.tab}/${item.id}`, { replace: true })
  }

  const fail = (issues: Issue[], what: string) => {
    toast("error", `Can't ${what}: ${issues.length} issue${issues.length === 1 ? "" : "s"} to fix. ${issues[0].message}`)
    setTimeout(() => focusField(issues[0].field), 50)
  }

  const save = () => {
    const issues = published ? validateForPublish(draft, assets) : validateDraft(draft)
    if (issues.length) {
      setAttempt("save")
      return fail(issues, published ? "save changes" : "save draft")
    }
    commit({ ...draft, updatedAt: new Date().toISOString() }, published ? `Changes to "${draft.title}" saved and live in the prototype.` : `Draft "${draft.title}" saved.`)
  }

  const run = (action: TransitionAction) => {
    const res = transition(draft, action, assets)
    if (!res.ok) {
      setAttempt(action === "schedule" ? "schedule" : "publish")
      return fail(res.issues, action)
    }
    commit(res.item, TRANSITION_TOAST[action](res.item.title))
  }

  const request = (action: TransitionAction) => {
    if (action === "archive" || (action === "unpublish" && usage.length)) setConfirm(action)
    else run(action)
  }

  const primary: React.ReactNode = archived ? (
    <button className="btn btn-primary" onClick={() => run("restore")}>Restore to draft</button>
  ) : published ? (
    <button className="btn btn-primary" onClick={save}>Save changes</button>
  ) : (
    <button className="btn btn-primary" onClick={() => run("publish")}>{draft.status === "scheduled" ? "Publish now" : "Publish"}</button>
  )

  return (
    <div className="page-pad">
      <PageActions>
        {dirty && <span role="status" style={{ fontSize: 12.5, color: "var(--yellow)", fontWeight: 600 }}>Unsaved changes</span>}
        <button className="btn" onClick={() => setPreview(true)}>Preview</button>
        {!archived && !published && <button className="btn" onClick={save}>Save draft</button>}
        {primary}
      </PageActions>

      {archived && (
        <div role="note" style={{ marginBottom: 16, padding: "10px 14px", border: "1px solid var(--red)", borderRadius: 8, fontSize: 13, background: "rgba(248,113,113,.08)" }}>
          This {meta.label.toLowerCase()} is archived and read-only. Restore it to draft to edit it.
        </div>
      )}

      {shown.length > 0 && (attempt === "publish" || attempt === "schedule") && (
        <div role="alert" style={{ marginBottom: 16, padding: "12px 16px", border: "1px solid var(--red)", borderRadius: 8, background: "rgba(248,113,113,.08)" }}>
          <strong style={{ fontSize: 14 }}>{attempt === "schedule" ? "Can't schedule yet" : "Can't publish yet"}. Fix these first:</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
            {shown.map((i, k) => (
              <li key={k}>
                <button type="button" onClick={() => focusField(i.field)} style={{ all: "unset", cursor: "pointer", textDecoration: "underline", color: "var(--text-primary)" }}>{i.message}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="editor-layout">
        <fieldset disabled={archived} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
          <legend style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{meta.label} content fields</legend>
          <BasicsSection draft={draft} set={set} errs={errs} />
          {draft.type === "movie" && <MovieDetails draft={draft} set={set} errs={errs} />}
          {draft.type === "music_video" && <MusicVideoDetails draft={draft} set={set} errs={errs} />}
          {draft.type === "audio_track" && <AudioDetails draft={draft} set={set} errs={errs} />}
          {draft.type === "article" && <ArticleDetails draft={draft} set={set} errs={errs} />}
          {draft.type === "event" && <EventDetails draft={draft} set={set} errs={errs} />}
          <ArtworkSection draft={draft} set={set} errs={errs} crops={meta.artwork} />
          {meta.mediaKind && (
            <Card title={meta.mediaKind === "audio" ? "Audio file" : "Video file"} id="sec-media">
              <MediaSlot
                label={meta.mediaKind === "audio" ? "Audio file" : draft.type === "movie" ? "Feature video" : "Video file"}
                kind={meta.mediaKind}
                required
                fieldId="media"
                value={draft.mediaId}
                onChange={(m) => set({ mediaId: m })}
                error={errs.media}
              />
            </Card>
          )}
          {draft.type === "show" && <SeasonsSection draft={draft} set={set} errs={errs} />}
        </fieldset>

        <aside style={{ position: "sticky", top: 68 }} aria-label="Status and publishing">
          <Card title="Status">
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <Badge color={STATUS_META[draft.status].color}>{STATUS_META[draft.status].label}</Badge>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 6 }}>{STATUS_META[draft.status].hint}</div>
              </div>
              <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 12.5 }}>
                <dt style={{ color: "var(--text-muted)" }}>Type</dt><dd style={{ margin: 0 }}>{meta.label}</dd>
                <dt style={{ color: "var(--text-muted)" }}>ID</dt><dd style={{ margin: 0, fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{draft.id}</dd>
                <dt style={{ color: "var(--text-muted)" }}>Updated</dt><dd style={{ margin: 0 }}>{id === "new" ? "Not saved yet" : fmtDate(draft.updatedAt)}</dd>
                {draft.publishedAt && (<><dt style={{ color: "var(--text-muted)" }}>Published</dt><dd style={{ margin: 0 }}>{fmtDate(draft.publishedAt)}</dd></>)}
                {draft.status === "scheduled" && (<><dt style={{ color: "var(--text-muted)" }}>Goes live</dt><dd style={{ margin: 0 }}>{fmtDate(draft.scheduledAt)}</dd></>)}
              </dl>
              {usage.length > 0 && (
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                  On the homepage in: <strong style={{ color: "var(--text-primary)" }}>{usage.map((u) => u.label).join(", ")}</strong>
                </div>
              )}
            </div>
          </Card>

          {!archived && (
            <Card title="Publishing">
              <div style={{ display: "grid", gap: 14 }}>
                {publishIssues.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>All publishing requirements are met.</div>
                ) : (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--yellow)" }}>{publishIssues.length} requirement{publishIssues.length === 1 ? "" : "s"} blocking publish</div>
                    <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 4, maxHeight: 220, overflowY: "auto" }}>
                      {publishIssues.map((i, k) => (
                        <li key={k}>
                          <button type="button" onClick={() => focusField(i.field)} style={{ all: "unset", cursor: "pointer", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.45, textDecoration: "underline" }}>{i.message}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {draft.status !== "published" && (
                  <div style={{ display: "grid", gap: 8, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                    <label htmlFor="scheduledAt" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>Schedule for later</label>
                    <input
                      id="scheduledAt"
                      type="datetime-local"
                      className="input"
                      value={toLocalInput(draft.scheduledAt)}
                      aria-invalid={!!scheduleIssue}
                      aria-describedby={scheduleIssue ? "scheduledAt-e" : undefined}
                      onChange={(e) => set({ scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                    {(scheduleIssue || errs.scheduledAt) && <span id="scheduledAt-e" role="alert" style={{ fontSize: 12, color: "var(--red)" }}>{scheduleIssue?.message ?? errs.scheduledAt}</span>}
                    <button className="btn" onClick={() => run("schedule")}>{draft.status === "scheduled" ? "Reschedule" : "Schedule"}</button>
                  </div>
                )}
                <div style={{ display: "grid", gap: 8, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  {published && <button className="btn" onClick={() => request("unpublish")}>Unpublish</button>}
                  <button className="btn btn-danger" onClick={() => request("archive")}>Archive</button>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45 }}>
                    Unpublish hides it from customers but keeps it editable. Archive retires it until restored.
                  </span>
                </div>
              </div>
            </Card>
          )}
        </aside>
      </div>

      {preview && <ContentPreview item={draft} onClose={() => setPreview(false)} />}
      {confirm && (
        <ConfirmDialog
          title={confirm === "archive" ? `Archive "${draft.title || "Untitled"}"?` : `Unpublish "${draft.title || "Untitled"}"?`}
          confirmLabel={confirm === "archive" ? "Archive" : "Unpublish"}
          danger={confirm === "archive"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const a = confirm
            setConfirm(null)
            run(a)
          }}
        >
          {confirm === "archive" ? "Archived content becomes read-only and is hidden from customers. You can restore it to draft later." : "It will stop being visible to customers."}
          {usage.length > 0 && (
            <p style={{ margin: "10px 0 0" }}>
              It is currently selected in homepage section{usage.length > 1 ? "s" : ""}: <strong style={{ color: "var(--text-primary)" }}>{usage.map((u) => u.label).join(", ")}</strong>. Those sections will show it as unavailable until it is republished or removed from the homepage.
            </p>
          )}
        </ConfirmDialog>
      )}
    </div>
  )
}
