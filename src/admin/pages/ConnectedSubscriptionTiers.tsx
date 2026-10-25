import LoadingState from "../components/LoadingState";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card, Badge } from "../ui";
import StaffAuth from "./StaffAuth";
export default function ConnectedSubscriptionTiers() {
  const [session, setSession] = useState<any>(null),
    [tiers, setTiers] = useState<any[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const staff = await api("/admin/session");
      setSession(staff);
      const response = await fetch("/api/v1/catalog/subscription-tiers");
      if (!response.ok) throw Error("Subscription tiers could not be loaded.");
      setTiers(
        (await response.json()).sort(
          (a: any, b: any) => a.maxProfiles - b.maxProfiles,
        ),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load subscription policies.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (loading)
    return (
      <div className="page-pad">
        <LoadingState
          label={<>Loading subscription policies…</>}
          variant="cards"
        />
      </div>
    );
  if (!session)
    return (
      <div className="page-pad">
        <StaffAuth onAuthenticated={load} />
      </div>
    );
  return (
    <div className="page-pad">
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 13,
          marginBottom: 20,
        }}
      >
        The configured tier limits are shared by customer profiles and movie
        playback. Subscription membership is provider-managed; staff cannot
        grant it.
      </p>
      {error && (
        <p role="alert" style={{ color: "var(--red)", marginBottom: 20 }}>
          {error}
        </p>
      )}
      <div className="grid-3">
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            title={tier.name}
            aside={
              <Badge color={tier.code === "gold" ? "#C9A84C" : "#60a5fa"}>
                {tier.code}
              </Badge>
            }
          >
            <dl style={{ display: "grid", gap: 16, fontSize: 13 }}>
              <div>
                <dt style={{ color: "var(--text-secondary)" }}>Profiles</dt>
                <dd>{tier.maxProfiles}</dd>
              </div>
              <div>
                <dt style={{ color: "var(--text-secondary)" }}>
                  Maximum video quality
                </dt>
                <dd>
                  {tier.maxVideoHeight === 2160
                    ? "4K"
                    : tier.maxVideoHeight + "p"}{" "}
                  where available
                </dd>
              </div>
              <div>
                <dt style={{ color: "var(--text-secondary)" }}>Ad policy</dt>
                <dd style={{ textTransform: "capitalize" }}>
                  {tier.adPolicy} · delivery not connected
                </dd>
              </div>
              <div>
                <dt style={{ color: "var(--text-secondary)" }}>
                  Early event notices
                </dt>
                <dd>
                  {tier.earlyEventNotices
                    ? "Included; notification delivery pending"
                    : "Not included"}
                </dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
      <Card title="Activation boundary">
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: "var(--text-secondary)",
          }}
        >
          Accounts without an active subscription have one profile and up to
          720p playback for free films, where a matching video exists. Only
          active provider records unlock an eligible premium film. Expired or
          revoked membership grants no premium access. Billing and provider
          activation are not connected yet.
        </p>
      </Card>
    </div>
  );
}
