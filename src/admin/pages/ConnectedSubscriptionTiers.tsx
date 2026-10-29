import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useDirtyGuard, Link } from "../router";
import { Modal, ConfirmDialog } from "../ui";
import AccessTable, { Identity } from "../components/AccessVisual";
import MediaIcon from "../components/MediaIcon";
import LoadingState from "../components/LoadingState";
import { money } from "../components/partnership-model";
import "../components/Partnerships.css";
export default function ConnectedSubscriptionTiers() {
  const [session, setSession] = useState<any>(null),
    [tiers, setTiers] = useState<any[]>([]),
    [billing, setBilling] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [editing, setEditing] = useState<any>(null),
    [discard, setDiscard] = useState(false),
    [notice, setNotice] = useState("");
  const [review, setReview] = useState(false),
    [reason, setReason] = useState("");
  useEffect(() => {
    setReview(false);
    setReason("");
  }, [editing?.id]);
  useDirtyGuard(() => !!editing);
  async function load() {
    const [staff, plans, prices] = await Promise.all([
      api("/admin/session"),
      api("/catalog/subscription-tiers"),
      api("/catalog/subscription-billing"),
    ]);
    setSession(staff);
    setTiers(plans.sort((a: any, b: any) => a.maxProfiles - b.maxProfiles));
    setBilling(prices);
    setLoaded(true);
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Plans could not be loaded.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void run(load);
  }, []);
  const policy = (t: any) => ({
    name: t.name,
    maxProfiles: t.maxProfiles,
    maxVideoHeight: t.maxVideoHeight,
    adPolicy: t.adPolicy,
    earlyEventNotices: t.earlyEventNotices,
  });
  return (
    <div
      className="page-pad people-workspace av-workspace pt-workspace"
      aria-busy={busy}
    >
      <header className="people-intro">
        <p className="people-eyebrow">MGTV+ · customer viewing plans</p>
        <h2>A clear benefit. In every plan.</h2>
        <p>
          Compare the current catalog policies. Purchases and checkout attempts
          preserve their own benefit snapshots; later plan edits apply to future
          purchases.
        </p>
      </header>
      {error && (
        <div role="alert" className="access-error">
          {error}
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
        <p className="people-notice" role="status">
          {notice}
        </p>
      )}
      {!loaded && !error ? (
        <LoadingState
          label="Loading plans and sandbox prices…"
          variant="table"
        />
      ) : (
        <>
          <div className="av-callout pt-plan-notice">
            <MediaIcon name="lock" />
            <span>
              Customer membership remains provider-managed. Staff can define
              eligible benefits but cannot grant paid access. Partner services
              and commercial agreements are managed separately.
            </span>
            <Link className="btn" to="/admin/partnerships">
              Partnerships
            </Link>
          </div>
          <AccessTable
            label="Customer plan comparison"
            rows={tiers}
            rowKey={(t) => t.id}
            scope="configured plans"
            columns={[
              {
                key: "plan",
                label: "Plan",
                render: (t) => (
                  <Identity
                    name={t.name}
                    detail={t.code + " · catalog v" + t.version}
                    icon="brand"
                  />
                ),
              },
              {
                key: "price",
                label: "Monthly sandbox total",
                render: (t) =>
                  money(
                    billing?.items.find((p: any) => p.code === t.code)
                      ?.amountMinor,
                  ),
              },
              {
                key: "profiles",
                label: "Profiles",
                render: (t) => <strong>{t.maxProfiles}</strong>,
              },
              {
                key: "quality",
                label: "Video ceiling",
                render: (t) => (
                  <span>
                    {t.maxVideoHeight === 2160 ? "4K" : t.maxVideoHeight + "p"}
                    <small>Where available</small>
                  </span>
                ),
              },
              {
                key: "ads",
                label: "Advertising",
                render: (t) =>
                  t.adPolicy === "none"
                    ? "No campaign ads"
                    : t.adPolicy === "reduced"
                      ? "Reduced ads"
                      : "Standard ads",
              },
              {
                key: "events",
                label: "Event notices",
                render: (t) =>
                  t.earlyEventNotices ? "Early notices" : "Standard notices",
              },
              {
                key: "manage",
                label: "Policy",
                render: (t) => (
                  <button
                    className="btn av-link"
                    disabled={
                      !session?.permissions.includes("subscriptions.manage")
                    }
                    onClick={() =>
                      setEditing({
                        ...policy(t),
                        id: t.id,
                        version: t.version,
                        original: policy(t),
                      })
                    }
                  >
                    Edit benefits
                  </button>
                ),
              },
            ]}
          />
          <div className="pt-form-grid">
            <section className="av-panel">
              <h3>
                <MediaIcon name="review" />
                Access and exclusions
              </h3>
              <p>
                Premium eligibility is configured per content item; higher tiers
                do not automatically inherit every licensed title. Age
                classification, selected profile, rights windows and available
                media remain enforced.
              </p>
              <p>
                Profiles are identities, not a promise of the same number of
                simultaneous streams. A separate concurrent-stream policy must
                be defined and enforced before it is advertised.
              </p>
            </section>
            <section className="av-panel">
              <h3>
                <MediaIcon name="calendar" />
                Term and renewal
              </h3>
              <p>
                One calendar month per verified payment. Renewals are
                customer-initiated and preserve remaining same-tier paid time.
                Tier changes wait until existing paid access ends.
              </p>
              <p>
                Billing mode:{" "}
                {billing?.enabled
                  ? "Stripe sandbox enabled"
                  : "Checkout disabled in this environment"}
                . Prices shown are configured sandbox totals in JMD. Live tax
                and commercial approval remain pending.
              </p>
            </section>
            <section className="av-panel">
              <h3>
                <MediaIcon name="users" />
                Without a subscription
              </h3>
              <p>
                One profile and access to eligible free content. Published
                previews remain available under their own access rules. Expired
                or revoked membership does not unlock premium access.
              </p>
            </section>
            <section className="av-panel">
              <h3>
                <MediaIcon name="lock" />
                Safe package configuration
              </h3>
              <p>
                Policy edits require subscriptions.manage and the saved catalog
                version. Existing memberships keep captured benefits. Sandbox
                prices remain provider-configured; this editor cannot silently
                change charges or activate membership.
              </p>
              <p>
                Artwork services, downloads, ticket discounts and other benefits
                are not included unless they are explicitly implemented and
                agreed.
              </p>
            </section>
          </div>
        </>
      )}
      {editing && (
        <Modal
          title={"Edit future benefits · " + editing.name}
          side
          width={680}
          onClose={() => {
            if (!busy) setDiscard(true);
          }}
        >
          {!review ? (
            <form
              className="av-workspace pt-workspace access-stack"
              onSubmit={(e) => {
                e.preventDefault();
                setReview(true);
              }}
            >
              <p className="av-callout">
                <MediaIcon name="lock" />
                Review future-purchase benefits. Existing paid periods and
                pending checkouts retain their captured policy.
              </p>
              <fieldset className="access-fieldset" disabled={busy}>
                <label className="pt-field">
                  Plan name
                  <input
                    className="input"
                    required
                    maxLength={100}
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                  />
                </label>
                <label className="pt-field">
                  Maximum profiles
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={5}
                    step={1}
                    value={editing.maxProfiles}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        maxProfiles: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label className="pt-field">
                  Maximum video quality
                  <select
                    className="input"
                    value={editing.maxVideoHeight}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        maxVideoHeight: Number(e.target.value),
                      })
                    }
                  >
                    {[720, 1080, 2160].map((n) => (
                      <option key={n} value={n}>
                        {n === 2160 ? "4K" : n + "p"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="pt-field">
                  Ad policy
                  <select
                    className="input"
                    value={editing.adPolicy}
                    onChange={(e) =>
                      setEditing({ ...editing, adPolicy: e.target.value })
                    }
                  >
                    <option value="standard">Standard</option>
                    <option value="reduced">Reduced</option>
                    <option value="none">No campaign ads</option>
                  </select>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editing.earlyEventNotices}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        earlyEventNotices: e.target.checked,
                      })
                    }
                  />{" "}
                  Early event notices
                </label>
                {error && <p role="alert">{error}</p>}
                <button
                  className="btn btn-primary"
                  disabled={
                    !editing.name.trim() ||
                    JSON.stringify(policy(editing)) ===
                      JSON.stringify(editing.original)
                  }
                >
                  Review future benefits
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setDiscard(true)}
                >
                  Cancel
                </button>
              </fieldset>
            </form>
          ) : (
            <div className="av-workspace pt-workspace access-stack">
              <h3>Review future-purchase benefits</h3>
              <p>
                Catalog v{editing.version} will be checked. Existing paid
                periods and pending checkouts retain their snapshots.
              </p>
              <dl className="pt-facts">
                {Object.entries(policy(editing)).map(([key, value]) => (
                  <div key={key}>
                    <dt>
                      {
                        {
                          name: "Plan name",
                          maxProfiles: "Profiles",
                          maxVideoHeight: "Video ceiling",
                          adPolicy: "Ad policy",
                          earlyEventNotices: "Early event notices",
                        }[key]
                      }
                    </dt>
                    <dd>
                      {String(editing.original[key])} →{" "}
                      <strong>{String(value)}</strong>
                    </dd>
                  </div>
                ))}
              </dl>
              <label className="pt-field">
                Reason for this policy change
                <textarea
                  className="input"
                  maxLength={2000}
                  value={reason}
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
                      "/admin/subscription-tiers/" + editing.id,
                      "PATCH",
                      { ...policy(editing), reason },
                      editing.version,
                    );
                    setEditing(null);
                    setNotice(
                      "Future catalog benefits saved and audited. Existing purchased benefits remain unchanged.",
                    );
                    await load();
                  })
                }
              >
                Confirm future benefits
              </button>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setReview(false)}
              >
                Back to editing
              </button>
            </div>
          )}
        </Modal>
      )}
      {discard && (
        <ConfirmDialog
          title="Discard plan edits?"
          confirmLabel="Discard edits"
          onCancel={() => setDiscard(false)}
          onConfirm={() => {
            setEditing(null);
            setDiscard(false);
          }}
        >
          Unsaved future-benefit changes will be discarded.
        </ConfirmDialog>
      )}
    </div>
  );
}
