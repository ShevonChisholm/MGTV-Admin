import LoadingState from "../components/LoadingState";
import React, { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { useDirtyGuard } from "../router";
type Profile = {
  id: string;
  name: string;
  type: string;
  avatar: string;
  isMain: boolean;
  language: string;
  autoplay: boolean;
  maxClassification: string;
  dailyLimitMinutes: number | null;
  requirePin: boolean;
  version: number;
};
const empty = {
  name: "",
  type: "adult",
  avatar: "gold",
  language: "en",
  autoplay: false,
  maxClassification: "R",
  dailyLimitMinutes: "",
  requirePin: true,
};
const colors: Record<string, string> = {
  gold: "#c8a65a",
  blue: "#74baff",
  coral: "#f5a5b3",
  jade: "#76d4b4",
  purple: "#c5a6f6",
};
export default function ConnectedProfiles({
  customerId,
  canManage,
  suspended,
  onChanged,
  onEditingChange,
}: {
  customerId: string;
  canManage: boolean;
  suspended: boolean;
  onChanged: () => Promise<void>;
  onEditingChange: (editing: boolean) => void;
}) {
  const [items, setItems] = useState<Profile[]>([]),
    [limit, setLimit] = useState(1),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<Profile | null>(null),
    [mode, setMode] = useState<"create" | "edit" | "policy" | "delete" | null>(
      null,
    ),
    [form, setForm] = useState(empty),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false),
    errorRef = useRef<HTMLDivElement>(null),
    headingRef = useRef<HTMLHeadingElement>(null),
    sectionRef = useRef<HTMLHeadingElement>(null),
    retryRef = useRef<{ signature: string; key: string } | null>(null);
  dirtyRef.current = dirty;
  useDirtyGuard(() => dirtyRef.current);
  useEffect(() => {
    onEditingChange(mode !== null);
    return () => onEditingChange(false);
  }, [mode, onEditingChange]);
  const base = "/admin/customers/" + customerId + "/profiles";
  async function load() {
    const page = await api(base);
    setItems(page.items);
    setLimit(page.limit);
    setLoaded(true);
  }
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 412
          ? "This profile changed. Cancel and reopen it to review the latest version."
          : e instanceof Error
            ? e.message
            : "The request failed.",
      );
      setTimeout(() => errorRef.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setMode(null);
    setDirty(false);
    retryRef.current = null;
    void run(load);
  }, [customerId]);
  function open(next: typeof mode, p: Profile | null = null) {
    setSelected(p);
    setForm(
      p
        ? {
            ...p,
            dailyLimitMinutes:
              p.dailyLimitMinutes === null ? "" : String(p.dailyLimitMinutes),
          }
        : empty,
    );
    setReason("");
    setError("");
    setNotice("");
    setDirty(false);
    retryRef.current = null;
    setMode(next);
    setTimeout(() => headingRef.current?.focus(), 0);
  }
  function change(patch: Partial<typeof empty>) {
    setForm((old) => ({ ...old, ...patch }));
    setDirty(true);
  }
  const field = (label: string, node: React.ReactNode) => (
    <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
      {label}
      {node}
    </label>
  );
  const input = (key: "name" | "language", label: string, maxLength: number) =>
    field(
      label,
      <input
        className="input"
        required
        maxLength={maxLength}
        value={form[key]}
        onChange={(e) => change({ [key]: e.target.value })}
      />,
    );
  async function save() {
    let path = base,
      method = "POST",
      body: unknown = { name: form.name, type: form.type, avatar: form.avatar };
    if (mode === "edit") {
      path += "/" + selected!.id;
      method = "PATCH";
      body = {
        name: form.name,
        type: form.type,
        avatar: form.avatar,
        language: form.language,
        autoplay: form.autoplay,
      };
    }
    if (mode === "policy") {
      path += "/" + selected!.id + "/policy";
      method = "PATCH";
      body = {
        maxClassification: form.maxClassification,
        dailyLimitMinutes:
          form.dailyLimitMinutes === "" ? null : Number(form.dailyLimitMinutes),
        requirePin: form.requirePin,
      };
    }
    if (mode === "delete") {
      path += "/" + selected!.id + "/delete";
      body = { reason };
    }
    const signature = path + JSON.stringify(body);
    if (retryRef.current?.signature !== signature)
      retryRef.current = { signature, key: crypto.randomUUID() };
    await api(
      path,
      method,
      body,
      mode === "create" ? undefined : selected?.version,
      retryRef.current.key,
    );
    setMode(null);
    setDirty(false);
    dirtyRef.current = false;
    retryRef.current = null;
    setNotice(
      mode === "delete"
        ? "Profile deleted."
        : mode === "policy"
          ? "Parental policy saved."
          : "Profile saved.",
    );
    await load();
    await onChanged();
    sectionRef.current?.focus();
  }
  const disabled = !canManage || suspended;
  return (
    <section
      className="people-profiles"
      style={{
        marginTop: 28,
        borderTop: "1px solid var(--border)",
        paddingTop: 24,
      }}
      aria-labelledby="customer-profiles-heading"
    >
      <h3 id="customer-profiles-heading" ref={sectionRef} tabIndex={-1}>
        Customer profiles
      </h3>
      <p style={{ margin: "8px 0", color: "var(--text-secondary)" }}>
        {items.length} of {limit} subscription slots · One protected main adult
        profile
      </p>
      <p style={{ fontSize: 13, marginBottom: 16 }}>
        Movie classifications are enforced. Profiles with daily limits cannot
        play full films until viewing-budget enforcement is available.
      </p>
      {suspended && (
        <p role="status">Reinstate this account to change profiles.</p>
      )}
      {error && (
        <div
          role="alert"
          tabIndex={-1}
          ref={errorRef}
          style={{
            padding: 12,
            border: "1px solid #db8585",
            marginBottom: 12,
            overflowWrap: "anywhere",
          }}
        >
          {error}
        </div>
      )}
      {notice && (
        <p role="status" style={{ marginBottom: 12 }}>
          {notice}
        </p>
      )}
      {!loaded && !error && (
        <LoadingState label={<>Loading profiles…</>} variant="cards" />
      )}
      {!mode && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(100%,240px),1fr))",
              gap: 12,
            }}
          >
            {items.map((p) => (
              <article
                className="card"
                key={p.id}
                style={{ padding: 18, minWidth: 0, overflowWrap: "anywhere" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "var(--bg)",
                      color: colors[p.avatar],
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h4>{p.name}</h4>
                    <small>
                      {p.type}
                      {p.isMain ? " · Main profile" : ""}
                    </small>
                  </div>
                </div>
                <p style={{ fontSize: 13, margin: "12px 0" }}>
                  Classification: {p.maxClassification} · Daily limit:{" "}
                  {p.dailyLimitMinutes === null
                    ? "Not set"
                    : p.dailyLimitMinutes + " min"}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="btn"
                    disabled={busy || disabled}
                    onClick={() => open("edit", p)}
                    aria-label={"Edit profile " + p.name}
                  >
                    Edit
                  </button>
                  <button
                    className="btn"
                    disabled={busy || disabled}
                    onClick={() => open("policy", p)}
                    aria-label={"Parental settings for " + p.name}
                  >
                    Parental settings
                  </button>
                  {!p.isMain && (
                    <button
                      className="btn"
                      disabled={busy || disabled}
                      onClick={() => open("delete", p)}
                      aria-label={"Delete profile " + p.name}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            disabled={busy || disabled || !loaded || items.length >= limit}
            onClick={() => open("create")}
          >
            Add profile
          </button>
          {items.length >= limit && (
            <p role="status" style={{ marginTop: 8 }}>
              The current subscription’s profile allowance is in use. Existing
              profiles are preserved if that allowance changes.
            </p>
          )}
          {error && (
            <button className="btn" onClick={() => void run(load)}>
              Retry loading profiles
            </button>
          )}
        </>
      )}
      {mode && (
        <form
          className="people-form"
          onSubmit={(e) => {
            e.preventDefault();
            void run(save);
          }}
          style={{ maxWidth: 600, marginTop: 16 }}
        >
          <h4 tabIndex={-1} ref={headingRef} style={{ marginBottom: 16 }}>
            {mode === "create"
              ? "Add a profile"
              : mode === "edit"
                ? "Edit " + selected?.name
                : mode === "policy"
                  ? "Parental settings: " + selected?.name
                  : "Delete " + selected?.name + "?"}
          </h4>
          <fieldset
            disabled={busy || disabled}
            style={{
              border: 0,
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 16,
              minWidth: 0,
            }}
          >
            {(mode === "create" || mode === "edit") && (
              <>
                {input("name", "Profile name", 20)}
                {field(
                  "Age category",
                  <select
                    className="input"
                    value={form.type}
                    disabled={selected?.isMain}
                    onChange={(e) => change({ type: e.target.value })}
                  >
                    {["adult", "teen", "child"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>,
                )}
                {field(
                  "Avatar color",
                  <select
                    className="input"
                    value={form.avatar}
                    onChange={(e) => change({ avatar: e.target.value })}
                  >
                    {Object.keys(colors).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>,
                )}
                {mode === "edit" && (
                  <>
                    {input(
                      "language",
                      "Language code (for example en or en-JM)",
                      5,
                    )}
                    <label>
                      <input
                        type="checkbox"
                        checked={form.autoplay}
                        onChange={(e) => change({ autoplay: e.target.checked })}
                      />{" "}
                      Autoplay preference
                    </label>
                  </>
                )}
                {selected?.isMain && (
                  <small>
                    The main profile remains an adult and cannot be deleted.
                  </small>
                )}
              </>
            )}
            {mode === "policy" && (
              <>
                {field(
                  "Maximum classification",
                  <select
                    className="input"
                    value={form.maxClassification}
                    onChange={(e) =>
                      change({ maxClassification: e.target.value })
                    }
                  >
                    {["G", "PG", "PG-13", "R"]
                      .slice(
                        0,
                        selected?.type === "child"
                          ? 2
                          : selected?.type === "teen"
                            ? 3
                            : 4,
                      )
                      .map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                  </select>,
                )}
                {field(
                  "Daily viewing limit in minutes (blank for none)",
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={1440}
                    step={1}
                    value={form.dailyLimitMinutes}
                    onChange={(e) =>
                      change({ dailyLimitMinutes: e.target.value })
                    }
                  />,
                )}
                <label>
                  <input
                    type="checkbox"
                    checked={form.requirePin}
                    onChange={(e) => change({ requirePin: e.target.checked })}
                  />{" "}
                  Require parental verification when switching to this profile
                </label>
                <small>
                  Manage the parental PIN through account security. Playback
                  enforcement remains unavailable.
                </small>
              </>
            )}
            {mode === "delete" && (
              <>
                <p>
                  This removes the profile permanently. Its name and preferences
                  cannot be restored.
                </p>
                {field(
                  "Reason for deleting this profile",
                  <textarea
                    className="input"
                    required
                    maxLength={2000}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setDirty(true);
                    }}
                  />,
                )}
              </>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className={
                  mode === "delete" ? "btn btn-danger" : "btn btn-primary"
                }
                disabled={busy || disabled || (mode !== "create" && !dirty)}
              >
                {busy
                  ? "Saving…"
                  : mode === "delete"
                    ? "Confirm profile deletion"
                    : mode === "policy"
                      ? "Store parental policy"
                      : "Save profile"}
              </button>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => {
                  setMode(null);
                  setDirty(false);
                  setError("");
                  void run(load);
                  sectionRef.current?.focus();
                }}
              >
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
