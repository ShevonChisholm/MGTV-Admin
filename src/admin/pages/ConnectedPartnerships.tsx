import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import { Link, useRouter, useDirtyGuard } from "../router";
import { Modal, ConfirmDialog } from "../ui";
import AccessTable, { Identity } from "../components/AccessVisual";
import MediaIcon from "../components/MediaIcon";
import LoadingState from "../components/LoadingState";
import PartnershipFields, {
  PartnershipInput,
} from "../components/PartnershipFields";
import PartnershipDetail from "../components/PartnershipDetail";
import {
  partnershipBase as base,
  partnershipSections as sections,
  emptyPartnership,
  cleanPartnership,
  label,
  money,
} from "../components/partnership-model";
import "../components/Partnerships.css";
export default function ConnectedPartnerships() {
  const { route, navigate } = useRouter(),
    kind = sections.includes(route.parts[0]) ? route.parts[0] : "agreements",
    id = route.parts[1];
  const scope = kind + "/" + (id ?? "");
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const [loadedFor, setLoadedFor] = useState("");
  const [session, setSession] = useState<any>(null),
    [items, setItems] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [record, setRecord] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [q, setQ] = useState(""),
    [status, setStatus] = useState("");
  const [editing, setEditing] = useState<any>(null),
    [step, setStep] = useState(0),
    [discard, setDiscard] = useState(false),
    [command, setCommand] = useState(""),
    [reason, setReason] = useState(""),
    [reference, setReference] = useState(""),
    [delivery, setDelivery] = useState<any>(null),
    [revision, setRevision] = useState<any>(null),
    [voiding, setVoiding] = useState("");
  const key = useRef<{ signature: string; key: string } | null>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const dirty = useRef(false);
  dirty.current =
    editing !== null || !!reason || !!reference || !!delivery || !!voiding;
  useDirtyGuard(() => dirty.current);
  const can = (permission: string) =>
    !!session?.permissions.includes(permission);
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      if (currentScope.current !== scope) return;
      const details =
        e instanceof ApiError && Array.isArray(e.payload?.issues)
          ? e.payload.issues
              .slice(0, 10)
              .map((issue: any) =>
                [issue.path, issue.message].filter(Boolean).join(": "),
              )
              .join(" · ")
          : "";
      setError(
        (e instanceof Error ? e.message : "The request failed.") +
          (details ? " " + details : ""),
      );
    } finally {
      if (currentScope.current === scope) setBusy(false);
    }
  }
  async function list(more = false, search = q, state = status) {
    const result = await api(
      base +
        "/" +
        kind +
        "?q=" +
        encodeURIComponent(search) +
        "&status=" +
        encodeURIComponent(state) +
        (more && cursor ? "&after=" + encodeURIComponent(cursor) : ""),
    );
    if (currentScope.current !== scope) return;
    setItems((old) => (more ? [...old, ...result.items] : result.items));
    setCursor(result.nextCursor);
  }
  async function load() {
    const current = await api("/admin/session");
    if (currentScope.current !== scope) return;
    setSession(current);
    if (current.permissions.includes("partnerships.read")) {
      if (id) {
        const detail = await api(base + "/" + kind + "/" + id);
        if (currentScope.current !== scope) return;
        setRecord(detail);
      } else await list(false, "", "");
    }
    if (currentScope.current !== scope) return;
    setLoadedFor(scope);
    setLoaded(true);
  }
  useEffect(() => {
    setLoaded(false);
    setRecord(null);
    setQ("");
    setStatus("");
    setError("");
    setNotice("");
    setEditing(null);
    setStep(0);
    setCommand("");
    setReason("");
    void run(load);
  }, [kind, id]);
  function operation(signature: string) {
    if (key.current?.signature !== signature)
      key.current = { signature, key: crypto.randomUUID() };
    return key.current.key;
  }
  function open(body?: any) {
    setEditing(cleanPartnership(kind, body ?? emptyPartnership(kind)));
    setStep(0);
    setError("");
    key.current = null;
  }
  const change = (patch: any) =>
    setEditing((old: any) => ({ ...old, ...patch }));
  async function save() {
    let payload = cleanPartnership(kind, editing);
    if (payload.lines)
      payload.lines = payload.lines.map((line: any) => ({
        ...line,
        dueAt: line.dueAt || null,
      }));
    if (kind === "services" && payload.pricing !== "fixed")
      payload.unitAmountMinor = null;
    if (kind === "agreements") {
      payload = {
        ...payload,
        startsAt: payload.startsAt || null,
        endsAt: payload.endsAt || null,
        territories: payload.territories
          .map((v: string) => v.trim())
          .filter(Boolean),
        ...(!["licensing", "hybrid"].includes(payload.mode)
          ? { licenseFeeMinor: null }
          : {}),
        ...(!["revenue_share", "hybrid"].includes(payload.mode)
          ? {
              partnerShareBps: null,
              revenueBasis: "",
              deductions: "",
              settlementSchedule: "",
            }
          : {}),
      };
    }
    const result = await api(
      base + "/" + kind + (record ? "/" + record.id : ""),
      record ? "PUT" : "POST",
      payload,
      record?.version,
      record ? undefined : operation(JSON.stringify(payload)),
    );
    setEditing(null);
    dirty.current = false;
    key.current = null;
    setNotice("Saved. No payment, publication or access has been activated.");
    if (record) setRecord(await api(base + "/" + kind + "/" + result.id));
    else navigate("/admin/partnerships/" + kind + "/" + result.id);
  }
  async function execute() {
    const payload = { reason, ...(reference ? { reference } : {}) };
    await api(
      base + "/" + kind + "/" + record.id + "/commands/" + command,
      "POST",
      payload,
      record.version,
      operation(
        JSON.stringify({
          id: record.id,
          version: record.version,
          command,
          ...payload,
        }),
      ),
    );
    setCommand("");
    setReason("");
    setReference("");
    key.current = null;
    setRecord(await api(base + "/" + kind + "/" + record.id));
    setNotice("State updated and audited.");
  }
  const stages =
    kind === "agreements"
      ? ["Partner", "Services", "Relationships", "Terms", "Review"]
      : kind === "offerings"
        ? ["Offering", "Services", "Review"]
        : kind === "services"
          ? ["Benefit", "Pricing & delivery", "Review"]
          : ["Partner identity", "Review"];
  function next(n: number) {
    setStep(n);
    setTimeout(() => heading.current?.focus(), 0);
  }
  return (
    <div
      className="page-pad people-workspace av-workspace pt-workspace"
      aria-busy={busy}
    >
      <header className="people-intro">
        <p className="people-eyebrow">Partnerships · commercial operations</p>
        <h2>Clear commitments. Lasting partnerships.</h2>
        <p>
          Define MGTV’s services, tailor agreements and record fulfillment.
          Customer viewing plans, publication and staff access remain separate.
        </p>
      </header>
      {error && (
        <div role="alert" className="access-error">
          {error}
          <button
            className="btn"
            disabled={busy || !!editing}
            onClick={() => void run(load)}
          >
            Reload saved records
          </button>
        </div>
      )}
      {notice && (
        <p className="people-notice" role="status">
          {notice}
        </p>
      )}
      {!loaded || loadedFor !== scope ? (
        error ? null : (
          <LoadingState
            label="Loading partnership workspace…"
            variant="table"
          />
        )
      ) : !can("partnerships.read") ? (
        <div className="av-panel">
          <MediaIcon name="lock" />
          <h3>Partnership access required</h3>
          <p>
            Explicit partnerships.read and a fresh staff sign-in are required.
          </p>
        </div>
      ) : (
        <>
          <nav className="av-section-nav" aria-label="Partnership sections">
            {sections.map((s) => (
              <Link
                className="btn"
                key={s}
                to={"/admin/partnerships/" + s}
                aria-current={s === kind ? "page" : undefined}
              >
                <MediaIcon
                  name={
                    s === "services"
                      ? "grid"
                      : s === "partners"
                        ? "users"
                        : "review"
                  }
                  size={17}
                />
                {s === "services" ? "Service & benefit catalog" : label(s)}
              </Link>
            ))}
          </nav>
          {!id ? (
            <>
              <form
                className="access-toolbar"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(() => list());
                }}
              >
                <label>
                  Find by name
                  <input
                    className="input"
                    maxLength={120}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </label>
                <label>
                  Status
                  <select
                    className="input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    {(kind === "agreements"
                      ? [
                          "draft",
                          "in_review",
                          "approved",
                          "accepted",
                          "active",
                          "ended",
                        ]
                      : kind === "partners"
                        ? ["active", "inactive"]
                        : kind === "offerings"
                          ? ["draft", "published", "retired"]
                          : ["draft"]
                    ).map((v) => (
                      <option value={v} key={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="btn" disabled={busy}>
                  Apply filters
                </button>
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setQ("");
                    setStatus("");
                    void run(() => list(false, "", ""));
                  }}
                >
                  Reset
                </button>
                {can("partnerships.manage") && (
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={busy}
                    onClick={() => open()}
                  >
                    <MediaIcon name="plus" size={16} />
                    Create{" "}
                    {kind === "services"
                      ? "service"
                      : kind === "partners"
                        ? "partner"
                        : kind === "offerings"
                          ? "offering"
                          : "agreement"}
                  </button>
                )}
              </form>
              <AccessTable
                label={label(kind)}
                rows={items}
                rowKey={(r) => r.id}
                scope="loaded records"
                columns={[
                  {
                    key: "name",
                    label: "Name",
                    render: (r) => (
                      <Identity
                        name={r.body.name}
                        detail={
                          kind === "partners"
                            ? r.body.roles.map(label).join(" · ")
                            : kind === "services"
                              ? r.body.unit
                              : kind === "agreements"
                                ? r.body.partnerSnapshot?.name
                                : r.body.description
                        }
                        icon={kind === "partners" ? "users" : "review"}
                      />
                    ),
                  },
                  {
                    key: "state",
                    label: kind === "services" ? "Readiness" : "Status",
                    render: (r) => (
                      <span
                        className="av-status"
                        data-state={
                          kind === "services" ? r.body.availability : r.status
                        }
                      >
                        {label(
                          kind === "services" ? r.body.availability : r.status,
                        )}
                      </span>
                    ),
                  },
                  {
                    key: "terms",
                    label: "Commercial basis",
                    render: (r) =>
                      kind === "services"
                        ? r.body.pricing === "fixed"
                          ? money(r.body.unitAmountMinor)
                          : label(r.body.pricing)
                        : kind === "agreements"
                          ? label(r.body.mode)
                          : kind === "partners"
                            ? label(r.body.entityType)
                            : r.body.lines.length + " services",
                  },
                  {
                    key: "view",
                    label: "Details",
                    render: (r) => (
                      <Link
                        className="btn av-link"
                        to={"/admin/partnerships/" + kind + "/" + r.id}
                      >
                        View
                        <MediaIcon name="arrow" size={16} />
                      </Link>
                    ),
                  },
                ]}
              />
              {cursor && (
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => void run(() => list(true))}
                >
                  Load more records
                </button>
              )}
            </>
          ) : (
            record && (
              <>
                <Link className="btn" to={"/admin/partnerships/" + kind}>
                  <MediaIcon name="back" size={16} />
                  All {kind}
                </Link>
                <PartnershipDetail
                  record={record}
                  kind={kind}
                  can={can}
                  actorId={session.principal.id}
                  onEdit={() => open(record.body)}
                  onCommand={(action) => {
                    setCommand(action);
                    setReason("");
                    setReference("");
                    key.current = null;
                  }}
                  onVoid={(deliveryId) => {
                    setVoiding(deliveryId);
                    setReason("");
                    key.current = null;
                  }}
                  onDelivery={() =>
                    setDelivery({
                      lineId: record.body.lineSnapshots[0]?.id ?? "",
                      units: 1,
                      evidence: "",
                    })
                  }
                  onRevision={(version) =>
                    void run(async () =>
                      setRevision(
                        await api(
                          base + "/" + kind + "/" + id + "/history/" + version,
                        ),
                      ),
                    )
                  }
                />
              </>
            )
          )}
        </>
      )}
      {editing && (
        <Modal
          title={record ? "Edit " + label(kind) : "Create " + label(kind)}
          side
          width={900}
          onClose={() => {
            if (!busy) setDiscard(true);
          }}
        >
          <form
            className="av-workspace pt-workspace access-stack"
            onSubmit={(e) => {
              e.preventDefault();
              void run(save);
            }}
          >
            <ol className="av-wizard" aria-label="Partnership editor steps">
              {stages.map((name, i) => (
                <li key={name} aria-current={i === step ? "step" : undefined}>
                  <span>{i + 1}</span>
                  {name}
                </li>
              ))}
            </ol>
            <h3 tabIndex={-1} ref={heading}>
              {stages[step]}
            </h3>
            <fieldset className="access-fieldset" disabled={busy}>
              <PartnershipFields
                kind={kind}
                step={step}
                body={editing}
                resolvedSubjects={record?.resolvedSubjects ?? []}
                change={change}
                can={can}
              />
              {error && <p role="alert">{error}</p>}
              <div className="access-actions">
                {step > 0 && (
                  <button
                    className="btn"
                    type="button"
                    onClick={() => next(step - 1)}
                  >
                    Back
                  </button>
                )}
                {step < stages.length - 1 && (
                  <button
                    className="btn"
                    type="button"
                    onClick={() => next(step + 1)}
                  >
                    Continue
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={
                    !editing.name.trim() ||
                    (kind === "agreements" && !editing.partnerId)
                  }
                >
                  Save {record ? "changes" : "draft"}
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
          title="Discard partnership edits?"
          confirmLabel="Discard edits"
          onConfirm={() => {
            setEditing(null);
            setDiscard(false);
            setError("");
          }}
          onCancel={() => setDiscard(false)}
        >
          Unsaved changes will be discarded.
        </ConfirmDialog>
      )}
      {command && (
        <Modal
          title={label(command) + " · reviewed action"}
          onClose={() => {
            if (!busy) {
              setCommand("");
              setReason("");
            }
          }}
        >
          <div className="av-workspace pt-workspace access-stack">
            <p>
              {command === "accept"
                ? "Record an externally accepted agreement reference. This is not an electronic signature or payment verification."
                : command === "activate"
                  ? "Activation checks the agreed term, operational readiness and financial execution boundary."
                  : command === "approve"
                    ? "The saved version will be checked and audited. Agreement approval requires a separate colleague."
                    : "The saved version will be checked and the action audited."}
            </p>
            <label className="pt-field">
              Reason for this action
              <textarea
                className="input"
                maxLength={2000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            {command === "accept" && (
              <label className="pt-field">
                External acceptance reference
                <input
                  className="input"
                  maxLength={1000}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </label>
            )}
            {error && <p role="alert">{error}</p>}
            <button
              className="btn btn-primary"
              disabled={
                busy ||
                reason.trim().length < 5 ||
                (command === "accept" && !reference.trim())
              }
              onClick={() => void run(execute)}
            >
              Confirm {command}
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => {
                setCommand("");
                setReason("");
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {delivery && (
        <Modal
          title="Record manual delivery evidence"
          onClose={() => {
            if (!busy) setDelivery(null);
          }}
        >
          <div className="av-workspace pt-workspace access-stack">
            <label className="pt-field">
              Agreed service
              <select
                className="input"
                value={delivery.lineId}
                onChange={(e) =>
                  setDelivery({ ...delivery, lineId: e.target.value })
                }
              >
                {record.body.lineSnapshots.map((line: any) => (
                  <option key={line.id} value={line.id}>
                    {line.serviceSnapshot.name}
                  </option>
                ))}
              </select>
            </label>
            <PartnershipInput
              body={delivery}
              change={(patch) => setDelivery({ ...delivery, ...patch })}
              k="units"
              name="Delivered units"
              type="integer"
            />
            <PartnershipInput
              body={delivery}
              change={(patch) => setDelivery({ ...delivery, ...patch })}
              k="evidence"
              name="Delivery evidence"
              type="textarea"
            />
            <button
              className="btn btn-primary"
              disabled={busy || delivery.evidence.trim().length < 5}
              onClick={() =>
                void run(async () => {
                  await api(
                    base + "/agreements/" + id + "/deliveries",
                    "POST",
                    delivery,
                    record.version,
                    operation(
                      JSON.stringify({ version: record.version, ...delivery }),
                    ),
                  );
                  setDelivery(null);
                  setRecord(await api(base + "/agreements/" + id));
                })
              }
            >
              Save evidence
            </button>
            {error && <p role="alert">{error}</p>}
          </div>
        </Modal>
      )}
      {voiding && (
        <Modal
          title="Void mistaken delivery evidence"
          onClose={() => {
            if (!busy) {
              setVoiding("");
              setReason("");
            }
          }}
        >
          <div className="access-stack">
            <p>
              The original evidence remains visible. This records an audited
              correction and restores the affected fulfillment quantity; it does
              not issue a refund or alter agreement terms.
            </p>
            <label className="pt-field">
              Reason for correction
              <textarea
                className="input"
                value={reason}
                maxLength={2000}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <button
              className="btn btn-primary"
              disabled={busy || reason.trim().length < 5}
              onClick={() =>
                void run(async () => {
                  await api(
                    base +
                      "/agreements/" +
                      id +
                      "/deliveries/" +
                      voiding +
                      "/void",
                    "POST",
                    { reason },
                    record.version,
                    operation(
                      JSON.stringify({
                        id,
                        voiding,
                        version: record.version,
                        reason,
                      }),
                    ),
                  );
                  setVoiding("");
                  setReason("");
                  setRecord(await api(base + "/agreements/" + id));
                })
              }
            >
              Confirm correction
            </button>
            <button
              className="btn"
              disabled={busy}
              onClick={() => {
                setVoiding("");
                setReason("");
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {revision && (
        <Modal
          title={"Saved revision v" + revision.version}
          side
          width={900}
          onClose={() => setRevision(null)}
        >
          <div className="av-workspace pt-workspace">
            <p>
              {revision.reason} ·{" "}
              {new Date(revision.created_at).toLocaleString()}
            </p>
            <PartnershipDetail
              kind={kind}
              record={{ ...revision, id, history: [] }}
              can={() => false}
              actorId=""
              onEdit={() => {}}
              onCommand={() => {}}
              onDelivery={() => {}}
              onRevision={() => {}}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
