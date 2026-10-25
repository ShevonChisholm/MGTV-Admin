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
  async function list(more = false) {
    const params = new URLSearchParams({ q, status });
    if (!status) params.delete("status");
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
    <div className="page-pad people-workspace" style={{ maxWidth: 1100 }}>
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
      {!session ? (
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
                  Staff and customer accounts use different emails. New records
                  stay pending until verification or invitation acceptance is
                  completed.
                </p>
              </header>
              {!id ? (
                <>
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
                  <div style={{ display: "grid", gap: 12 }}>
                    {items.map((account) => (
                      <Link
                        className="card people-row"
                        key={account.id}
                        to={routeBase + "/" + account.id}
                        style={{
                          padding: 18,
                          color: "inherit",
                          textDecoration: "none",
                          display: "flex",
                          gap: 12,
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        <div className="people-identity">
                          <span className="people-avatar" aria-hidden="true">
                            {account.displayName.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>{account.displayName}</strong>
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-secondary)",
                                marginTop: 4,
                              }}
                            >
                              {account.email}
                            </div>
                          </div>
                        </div>
                        <span
                          className="people-status"
                          data-status={account.status}
                        >
                          {account.status}
                        </span>
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
                      <h2 style={{ margin: "20px 0 12px" }}>
                        {record
                          ? record.displayName
                          : "New " +
                            (kind === "staff"
                              ? "staff member"
                              : "customer record")}
                      </h2>
                      {record && (
                        <p style={{ marginBottom: 16 }}>
                          Status: <strong>{record.status}</strong>
                        </p>
                      )}
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
                            kind === "staff" ? "Staff email" : "Customer email",
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
                        </fieldset>
                      </form>
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
                            {record.permissions?.length
                              ? record.permissions.join(", ")
                              : "No permissions granted."}
                          </p>
                          {can("staff.manage") &&
                            record.id !== session.principal.id &&
                            record.status !== "revoked" && (
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
                      )}
                      {record?.kind === "staff" &&
                        record.status === "active" &&
                        record.id !== session.principal.id &&
                        can("staff.manage") && (
                          <StaffMfaRecovery
                            key={record.id}
                            id={record.id}
                            disabled={
                              busy || dirty || profileEditing || rolesEditing
                            }
                            onChanged={async () =>
                              select(await api(base + "/" + record.id))
                            }
                          />
                        )}
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
                              Reinstating a pending record keeps it pending. It
                              does not activate sign-in.
                            </small>
                          </div>
                        )}
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
                                  · {new Date(event.createdAt).toLocaleString()}
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
