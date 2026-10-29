import { useEffect, useState } from "react";
import MediaIcon from "./MediaIcon";
export const homepageKindIcon = (kind: string) =>
  ({
    movie: "film",
    show: "series",
    episode: "series",
    music: "audio",
    sports: "sport",
    event: "calendar",
    artist: "artist",
    album: "album",
    playlist: "playlist",
    news: "review",
    lifestyle: "culture",
  })[kind] ?? "file";
const paths: Record<string, string> = {
  movie: "movies",
  show: "shows",
  episode: "episodes",
  music: "music",
  sports: "sports",
  event: "events",
  artist: "artists",
  album: "albums",
  playlist: "playlists",
  news: "news",
  lifestyle: "lifestyle",
};
export function homepageImage(kind: string, row: any) {
  const b = row.draft ?? row.body ?? {};
  if (kind === "event" && (b.landscapeVersionId || b.portraitVersionId)) {
    const slot = b.landscapeVersionId ? "landscape" : "portrait";
    return `/api/v1/admin/events/${row.id}/artwork/${slot}?v=${row.version}`;
  }
  if (b.artwork?.landscapeVersionId || b.artwork?.portraitVersionId) {
    const slot = b.artwork.landscapeVersionId ? "landscape" : "portrait";
    return `/api/v1/admin/${paths[kind]}/${row.id}/artwork/${slot}?v=${row.version}`;
  }
  if (b.coverMediaVersionId)
    return `/api/v1/admin/${paths[kind]}/${row.id}/cover?v=${row.version}`;
  return null;
}
export function HomepageImage({
  src,
  kind,
  priority = false,
}: {
  src?: string | null;
  kind: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div className="hp-art">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="hp-art-fallback">
          <MediaIcon name={homepageKindIcon(kind)} size={30} />
          <small>{failed ? "Artwork unavailable" : "Artwork to come"}</small>
        </span>
      )}
    </div>
  );
}
const refKey = (r: any) => r.kind + ":" + r.id;
export default function HomepageCanvas({
  layout,
  labels,
  surface,
  onEdit,
}: {
  layout: any;
  labels: Record<string, any>;
  surface: string;
  onEdit: (id: string) => void;
}) {
  const first = layout.hero[0],
    lead = first ? labels[refKey(first)] : null;
  return (
    <section className="hp-canvas" aria-label="Saved layout canvas">
      <div className="hp-canvas-heading">
        <span className="hp-kicker">SAVED PAGE CANVAS</span>
        <p>
          Open a placement to arrange its draft. Changes reach viewers only
          after publication.
        </p>
      </div>
      <div className="hp-hero-frame">
        <HomepageImage
          src={lead?.image}
          kind={first?.kind ?? "movie"}
          priority
        />
        <div className="hp-hero-shade" />
        <div className="hp-hero-copy">
          <span className="hp-kicker">
            FEATURED HERO · {layout.hero.length} OF 5 PICKS
          </span>
          <h2>
            {lead?.title ??
              (first
                ? "Featured selection needs review"
                : "Your opening moment")}
          </h2>
          <p>
            {first
              ? "Poster-first presentation with each title’s own availability and access rules."
              : "Choose a published story to lead this page."}
          </p>
          <button className="btn btn-primary" onClick={() => onEdit("hero")}>
            <MediaIcon name="edit" size={16} /> Arrange featured content
          </button>
        </div>
      </div>
      {layout.hero.length > 0 && (
        <ol
          className="hp-hero-strip"
          aria-label="Featured picks in saved order"
        >
          {layout.hero.map((r: any, i: number) => (
            <li key={refKey(r)}>
              <HomepageImage src={labels[refKey(r)]?.image} kind={r.kind} />
              <div>
                <span>
                  {String(i + 1).padStart(2, "0")} · {r.kind}
                </span>
                <strong>
                  {labels[refKey(r)]?.title ?? "Selection needs review"}
                </strong>
              </div>
            </li>
          ))}
        </ol>
      )}
      {surface === "home" && (
        <>
          <div className="hp-section-heading">
            <MediaIcon name="grid" />
            <div>
              <h3>The page, one section at a time</h3>
              <p>
                {layout.sections.length} saved sections · hidden sections stay
                visible here for staff.
              </p>
            </div>
          </div>
          <ol className="hp-section-grid" aria-label="Saved homepage sections">
            {layout.sections.map((s: any, i: number) => (
              <li key={s.id} className={s.enabled ? "" : "hp-is-hidden"}>
                <button
                  className="hp-section-tile"
                  aria-label={"Open section " + s.label}
                  onClick={() => onEdit(s.id)}
                >
                  <div className="hp-section-art">
                    {s.kind === "editorial" ? (
                      <div className="hp-collage">
                        {s.items.length ? (
                          s.items
                            .slice(0, 4)
                            .map((r: any) => (
                              <HomepageImage
                                key={refKey(r)}
                                src={labels[refKey(r)]?.image}
                                kind={r.kind}
                              />
                            ))
                        ) : (
                          <HomepageImage kind="grid" />
                        )}
                      </div>
                    ) : (
                      <div className={"hp-system-art hp-system-art--" + s.kind}>
                        <MediaIcon
                          name={s.kind === "membership" ? "lock" : "clock"}
                          size={38}
                        />
                        <strong>
                          {s.kind === "membership"
                            ? "MGTV+"
                            : "Continue Watching"}
                        </strong>
                        <span>
                          {s.kind === "membership"
                            ? "Membership placement"
                            : "Genuine profile progress"}
                        </span>
                      </div>
                    )}
                    <span className="hp-tile-index">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="hp-tile-visibility">
                      {s.enabled ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  <div className="hp-section-copy">
                    <span className="hp-kicker">
                      {s.kind === "editorial"
                        ? s.layout === "news"
                          ? "Editorial split"
                          : s.layout === "grid"
                            ? "Content grid"
                            : "Content rail"
                        : s.kind === "membership"
                          ? "Membership banner"
                          : "Personal collection"}
                    </span>
                    <h3>{s.label}</h3>
                    <p>
                      {s.description ||
                        "Open this section to review its placement and settings."}
                    </p>
                    <div>
                      <span>
                        {s.kind === "editorial"
                          ? s.items.length + " selections"
                          : "Managed automatically"}
                      </span>
                      <MediaIcon name="arrow" size={17} />
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ol>
          {!layout.sections.length && (
            <div className="hp-empty-canvas">
              <MediaIcon name="grid" size={36} />
              <h3>Make room for your stories</h3>
              <p>
                Add an editorial rail, personal collection or membership
                placement in Arrange draft.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
export function HomepageSavedPreview({
  preview,
  surface,
  dirty,
}: {
  preview: any;
  surface: string;
  dirty: boolean;
}) {
  const hero = preview?.hero ?? [],
    sections = preview?.sections ?? [],
    lead = hero[0]?.content;
  return (
    <section
      className="hp-saved-preview"
      aria-label="Saved customer layout preview"
    >
      <div className="hp-canvas-heading">
        <span className="hp-kicker">SAVED LAYOUT · STAFF PREVIEW</span>
        <p>
          {dirty
            ? "Unsaved edits are not shown. Save and check requirements to refresh this view."
            : "Published, available content resolved from the saved layout. Hidden and empty editorial sections are omitted; customer profile filtering still applies."}
        </p>
      </div>
      <div className="hp-preview-page">
        <div className="hp-preview-hero">
          <HomepageImage
            src={
              lead?.artwork?.landscapeUrl ??
              lead?.coverUrl ??
              lead?.artwork?.portraitUrl
            }
            kind={hero[0]?.kind ?? "movie"}
          />
          <div>
            <span className="hp-kicker">
              {surface === "home" ? "MGTV · FEATURED" : surface + " · FEATURED"}
            </span>
            <h2>{lead?.title ?? "No available featured content"}</h2>
            <p>
              {hero.length} resolved featured{" "}
              {hero.length === 1 ? "selection" : "selections"}
            </p>
          </div>
        </div>
        {sections.map((s: any) => (
          <section className="hp-preview-section" key={s.id}>
            <h3>{s.label}</h3>
            {s.description && <p>{s.description}</p>}
            {s.kind === "editorial" ? (
              <div className="hp-preview-grid">
                {s.items.map((r: any) => (
                  <article key={refKey(r)}>
                    <HomepageImage
                      src={
                        r.content.artwork?.landscapeUrl ??
                        r.content.coverUrl ??
                        r.content.artwork?.portraitUrl
                      }
                      kind={r.kind}
                    />
                    <span className="hp-kicker">{r.kind}</span>
                    <h4>{r.content.title}</h4>
                  </article>
                ))}
              </div>
            ) : (
              <div className="hp-preview-system">
                <MediaIcon
                  name={s.kind === "membership" ? "lock" : "clock"}
                  size={28}
                />
                <div>
                  <strong>
                    {s.kind === "membership"
                      ? "MGTV+ membership benefits"
                      : "Continue where you left off"}
                  </strong>
                  <p>
                    {s.kind === "membership"
                      ? "The membership banner appears in this placement."
                      : "Each viewer sees their own actual saved viewing progress here."}
                  </p>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

export function HomepageLoading() {
  return (
    <section
      className="page-pad homepage-workspace hp-loading"
      aria-busy="true"
      aria-label="Loading editorial layout"
    >
      <span className="sr-only" role="status">
        Loading saved editorial layout…
      </span>
      <div aria-hidden="true">
        <div className="hp-loading-head">
          <span className="ui-skeleton" />
          <span className="ui-skeleton" />
          <span className="ui-skeleton" />
        </div>
        <div className="hp-loading-nav">
          {Array.from({ length: 8 }, (_, i) => (
            <span className="ui-skeleton" key={i} />
          ))}
        </div>
        <div className="hp-loading-nav hp-loading-tabs">
          {Array.from({ length: 5 }, (_, i) => (
            <span className="ui-skeleton" key={i} />
          ))}
        </div>
        <div className="ui-skeleton hp-loading-hero" />
        <div className="hp-loading-cards">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i}>
              <span className="ui-skeleton" />
              <span className="ui-skeleton" />
              <span className="ui-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
