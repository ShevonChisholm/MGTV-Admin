import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useDirtyGuard } from "../router";
import { Card } from "../ui";
export default function StaffRoles({
  id,
  canManage,
  onChanged,
  onEditingChange,
}: {
  id: string;
  canManage: boolean;
  onChanged: () => Promise<void>;
  onEditingChange: (editing:boolean)=>void;
}) {
  const [record, setRecord] = useState<any>(null),
    [roles, setRoles] = useState<any[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const key = useRef<{ body: string; key: string } | null>(null);
  const dirty =
    !!record &&
    (JSON.stringify([...selected].sort()) !==
      JSON.stringify(record.roles.map((r: any) => r.id).sort()) ||
      !!reason);
  useDirtyGuard(() => dirty);
  useEffect(()=>{onEditingChange(dirty);return()=>onEditingChange(false);},[dirty,onEditingChange]);
  async function load() {
    const result = await api(`/admin/staff/${id}/access`);
    setRecord(result);
    setSelected(result.roles.map((r: any) => r.id));
    if (canManage) setRoles((await api("/admin/access/roles")).items);
  }
  useEffect(() => {
    setRecord(null);
    setError("");
    void load().catch((e) => setError(e.message));
  }, [id, canManage]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = { roleIds: selected, reason: reason.trim() },
      signature = JSON.stringify(body);
    if (key.current?.body !== signature)
      key.current = { body: signature, key: crypto.randomUUID() };
    try {
      await api(
        `/admin/staff/${id}/roles`,
        "PUT",
        body,
        record.version,
        key.current.key,
      );
      key.current = null;
      setReason("");
      await load();
      await onChanged();
      setNotice(
        "Role assignments saved. This staff member must sign in again.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save roles.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Roles & effective access">
      <div className="access-stack">
        {error && (
          <p role="alert">
            {error}{" "}
            <button
              className="btn"
              onClick={() => void load().catch((e) => setError(e.message))}
            >
              Retry
            </button>
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {!record && !error && (
          <div className="access-skeleton" role="status">
            Loading staff access…
          </div>
        )}
        {record && (
          <>
            <p>
              Direct grants and active assigned roles combine to form effective
              access. A role label grants nothing. Publishing remains a direct
              grant.
            </p>
            <div className="access-chips">
              {record.roles.length ? (
                record.roles.map((r: any) => (
                  <span key={r.id} className="badge">
                    {r.name}
                    {!r.active ? " · inactive" : ""}
                  </span>
                ))
              ) : (
                <span>No roles assigned.</span>
              )}
            </div>
            <details>
              <summary>
                View {record.effectivePermissions.length} effective permissions
              </summary>
              <div className="access-chips">
                {record.effectivePermissions.map((p: string) => (
                  <code key={p}>{p}</code>
                ))}
              </div>
            </details>
            {canManage && (
              <form onSubmit={save} className="access-stack">
                <fieldset disabled={busy} className="access-fieldset">
                  <legend>Assign roles</legend>
                  {roles.map((r) => (
                    <label className="permission-option" key={r.id}>
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        disabled={!r.active && !selected.includes(r.id)}
                        onChange={(e) =>
                          setSelected((old) =>
                            e.target.checked
                              ? [...old, r.id]
                              : old.filter((v) => v !== r.id),
                          )
                        }
                      />
                      <span>
                        <strong>
                          {r.name}
                          {!r.active ? " · inactive" : ""}
                        </strong>
                        <small>{r.description}</small>
                      </span>
                    </label>
                  ))}
                  <label>
                    Reason for assignment change
                    <textarea
                      className="input"
                      required
                      maxLength={2000}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <div className="access-actions">
                    <button
                      className="btn btn-primary"
                      disabled={!dirty || !reason.trim() || busy}
                    >
                      Save role assignments
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        setSelected(record.roles.map((r: any) => r.id));
                        setReason("");
                        setError("");
                      }}
                    >
                      Cancel changes
                    </button>
                  </div>
                </fieldset>
              </form>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
