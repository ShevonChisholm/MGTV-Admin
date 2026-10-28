import { useEffect, useState } from "react";
import { Link } from "../router";
import MediaIcon from "./MediaIcon";
import { ContentArtwork, ContentStatus } from "./ContentVisual";
import { EventArt } from "./EventsVisual";
import { StatusPill } from "../ui/ops";
import { CAMPAIGN_STATUS, ORG_STATUS } from "../pages/opsMeta";
import CreativeVideo from "../ui/CreativeVideo";
import "./PartnersVisual.css";
export function PartnerImage({
  src,
  alt = "",
  logo = false,
  light = false,
}: {
  src?: string | null;
  alt?: string;
  logo?: boolean;
  light?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div
      className={`pv-image ${logo ? "pv-image--logo" : ""} ${light ? "pv-image--light" : ""}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="same-origin"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="pv-image-fallback">
          <MediaIcon name={logo ? "brand" : "image"} size={30} />
          <small>
            {failed
              ? "Image unavailable"
              : logo
                ? "Logo not selected"
                : "Artwork to come"}
          </small>
        </span>
      )}
    </div>
  );
}
export function SponsorImage({
  record,
  asset,
  story = false,
}: {
  record: any;
  asset?: any;
  story?: boolean;
}) {
  const a =
      asset ??
      record?.draft?.brandAssets?.find(
        (a: any) => a.id === record.draft.publicAssetId,
      ),
    version = story ? record?.draft?.storyImageVersionId : a?.mediaVersionId;
  return (
    <PartnerImage
      logo={!story}
      light={!story && a?.kind === "logo_light"}
      src={
        version
          ? `/api/v1/admin/sponsors/${record.id}/assets/${version}?v=${record.version}`
          : null
      }
    />
  );
}
export function BrandTile({ name }: { name: string }) {
  return (
    <div className="pv-brand-tile" aria-hidden="true">
      <MediaIcon name="brand" size={25} />
      <strong>
        {name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((x) => x[0])
          .join("")
          .toUpperCase() || "AD"}
      </strong>
      <span>Advertiser</span>
    </div>
  );
}
export function SponsorGrid({ items }: { items: any[] }) {
  return (
    <ul className="pv-grid" aria-label="Sponsor records">
      {items.map((r) => (
        <li className="pv-card" key={r.id}>
          <Link
            className="pv-card-link"
            to={"/admin/sponsors/" + r.id + "/overview"}
            aria-label={"Open " + r.draft.name}
          >
            <div className="pv-sponsor-art">
              <SponsorImage record={r} story />
              <div className="pv-logo-inset">
                <SponsorImage record={r} />
              </div>
            </div>
            <div className="pv-card-copy">
              <span className="cv-kicker">Editorial partner</span>
              <h3>{r.draft.name}</h3>
              <div className="pv-states">
                <StatusPill map={ORG_STATUS} value={r.status} />
                <ContentStatus status={r.publicationStatus} />
              </div>
              <p className="pv-clamp">
                {r.draft.description || "Sponsor organization"}
              </p>
              <div className="pv-card-foot">
                <span>
                  <MediaIcon name="link" size={15} />
                  {r.draft.showIds.length + r.draft.eventIds.length} linked
                  titles
                </span>
                <MediaIcon name="arrow" size={18} />
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
export function AdvertisingGrid({
  items,
  kind,
  advertisers = [],
}: {
  items: any[];
  kind: string;
  advertisers?: any[];
}) {
  const campaign = kind === "campaigns";
  return (
    <ul
      className="pv-grid"
      aria-label={campaign ? "Campaign records" : "Advertiser records"}
    >
      {items.map((r) => {
        const b = campaign ? r.draft : r.body;
        return (
          <li className="pv-card" key={r.id}>
            <Link
              className="pv-card-link"
              to={"/admin/advertising/" + kind + "/" + r.id}
              aria-label={"Open " + b.name}
            >
              {campaign ? (
                <PartnerImage src={r.previewCreative?.url} />
              ) : (
                <BrandTile name={b.name} />
              )}
              <div className="pv-card-copy">
                <span className="cv-kicker">
                  {campaign
                    ? (advertisers.find((a) => a.id === b.advertiserId)?.body
                        .name ?? "Campaign")
                    : "Advertising organization"}
                </span>
                <h3>{b.name || "Untitled"}</h3>
                <StatusPill
                  map={campaign ? CAMPAIGN_STATUS : ORG_STATUS}
                  value={r.status}
                />
                <p className="pv-clamp">
                  {campaign
                    ? b.headline || b.objective || "Saved campaign"
                    : b.website || "Website not provided"}
                </p>
                <div className="pv-card-foot">
                  <span>
                    <MediaIcon name={campaign ? "image" : "users"} size={15} />
                    {campaign
                      ? `${b.creativeVersionIds.length} creative · ${b.placements.length} placements`
                      : `${b.contacts.length} private contacts`}
                  </span>
                  <MediaIcon name="arrow" size={18} />
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
export function PartnerSkeleton() {
  return (
    <div className="pv-grid" role="status" aria-label="Loading partner records">
      {Array.from({ length: 6 }, (_, i) => (
        <div className="pv-card pv-skeleton" key={i}>
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export function SponsorOverview({
  record,
  shows,
  events,
}: {
  record: any;
  shows: any[];
  events: any[];
}) {
  const b = record.draft;
  return (
    <div>
      <section className="pv-hero">
        <SponsorImage record={record} story />
        <div className="pv-hero-copy">
          <div className="pv-hero-logo">
            <SponsorImage record={record} />
          </div>
          <span className="cv-kicker">Saved sponsor identity</span>
          <h2>{b.name}</h2>
          <div className="pv-states">
            <StatusPill map={ORG_STATUS} value={record.status} />
            <ContentStatus status={record.publicationStatus} />
          </div>
          <p className="pv-description">
            {b.description || "Add a description in Organization."}
          </p>
          <p className="pv-muted">{b.website || "Website not provided"}</p>
        </div>
      </section>
      <div className="pv-facts">
        <div>
          <MediaIcon name="brand" />
          <span>
            <strong>{b.brandAssets.length}</strong>Brand assets
          </span>
        </div>
        <div>
          <MediaIcon name="users" />
          <span>
            <strong>{b.contacts.length}</strong>Private contacts
          </span>
        </div>
        <div>
          <MediaIcon name="link" />
          <span>
            <strong>{b.showIds.length + b.eventIds.length}</strong>Linked shows
            & events
          </span>
        </div>
      </div>
      <p className="pv-notice">
        “Supported by” is an editorial credit for all tiers, including Gold.
        Publication is separate from organization status; contacts remain
        private.
      </p>
      <section className="pv-panel">
        <h3>
          <MediaIcon name="link" /> Contextual credits
        </h3>
        <div className="pv-linked-grid">
          {[
            ["show", b.showIds, shows],
            ["event", b.eventIds, events],
          ].flatMap(([kind, ids, rows]: any) =>
            (ids as string[]).map((id) => {
              const target = rows.find((r: any) => r.id === id);
              return (
                <div className="pv-linked" key={kind + id}>
                  {target && <TargetArtwork record={target} kind={kind} />}
                  <div>
                    <span className="cv-kicker">{kind}</span>
                    <strong>
                      {target?.draft?.title ??
                        "Linked title · details require content access"}
                    </strong>
                    {target && (
                      <Link
                        to={
                          (kind === "show"
                            ? "/admin/content/shows/"
                            : "/admin/events/") + id
                        }
                      >
                        Open title <MediaIcon name="arrow" size={15} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            }),
          )}
        </div>
        {!b.showIds.length && !b.eventIds.length && (
          <p className="pv-muted">
            No contextual credits linked yet. Choose titles under Shows &
            events.
          </p>
        )}
      </section>
    </div>
  );
}
export function TargetArtwork({ record, kind }: { record: any; kind: string }) {
  return (
    <div className="pv-target-art">
      {kind === "event" ? (
        <EventArt record={record} />
      ) : (
        <ContentArtwork
          record={record}
          entity={
            kind === "show"
              ? "shows"
              : kind === "movie"
                ? "movies"
                : kind === "sports"
                  ? "sports"
                  : "music"
          }
        />
      )}
    </div>
  );
}
export function CampaignFlow({ status }: { status: string }) {
  return (
    <div className="pv-flow" aria-label="Campaign workflow">
      {[
        "draft",
        "in_review",
        ...(status === "rejected" ? ["rejected"] : []),
        "approved",
        "active",
        "completed",
      ].map((s, i) => (
        <span key={s} aria-current={status === s ? "step" : undefined}>
          <span className="pv-step-number">{i + 1}</span>
          {s.replace(/_/g, " ")}
        </span>
      ))}
    </div>
  );
}
export function CampaignOverview({
  record,
  advertiser,
  targets,
  onReview,
  active,
}: {
  record: any;
  advertiser: string;
  targets: any[];
  onReview: () => void;
  active: boolean;
}) {
  const b = record.draft,
    images = record.creative?.filter((c: any) => c.kind === "image") ?? [];
  return (
    <div>
      <section className="pv-hero">
        <PartnerImage src={images[0]?.url} />
        <div className="pv-hero-copy">
          <span className="cv-kicker">{advertiser} · saved campaign</span>
          <h2>{b.name}</h2>
          <StatusPill map={CAMPAIGN_STATUS} value={record.status} />
          <h3>{b.headline}</h3>
          <p className="pv-description">
            {b.objective || "No objective entered."}
          </p>
          <p className="pv-muted">
            {b.destinationUrl || "Destination not set"}
          </p>
          <button className="btn" onClick={onReview}>
            <MediaIcon name="review" size={17} /> Review & status
          </button>
        </div>
      </section>
      <CampaignFlow status={record.status} />
      <div className="pv-facts">
        <div>
          <MediaIcon name="calendar" />
          <span>
            <strong>
              {b.startAt ? new Date(b.startAt).toLocaleString() : "Not set"}
            </strong>
            Starts · this computer's timezone
          </span>
        </div>
        <div>
          <MediaIcon name="clock" />
          <span>
            <strong>
              {b.endAt ? new Date(b.endAt).toLocaleString() : "Not set"}
            </strong>
            Ends · this computer's timezone
          </span>
        </div>
        <div>
          <MediaIcon name="image" />
          <span>
            <strong>{b.creativeVersionIds.length}</strong>Saved creative files
          </span>
        </div>
      </div>
      <section className="pv-panel">
        <h3>
          <MediaIcon name="grid" /> Placements
        </h3>
        <div className="pv-placement-chips">
          {b.placements.map((p: any) => {
            const t = targets.find(
              (t) => t.kind === p.kind && t.id === p.targetId,
            );
            return (
              <span key={p.kind + p.targetId}>
                <MediaIcon
                  name={p.kind === "home" ? "grid" : "link"}
                  size={16}
                />
                {p.kind === "home"
                  ? "Homepage sponsored cards"
                  : (t?.title ?? "Linked " + p.kind)}
              </span>
            );
          })}
        </div>
        {!b.placements.length && (
          <p className="pv-muted">No placements selected.</p>
        )}
      </section>
      <section className="pv-panel">
        <h3>
          <MediaIcon name="image" /> Saved creative gallery
        </h3>
        <p className="pv-muted">
          Staff preview of saved files. Customer delivery uses the approved
          revision only.
        </p>
        <div className="pv-creative-grid">
          {record.creative?.map((c: any) => (
            <figure key={c.id}>
              {c.kind === "image" ? (
                <PartnerImage src={c.url} />
              ) : c.kind === "video" ? (
                active ? (
                  <CreativeVideo src={c.url} />
                ) : (
                  <p className="pv-muted">Video preview</p>
                )
              ) : (
                <div className="pv-notice">Preview unavailable</div>
              )}
              <figcaption>
                {c.filename || "Creative file"} · {c.state}
              </figcaption>
            </figure>
          ))}
        </div>
        {!record.creative?.length && (
          <p className="pv-muted">No saved creative yet.</p>
        )}
      </section>
    </div>
  );
}
export function AdvertiserOverview({
  record,
  campaigns,
}: {
  record: any;
  campaigns: any[];
}) {
  const b = record.body;
  return (
    <div>
      <section className="pv-hero">
        <BrandTile name={b.name} />
        <div className="pv-hero-copy">
          <span className="cv-kicker">Saved advertiser organization</span>
          <h2>{b.name}</h2>
          <StatusPill map={ORG_STATUS} value={record.status} />
          <p className="pv-muted">{b.website || "Website not provided"}</p>
          <p className="pv-description">{b.notes || "No internal notes."}</p>
          <p className="pv-notice">
            {b.contacts.length} private contacts · Contact information stays
            within authorized staff access.
          </p>
        </div>
      </section>
      <section className="pv-panel">
        <h3>
          <MediaIcon name="campaign" /> Linked campaigns · {campaigns.length}
        </h3>
        <AdvertisingGrid
          items={campaigns}
          kind="campaigns"
          advertisers={[record]}
        />
        {!campaigns.length && (
          <p className="pv-muted">No campaigns linked to this advertiser.</p>
        )}
      </section>
    </div>
  );
}
export function PartnerHistory({ items }: { items: any[] }) {
  return (
    <ol className="pv-history">
      {items.map((h, i) => (
        <li key={h.id ?? i}>
          <MediaIcon name="clock" size={18} />
          <div>
            <strong>{h.action.replace(/[._]/g, " ")}</strong>
            <small>{new Date(h.created_at).toLocaleString()}</small>
            {h.details?.reason && <p>{h.details.reason}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
