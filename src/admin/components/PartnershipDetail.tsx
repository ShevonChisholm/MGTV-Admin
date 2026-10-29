import { Link } from "../router";
import { Identity } from "./AccessVisual";
import MediaIcon from "./MediaIcon";
import { money, label, subjectPaths } from "./partnership-model";
export default function PartnershipDetail({
  record,
  kind,
  can,
  actorId,
  onEdit,
  onCommand,
  onDelivery,
  onVoid,
  onRevision,
}: {
  record: any;
  kind: string;
  can: (p: string) => boolean;
  actorId: string;
  onEdit: () => void;
  onCommand: (a: string) => void;
  onDelivery: () => void;
  onVoid?: (id: string) => void;
  onRevision: (version: number) => void;
}) {
  const b = record.body,
    actions =
      kind === "offerings"
        ? record.status === "draft"
          ? ["publish"]
          : record.status === "published"
            ? ["retire"]
            : []
        : kind === "agreements"
          ? ((
              {
                draft: ["submit"],
                in_review: ["return", "approve"],
                approved: ["accept"],
                accepted: ["activate"],
                active: ["end"],
              } as Record<string, string[]>
            )[record.status] ?? [])
          : [];
  const fieldNames: Record<string, string> = {
    entityType: "Entity type",
    roles: "Partner roles",
    contactEmail: "Private contact email",
    description: "Description",
    key: "Stable service key",
    unit: "Unit",
    eligibleRoles: "Eligible partner roles",
    pricing: "Pricing method",
    cadence: "Charging cadence",
    availability: "Operational availability",
    fulfillment: "Fulfillment method",
    evidenceRequirement: "Delivery evidence required",
    verificationReference: "Operational verification",
    exclusions: "Exclusions",
    startsAt: "Availability starts",
    endsAt: "Availability ends",
    territories: "Territories",
    rightsTerms: "Rights and exclusivity",
    partnerResponsibilities: "Partner responsibilities",
    mgtvResponsibilities: "MGTV responsibilities",
    revenueBasis: "Attributable revenue basis",
    deductions: "Allowed deductions",
    settlementSchedule: "Settlement schedule",
  };
  return (
    <>
      <div className="av-journey-hero">
        <span className="av-icon">
          <MediaIcon
            name={kind === "partners" ? "users" : "review"}
            size={28}
          />
        </span>
        <div>
          <p className="people-eyebrow">
            {label(kind)} · Version {record.version}
          </p>
          <h2>{b.name}</h2>
          <p>{b.partnerSnapshot?.name ?? b.description ?? ""}</p>
        </div>
        <span className="av-status" data-state={record.status}>
          {label(record.effectiveStatus ?? record.status)}
        </span>
      </div>
      <div className="access-actions">
        {can("partnerships.manage") &&
          ((kind === "agreements" && record.status === "draft") ||
            (kind === "offerings" && record.status !== "retired") ||
            ["services", "partners"].includes(kind)) && (
            <button className="btn" onClick={onEdit}>
              <MediaIcon name="edit" size={16} />
              {kind === "offerings" && record.status === "published"
                ? "Edit as new draft version"
                : "Edit record"}
            </button>
          )}
        {actions.map((action) => (
          <button
            key={action}
            className="btn"
            disabled={
              !can(
                action === "submit"
                  ? "partnerships.manage"
                  : ["activate", "end"].includes(action)
                    ? "partnerships.activate"
                    : "partnerships.approve",
              ) ||
              (action === "approve" &&
                [record.created_by, record.edited_by].includes(actorId))
            }
            onClick={() => onCommand(action)}
          >
            {label(action)}
          </button>
        ))}
      </div>
      {kind === "agreements" && (
        <div className="av-callout">
          <MediaIcon name="lock" />
          Acceptance records externally agreed terms. It does not verify
          payment, publish content or grant access. Partner financial execution
          is not connected.
        </div>
      )}
      <div className="av-panel">
        <h3>
          <MediaIcon name="file" />
          Saved definition
        </h3>
        <dl className="pt-facts">
          {Object.entries(fieldNames)
            .filter(([key]) => key in b)
            .map(([key, name]) => (
              <div key={key}>
                <dt>{name}</dt>
                <dd>
                  {Array.isArray(b[key])
                    ? b[key].map(label).join(" · ") || "Not agreed"
                    : b[key] === null || b[key] === ""
                      ? "Not agreed"
                      : String(b[key])}
                </dd>
              </div>
            ))}
        </dl>
        {b.partnerSnapshot && (
          <Link
            className="btn"
            to={"/admin/partnerships/partners/" + b.partnerId}
          >
            {b.partnerSnapshot.name} · identity snapshot v
            {b.partnerSnapshot.version}
          </Link>
        )}
        {b.offeringSnapshot && (
          <p>
            Offering: {b.offeringSnapshot.body.name} · snapshot v
            {b.offeringSnapshot.version}
          </p>
        )}
        {record.accepted_reference && (
          <p>External acceptance reference: {record.accepted_reference}</p>
        )}
        {b.dependencies?.map((id: string) => (
          <Link
            className="btn"
            key={id}
            to={"/admin/partnerships/services/" + id}
          >
            View required service
          </Link>
        ))}
      </div>
      {kind === "services" && (
        <div className="av-panel">
          <h3>
            <MediaIcon name="brand" />
            Catalog pricing
          </h3>
          <p>
            {b.pricing === "fixed"
              ? money(b.unitAmountMinor)
              : label(b.pricing)}{" "}
            · {label(b.cadence)}
          </p>
        </div>
      )}
      {b.lineSnapshots && (
        <section className="av-panel">
          <h3>
            <MediaIcon name="brand" />
            Scope & authoritative quote
          </h3>
          <div className="pt-totals">
            <div>
              <small>Incoming subtotal</small>
              <strong>{money(b.subtotalMinor)}</strong>
            </div>
            {kind === "agreements" && (
              <>
                <div>
                  <small>Tax · {label(b.taxTreatment)}</small>
                  <strong>{money(b.taxMinor)}</strong>
                </div>
                <div>
                  <small>Incoming total</small>
                  <strong>{money(b.totalMinor)}</strong>
                </div>
                <div>
                  <small>MGTV licensing obligation</small>
                  <strong>{money(b.licenseFeeMinor)}</strong>
                </div>
                <div>
                  <small>Partner revenue share</small>
                  <strong>
                    {b.partnerShareBps === null
                      ? "Not agreed / applicable"
                      : b.partnerShareBps / 100 + "%"}
                  </strong>
                </div>
              </>
            )}
          </div>
          {b.lineSnapshots.map((line: any) => (
            <article className="pt-saved-line" key={line.id}>
              <Identity
                name={line.serviceSnapshot.name}
                detail={
                  "Catalog v" +
                  line.serviceVersion +
                  " · " +
                  line.quantity +
                  " × " +
                  line.periods +
                  " periods"
                }
                icon="review"
              />
              <p>
                {money(line.unitAmountMinor)} per unit · Line total:{" "}
                <strong>{money(line.totalMinor)}</strong>
              </p>
              <p>
                <strong>Partner benefit: </strong>
                {line.serviceSnapshot.description}
              </p>
              <p>{line.scope || "Scope pending"}</p>
              <small>Due: {line.dueAt ?? "Not agreed"}</small>
              <p>Evidence: {line.serviceSnapshot.evidenceRequirement}</p>
              <p>
                Exclusions: {line.serviceSnapshot.exclusions || "Not specified"}
              </p>
            </article>
          ))}
        </section>
      )}
      {b.subjects && (
        <section className="av-panel">
          <h3>
            <MediaIcon name="link" />
            Covered content & products
          </h3>
          {!b.subjects.length && <p>No entities linked yet.</p>}
          {b.subjects.map((s: any) => (
            <div className="pt-subject" key={s.kind + s.id + s.relationship}>
              <MediaIcon name="link" size={16} />
              <span>
                {label(s.relationship)} · {subjectPaths[s.kind].name}
              </span>
              {record.resolvedSubjects?.some(
                (r: any) => r.kind === s.kind && r.id === s.id,
              ) ? (
                <Link
                  className="btn av-link"
                  to={
                    record.resolvedSubjects.find(
                      (r: any) => r.kind === s.kind && r.id === s.id,
                    ).adminPath
                  }
                >
                  {
                    record.resolvedSubjects.find(
                      (r: any) => r.kind === s.kind && r.id === s.id,
                    ).name
                  }
                </Link>
              ) : (
                <small>Entity read permission required</small>
              )}
            </div>
          ))}
        </section>
      )}
      {record.readiness && (
        <details className="av-panel">
          <summary>Review & activation readiness</summary>
          {["reviewBlockers", "activationBlockers"].map((key) => (
            <div key={key}>
              <h4>
                {key === "reviewBlockers"
                  ? "Review blockers"
                  : "Activation blockers"}
              </h4>
              <ul>
                {record.readiness[key].map((message: string) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
              {!record.readiness[key].length && <p>No blockers returned.</p>}
            </div>
          ))}
        </details>
      )}
      {kind === "agreements" && (
        <section className="av-panel">
          <h3>
            <MediaIcon name="check" />
            Fulfillment evidence
          </h3>
          <p>
            Manual evidence records; no automated placements or financial
            execution implied.
          </p>
          {record.deliveries?.map((d: any) => (
            <article className="pt-saved-line" key={d.id}>
              <strong>
                {d.units} units ·{" "}
                {
                  b.lineSnapshots.find((l: any) => l.id === d.line_id)
                    ?.serviceSnapshot.name
                }
              </strong>
              <p>{d.evidence}</p>
              {d.voided_at ? (
                <p>
                  Voided: {d.void_reason} ·{" "}
                  {new Date(d.voided_at).toLocaleString()}
                </p>
              ) : (
                can("partnerships.manage") &&
                onVoid && (
                  <button className="btn" onClick={() => onVoid(d.id)}>
                    Void mistaken evidence
                  </button>
                )
              )}
              <small>{new Date(d.created_at).toLocaleString()}</small>
            </article>
          ))}
          {!record.deliveries?.length && <p>No evidence recorded.</p>}
          {record.status === "active" && can("partnerships.manage") && (
            <button className="btn" onClick={onDelivery}>
              Record delivery
            </button>
          )}
        </section>
      )}
      <details className="av-panel">
        <summary>Immutable history · latest 100 revisions</summary>
        <ol className="access-history">
          {record.history?.map((h: any) => (
            <li key={h.version}>
              <strong>
                v{h.version} · {label(h.status)}
              </strong>
              <p>{h.reason}</p>
              <small>{new Date(h.created_at).toLocaleString()}</small>
              <button className="btn" onClick={() => onRevision(h.version)}>
                View revision
              </button>
            </li>
          ))}
        </ol>
      </details>
    </>
  );
}
