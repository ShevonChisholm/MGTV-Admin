import LoadingState from "../components/LoadingState";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { Card, Tabs, Modal, ConfirmDialog } from "../ui";
import { useDirtyGuard } from "../router";
export default function ConnectedAccess() {
  const [tab, setTab] = useState("roles"),
    [session, setSession] = useState<any>(null),
    [resources, setResources] = useState<any[]>([]),
    [available, setAvailable] = useState<any[]>([]),
    [roles, setRoles] = useState<any[]>([]),
    [history, setHistory] = useState<any[]>([]),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [editing, setEditing] = useState<any>(null),
    [filter, setFilter] = useState("");
  const [discard, setDiscard] = useState(false);
  const [permissionFilter, setPermissionFilter] = useState("");
  const key = useRef<{ body: string; key: string } | null>(null);
  const canManage = session?.permissions.includes("access.manage");
  useDirtyGuard(() => !!editing);
  async function load() {
    const s = await api("/admin/session");
    setSession(s);
    if (!s.permissions.includes("access.read")) {
      setLoaded(true);
      return;
    }
    const [catalog, roleList, events] = await Promise.all([
      api("/admin/access/resources"),
      api("/admin/access/roles"),
      api("/admin/access/history"),
    ]);
    setResources(catalog.items);
    setAvailable(catalog.available);
    setRoles(roleList.items);
    setHistory(events.items);
    setLoaded(true);
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The request failed.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void run(load);
  }, []);
  function edit(type: string, item?: any) {
    setError("");
    setPermissionFilter("");
    key.current = null;
    setEditing({
      type,
      id: item?.id,
      version: item?.version,
      key: item?.key ?? available[0]?.key ?? "",
      name: item?.name ?? "",
      description: item?.description ?? "",
      permissions: item?.permissions ?? [],
      active: item?.active ?? true,
      reason: "",
    });
  }
  function change(p: any) {
    setEditing((old: any) => ({ ...old, ...p }));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      const isRole = editing.type === "role",
        body = isRole
          ? {
              name: editing.name.trim(),
              description: editing.description,
              permissions: editing.permissions,
              active: editing.active,
              reason: editing.reason.trim(),
            }
          : {
              key: editing.key,
              name: editing.name.trim(),
              description: editing.description,
              reason: editing.reason.trim(),
            },
        signature = JSON.stringify({
          id: editing.id,
          version: editing.version,
          body,
        });
      if (key.current?.body !== signature)
        key.current = { body: signature, key: crypto.randomUUID() };
      await api(
        isRole
          ? "/admin/access/roles" + (editing.id ? "/" + editing.id : "")
          : "/admin/access/resources",
        isRole && editing.id ? "PUT" : "POST",
        body,
        editing.version,
        key.current.key,
      );
      setEditing(null);
      key.current = null;
      setNotice(
        isRole
          ? "Role saved. Affected staff sessions have been revoked."
          : "Resource registration saved.",
      );
      await load();
    });
  }
  return (
    <div className="page-pad people-workspace access-workspace">
      <header className="people-intro">
        <p className="people-eyebrow">People & access</p>
        <h2>The right access. For the right work.</h2>
        <p>
          Register resources, shape reusable roles and keep sensitive
          permissions explicit. Staff role assignments live on each staff
          record.
        </p>
      </header>
      {error && (
        <div role="alert" className="access-error">
          {error}{" "}
          <button
            className="btn"
            disabled={busy}
            onClick={() => void run(load)}
          >
            Retry
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className="people-notice">
          {notice}
        </p>
      )}
      {!loaded && !error ? (
        <LoadingState label="Loading workspace…" variant="cards" />
      ) : !session?.permissions.includes("access.read") ? (
        <Card title="Access restricted">
          <p>
            You need explicit access.read permission to view this workspace.
          </p>
        </Card>
      ) : (
        <>
          <Tabs
            label="Access management sections"
            items={[
              { id: "roles", label: "Roles", count: roles.length },
              {
                id: "resources",
                label: "Resources & permissions",
                count: resources.length,
              },
              { id: "history", label: "Activity" },
            ]}
            value={tab}
            onChange={(v) => {
              setTab(v);
              setFilter("");
            }}
          />
          <div className="access-toolbar">
            <label>
              Find {tab === "roles" ? "a role" : "a resource or permission"}
              <input
                className="input"
                value={filter}
                maxLength={100}
                onChange={(e) => setFilter(e.target.value)}
              />
            </label>
            {canManage && tab !== "history" && (
              <button
                className="btn btn-primary"
                disabled={busy || (tab === "resources" && !available.length)}
                onClick={() => edit(tab === "roles" ? "role" : "resource")}
              >
                {tab === "roles" ? "Create role" : "Register resource"}
              </button>
            )}
          </div>
          {tab === "roles" && (
            <div className="access-grid">
              {roles
                .filter((r) =>
                  (r.name + " " + r.description)
                    .toLowerCase()
                    .includes(filter.toLowerCase()),
                )
                .map((r) => (
                  <Card
                    key={r.id}
                    title={r.name}
                    aside={
                      <span className="badge">
                        {r.active ? "Active" : "Inactive"}
                      </span>
                    }
                  >
                    <div className="access-stack">
                      <p>{r.description || "No description."}</p>
                      <p>
                        {r.permissions.length} permissions · {r.members} staff
                        assignments
                      </p>
                      <div className="access-chips">
                        {r.permissions.map((p: string) => (
                          <code key={p}>{p}</code>
                        ))}
                      </div>
                      {canManage && (
                        <button
                          className="btn"
                          disabled={busy}
                          onClick={() => edit("role", r)}
                        >
                          Edit role
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              {!roles.length && (
                <p>
                  No roles yet. Create a role with only the access its work
                  requires.
                </p>
              )}
            </div>
          )}
          {tab === "resources" && (
            <>
              <p className="access-hint">
                Only resources backed by deployed API code can be registered.
                All currently implemented resources are registered. Registering
                a name never creates an endpoint or grants staff access.
              </p>
              <div className="access-grid">
                {resources
                  .filter((r) =>
                    (
                      r.name +
                      " " +
                      r.key +
                      " " +
                      r.permissions.map((p: any) => p.key).join(" ")
                    )
                      .toLowerCase()
                      .includes(filter.toLowerCase()),
                  )
                  .map((r) => (
                    <Card
                      key={r.key}
                      title={r.name}
                      aside={<code>{r.key}</code>}
                    >
                      <div className="access-stack">
                        <p>{r.description}</p>
                        {r.permissions.map((p: any) => (
                          <div className="access-permission" key={p.key}>
                            <span>
                              <strong>{p.label}</strong>
                              <small>{p.key}</small>
                            </span>
                            <span className="badge">
                              {p.directOnly
                                ? "Direct grant only"
                                : "Role eligible"}
                            </span>
                          </div>
                        ))}
                        {canManage && (
                          <button
                            className="btn"
                            disabled={busy}
                            onClick={() => edit("resource", r)}
                          >
                            Edit registration
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            </>
          )}
          {tab === "history" && (
            <Card title="Access history">
              <ol className="access-history">
                {history
                  .filter((h) =>
                    (h.action + " " + h.actor + " " + h.details.reason)
                      .toLowerCase()
                      .includes(filter.toLowerCase()),
                  )
                  .map((h) => (
                    <li key={h.id}>
                      <strong>{h.action}</strong>
                      <p>
                        {h.actor ?? "Staff"} ·{" "}
                        {new Date(h.created_at).toLocaleString()}
                      </p>
                      <p>{h.details.reason}</p>
                      {h.details.resourceKey && (
                        <code>{h.details.resourceKey}</code>
                      )}
                    </li>
                  ))}
              </ol>
              {!history.length && <p>No access changes recorded yet.</p>}
            </Card>
          )}
        </>
      )}
      {editing && (
        <Modal
          title={
            editing.type === "role"
              ? editing.id
                ? "Edit role"
                : "Create role"
              : "Resource registration"
          }
          side
          width={720}
          onClose={() => {
            if (!busy) setDiscard(true);
          }}
        >
          <form onSubmit={save} className="access-stack">
            <fieldset className="access-fieldset" disabled={busy}>
              {editing.type === "resource" && (
                <label>
                  Resource key
                  <select
                    className="input"
                    value={editing.key}
                    disabled={!!editing.version}
                    onChange={(e) => change({ key: e.target.value })}
                  >
                    {(editing.version ? resources : available).map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.key}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Name
                <input
                  className="input"
                  required
                  maxLength={100}
                  value={editing.name}
                  onChange={(e) => change({ name: e.target.value })}
                />
              </label>
              <label>
                Description
                <textarea
                  className="input"
                  maxLength={1000}
                  value={editing.description}
                  onChange={(e) => change({ description: e.target.value })}
                />
              </label>
              {editing.type === "role" && (
                <>
                  <label className="access-check">
                    <input
                      type="checkbox"
                      checked={editing.active}
                      onChange={(e) => change({ active: e.target.checked })}
                    />
                    Role active
                  </label>
                  <p>
                    Sensitive publishing, results-release and security
                    management permissions must be granted directly to staff.
                  </p>
                  <label>
                    Find role permissions
                    <input
                      className="input"
                      type="search"
                      value={permissionFilter}
                      placeholder="Search a resource or permission"
                      onChange={(e) => setPermissionFilter(e.target.value)}
                    />
                  </label>
                  {resources
                    .filter((r) =>
                      (
                        r.name +
                        " " +
                        r.key +
                        " " +
                        r.permissions.map((p: any) => p.key).join(" ")
                      )
                        .toLowerCase()
                        .includes(permissionFilter.toLowerCase()),
                    )
                    .map((r) => (
                      <fieldset key={r.key} className="access-resource-group">
                        <legend>
                          {r.key === "content"
                            ? "All content · legacy global access"
                            : r.name}
                        </legend>
                        {r.permissions
                          .filter((p: any) => !p.directOnly)
                          .map((p: any) => (
                            <label className="permission-option" key={p.key}>
                              <input
                                type="checkbox"
                                disabled={!session.permissions.includes(p.key)}
                                checked={editing.permissions.includes(p.key)}
                                onChange={(e) =>
                                  change({
                                    permissions: e.target.checked
                                      ? [...editing.permissions, p.key]
                                      : editing.permissions.filter(
                                          (v: string) => v !== p.key,
                                        ),
                                  })
                                }
                              />
                              <span>
                                {p.label}
                                <small>
                                  {p.key}
                                  {!session.permissions.includes(p.key)
                                    ? " · Not delegable by your account"
                                    : ""}
                                </small>
                              </span>
                            </label>
                          ))}
                      </fieldset>
                    ))}
                </>
              )}
              <label>
                Reason for this change
                <textarea
                  className="input"
                  required
                  maxLength={2000}
                  value={editing.reason}
                  onChange={(e) => change({ reason: e.target.value })}
                />
              </label>
              {error && <p role="alert">{error}</p>}
              <div className="access-actions">
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setDiscard(true)}
                >
                  Cancel
                </button>
              </div>
            </fieldset>
          </form>
        </Modal>
      )}
      {discard && (
        <ConfirmDialog
          title="Discard access changes?"
          confirmLabel="Discard changes"
          onConfirm={() => {
            setEditing(null);
            setDiscard(false);
          }}
          onCancel={() => setDiscard(false)}
        >
          Your unsaved role or resource changes will be discarded.
        </ConfirmDialog>
      )}
    </div>
  );
}
