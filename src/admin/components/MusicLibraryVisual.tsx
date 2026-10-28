import { useEffect, useState } from "react";
import { Link } from "../router";
import MediaIcon from "./MediaIcon";
import { ContentStatus } from "./ContentVisual";
import "./MusicLibraryVisual.css";

export const libraryTypes = [
  {
    id: "artists",
    label: "Artists",
    singular: "artist",
    icon: "artist",
    description: "The voices and faces behind the music.",
  },
  {
    id: "albums",
    label: "Albums",
    singular: "album",
    icon: "album",
    description: "Complete releases, arranged track by track.",
  },
  {
    id: "playlists",
    label: "Playlists",
    singular: "playlist",
    icon: "playlist",
    description: "Curated listening and viewing, in the right order.",
  },
];
export function LibraryCover({
  record,
  kind,
  className = "",
}: {
  record: any;
  kind: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const body = record?.draft ?? record?.body;
  const src =
    record?.id && body?.coverMediaVersionId
      ? `/api/v1/admin/${kind}/${record.id}/cover?v=${record.version}`
      : null;
  useEffect(() => setFailed(false), [src]);
  return (
    <div className={`ml-cover ml-cover--${kind} ${className}`}>
      {kind === "playlists" && (
        <>
          <span className="ml-stack ml-stack--back" />
          <span className="ml-stack ml-stack--middle" />
        </>
      )}
      <div className="ml-cover-face">
        {src && !failed ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            referrerPolicy="same-origin"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="ml-art-fallback">
            <MediaIcon
              name={libraryTypes.find((t) => t.id === kind)?.icon ?? "audio"}
              size={40}
            />
            <small>{failed ? "Artwork unavailable" : "Artwork to come"}</small>
          </span>
        )}
      </div>
    </div>
  );
}
export function LibraryGrid({
  items,
  kind,
  path,
}: {
  items: any[];
  kind: string;
  path: string;
}) {
  return (
    <ul className="ml-grid" aria-label={`${kind} records`}>
      {items.map((item) => {
        const b = item.body ?? item.draft;
        return (
          <li key={item.id} className="ml-card">
            <Link
              to={path + "/" + item.id}
              className="ml-card-link"
              aria-label={"Open " + (b.title || "Untitled")}
            >
              <div className="ml-card-art">
                <LibraryCover record={item} kind={kind} />
                <ContentStatus status={item.status} />
              </div>
              <div className="ml-card-copy">
                <span className="cv-kicker">
                  {kind === "playlists"
                    ? b.playlistKind === "video"
                      ? "Video playlist"
                      : "Track playlist"
                    : kind === "albums"
                      ? "Album"
                      : "Artist"}
                </span>
                <h3>{b.title || "Untitled"}</h3>
                <p>
                  {kind === "artists"
                    ? [b.origin, b.genre].filter(Boolean).join(" · ") ||
                      "Artist profile"
                    : [
                        b.releaseYear,
                        `${b.musicIds?.length ?? 0} ${kind === "albums" ? ((b.musicIds?.length ?? 0) === 1 ? "track" : "tracks") : (b.musicIds?.length ?? 0) === 1 ? "release" : "releases"}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
                <div className="ml-card-foot">
                  <span>
                    <MediaIcon name="audio" size={14} />
                    {b.musicIds?.length ?? 0} linked
                  </span>
                  <span>
                    Open <MediaIcon name="arrow" size={16} />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
export function LibraryGridSkeleton() {
  return (
    <div className="ml-grid" role="status" aria-label="Loading music library">
      <span className="sr-only">Loading music library…</span>
      {Array.from({ length: 8 }, (_, i) => (
        <div className="ml-card ml-skeleton" key={i}>
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export function MusicReleaseVisual({ record }: { record: any }) {
  const [failed, setFailed] = useState(false),
    id = record?.id,
    version = record?.version;
  const hasArt = !!record?.draft?.artwork?.portraitVersionId;
  const src = hasArt
    ? `/api/v1/admin/music/${id}/artwork/portrait?v=${version}`
    : null;
  useEffect(() => setFailed(false), [src]);
  return (
    <span className="ml-release-art">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="same-origin"
          onError={() => setFailed(true)}
        />
      ) : (
        <MediaIcon
          name={record?.draft?.musicKind === "music-video" ? "video" : "audio"}
          size={23}
        />
      )}
    </span>
  );
}
export function LibraryOverview({
  record,
  kind,
  music,
  artists,
  canReadMusic,
  onEdit,
  canEdit,
}: {
  record: any;
  kind: string;
  music: any[];
  artists: any[];
  canReadMusic: boolean;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const b = record.draft,
    artist = artists.find((a) => a.id === b.artistId);
  return (
    <div className="ml-overview">
      <section className="ml-hero">
        <LibraryCover record={record} kind={kind} />
        <div className="ml-hero-copy">
          <span className="cv-kicker">
            Saved {libraryTypes.find((t) => t.id === kind)?.singular}
          </span>
          <h2>{b.title || "Untitled"}</h2>
          <div className="ml-inline">
            <ContentStatus status={record.status} />
            <span>Revision {record.version}</span>
          </div>
          <p className="ml-meta">
            {kind === "artists"
              ? [b.origin, b.genre].filter(Boolean).join(" · ")
              : kind === "albums"
                ? [
                    artist?.body?.title ??
                      (b.artistId ? "Linked artist" : "Artist not selected"),
                    b.releaseYear,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : b.playlistKind === "video"
                  ? "Music video collection"
                  : "Audio track collection"}
          </p>
          {artist && (
            <Link
              className="ml-release-link"
              to={"/admin/music-library/artists/" + artist.id}
            >
              <MediaIcon name="artist" size={16} /> View artist profile
            </Link>
          )}
          <p className="ml-description">
            {b.description || "Add a description in the draft editor."}
          </p>
          {canEdit && (
            <button className="btn" onClick={onEdit}>
              <MediaIcon name="edit" size={16} /> Edit draft
            </button>
          )}
        </div>
      </section>
      <div className="ml-snapshot">
        <div>
          <MediaIcon name="audio" />
          <span>
            <strong>{b.musicIds?.length ?? 0}</strong> Linked releases
          </span>
        </div>
        <div>
          <MediaIcon name={b.coverMediaVersionId ? "image" : "alert"} />
          <span>
            <strong>
              {b.coverMediaVersionId ? "Attached" : "Not attached"}
            </strong>{" "}
            Saved cover artwork
          </span>
        </div>
        <div>
          <MediaIcon name="review" />
          <span>
            <strong>
              {record.draft_revision_id === record.published_revision_id
                ? "Current"
                : "Draft revision"}
            </strong>
            {record.published_revision_id
              ? " Publication snapshot"
              : " Not published yet"}
          </span>
        </div>
      </div>
      <section className="ml-section">
        <div className="ml-section-heading">
          <h3>{kind === "albums" ? "Track listing" : "Linked releases"}</h3>
          <span>Saved order</span>
        </div>
        <ol className="ml-releases">
          {(b.musicIds ?? []).map((id: string, index: number) => {
            const m = music.find((m) => m.id === id);
            return (
              <li key={id}>
                <span className="ml-position">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <MusicReleaseVisual record={m} />
                <div className="ml-release-copy">
                  <strong>
                    {m?.draft?.title ??
                      (canReadMusic ? "Unavailable release" : "Linked release")}
                  </strong>
                  <small>
                    {m
                      ? [
                          m.draft?.artist,
                          m.draft?.musicKind === "track"
                            ? "Audio track"
                            : "Music video",
                          m.status,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : canReadMusic
                        ? "This reference is not available in the music catalog."
                        : "Music read permission is required for release details."}
                  </small>
                </div>
                {m && canReadMusic && (
                  <Link
                    className="ml-release-link"
                    to={
                      "/admin/content/" +
                      (m.draft?.musicKind === "track"
                        ? "audio"
                        : "music-videos") +
                      "/" +
                      id
                    }
                    aria-label={"Open release " + m.draft?.title}
                  >
                    <MediaIcon name="arrow" size={18} />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
        {!b.musicIds?.length && (
          <div className="ml-empty">
            <MediaIcon name="audio" size={30} />
            <h3>No releases linked yet</h3>
            <p>Add music in Edit draft to shape this collection.</p>
          </div>
        )}
      </section>
    </div>
  );
}
