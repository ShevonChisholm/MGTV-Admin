import { Link } from "../router";
import MediaIcon from "./MediaIcon";
import { ContentStatus } from "./ContentVisual";
import { PartnerImage, PartnerHistory } from "./PartnersVisual";
import { StatusPill } from "../ui/ops";
import { VOTING, RESULTS } from "../pages/opsMeta";
import "./AwardsVisual.css";
export { PartnerHistory as AwardsHistory };
export function AwardArt({
  record,
  version,
  canRead = true,
}: {
  record: any;
  version?: string | null;
  canRead?: boolean;
}) {
  if (!canRead)
    return (
      <div className="pv-image">
        <span className="pv-image-fallback">
          <MediaIcon name="lock" size={28} />
          <small>Media access required</small>
        </span>
      </div>
    );
  return (
    <PartnerImage
      src={
        canRead && record?.id && version
          ? "/api/v1/admin/awards/" +
            record.id +
            "/presentation/artwork/" +
            version
          : null
      }
    />
  );
}
export function AwardStates({ record }: { record: any }) {
  return (
    <div className="pv-states">
      <ContentStatus status={record.status} />
      <StatusPill map={VOTING} value={record.votingState} />
      <StatusPill
        map={{
          ...RESULTS,
          withheld: { label: "Results private", color: "#b4b9c4" },
        }}
        value={record.resultsState}
      />
    </div>
  );
}
export function AwardsGrid({
  items,
  canRead,
}: {
  items: any[];
  canRead: boolean;
}) {
  return (
    <ul className="pv-grid" aria-label="Award programs">
      {items.map((r) => (
        <li key={r.id} className="pv-card">
          <Link
            className="pv-card-link"
            to={"/admin/awards/" + r.id + "/overview"}
            aria-label={"Open " + r.draft.title}
          >
            <AwardArt
              record={r}
              version={
                r.presentation?.landscapeVersionId ??
                r.draft.landscapeVersionId ??
                r.draft.portraitVersionId
              }
              canRead={canRead}
            />
            <div className="pv-card-copy">
              <span className="cv-kicker">MGTV Awards · {r.draft.year}</span>
              <h3>{r.draft.title}</h3>
              <AwardStates record={r} />
              <p className="pv-clamp">
                {r.draft.description ||
                  "A celebration of Caribbean creativity."}
              </p>
              <div className="pv-card-foot">
                <span>
                  <MediaIcon name="sport" size={16} />
                  {r.draft.categories.length} categories ·{" "}
                  {r.draft.categories.reduce(
                    (a: number, c: any) => a + c.nominees.length,
                    0,
                  )}{" "}
                  nominees
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
export function AwardOverview({
  record,
  canRead,
}: {
  record: any;
  canRead: boolean;
}) {
  const b = record.draft;
  return (
    <>
      <section className="pv-hero">
        <AwardArt
          record={record}
          version={
            record.presentation?.landscapeVersionId ??
            b.landscapeVersionId ??
            b.portraitVersionId
          }
          canRead={canRead}
        />
        <div className="pv-hero-copy">
          <span className="cv-kicker">Saved award program · {b.year}</span>
          <h2>{b.title}</h2>
          <AwardStates record={record} />
          <p className="pv-description">
            {b.description || "No program description yet."}
          </p>
          <p className="pv-notice">
            <MediaIcon name="lock" size={16} />{" "}
            {record.ballotRevisionId
              ? "Ballot frozen · submitted votes remain protected."
              : "Ballot can be edited before voting first opens."}
          </p>
        </div>
      </section>
      <div className="pv-facts">
        <div>
          <MediaIcon name="calendar" />
          <span>
            <strong>
              {b.opensAt
                ? new Date(b.opensAt).toLocaleString("en-GB", {
                    timeZone: b.timezone,
                  })
                : "Not scheduled"}
            </strong>
            Voting opens · {b.timezone}
          </span>
        </div>
        <div>
          <MediaIcon name="clock" />
          <span>
            <strong>
              {b.closesAt
                ? new Date(b.closesAt).toLocaleString("en-GB", {
                    timeZone: b.timezone,
                  })
                : "Not scheduled"}
            </strong>
            Voting closes · {b.timezone}
          </span>
        </div>
        <div>
          <MediaIcon name="users" />
          <span>
            <strong>
              {b.categories.reduce(
                (n: number, c: any) => n + c.nominees.length,
                0,
              )}{" "}
              nominees
            </strong>
            {b.categories.length} categories
          </span>
        </div>
      </div>
      <div className="aw-rules">
        <span>
          <MediaIcon name="users" /> Adult profiles only
        </span>
        <span>
          <MediaIcon name="lock" /> One final vote per account/category
        </span>
        <span>
          <MediaIcon name="sport" /> Joint winners for ties
        </span>
        <span>
          <MediaIcon name="review" /> Results released by authorized staff
        </span>
      </div>
      <section className="pv-panel">
        <h3>
          <MediaIcon name="sport" /> The saved ballot
        </h3>
        <div className="aw-ballot-grid">
          {b.categories.map((c: any) => (
            <article className="aw-category" key={c.id}>
              <span className="cv-kicker">{c.section}</span>
              <h4>{c.name || "Unnamed category"}</h4>
              <p className="pv-muted">{c.description}</p>
              <div className="aw-nominee-grid">
                {c.nominees.map((n: any) => (
                  <div className="aw-nominee" key={n.id}>
                    <AwardArt
                      record={record}
                      version={
                        record.presentation?.nominees?.find(
                          (x: any) => x.nomineeId === n.id,
                        )?.imageVersionId ?? n.imageVersionId
                      }
                      canRead={canRead}
                    />
                    <div>
                      <strong>{n.name || "Unnamed nominee"}</strong>
                      <small>{n.subtitle}</small>
                    </div>
                  </div>
                ))}
              </div>
              {!c.nominees.length && (
                <p className="pv-muted">No nominees yet.</p>
              )}
            </article>
          ))}
        </div>
        {!b.categories.length && (
          <p className="pv-muted">
            Add categories and nominees in their editing sections.
          </p>
        )}
      </section>
    </>
  );
}
