import React, { useState } from "react"
import { Link, useRouter } from "../router"
import { useOps } from "../store/ops/ops"
import { useStore } from "../store/store"
import { Card, EmptyState, Modal, SelectField, TextField } from "../ui"
import { ActivityLog, Denied, Note, ProvisionalNote, ReasonDialog, ConfirmDialog, StatusPill, Toolbar, isEmail } from "../ui/ops"
import { fmtDate, genId } from "../store/meta"
import { CAPABILITIES, EXAMPLE_MATRIX, ROLES, ACTOR, newLog, logged } from "../store/ops/types"
import type { AdminUser, Role } from "../store/ops/types"
import { USER_STATUS } from "./opsMeta"

function InviteModal({ onClose }: { onClose: () => void }) {
  const { users, upsert } = useOps()
  const { toast } = useStore()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [err, setErr] = useState<Record<string, string>>({})
  const send = () => {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = "Enter an email address."
    else if (!isEmail(email)) e.email = "Enter a valid email address, like name@mgtv.example."
    else if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) e.email = "This email already has an account or a pending invitation."
    if (!role) e.role = "Choose a role for this person."
    setErr(e)
    if (Object.keys(e).length) return
    const u: AdminUser = {
      id: genId("usr"), name: name.trim() || email.trim().split("@")[0], email: email.trim(), role: role as Role,
      status: "invited", lastActive: "", activity: newLog(`Invited as ${role}`),
    }
    upsert("users", u)
    toast("success", `Invitation recorded for ${u.email}. No email was sent: this is a local prototype.`)
    onClose()
  }
  return (
    <Modal title="Invite an admin user" onClose={onClose} width={480} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={send}>Create invitation</button></>}>
      <div style={{ display: "grid", gap: 14 }}>
        <Note tone="mock">The invitation is recorded here with a pending status. No email is sent.</Note>
        <TextField label="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} error={err.email} />
        <TextField label="Display name" hint="Optional. Defaults to the part of the email before the @." value={name} onChange={(e) => setName(e.target.value)} />
        <SelectField label="Role (provisional)" required value={role} onChange={(e) => setRole(e.target.value)} options={ROLES} error={err.role} />
      </div>
    </Modal>
  )
}

function UserDrawer({ id }: { id: string }) {
  const { users, upsert, can } = useOps()
  const { toast } = useStore()
  const { navigate } = useRouter()
  const u = users.find((x) => x.id === id)
  const [role, setRole] = useState<Role | "">("")
  const [confirmRole, setConfirmRole] = useState(false)
  const [dlg, setDlg] = useState<"suspend" | "reactivate" | "revoke" | null>(null)
  const close = () => navigate("/admin/users")
  const allowed = can("users.manage")
  if (!u) return <Modal title="Admin user not found" onClose={close} side><EmptyState title="No such user" body="They may have been revoked or demo data was reset." /></Modal>
  const target = role || u.role
  const isSelf = u.name === ACTOR

  return (
    <>
      <Modal title={u.name} onClose={close} side width={520} footer={<button className="btn" onClick={close}>Close</button>}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <StatusPill map={USER_STATUS} value={u.status} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{u.email}</span>
          </div>
          {!allowed && <Note tone="bad" title="Read-only">Your role can't manage admin users. Changes are disabled.</Note>}
          <ProvisionalNote>The roles below are examples. Permissions are not final until the permission matrix is approved.</ProvisionalNote>

          <Card title="Role">
            <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
              <SelectField label="Role" value={target} onChange={(e) => setRole(e.target.value as Role)} options={ROLES} disabled={!allowed || u.status === "suspended"} />
              <button className="btn btn-primary" disabled={!allowed || target === u.role} onClick={() => setConfirmRole(true)}>Change role</button>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "10px 0 0" }}>
              {target}: {EXAMPLE_MATRIX[target as Role].length ? CAPABILITIES.filter((c) => EXAMPLE_MATRIX[target as Role].includes(c.id)).map((c) => c.label).join("; ") : "Can view records only."}
            </p>
            {isSelf && <p style={{ fontSize: 12.5, color: "var(--yellow)", margin: "8px 0 0" }}>This is your own account. Lowering your role changes what you can do next.</p>}
          </Card>

          <Card title="Account">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {u.status === "invited" && (
                <>
                  <button className="btn" disabled={!allowed} onClick={() => { upsert("users", logged(u, "Invitation resent (simulated)")); toast("info", "Invitation marked as resent. No email was sent.") }}>Resend invitation</button>
                  <button className="btn" disabled={!allowed} onClick={() => setDlg("revoke")}>Revoke invitation…</button>
                </>
              )}
              {u.status === "active" && <button className="btn" disabled={!allowed || isSelf} title={isSelf ? "You can't suspend your own account" : undefined} onClick={() => setDlg("suspend")}>Suspend access…</button>}
              {u.status === "suspended" && <button className="btn" disabled={!allowed} onClick={() => setDlg("reactivate")}>Reactivate…</button>}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "10px 0 0" }}>Last active: {u.lastActive ? fmtDate(u.lastActive) : "Never"}</p>
          </Card>

          <Card title="Activity history"><ActivityLog items={u.activity} /></Card>
        </div>
      </Modal>

      {confirmRole && (
        <ReasonDialog title={`Change role to ${target}?`} confirmLabel="Change role" reasonLabel="Reason for the change" onCancel={() => setConfirmRole(false)}
          onConfirm={(reason) => { upsert("users", logged({ ...u, role: target as Role }, `Role changed from ${u.role} to ${target}`, reason)); setRole(""); setConfirmRole(false); toast("success", `${u.name} is now ${target} (provisional role).`) }}>
          {u.name} will get the example permissions of the {target} role.
        </ReasonDialog>
      )}
      {dlg === "suspend" && (
        <ReasonDialog title={`Suspend ${u.name}?`} confirmLabel="Suspend access" danger onCancel={() => setDlg(null)}
          onConfirm={(reason) => { upsert("users", logged({ ...u, status: "suspended" }, "Access suspended", reason)); setDlg(null); toast("info", `${u.name} is suspended.`) }}>
          They lose access to this portal until reactivated. Their record and history are kept.
        </ReasonDialog>
      )}
      {dlg === "reactivate" && (
        <ReasonDialog title={`Reactivate ${u.name}?`} confirmLabel="Reactivate" onCancel={() => setDlg(null)}
          onConfirm={(reason) => { upsert("users", logged({ ...u, status: "active" }, "Access reactivated", reason)); setDlg(null); toast("success", `${u.name} is active again.`) }}>
          They regain access with their current role ({u.role}).
        </ReasonDialog>
      )}
      {dlg === "revoke" && (
        <ConfirmDialog title="Revoke this invitation?" confirmLabel="Revoke invitation" danger onCancel={() => setDlg(null)}
          onConfirm={() => { upsert("users", logged({ ...u, status: "suspended" }, "Invitation revoked")); setDlg(null); toast("info", "Invitation revoked. The account is kept as suspended.") }}>
          {u.email} will not be able to accept it. You can reactivate the entry later.
        </ConfirmDialog>
      )}
    </>
  )
}

export default function Users() {
  const { route } = useRouter()
  const { users, can, actingRole } = useOps()
  const [q, setQ] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState("")
  const [invite, setInvite] = useState(false)
  const allowed = can("users.manage")

  if (!allowed) return <Denied what="Admin Users" cap="users.manage" />

  const list = users.filter((u) => (!role || u.role === role) && (!status || u.status === status) && (u.name + u.email).toLowerCase().includes(q.toLowerCase()))
  const pending = users.filter((u) => u.status === "invited").length

  return (
    <div className="page-pad">
      <ProvisionalNote>Roles (Viewer, Editor, Moderator, Admin) are examples. The permission matrix is not approved. You are viewing as {actingRole}.</ProvisionalNote>
      <Toolbar>
        <div style={{ flex: "1 1 220px" }}><TextField label="Search users" placeholder="Name or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={ROLES} placeholder="All roles" />
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={["active", "invited", "suspended"]} placeholder="All statuses" />
        <button className="btn btn-primary" onClick={() => setInvite(true)}>Invite user</button>
      </Toolbar>
      {pending > 0 && <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "0 0 10px" }}>{pending} invitation{pending > 1 ? "s" : ""} pending.</p>}
      {list.length === 0 ? (
        <EmptyState title="No users match" body="Clear the filters, or invite someone new." />
      ) : (
        <div className="scroll-x" style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--card)" }}>
          <table className="tbl">
            <thead><tr><th>User</th><th>Role (provisional)</th><th>Status</th><th>Last active</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/admin/users/${u.id}`} style={{ color: "var(--text-primary)", fontWeight: 600, textDecoration: "none" }}>{u.name}</Link>
                    <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{u.email}</div>
                  </td>
                  <td>{u.role}</td>
                  <td><StatusPill map={USER_STATUS} value={u.status} /></td>
                  <td>{u.lastActive ? fmtDate(u.lastActive) : "Never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ height: 20 }} />
      <Card title="Example permissions by role (provisional)">
        <div className="scroll-x">
          <table className="tbl">
            <thead><tr><th>Capability</th>{ROLES.map((r) => <th key={r}>{r}</th>)}</tr></thead>
            <tbody>
              {CAPABILITIES.map((c) => (
                <tr key={c.id}>
                  <td>{c.label}</td>
                  {ROLES.map((r) => <td key={r}>{EXAMPLE_MATRIX[r].includes(c.id) ? "Yes" : "No"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {invite && <InviteModal onClose={() => setInvite(false)} />}
      {route.parts[0] && <UserDrawer id={route.parts[0]} />}
    </div>
  )
}
