import { useDirtyGuard } from "../router";
import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../ui";
import MediaIcon from "./MediaIcon";
import LoadingState, { ErrorState } from "./LoadingState";
export default function LifecycleSettings({
  kind,
  id,
  revisionId,
  canPublish,
}: {
  kind: string;
  id: string;
  revisionId?: string | null;
  canPublish: boolean;
}) {
  const [data, setData] = useState<any>(null),
    [teaser, setTeaser] = useState(false),
    [finale, setFinale] = useState(false),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [retry, setRetry] = useState(0);
  useDirtyGuard(
    () =>
      !!data &&
      (teaser !== data.teaserApproved ||
        finale !== data.seasonFinale ||
        !!reason.trim()),
  );
  const path = `/admin/content-lifecycle/${kind}/${id}`;
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    void api(path)
      .then((r) => {
        if (active) {
          setData(r);
          setTeaser(r.teaserApproved);
          setFinale(r.seasonFinale);
          setReason("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [path, revisionId, retry]);
  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await api(
        path,
        "PATCH",
        {
          teaserApproved: teaser,
          seasonFinale: finale,
          revisionId: data.revisionId,
          reason,
        },
        data.version,
      );
      setData(r);
      setReason("");
      setNotice("Lifecycle settings saved for the published revision.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settings could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Lifecycle & first looks">
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        New Releases uses 30 days after first availability; Leaving Soon uses
        the last 14 days. These settings apply to the current published revision
        and never publish a draft or unlock playback.
      </p>
      {!data && !error ? (
        <LoadingState label="Loading lifecycle settings…" variant="inline" />
      ) : null}
      {error && (
        <ErrorState message={error} onRetry={() => setRetry((v) => v + 1)} />
      )}
      {data && (
        <div style={{ display: "grid", gap: 12 }}>
          {kind !== "event" && (
            <label>
              <input
                type="checkbox"
                checked={teaser}
                disabled={busy || !canPublish || !data.revisionId}
                onChange={(e) => setTeaser(e.target.checked)}
              />{" "}
              Approve the published title, synopsis and artwork for a
              pre-release first look. I confirm they may be shown before
              full-content availability.
            </label>
          )}
          {kind === "episode" && (
            <label>
              <input
                type="checkbox"
                checked={finale}
                disabled={busy || !canPublish || !data.revisionId}
                onChange={(e) => setFinale(e.target.checked)}
              />{" "}
              This published episode is the season finale
            </label>
          )}
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Coming Soon shows approved first looks up to 30 days ahead. Future
            drafts and scheduled, unpublished revisions stay private. Republish
            changes require a new review of these markers.
          </p>
          <label>
            Reason
            <input
              className="input"
              value={reason}
              maxLength={1000}
              disabled={busy || !canPublish}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn"
            disabled={busy || !canPublish || !data.revisionId || !reason.trim()}
            onClick={() => void save()}
          >
            Save lifecycle settings
          </button>
          {!data.revisionId && (
            <small>
              Publish a reviewed revision before approving its public first
              look.
            </small>
          )}
          {!canPublish && (
            <small>
              Your explicit publication permission is required to change these
              settings.
            </small>
          )}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
    </Card>
  );
}
export function LifecycleAutomation() {
  const [data, setData] = useState<any>(null),
    [enabled, setEnabled] = useState(false),
    [localEmail, setLocalEmail] = useState(false),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [revision, setRevision] = useState(0),
    [canManage, setCanManage] = useState(false);
  useDirtyGuard(
    () =>
      !!data &&
      (enabled !== data.enabled ||
        localEmail !== data.local_email ||
        !!reason.trim()),
  );
  useEffect(() => {
    let active = true;
    void Promise.all([
      api("/admin/notifications/lifecycle"),
      api("/admin/session"),
    ])
      .then(([r, s]) => {
        if (active) {
          setData(r);
          setEnabled(r.enabled);
          setLocalEmail(r.local_email);
          setCanManage(
            [
              "notifications.read",
              "notifications.manage",
              "notifications.send",
            ].every((p) => s.permissions.includes(p)),
          );
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  return (
    <Card title="Lifecycle notifications">
      <div className="nt-lifecycle-moments">
        {[
          { icon: "film", label: "Fresh releases" },
          { icon: "series", label: "New episodes & finales" },
          { icon: "clock", label: "Coming & leaving soon" },
          { icon: "calendar", label: "Event first looks" },
        ].map((x) => (
          <span key={x.label}>
            <MediaIcon name={x.icon} size={18} />
            {x.label}
          </span>
        ))}
      </div>
      <details className="nt-lifecycle-policy">
        <summary>How eligibility and first looks work</summary>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Fresh releases, approved first looks, leaving-soon titles, new
          episodes, explicit finales and upcoming events use real content
          records. Each milestone is recorded once; profile access, active
          profile allowance and preferences are checked before delivery. Old
          milestones are not backfilled. Gold gets event first looks at 32 days,
          48 hours ahead of the standard 30-day window; a delivery claim
          prevents a repeat general notice.
        </p>
      </details>
      {error && (
        <ErrorState message={error} onRetry={() => setRevision((v) => v + 1)} />
      )}{" "}
      {!data && !error ? (
        <LoadingState label="Loading lifecycle automation…" variant="inline" />
      ) : null}
      {data && (
        <div style={{ display: "grid", gap: 12 }}>
          <label className="nt-lifecycle-option">
            <input
              type="checkbox"
              checked={enabled}
              disabled={busy || !canManage}
              onChange={(e) => setEnabled(e.target.checked)}
            />{" "}
            Automatically deliver lifecycle notices in-app
          </label>
          <label className="nt-lifecycle-option">
            <input
              type="checkbox"
              checked={localEmail}
              disabled={busy || !canManage}
              onChange={(e) => setLocalEmail(e.target.checked)}
            />{" "}
            Also write opted-in main adult profile email to the private local
            inbox
          </label>
          <small>
            No external email or browser push. Pausing automation does not
            retract already delivered messages; pending delivery rechecks
            eligibility.
          </small>
          <label>
            Reason
            <input
              className="input"
              maxLength={1000}
              value={reason}
              disabled={busy || !canManage}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn"
            disabled={busy || !canManage || !reason.trim()}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await api(
                  "/admin/notifications/lifecycle",
                  "PATCH",
                  { enabled, localEmail, reason },
                  data.version,
                );
                setReason("");
                setRevision((v) => v + 1);
                setNotice("Lifecycle automation settings saved.");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Unable to save.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Save automation settings
          </button>
          {data.metrics?.length ? (
            <div
              className="nt-lifecycle-metrics"
              aria-label="Recorded lifecycle milestones"
            >
              {data.metrics.map((m: any) => (
                <div key={m.milestone}>
                  <MediaIcon
                    name={
                      m.milestone.includes("event")
                        ? "calendar"
                        : m.milestone.includes("episode") ||
                            m.milestone.includes("finale")
                          ? "series"
                          : "bell"
                    }
                    size={22}
                  />
                  <h4>{m.milestone.replace(/-/g, " ")}</h4>
                  <strong>{m.messages}</strong>
                  <span>messages · {m.milestones} recorded milestones</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="nt-footnote">No lifecycle milestones recorded yet.</p>
          )}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
    </Card>
  );
}
