import { useState } from "react";
import PartnershipPicker from "./PartnershipPicker";
import MediaIcon from "./MediaIcon";
import {
  partnerRoles,
  partnershipBase as base,
  subjectPaths,
  emptyLine,
  label,
} from "./partnership-model";
export function PartnershipInput({
  body,
  change,
  k,
  name,
  type = "text",
  options,
  max = 3000,
}: {
  body: any;
  change: (p: any) => void;
  k: string;
  name: string;
  type?: string;
  options?: string[];
  max?: number;
}) {
  const value = body[k],
    money = type === "money" || type === "percent";
  return (
    <label className="pt-field">
      {name}
      {options ? (
        <select
          className="input"
          value={value}
          onChange={(e) => change({ [k]: e.target.value })}
        >
          {options.map((v) => (
            <option value={v} key={v}>
              {label(v)}
            </option>
          ))}
        </select>
      ) : type === "textarea" || type === "list" ? (
        <textarea
          className="input"
          maxLength={max}
          value={type === "list" ? value.join("\n") : value}
          onChange={(e) =>
            change({
              [k]:
                type === "list" ? e.target.value.split("\n") : e.target.value,
            })
          }
        />
      ) : (
        <input
          className="input"
          maxLength={max}
          type={money || type === "integer" ? "number" : type}
          min={money ? 0 : undefined}
          max={type === "percent" ? 100 : money ? 1000000 : undefined}
          step={money ? "0.01" : type === "integer" ? 1 : undefined}
          value={money ? (value === null ? "" : value / 100) : (value ?? "")}
          onChange={(e) =>
            change({
              [k]: money
                ? e.target.value === ""
                  ? null
                  : Math.round(Number(e.target.value) * 100)
                : type === "integer"
                  ? Number(e.target.value)
                  : e.target.value,
            })
          }
        />
      )}
    </label>
  );
}
export default function PartnershipFields({
  kind,
  step,
  body,
  change,
  can,
  resolvedSubjects = [],
}: {
  kind: string;
  step: number;
  body: any;
  change: (p: any) => void;
  can: (p: string) => boolean;
  resolvedSubjects?: Array<{ kind: string; id: string; name: string }>;
}) {
  const [targetKind, setTargetKind] = useState("product"),
    [targetId, setTargetId] = useState(""),
    [relationship, setRelationship] = useState("sells");
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({});
  const [targetName, setTargetName] = useState("");
  const field = (
    k: string,
    name: string,
    type = "text",
    options?: string[],
    max?: number,
  ) => (
    <PartnershipInput
      key={k}
      body={body}
      change={change}
      k={k}
      name={name}
      type={type}
      options={options}
      max={max}
    />
  );
  const roles = (k: string) => (
    <fieldset className="pt-checks">
      <legend>Partner roles</legend>
      {partnerRoles.map((role) => (
        <label key={role}>
          <input
            type="checkbox"
            checked={body[k].includes(role)}
            onChange={(e) =>
              change({
                [k]: e.target.checked
                  ? [...body[k], role]
                  : body[k].filter((r: string) => r !== role),
              })
            }
          />
          {label(role)}
        </label>
      ))}
    </fieldset>
  );
  if (step === 0)
    return (
      <>
        {field("name", "Name", "text", undefined, 180)}
        {kind === "partners" ? (
          <>
            {field("entityType", "Entity type", "text", [
              "organization",
              "individual",
            ])}
            {roles("roles")}
            {field("description", "Description", "textarea")}
            {field("contactEmail", "Contact email", "email", undefined, 254)}
            {field("status", "Partner status", "text", ["active", "inactive"])}
          </>
        ) : kind === "agreements" ? (
          <>
            <PartnershipPicker
              path={base + "/partners"}
              label="partner"
              value={body.partnerId}
              onChange={(id) => change({ partnerId: id })}
            />
            {field("mode", "Commercial arrangement", "text", [
              "partner_pays",
              "licensing",
              "revenue_share",
              "hybrid",
            ])}
            <PartnershipPicker
              path={base + "/offerings"}
              label="published offering (optional)"
              status="published"
              value={body.offeringId ?? ""}
              onChange={(id, item) => {
                if (id && item?.status !== "published") return;
                change({
                  offeringId: id || null,
                  ...(item ? { lines: item.body.lines } : {}),
                });
              }}
            />
            <button
              type="button"
              className="btn"
              onClick={() => change({ offeringId: null })}
            >
              Use bespoke terms
            </button>
            <p className="av-callout">
              <MediaIcon name="review" />
              An offering pre-fills services. Review quantities, prices and
              obligations for this agreement.
            </p>
          </>
        ) : (
          <>
            {field(
              "description",
              kind === "services"
                ? "Benefit delivered to the partner"
                : "Offering description",
              "textarea",
            )}
            {roles("eligibleRoles")}
            {kind === "services" && (
              <>
                {field("key", "Stable service key", "text", undefined, 80)}
                {field(
                  "unit",
                  "Unit (title, episode, placement, report…)",
                  "text",
                  undefined,
                  80,
                )}
              </>
            )}
          </>
        )}
      </>
    );
  if ((kind === "agreements" || kind === "offerings") && step === 1)
    return (
      <>
        <p className="av-callout">
          <MediaIcon name="review" />
          Save to calculate the authoritative JMD quote. Blank prices use
          catalog pricing or remain unresolved. One-time services must have one
          charging period.
        </p>
        {body.lines.map((line: any, i: number) => {
          const set = (p: any) =>
            change({
              lines: body.lines.map((l: any, j: number) =>
                i === j ? { ...l, ...p } : l,
              ),
            });
          return (
            <fieldset className="pt-line" key={i}>
              <legend>Service {i + 1}</legend>
              <PartnershipPicker
                path={base + "/services"}
                label="service"
                value={line.serviceId}
                onChange={(id) => set({ serviceId: id })}
              />
              <div className="pt-form-grid">
                {[
                  ["quantity", "Quantity", "integer"],
                  ["periods", "Charging periods", "integer"],
                  ["unitAmountMinor", "Agreed unit price (JMD)", "money"],
                ].map(([k, name, type]) => (
                  <PartnershipInput
                    key={k}
                    k={k}
                    name={name}
                    type={type}
                    body={line}
                    change={set}
                  />
                ))}
              </div>
              <PartnershipInput
                k="dueAt"
                name="Delivery deadline (ISO date with timezone)"
                body={line}
                change={(p) => set({ ...p, dueAt: p.dueAt || null })}
              />
              <PartnershipInput
                k="scope"
                name="Exact scope, quantity basis and delivery limits"
                type="textarea"
                body={line}
                change={set}
              />
              <PartnershipInput
                k="overrideReason"
                name="Reason for a fixed-price override"
                body={line}
                change={set}
                max={1000}
              />
              <button
                className="btn"
                type="button"
                onClick={() =>
                  change({
                    lines: body.lines.filter((_: any, j: number) => j !== i),
                  })
                }
              >
                <MediaIcon name="trash" size={16} />
                Remove service
              </button>
            </fieldset>
          );
        })}
        <button
          className="btn"
          type="button"
          disabled={body.lines.length >= 50}
          onClick={() => change({ lines: [...body.lines, emptyLine()] })}
        >
          <MediaIcon name="plus" size={16} />
          Add service
        </button>
      </>
    );
  if (kind === "services" && step === 1)
    return (
      <>
        {field("pricing", "Pricing method", "text", [
          "negotiated",
          "fixed",
          "included",
        ])}
        {body.pricing === "fixed" &&
          field("unitAmountMinor", "Fixed catalog unit price (JMD)", "money")}
        {field("cadence", "Charging cadence", "text", [
          "once",
          "calendar_month",
        ])}
        <label className="pt-field">
          Operational availability
          <select
            className="input"
            value={body.availability}
            onChange={(e) => change({ availability: e.target.value })}
          >
            {["planned", "implemented", "verified", "unavailable"].map((v) => (
              <option
                value={v}
                key={v}
                disabled={v === "verified" && !can("partnerships.approve")}
              >
                {label(v)}
              </option>
            ))}
          </select>
        </label>
        <p className="av-callout">
          <MediaIcon name="lock" />
          Manual fulfillment only. Verification requires explicit approval
          permission and evidence. Automatic service adapters are not connected.
        </p>
        {field(
          "evidenceRequirement",
          "Evidence required to demonstrate delivery",
          "textarea",
        )}
        {field(
          "verificationReference",
          "Operational verification reference",
          "text",
          undefined,
          1000,
        )}
        {field("exclusions", "Exclusions and service limits", "textarea")}
        <PartnershipPicker
          path={base + "/services"}
          label="required service"
          value=""
          onChange={(id) => {
            if (id && !body.dependencies.includes(id))
              change({ dependencies: [...body.dependencies, id] });
          }}
        />
        {body.dependencies.map((id: string) => (
          <div className="pt-subject" key={id}>
            <span>{id}</span>
            <button
              className="btn"
              type="button"
              onClick={() =>
                change({
                  dependencies: body.dependencies.filter(
                    (v: string) => v !== id,
                  ),
                })
              }
            >
              Remove dependency
            </button>
          </div>
        ))}
      </>
    );
  if (kind === "agreements" && step === 2)
    return (
      <>
        <label className="pt-field">
          Entity type
          <select
            className="input"
            value={targetKind}
            onChange={(e) => {
              setTargetKind(e.target.value);
              setTargetId("");
            }}
          >
            {Object.entries(subjectPaths).map(([key, s]) => (
              <option key={key} value={key} disabled={!can(s.permission)}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="pt-field">
          Relationship
          <select
            className="input"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
          >
            {[
              "distributes",
              "sells",
              "promotes",
              "sponsors",
              "represents",
              "fulfills",
            ].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        {can(subjectPaths[targetKind].permission) ? (
          <PartnershipPicker
            path={base + "/targets/" + targetKind}
            label={subjectPaths[targetKind].name}
            value={targetId}
            onChange={(id, item) => {
              setTargetId(id);
              setTargetName(item?.name ?? "");
            }}
          />
        ) : (
          <p>Entity read permission is required.</p>
        )}
        <button
          className="btn"
          type="button"
          disabled={!targetId || body.subjects.length >= 100}
          onClick={() => {
            if (
              !body.subjects.some(
                (s: any) =>
                  s.kind === targetKind &&
                  s.id === targetId &&
                  s.relationship === relationship,
              )
            )
              change({
                subjects: [
                  ...body.subjects,
                  { kind: targetKind, id: targetId, relationship },
                ],
              });
            setSubjectNames((old) => ({
              ...old,
              [targetKind + ":" + targetId]: targetName,
            }));
            setTargetId("");
          }}
        >
          Link entity
        </button>
        {body.subjects.map((s: any, i: number) => (
          <div className="pt-subject" key={s.kind + s.id + s.relationship}>
            <MediaIcon name="link" size={16} />
            <span>
              {label(s.relationship)} · {subjectPaths[s.kind].name} ·{" "}
              {subjectNames[s.kind + ":" + s.id] ||
                resolvedSubjects.find((r) => r.kind === s.kind && r.id === s.id)
                  ?.name ||
                "Linked record (name unavailable)"}
            </span>
            <button
              className="btn"
              type="button"
              onClick={() =>
                change({
                  subjects: body.subjects.filter(
                    (_: any, j: number) => i !== j,
                  ),
                })
              }
            >
              Remove
            </button>
          </div>
        ))}
      </>
    );
  if (kind === "agreements" && step === 3)
    return (
      <>
        {field("startsAt", "Starts at (ISO date with timezone)")}
        {field("endsAt", "Ends at (ISO date with timezone)")}
        {field("territories", "Territories (one per line)", "list")}
        {field(
          "rightsTerms",
          "Rights, exclusivity and availability",
          "textarea",
          undefined,
          6000,
        )}
        {field(
          "partnerResponsibilities",
          "Partner responsibilities",
          "textarea",
          undefined,
          6000,
        )}
        {field(
          "mgtvResponsibilities",
          "MGTV responsibilities",
          "textarea",
          undefined,
          6000,
        )}
        {field("taxTreatment", "Tax treatment", "text", [
          "pending",
          "inclusive",
          "exclusive",
          "not_applicable",
        ])}
        {field("taxMinor", "Tax component (JMD; blank = pending)", "money")}
        {["licensing", "hybrid"].includes(body.mode) &&
          field("licenseFeeMinor", "MGTV licensing obligation (JMD)", "money")}
        {["revenue_share", "hybrid"].includes(body.mode) && (
          <>
            {field("partnerShareBps", "Partner revenue share (%)", "percent")}
            {field(
              "revenueBasis",
              "Attributable revenue and calculation basis",
              "textarea",
            )}
            {field(
              "deductions",
              "Allowed deductions, fees and refunds",
              "textarea",
            )}
            {field(
              "settlementSchedule",
              "Settlement schedule and review process",
              "textarea",
            )}
          </>
        )}
        {
          <p className="av-callout">
            <MediaIcon name="lock" />
            Financial execution is not connected. An accepted agreement does not
            verify collection, licensing payment or a revenue-share payout.
          </p>
        }
      </>
    );
  return (
    <div className="av-review">
      <h3>{body.name || "Unnamed draft"}</h3>
      <p>
        {body.description ||
          body.mgtvResponsibilities ||
          "Review the selected identity and terms."}
      </p>
      {body.lines && (
        <p>
          {body.lines.length} services · {body.subjects?.length ?? 0} entity
          relationships
        </p>
      )}
      <p>
        {kind === "agreements" || kind === "offerings"
          ? "Save to review the authoritative quote, catalog snapshots and complete readiness checks."
          : kind === "services"
            ? "Review the benefit, eligible partner roles, pricing and delivery evidence before saving this service version."
            : "Review the partner identity, contact details and commercial roles before saving."}
      </p>
      <p className="av-callout">
        <MediaIcon name="lock" />
        Saving does not take payment, publish content, activate an agreement or
        grant staff/customer access.
      </p>
    </div>
  );
}
