import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useDirtyGuard } from "../router";
export default function StaffPermissions({
  id,
  disabled=false,
  version,
  current,
  actorPermissions,
  onChanged,
  onEditingChange,
}: {
  id: string;
  disabled?: boolean;
  version: number;
  current: string[];
  actorPermissions: string[];
  onChanged: () => Promise<void>;
  onEditingChange: (editing: boolean) => void;
}) {
  const [catalog,setCatalog]=useState<any[]>([]),[catalogError,setCatalogError]=useState("");
  useEffect(()=>{let active=true;api("/admin/staff/permission-catalog").then(r=>{if(active)setCatalog(r.items);}).catch(e=>{if(active)setCatalogError(e.message);});return()=>{active=false;};},[]);
  const [permissionFilter,setPermissionFilter]=useState("");
  const permissions=catalog.flatMap(r=>r.permissions.map((p:any)=>p.key as string));
  const [selected, setSelected] = useState(current),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false),
    errorRef = useRef<HTMLDivElement>(null),
    keyRef = useRef<{ body: string; key: string } | null>(null);
  dirtyRef.current = dirty;
  useDirtyGuard(() => dirtyRef.current);
  useEffect(() => {
    setSelected(current);
    setDirty(false);
    setReason("");
  }, [version]);
  useEffect(() => {
    onEditingChange(dirty);
    return () => onEditingChange(false);
  }, [dirty, onEditingChange]);
  return (
    <form
      style={{ display: "grid", gap: 12, marginTop: 16 }}
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const body = { permissions: selected, reason },
          signature = JSON.stringify(body);
        if (keyRef.current?.body !== signature)
          keyRef.current = { body: signature, key: crypto.randomUUID() };
        void api(
          "/admin/staff/" + id + "/permissions",
          "POST",
          body,
          version,
          keyRef.current.key,
        )
          .then(async () => {
            setDirty(false);
            dirtyRef.current = false;
            keyRef.current = null;
            await onChanged();
          })
          .catch((e) => {
            setError(e.message);
            setTimeout(() => errorRef.current?.focus(), 0);
          })
          .finally(() => setBusy(false));
      }}
    >
      {catalogError&&<p role="alert">{catalogError}</p>}
      {!catalog.length&&!catalogError&&<p role="status">Loading registered permissions…</p>}
      <p>
        Grant permissions explicitly. A descriptive role label grants nothing. Assigned roles may supply other permissions; publishing always needs a direct grant. You can
        change only permissions you hold; changes sign this staff member out.
      </p>
      {error && (
        <div role="alert" ref={errorRef} tabIndex={-1}>
          {error}
        </div>
      )}
      <fieldset
        disabled={busy || disabled}
        style={{ border: 0, padding: 0, display: "grid", gap: 10 }}
      >
        <legend style={{ marginBottom: 12 }}>Assigned permissions</legend>
        <label>Find a direct permission<input className="input" value={permissionFilter} onChange={e=>setPermissionFilter(e.target.value)} placeholder="For example: movies.publish"/></label>
        <div className="permission-grid">
          {permissions.filter(p=>p.includes(permissionFilter.trim().toLowerCase())).map((p) => (
            <label
              key={p}
              className="permission-option"
              style={{ display: "flex", gap: 8, overflowWrap: "anywhere" }}
            >
              <input
                type="checkbox"
                checked={selected.includes(p)}
                disabled={!actorPermissions.includes(p)}
                onChange={(e) => {
                  setSelected((old) =>
                    e.target.checked ? [...old, p] : old.filter((x) => x !== p),
                  );
                  setDirty(true);
                }}
              />
              <span>
                <strong
                  style={{ display: "block", textTransform: "capitalize" }}
                >
                  {p.split(".").reverse().join(" ")}
                </strong>
                <small>
                  {p}
                  {!actorPermissions.includes(p)
                    ? " · Requires a permission you do not hold"
                    : ""}
                </small>
              </span>
            </label>
          ))}
        </div>
        <label style={{ display: "grid", gap: 6 }}>
          Reason for permission change
          <textarea
            className="input"
            required
            maxLength={2000}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setDirty(true);
            }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-primary" disabled={!dirty || busy || !catalog.length}>
            Save explicit permissions
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setSelected(current);
              setReason("");
              setDirty(false);
              setError("");
            }}
          >
            Cancel permission changes
          </button>
        </div>
      </fieldset>
    </form>
  );
}
