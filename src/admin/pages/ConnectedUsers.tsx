import MediaIcon from "../components/MediaIcon";
import "../components/PeopleVisual.css";
import LoadingState from "../components/LoadingState";
import StaffRoles from "./StaffRoles";
import StaffMfaRecovery from "./StaffMfaRecovery";
import StaffAuth from "./StaffAuth";
import StaffPermissions from "./StaffPermissions";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link, useDirtyGuard, useRouter } from "../router";
import ConnectedProfiles from "./ConnectedProfiles";

type Session = {
  principal: { id: string; displayName: string };
  permissions: string[];
};
type Account = {
  id: string;
  kind: "staff" | "customer";
  email: string;
  displayName: string;
  status: string;
  version: number;
  roleLabel?: string | null;
  countryCode?: string | null;
  permissions?: string[];
  activity?: {
    id: string;
    action: string;
    createdAt: string;
    details: { reason?: string; from?: string; to?: string };
  }[];
};
type Form = {
  email: string;
  displayName: string;
  roleLabel: string;
  countryCode: string;
};
const empty: Form = {
  email: "",
  displayName: "",
  roleLabel: "",
  countryCode: "",
};

export default function ConnectedUsers({
  kind,
  id,
}: {
  kind: "staff" | "customer";
  id?: string;
}) {
  const { navigate } = useRouter();
  const section = kind === "staff" ? "users" : "customers",
    base = "/admin/" + (kind === "staff" ? "staff" : "customers"),
    routeBase = "/admin/" + section;
  const readPermission = kind === "staff" ? "staff.read" : "customers.read",
    writePermission = kind === "staff" ? "staff.manage" : "customers.manage";
  const [session, setSession] = useState<Session | null>(null),
    [record, setRecord] = useState<Account | null>(null),
    [form, setForm] = useState<Form>(empty),
    [items, setItems] = useState<Account[]>([]),
    [cursor, setCursor] = useState<string | null>(null);
  const [pane, setPane] = useState("overview");
  const [busy, setBusy] = useState(false),
    [profileEditing, setProfileEditing] = useState(false),
    [rolesEditing, setRolesEditing] = useState(false),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [dirty, setDirty] = useState(false),
    [reason, setReason] = useState(""),
    [q, setQ] = useState(""),
    [status, setStatus] = useState("");
  const dirtyRef = useRef(false),
    errorRef = useRef<HTMLDivElement>(null),
    requestRef = useRef<{ body: string; key: string } | null>(null);
  dirtyRef.current = dirty;
  useDirtyGuard(() => dirtyRef.current);
  const can = (permission: string) => session?.permissions.includes(permission);
  const resetDirty = () => {
    dirtyRef.current = false;
    setDirty(false);
  };
  const select = (account: Account) => {
    setRecord(account);
    setForm({
      email: account.email,
      displayName: account.displayName,
      roleLabel: account.roleLabel ?? "",
      countryCode: account.countryCode ?? "",
    });
    resetDirty();
    setReason("");
  };
  const operationKey = (operation: string, body: unknown) => {
    const signature = operation + JSON.stringify(body);
    if (requestRef.current?.body !== signature)
      requestRef.current = { body: signature, key: crypto.randomUUID() };
    return requestRef.current.key;
  };
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The request could not be completed.",
      );
      if (e instanceof ApiError && e.status === 401) {
        setSession(null);
        setError("");
      }
      setTimeout(() => errorRef.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }
  async function list(more = false, search = q, state = status) {
    const params = new URLSearchParams({ q: search, status: state });
    if (!state) params.delete("status");
    if (more && cursor) params.set("cursor", cursor);
    const page = await api(base + "?" + params);
    setItems((old) => (more ? [...old, ...page.items] : page.items));
    setCursor(page.nextCursor);
  }
  async function load() {
    const current = (await api("/admin/session")) as Session;
    setSession(current);
    if (!current.permissions.includes(readPermission)) {
      setLoaded(true);
      return;
    }
    if (id && id !== "new") {
      if (!dirtyRef.current) select(await api(base + "/" + id));
    } else if (!id) await list();
    setLoaded(true);
  }
  useEffect(() => {
    setPane("overview");
    setLoaded(false);
    setRecord(null);
    setForm(empty);
    void run(load);
  }, [kind, id]);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, []);
  const change = (patch: Partial<Form>) => {
    setForm((old) => ({ ...old, ...patch }));
    setDirty(true);
    setNotice("");
  };
  const field = (label: string, node: React.ReactNode) => (
    <label
      style={{
        display: "grid",
        gap: 6,
        fontSize: 13,
        color: "var(--text-secondary)",
      }}
    >
      {label}
      {node}
    </label>
  );
  async function save() {
    const details = {
      displayName: form.displayName.trim(),
      ...(kind === "staff"
        ? { roleLabel: form.roleLabel.trim() || null }
        : { countryCode: form.countryCode.trim().toUpperCase() || null }),
    };
    if (record) {
      await api(base + "/" + record.id, "PATCH", details, record.version);
      select(await api(base + "/" + record.id));
      setNotice("Account record saved.");
    } else {
      const body = { ...details, email: form.email.trim().toLowerCase() };
      const created = await api(
        base,
        "POST",
        body,
        undefined,
        operationKey(base, body),
      );
      resetDirty();
      requestRef.current = null;
      navigate(routeBase + "/" + created.id);
    }
  }
  async function changeStatus(action: "suspend" | "reinstate" | "revoke") {
    if (!record) return;
    const body = { action, reason: reason.trim() };
    await api(
      base + "/" + record.id + "/status",
      "POST",
      body,
      record.version,
      operationKey(record.id, body),
    );
    select(await api(base + "/" + record.id));
    requestRef.current = null;
    setNotice("Account status updated and recorded in history.");
  }
  return (
    <div
      className="page-pad people-workspace people-visual"
      aria-busy={busy}
      data-kind={kind}
    >
      <div ref={errorRef} tabIndex={-1} role={error ? "alert" : undefined}>
        {error && (
          <div
            style={{
              padding: 14,
              border: "1px solid var(--red)",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            {error}{" "}
            {session && (
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    resetDirty();
                    await load();
                  })
                }
              >
                Reload server record
              </button>
            )}
          </div>
        )}
      </div>
      <div className="people-notice" role="status" aria-live="polite">
        {notice}
      </div>
      {!loaded && busy ? (
        <LoadingState label="Loading account workspace…" variant="cards" />
      ) : !session ? (
        <StaffAuth
          onAuthenticated={async () => {
            setError("");
            await load();
          }}
        />
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              Signed in as {session.principal.displayName}
            </span>
            <button
              className="btn"
              disabled={busy || dirty || profileEditing || rolesEditing}
              onClick={() =>
                void run(async () => {
                  await api("/admin/logout", "POST");
                  setSession(null);
                })
              }
            >
              Sign out
            </button>
          </div>
          {!can(readPermission) ? (
            <p role="alert">You need {readPermission} to view these records.</p>
          ) : (
            <>
              <header className="people-intro">
                <p className="people-eyebrow">People & access</p>
                <h2>
                  {kind === "staff" ? "Your MGTV team" : "Customer accounts"}
                </h2>
                <p>
                  {kind === "staff"
                    ? "The people behind MGTV. Browse staff identities, review access and open a focused account workspace."
                    : "A clear view of each household. Open an account to review its profiles, preferences and account history."}
                </p>
              </header>
              {!id ? (
                <>
                  <div className="pv-stats" aria-label="Loaded account summary">
                    {[
                      {
                        icon: "users",
                        label: "Accounts loaded",
                        value: items.length,
                      },
                      {
                        icon: "check",
                        label: "Active in this list",
                        value: items.filter((a) => a.status === "active")
                          .length,
                      },
                      {
                        icon: "clock",
                        label: "Pending in this list",
                        value: items.filter((a) => a.status === "pending")
                          .length,
                      },
                    ].map((stat) => (
                      <div className="pv-stat" key={stat.label}>
                        <span className="pv-icon">
                          <MediaIcon name={stat.icon} size={22} />
                        </span>
                        <div>
                          <strong>{stat.value}</strong>
                          <small>{stat.label}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form
                    className="people-toolbar"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(() => list());
                    }}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "end",
                      flexWrap: "wrap",
                      marginBottom: 20,
                    }}
                  >
                    {field(
                      "Search name or email",
                      <input
                        className="input"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        maxLength={200}
                      />,
                    )}
                    {field(
                      "Account status",
                      <select
                        className="input"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="">All statuses</option>
                        {[
                          "pending",
                          "active",
                          "suspended",
                          ...(kind === "staff" ? ["revoked"] : []),
                        ].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>,
                    )}
                    <button className="btn" disabled={busy}>
                      Apply filters
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={busy || (!q && !status)}
                      onClick={() => {
                        setQ("");
                        setStatus("");
                        void run(() => list(false, "", ""));
                      }}
                    >
                      Reset
                    </button>
                    {can(writePermission) && (
                      <Link className="btn btn-primary" to={routeBase + "/new"}>
                        Add{" "}
                        {kind === "staff" ? "staff member" : "customer record"}
                      </Link>
                    )}
                  </form>
                  {busy && !items.length && (
                    <LoadingState
                      label={<>Loading records…</>}
                      variant="table"
                    />
                  )}
                  {loaded && !busy && !error && items.length === 0 && (
                    <div className="people-form">
                      <h2>No accounts found</h2>
                      <p
                        style={{ marginTop: 8, color: "var(--text-secondary)" }}
                      >
                        Try a different name, email or status.
                      </p>
                    </div>
                  )}
                  <p className="pv-caption">
                    Showing {items.length} loaded accounts
                    {cursor ? " · More available" : ""}. Filters apply when you
                    select Apply filters.
                  </p>
                  <div className="pv-account-grid">
                    {items.map((account) => (
                      <Link
                        className="pv-account-card"
                        key={account.id}
                        to={routeBase + "/" + account.id}
                      >
                        <div className="pv-card-top">
                          <span className="pv-initials" aria-hidden="true">
                            {account.displayName
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((n) => n.charAt(0))
                              .join("")
                              .toUpperCase()}
                          </span>
                          <span
                            className="people-status"
                            data-status={account.status}
                          >
                            {account.status}
                          </span>
                        </div>
                        <h3>{account.displayName}</h3>
                        <p className="pv-email">
                          <MediaIcon name="mail" size={16} />
                          {account.email}
                        </p>
                        <div className="pv-card-foot">
                          <span>
                            <MediaIcon
                              name={kind === "staff" ? "lock" : "globe"}
                              size={16}
                            />
                            {kind === "staff"
                              ? account.roleLabel || "Staff account"
                              : account.countryCode || "Country not set"}
                          </span>
                          <MediaIcon name="arrow" size={20} />
                        </div>
                      </Link>
                    ))}
                  </div>
                  {cursor && (
                    <button
                      className="btn"
                      style={{ marginTop: 16 }}
                      disabled={busy}
                      onClick={() => void run(() => list(true))}
                    >
                      Load more records
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Link className="btn" to={routeBase}>
                    ← All {kind === "staff" ? "staff" : "customers"}
                  </Link>
                  {(id === "new" || record) && (
                    <>
                      <div className="pv-detail-hero">
                        <span
                          className="pv-initials pv-large"
                          aria-hidden="true"
                        >
                          {(record?.displayName || form.displayName || "MG")
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div>
                          <p className="people-eyebrow">
                            {kind === "staff"
                              ? "Staff identity"
                              : "Customer household"}
                          </p>
                          <h2>
                            {record?.displayName ||
                              (kind === "staff"
                                ? "New staff member"
                                : "New customer record")}
                          </h2>
                          <p className="pv-email">
                            {record?.email ||
                              "Create a pending identity to begin secure setup."}
                          </p>
                        </div>
                        {record && (
                          <span
                            className="people-status"
                            data-status={record.status}
                          >
                            {record.status}
                          </span>
                        )}
                      </div>
                      {record && (
                        <>
                          <nav
                            className="pv-sections"
                            aria-label="Account sections"
                          >
                            {[
                              {
                                id: "overview",
                                label: "Overview",
                                icon: "users",
                              },
                              {
                                id: "account",
                                label: "Account details",
                                icon: "edit",
                              },
                              {
                                id: kind === "customer" ? "profiles" : "access",
                                label:
                                  kind === "customer"
                                    ? "Profiles"
                                    : "Access & security",
                                icon: "lock",
                              },
                              {
                                id: "status",
                                label: "Account status",
                                icon: "alert",
                              },
                              {
                                id: "history",
                                label: "Activity",
                                icon: "clock",
                              },
                            ].map((tab) => (
                              <button
                                type="button"
                                key={tab.id}
                                className="btn"
                                aria-current={
                                  pane === tab.id ? "page" : undefined
                                }
                                disabled={
                                  busy ||
                                  ((dirty || profileEditing || rolesEditing) &&
                                    pane !== tab.id)
                                }
                                onClick={() => setPane(tab.id)}
                              >
                                <MediaIcon name={tab.icon} size={17} />
                                {tab.label}
                              </button>
                            ))}
                          </nav>
                          <section
                            className="pv-overview"
                            hidden={pane !== "overview"}
                            aria-label="Account overview"
                          >
                            <div className="pv-overview-card">
                              <span className="pv-icon">
                                <MediaIcon
                                  name={kind === "staff" ? "lock" : "users"}
                                  size={28}
                                />
                              </span>
                              <h3>
                                {kind === "staff"
                                  ? "A separate staff identity"
                                  : "One household, individual profiles"}
                              </h3>
                              <p>
                                {kind === "staff"
                                  ? "Staff sign-in and MFA remain separate from customer accounts. Only explicit permissions and assigned roles grant access; a display label grants none."
                                  : "Review the account’s profiles, age classifications and viewing policies in their own workspace. Profile allowance comes from the current subscription."}
                              </p>
                              <button
                                className="btn"
                                type="button"
                                onClick={() =>
                                  setPane(
                                    kind === "staff" ? "access" : "profiles",
                                  )
                                }
                              >
                                <MediaIcon name="arrow" size={18} />
                                {kind === "staff"
                                  ? "Review access & security"
                                  : "View customer profiles"}
                              </button>
                            </div>
                            <div className="pv-overview-card">
                              <h3>Account at a glance</h3>
                              <dl className="pv-facts">
                                <div>
                                  <dt>
                                    <MediaIcon name="mail" size={16} />
                                    Email
                                  </dt>
                                  <dd>{record.email}</dd>
                                </div>
                                <div>
                                  <dt>
                                    <MediaIcon name="check" size={16} />
                                    Status
                                  </dt>
                                  <dd>{record.status}</dd>
                                </div>
                                <div>
                                  <dt>
                                    <MediaIcon
                                      name={
                                        kind === "staff" ? "users" : "globe"
                                      }
                                      size={16}
                                    />
                                    {kind === "staff"
                                      ? "Role label"
                                      : "Country"}
                                  </dt>
                                  <dd>
                                    {kind === "staff"
                                      ? record.roleLabel || "Not set"
                                      : record.countryCode || "Not set"}
                                  </dd>
                                </div>
                              </dl>
                              <button
                                type="button"
                                className="btn"
                                onClick={() => setPane("account")}
                              >
                                <MediaIcon name="edit" size={18} />
                                View account details
                              </button>
                            </div>
                          </section>
                        </>
                      )}
                      <div hidden={!!record && pane !== "account"}>
                        <form
                          className="people-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void run(save);
                          }}
                        >
                          <fieldset
                            disabled={
                              busy ||
                              profileEditing ||
                              rolesEditing ||
                              !can(writePermission) ||
                              record?.status === "revoked"
                            }
                            style={{
                              border: 0,
                              padding: 0,
                              margin: 0,
                              display: "grid",
                              gap: 18,
                              maxWidth: 640,
                              minWidth: 0,
                            }}
                          >
                            {field(
                              "Display name",
                              <input
                                className="input"
                                required
                                maxLength={120}
                                value={form.displayName}
                                onChange={(e) =>
                                  change({ displayName: e.target.value })
                                }
                              />,
                            )}
                            {field(
                              kind === "staff"
                                ? "Staff email"
                                : "Customer email",
                              <input
                                className="input"
                                type="email"
                                autoComplete="off"
                                required
                                maxLength={254}
                                disabled={!!record}
                                value={form.email}
                                onChange={(e) =>
                                  change({ email: e.target.value })
                                }
                              />,
                            )}
                            {record && (
                              <small>
                                This email identifies the account and cannot be
                                changed here.
                              </small>
                            )}
                            {kind === "staff" ? (
                              <>
                                {field(
                                  "Role label (optional)",
                                  <input
                                    className="input"
                                    maxLength={100}
                                    value={form.roleLabel}
                                    onChange={(e) =>
                                      change({ roleLabel: e.target.value })
                                    }
                                  />,
                                )}
                                <small>
                                  A label does not grant permissions, including
                                  publication.
                                </small>
                              </>
                            ) : (
                              field(
                                "Country code (optional, two letters)",
                                <input
                                  className="input"
                                  maxLength={2}
                                  pattern="[A-Za-z]{2}"
                                  value={form.countryCode}
                                  onChange={(e) =>
                                    change({
                                      countryCode: e.target.value.toUpperCase(),
                                    })
                                  }
                                />,
                              )
                            )}
                            <button
                              className="btn btn-primary"
                              disabled={!dirty || busy}
                            >
                              {busy
                                ? "Saving…"
                                : record
                                  ? "Save account record"
                                  : "Create pending record"}
                            </button>
                            {record && (
                              <button
                                type="button"
                                className="btn"
                                disabled={busy || !dirty}
                                onClick={() => {
                                  select(record);
                                  setNotice("Unsaved account edits discarded.");
                                }}
                              >
                                Discard account edits
                              </button>
                            )}
                          </fieldset>
                        </form>
                      </div>
                      <div hidden={pane !== "access"}>
                        {record?.kind === "staff" && can("onboarding.read") && (
                          <div
                            className="card"
                            style={{ padding: 18, marginTop: 24 }}
                          >
                            <h3>Staff onboarding</h3>
                            <p>
                              Track this colleague’s invitation, secure setup,
                              orientation and access review.
                            </p>
                            <Link
                              className="btn"
                              to={"/admin/onboarding/" + record.id}
                            >
                              View onboarding journey
                            </Link>
                          </div>
                        )}
                        {record?.kind === "staff" && (
                          <div
                            className="card"
                            style={{ padding: 18, marginTop: 24 }}
                          >
                            <h3>Explicit permissions</h3>
                            <p
                              style={{
                                marginTop: 8,
                                color: "var(--text-secondary)",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {record.permissions?.length ? (
                                <span className="pv-permission-chips">
                                  {record.permissions.map((permission) => (
                                    <code key={permission}>{permission}</code>
                                  ))}
                                </span>
                              ) : (
                                "No permissions granted."
                              )}
                            </p>
                            {can("staff.manage") &&
                              record.id !== session.principal.id &&
                              record.status !== "revoked" && (
                                <details className="pv-disclosure">
                                  <summary>
                                    <MediaIcon name="edit" size={18} />
                                    Edit direct permissions
                                  </summary>
                                  <StaffPermissions
                                    disabled={rolesEditing}
                                    id={record.id}
                                    version={record.version}
                                    current={record.permissions ?? []}
                                    actorPermissions={session.permissions}
                                    onEditingChange={setProfileEditing}
                                    onChanged={async () =>
                                      select(await api(base + "/" + record.id))
                                    }
                                  />
                                </details>
                              )}
                            {record.status === "pending" &&
                              can("staff.manage") && (
                                <button
                                  className="btn"
                                  style={{ marginTop: 16 }}
                                  disabled={
                                    busy ||
                                    dirty ||
                                    profileEditing ||
                                    rolesEditing
                                  }
                                  onClick={() =>
                                    void run(async () => {
                                      const response = await api(
                                        "/admin/staff/" + record.id + "/invite",
                                        "POST",
                                      );
                                      setNotice(response.message);
                                    })
                                  }
                                >
                                  Issue staff invitation
                                </button>
                              )}
                          </div>
                        )}
                        {record?.kind === "staff" && (
                          <details className="pv-disclosure">
                            <summary>
                              <MediaIcon name="users" size={18} />
                              Roles & effective access
                            </summary>
                            <StaffRoles
                              onEditingChange={setRolesEditing}
                              key={"roles:" + record.id}
                              id={record.id}
                              canManage={
                                !!can("access.manage") &&
                                record.id !== session.principal.id &&
                                record.status !== "revoked" &&
                                !dirty &&
                                !profileEditing
                              }
                              onChanged={async () =>
                                select(await api(base + "/" + record.id))
                              }
                            />
                          </details>
                        )}
                        {record?.kind === "staff" &&
                          record.status === "active" &&
                          record.id !== session.principal.id &&
                          can("staff.manage") && (
                            <details className="pv-disclosure">
                              <summary>
                                <MediaIcon name="lock" size={18} />
                                Authenticator recovery
                              </summary>
                              <StaffMfaRecovery
                                key={record.id}
                                id={record.id}
                                disabled={
                                  busy ||
                                  dirty ||
                                  profileEditing ||
                                  rolesEditing
                                }
                                onChanged={async () =>
                                  select(await api(base + "/" + record.id))
                                }
                              />
                            </details>
                          )}
                      </div>
                      <div hidden={pane !== "status"}>
                        {record &&
                          can(writePermission) &&
                          record.id !== session.principal.id &&
                          record.status !== "revoked" && (
                            <div
                              className="card"
                              style={{
                                padding: 18,
                                marginTop: 24,
                                display: "grid",
                                gap: 12,
                              }}
                            >
                              <h3>Account status</h3>
                              {field(
                                "Reason for status change",
                                <textarea
                                  className="input"
                                  maxLength={2000}
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                />,
                              )}
                              <div
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  flexWrap: "wrap",
                                }}
                              >
                                <button
                                  className="btn"
                                  disabled={
                                    busy ||
                                    dirty ||
                                    profileEditing ||
                                    rolesEditing ||
                                    !reason.trim()
                                  }
                                  onClick={() =>
                                    void run(() =>
                                      changeStatus(
                                        record.status === "suspended"
                                          ? "reinstate"
                                          : "suspend",
                                      ),
                                    )
                                  }
                                >
                                  {record.status === "suspended"
                                    ? "Reinstate previous status"
                                    : "Suspend account"}
                                </button>
                                {kind === "staff" &&
                                  record.status === "pending" && (
                                    <button
                                      className="btn"
                                      disabled={busy || dirty || !reason.trim()}
                                      onClick={() =>
                                        void run(() => changeStatus("revoke"))
                                      }
                                    >
                                      Revoke pending record
                                    </button>
                                  )}
                              </div>
                              <small>
                                Reinstating a pending record keeps it pending.
                                It does not activate sign-in.
                              </small>
                            </div>
                          )}
                        {record &&
                          (!can(writePermission) ||
                            record.id === session.principal.id ||
                            record.status === "revoked") && (
                            <div className="pv-overview-card">
                              <MediaIcon name="lock" />
                              <h3>Status changes unavailable</h3>
                              <p>
                                {record.status === "revoked"
                                  ? "This record has been revoked."
                                  : record.id === session.principal.id
                                    ? "You cannot change your own account status here."
                                    : "Account management permission is required."}
                              </p>
                            </div>
                          )}
                      </div>
                      <div hidden={pane !== "profiles"}>
                        {record?.kind === "customer" && (
                          <ConnectedProfiles
                            key={record.id}
                            customerId={record.id}
                            canManage={!!can(writePermission) && !dirty}
                            suspended={record.status === "suspended"}
                            onEditingChange={setProfileEditing}
                            onChanged={async () => {
                              if (!dirtyRef.current)
                                select(await api(base + "/" + record.id));
                            }}
                          />
                        )}
                      </div>
                      <div hidden={pane !== "history"}>
                        {record && !record.activity?.length && (
                          <div className="pv-overview-card">
                            <MediaIcon name="clock" />
                            <h3>No account events returned</h3>
                            <p>
                              Account changes will appear here when recorded.
                            </p>
                          </div>
                        )}
                        {!!record?.activity?.length && (
                          <section
                            className="people-history"
                            style={{ marginTop: 24 }}
                          >
                            <h3>Record history</h3>
                            <ol
                              style={{
                                paddingLeft: 20,
                                display: "grid",
                                gap: 12,
                                marginTop: 12,
                              }}
                            >
                              {record.activity.map((event) => (
                                <li key={event.id}>
                                  <div>
                                    {event.action.replace(
                                      "users." + kind + ".",
                                      "",
                                    )}{" "}
                                    ·{" "}
                                    {new Date(event.createdAt).toLocaleString()}
                                  </div>
                                  {event.details.reason && (
                                    <p
                                      style={{
                                        fontSize: 13,
                                        color: "var(--text-secondary)",
                                        overflowWrap: "anywhere",
                                      }}
                                    >
                                      {event.details.reason}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ol>
                            <small>Most recent 50 account events.</small>
                          </section>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
