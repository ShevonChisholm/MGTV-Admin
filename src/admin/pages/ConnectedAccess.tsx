import AccessTable, {
  Identity,
  Summary,
  resourceIcon,
  PermissionGroup,
} from "../components/AccessVisual";
import MediaIcon from "../components/MediaIcon";
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
  const [inspecting, setInspecting] = useState<{
    type: string;
    item: any;
  } | null>(null);
  const [step, setStep] = useState(0);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  function goStep(next: number) {
    setStep(next);
    setTimeout(() => stepHeading.current?.focus(), 0);
  }

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
    setStep(0);
    setInspecting(null);
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
  const roleRows = roles.filter((r) =>
    (r.name + " " + r.description + " " + r.permissions.join(" "))
      .toLowerCase()
      .includes(filter.trim().toLowerCase()),
  );
  const resourceRows = resources.filter((r) =>
    (
      r.name +
      " " +
      r.key +
      " " +
      r.permissions.map((p: any) => p.key).join(" ")
    )
      .toLowerCase()
      .includes(filter.trim().toLowerCase()),
  );
  const historyRows = history.filter((h) =>
    (h.action + " " + (h.actor ?? "") + " " + (h.details?.reason ?? ""))
      .toLowerCase()
      .includes(filter.trim().toLowerCase()),
  );
  const permissionGroups = resources
    .map((r) => ({
      ...r,
      options: r.permissions.filter(
        (p: any) =>
          !p.directOnly &&
          ((r.name + " " + r.key)
            .toLowerCase()
            .includes(permissionFilter.trim().toLowerCase()) ||
            p.key
              .toLowerCase()
              .includes(permissionFilter.trim().toLowerCase())),
      ),
    }))
    .filter((r) => r.options.length);
  const steps =
    editing?.type === "role"
      ? ["Identity", "Permissions", "Review"]
      : ["Registration", "Review"];
  const reviewStep = steps.length - 1;
  return (
    <div
      className="page-pad people-workspace access-workspace av-workspace"
      aria-busy={busy}
    >
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
          <Summary
            items={[
              { icon: "users", label: "Reusable roles", value: roles.length },
              {
                icon: "grid",
                label: "Registered resources",
                value: resources.length,
              },
              {
                icon: "lock",
                label: "Direct-grant-only permissions",
                value: resources.reduce(
                  (n, r) =>
                    n + r.permissions.filter((p: any) => p.directOnly).length,
                  0,
                ),
              },
            ]}
          />
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
              {tab === "history"
                ? "Find an action, colleague or reason"
                : tab === "roles"
                  ? "Find a role or permission"
                  : "Find a resource or permission"}
              <input
                className="input"
                value={filter}
                maxLength={100}
                onChange={(e) => setFilter(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn"
              disabled={!filter}
              onClick={() => setFilter("")}
            >
              <MediaIcon name="refresh" size={16} />
              Reset
            </button>
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
            <AccessTable
              key={"roles:" + filter}
              label="Reusable roles"
              rows={roleRows}
              rowKey={(r) => r.id}
              columns={[
                {
                  key: "identity",
                  label: "Role",
                  render: (r) => (
                    <Identity
                      name={r.name}
                      detail={r.description || "No description"}
                      icon="users"
                    />
                  ),
                },
                {
                  key: "state",
                  label: "Status",
                  render: (r) => (
                    <span
                      className="av-status"
                      data-state={r.active ? "active" : "inactive"}
                    >
                      {r.active ? "Active" : "Inactive"}
                    </span>
                  ),
                },
                {
                  key: "permissions",
                  label: "Permissions",
                  render: (r) => (
                    <span className="av-number">
                      {r.permissions.length}
                      <small>role-eligible grants</small>
                    </span>
                  ),
                },
                {
                  key: "members",
                  label: "Assignments",
                  render: (r) => (
                    <span className="av-number">
                      {r.members}
                      <small>staff assignments</small>
                    </span>
                  ),
                },
                {
                  key: "view",
                  label: "Details",
                  render: (r) => (
                    <button
                      type="button"
                      className="btn av-link"
                      onClick={() => setInspecting({ type: "role", item: r })}
                      aria-label={"View role " + r.name}
                    >
                      View
                      <MediaIcon name="arrow" size={16} />
                    </button>
                  ),
                },
              ]}
              empty="Try another role name or permission. Create a role only when a new set of duties is needed."
            />
          )}
          {tab === "resources" && (
            <>
              <p className="av-callout">
                <MediaIcon name="lock" />
                Only resources backed by deployed API code can be registered.{" "}
                {available.length
                  ? `${available.length} available to register.`
                  : "All available resources are registered."}{" "}
                Registration creates neither endpoints nor staff access.
              </p>
              <AccessTable
                key={"resources:" + filter}
                label="Registered resources"
                rows={resourceRows}
                rowKey={(r) => r.key}
                columns={[
                  {
                    key: "name",
                    label: "Resource",
                    render: (r) => (
                      <Identity
                        name={r.name}
                        detail={r.key}
                        icon={resourceIcon(r.key)}
                      />
                    ),
                  },
                  {
                    key: "permissions",
                    label: "Permissions",
                    render: (r) => (
                      <span className="av-number">
                        {r.permissions.length}
                        <small>registered operations</small>
                      </span>
                    ),
                  },
                  {
                    key: "direct",
                    label: "Sensitive access",
                    render: (r) => (
                      <span
                        className="av-status"
                        data-state={
                          r.permissions.some((p: any) => p.directOnly)
                            ? "protected"
                            : "neutral"
                        }
                      >
                        <MediaIcon name="lock" size={14} />
                        {
                          r.permissions.filter((p: any) => p.directOnly).length
                        }{" "}
                        direct only
                      </span>
                    ),
                  },
                  {
                    key: "view",
                    label: "Details",
                    render: (r) => (
                      <button
                        type="button"
                        className="btn av-link"
                        onClick={() =>
                          setInspecting({ type: "resource", item: r })
                        }
                        aria-label={"View resource " + r.name}
                      >
                        View
                        <MediaIcon name="arrow" size={16} />
                      </button>
                    ),
                  },
                ]}
              />
            </>
          )}
          {tab === "history" && (
            <>
              <p className="av-caption">
                Recent events returned by the server. Pagination and search
                apply to this returned history.
              </p>
              <AccessTable
                key={"history:" + filter}
                label="Access activity"
                rows={historyRows}
                rowKey={(h) => h.id}
                scope="returned events"
                columns={[
                  {
                    key: "action",
                    label: "Action",
                    render: (h) => (
                      <Identity
                        name={h.action}
                        detail={h.details?.resourceKey}
                        icon="clock"
                      />
                    ),
                  },
                  {
                    key: "actor",
                    label: "Staff",
                    render: (h) => h.actor ?? "Staff",
                  },
                  {
                    key: "reason",
                    label: "Reason",
                    render: (h) => h.details?.reason || "No reason returned",
                  },
                  {
                    key: "time",
                    label: "Recorded",
                    render: (h) => (
                      <time dateTime={h.created_at}>
                        {new Date(h.created_at).toLocaleString()}
                      </time>
                    ),
                  },
                ]}
              />
            </>
          )}
        </>
      )}
      {inspecting && (
        <Modal
          title={inspecting.item.name}
          side
          width={720}
          onClose={() => setInspecting(null)}
        >
          <div className="av-workspace av-detail">
            <Identity
              name={inspecting.item.name}
              detail={
                inspecting.type === "role"
                  ? "Reusable role"
                  : inspecting.item.key
              }
              icon={
                inspecting.type === "role"
                  ? "users"
                  : resourceIcon(inspecting.item.key)
              }
            />
            <p>{inspecting.item.description || "No description provided."}</p>
            {inspecting.type === "role" ? (
              <>
                <Summary
                  items={[
                    {
                      icon: "check",
                      label: "Status",
                      value: inspecting.item.active ? "Active" : "Inactive",
                    },
                    {
                      icon: "lock",
                      label: "Permissions",
                      value: inspecting.item.permissions.length,
                    },
                    {
                      icon: "users",
                      label: "Staff assignments",
                      value: inspecting.item.members,
                    },
                  ]}
                />
                <h3>Included permissions</h3>
                <div className="av-permission-list">
                  {inspecting.item.permissions.map((key: string) => (
                    <div key={key}>
                      <MediaIcon name="check" size={17} />
                      <code>{key}</code>
                    </div>
                  ))}
                  {!inspecting.item.permissions.length && (
                    <p>No permissions included.</p>
                  )}
                </div>
                <p className="av-callout">
                  <MediaIcon name="lock" />
                  Sensitive direct-only permissions are assigned to individual
                  staff. A role label grants nothing.
                </p>
              </>
            ) : (
              <>
                <h3>Registered operations</h3>
                <div className="av-permission-list">
                  {inspecting.item.permissions.map((p: any) => (
                    <div key={p.key}>
                      <span className="av-icon">
                        <MediaIcon
                          name={p.directOnly ? "lock" : "check"}
                          size={18}
                        />
                      </span>
                      <span>
                        <strong>{p.label}</strong>
                        <code>{p.key}</code>
                        <small>
                          {p.directOnly
                            ? "Direct staff grant required"
                            : "Eligible for role assignment"}
                        </small>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {canManage && (
              <button
                className="btn btn-primary"
                onClick={() => edit(inspecting.type, inspecting.item)}
              >
                <MediaIcon name="edit" size={17} />
                {inspecting.type === "role" ? "Edit role" : "Edit registration"}
              </button>
            )}
          </div>
        </Modal>
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
          <form
            onSubmit={(e) => {
              if (step !== reviewStep) {
                e.preventDefault();
                if (editing.name.trim()) goStep(step + 1);
                return;
              }
              void save(e);
            }}
            className="access-stack av-workspace"
          >
            <ol className="av-wizard" aria-label="Editor steps">
              {steps.map((name, i) => (
                <li key={name} aria-current={i === step ? "step" : undefined}>
                  <span>
                    {i < step ? <MediaIcon name="check" size={15} /> : i + 1}
                  </span>
                  {name}
                </li>
              ))}
            </ol>
            <h3 ref={stepHeading} tabIndex={-1}>
              {steps[step]}
            </h3>
            <fieldset className="access-fieldset" disabled={busy}>
              {step === 0 && (
                <>
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
                </>
              )}
              {editing.type === "role" && step === 1 && (
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
                  {!permissionGroups.length && (
                    <p className="av-callout">
                      <MediaIcon name="search" />
                      No role-eligible permissions match. Sensitive direct-only
                      permissions are managed on staff accounts.
                    </p>
                  )}
                  {permissionGroups.map((r) => (
                    <PermissionGroup
                      key={r.key + ":" + permissionFilter}
                      initialOpen={
                        !!permissionFilter ||
                        r.options.some((p: any) =>
                          editing.permissions.includes(p.key),
                        )
                      }
                      title={r.name}
                      count={
                        r.options.filter((p: any) =>
                          editing.permissions.includes(p.key),
                        ).length
                      }
                      icon={resourceIcon(r.key)}
                    >
                      <fieldset className="access-resource-group">
                        <legend>
                          {r.key === "content"
                            ? "All content · legacy global access"
                            : r.name}
                        </legend>
                        {r.options.map((p: any) => (
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
                    </PermissionGroup>
                  ))}
                </>
              )}
              {step === reviewStep && (
                <>
                  <div className="av-review">
                    <Identity
                      name={editing.name}
                      detail={
                        editing.type === "role"
                          ? editing.active
                            ? "Active role"
                            : "Inactive role"
                          : editing.key
                      }
                      icon={editing.type === "role" ? "users" : "grid"}
                    />
                    <p>{editing.description || "No description provided."}</p>
                    {editing.type === "role" && (
                      <>
                        <h4>
                          {editing.permissions.length} selected permissions
                        </h4>
                        <div className="access-chips">
                          {editing.permissions.map((p: string) => (
                            <code key={p}>{p}</code>
                          ))}
                        </div>
                      </>
                    )}
                    <p className="av-callout">
                      <MediaIcon name="alert" />
                      {editing.type === "role"
                        ? "Saving a role can revoke affected staff sessions. Review this exact selection before confirming."
                        : "Registration updates the catalog only. It does not grant access."}
                    </p>
                  </div>
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
                </>
              )}
              {error && <p role="alert">{error}</p>}
              <div className="access-actions">
                {step > 0 && (
                  <button
                    className="btn"
                    type="button"
                    disabled={busy}
                    onClick={() => goStep(step - 1)}
                  >
                    <MediaIcon name="back" size={16} />
                    Back
                  </button>
                )}
                {step < reviewStep ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={busy || !editing.name.trim()}
                    onClick={() => goStep(step + 1)}
                  >
                    Continue
                    <MediaIcon name="arrow" size={16} />
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    disabled={
                      busy || !editing.reason.trim() || !editing.name.trim()
                    }
                  >
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                )}
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
