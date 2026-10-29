import MediaIcon from "./MediaIcon";
import {
  HomepageImage,
  homepageImage,
  homepageKindIcon,
} from "./HomepageVisual";
import { Badge } from "../ui";
export const contentIcon = (kind: string) =>
  kind === "podcast" ? "audio" : homepageKindIcon(kind);
const terms: Record<string, string> = {
  category: "Category",
  genre: "Genre",
  tag: "Tag",
  classification: "Age rating",
  region: "Region",
  language: "Language",
};
export const termLabel = (kind: string, plural = false) =>
  plural
    ? kind === "category"
      ? "Categories"
      : (terms[kind] ?? kind) + "s"
    : (terms[kind] ?? kind);
export const contentLabel = (kind: string) =>
  ({
    podcast: "Podcast",
    movie: "Movie",
    show: "Show",
    episode: "Episode",
    music: "Music",
    sports: "Sports",
    event: "Event",
    artist: "Artist",
    album: "Album",
    playlist: "Playlist",
    news: "News",
    lifestyle: "Lifestyle",
  })[kind] ?? kind;
export function DiscoveryMark({ kind, code }: { kind: string; code?: string }) {
  return (
    <div className={"dv-mark dv-mark--" + kind}>
      {kind === "classification" ? (
        <strong>{code}</strong>
      ) : (
        <MediaIcon
          name={
            kind === "category"
              ? "grid"
              : kind === "genre"
                ? "film"
                : kind === "tag"
                  ? "link"
                  : "globe"
          }
          size={32}
        />
      )}
      <span>{termLabel(kind)}</span>
    </div>
  );
}
export default function DiscoveryRecordCard({
  record: r,
  busy,
  onOpen,
  onAssign,
}: {
  record: any;
  busy: boolean;
  onOpen: () => void;
  onAssign?: () => void;
}) {
  return (
    <article
      className={"dv-record" + (!r.active ? " dv-record--inactive" : "")}
    >
      <button
        className="dv-open"
        disabled={busy}
        onClick={onOpen}
        aria-label={"Open " + r.name}
      >
        <div className="dv-record-top">
          <DiscoveryMark kind={r.kind} code={r.code} />
          <Badge color={r.active ? "#34d399" : "#9ca3af"}>
            {r.active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="dv-record-copy">
          <small>{r.code}</small>
          <h3>{r.name}</h3>
          <p>{r.description || "Open to review this discovery label."}</p>
          <div className="dv-chips">
            {r.contentKinds?.slice(0, 4).map((k: string) => (
              <span key={k}>{contentLabel(k)}</span>
            ))}
            {r.contentKinds?.length > 4 && (
              <span>+{r.contentKinds.length - 4} types</span>
            )}
          </div>
        </div>
      </button>
      <footer>
        <span title="Published references before availability and profile checks">
          <MediaIcon name="link" size={16} />
          {r.items ?? 0} references
        </span>
        <span>Order {r.position}</span>
        {onAssign && (
          <button
            className="btn btn-sm"
            disabled={busy}
            onClick={onAssign}
            aria-label={"Arrange content for " + r.name}
          >
            <MediaIcon name="grid" size={16} />
            Content
          </button>
        )}
      </footer>
    </article>
  );
}
export function DiscoveryContentCard({
  record: r,
  kind,
  checked,
  disabled,
  onToggle,
}: {
  record: any;
  kind: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const title =
    r.draft?.title ??
    r.draft?.name ??
    r.body?.title ??
    r.title ??
    r.name ??
    "Untitled";
  const src =
    kind === "podcast"
      ? (r.coverUrl ??
        (r.draft?.coverMediaVersionId
          ? `/api/v1/admin/podcasts/${r.id}/cover?v=${r.version}`
          : null))
      : homepageImage(kind, r);
  return (
    <label className={"dv-content" + (checked ? " dv-content--selected" : "")}>
      <div className="dv-content-art">
        <HomepageImage src={src} kind={kind} />
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
          aria-label={title + " · " + r.status}
        />
        <span className="dv-content-status">{r.status}</span>
      </div>
      <div className="dv-content-copy">
        <small>
          <MediaIcon name={contentIcon(kind)} size={14} />
          {contentLabel(kind)}
        </small>
        <strong>{title}</strong>
      </div>
    </label>
  );
}
