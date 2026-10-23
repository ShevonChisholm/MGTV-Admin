import React, { useState } from "react"
import { ConfirmDialog, EmptyState, Modal, TextField } from "./index"
import { isEmail } from "./ops"
import { genId } from "../store/meta"
import type { Contact } from "../store/ops/types"

function ContactForm({ initial, onSave, onClose }: { initial: Contact; onSave: (c: Contact) => void; onClose: () => void }) {
  const [c, setC] = useState(initial)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const save = () => {
    const e: Record<string, string> = {}
    if (!c.name.trim()) e.name = "Enter the contact's name."
    if (!c.email.trim()) e.email = "Enter an email address."
    else if (!isEmail(c.email)) e.email = "Enter a valid email address, like name@company.com."
    setErrs(e)
    if (!Object.keys(e).length) onSave({ ...c, name: c.name.trim(), email: c.email.trim() })
  }
  return (
    <Modal title={initial.name ? "Edit contact" : "Add contact"} onClose={onClose} width={480} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Save contact</button></>}>
      <div style={{ display: "grid", gap: 14 }}>
        <TextField label="Name" required value={c.name} error={errs.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        <TextField label="Role" value={c.role} onChange={(e) => setC({ ...c, role: e.target.value })} />
        <TextField label="Email" required type="email" value={c.email} error={errs.email} onChange={(e) => setC({ ...c, email: e.target.value })} />
        <TextField label="Phone" type="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
      </div>
    </Modal>
  )
}

export default function ContactsEditor({ contacts, onChange, disabled }: { contacts: Contact[]; onChange: (next: Contact[], action: string) => void; disabled?: boolean }) {
  const [edit, setEdit] = useState<Contact | null>(null)
  const [del, setDel] = useState<Contact | null>(null)
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{contacts.length} contact{contacts.length === 1 ? "" : "s"}</span>
        <button className="btn btn-primary btn-sm" disabled={disabled} onClick={() => setEdit({ id: genId("ct"), name: "", role: "", email: "", phone: "" })}>Add contact</button>
      </div>
      {contacts.length === 0 ? (
        <EmptyState title="No contacts yet" body="Add at least one person we can reach about this organization." />
      ) : (
        <div className="scroll-x" style={{ border: "1px solid var(--border)", borderRadius: 8 }}>
          <table className="tbl">
            <thead><tr><th>Name</th><th>Role</th><th>Email</th><th><span style={{ position: "absolute", left: -9999 }}>Actions</span></th></tr></thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.role || "—"}</td>
                  <td>{c.email}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-sm" disabled={disabled} onClick={() => setEdit(c)} aria-label={`Edit ${c.name}`}>Edit</button>{" "}
                    <button className="btn btn-sm btn-ghost" disabled={disabled} onClick={() => setDel(c)} aria-label={`Remove ${c.name}`}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {edit && (
        <ContactForm
          initial={edit}
          onClose={() => setEdit(null)}
          onSave={(c) => {
            const exists = contacts.some((x) => x.id === c.id)
            onChange(exists ? contacts.map((x) => (x.id === c.id ? c : x)) : [...contacts, c], `${exists ? "Updated" : "Added"} contact ${c.name}`)
            setEdit(null)
          }}
        />
      )}
      {del && (
        <ConfirmDialog title="Remove contact?" confirmLabel="Remove contact" danger onCancel={() => setDel(null)} onConfirm={() => { onChange(contacts.filter((x) => x.id !== del.id), `Removed contact ${del.name}`); setDel(null) }}>
          {del.name} will be removed from this organization. This is recorded in the activity history.
        </ConfirmDialog>
      )}
    </div>
  )
}
