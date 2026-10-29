import { useEffect, useState } from "react";
import MediaIcon from "./MediaIcon";
type Body = {
  title: string;
  summary: string;
  category: string;
  author: string;
  imageAlt?: string;
  imageCaption?: string;
  coverMediaVersionId: string | null;
  blocks: { type: string; text: string }[];
};
export function articleStats(body: Pick<Body, "blocks">) {
  const words = (body.blocks ?? [])
    .map((b) => b.text)
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return {
    words,
    minutes: Math.max(1, Math.ceil(words / 200)),
    blocks: body.blocks?.length ?? 0,
  };
}
export default function NewsArtwork({
  record,
  draft,
  resource = "news",
}: {
  record: any;
  draft?: Body;
  resource?: "news" | "lifestyle";
}) {
  const [failed, setFailed] = useState(false);
  const changed =
    draft &&
    draft.coverMediaVersionId !== (record?.draft.coverMediaVersionId ?? null);
  const src =
    record?.draft.coverMediaVersionId && !changed
      ? `/api/v1/admin/${resource}/${record.id}/cover?v=${record.version}`
      : null;
  useEffect(() => setFailed(false), [src]);
  return (
    <div className="nv-artwork">
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="nv-art-fallback">
          <MediaIcon name="image" size={38} />
          <span>
            {changed
              ? "Save to preview this cover"
              : failed
                ? "Cover unavailable"
                : "Your story starts here"}
          </span>
        </div>
      )}
    </div>
  );
}
export function ArticleReadingView({
  body,
  label,
}: {
  body: Body;
  label: string;
}) {
  return (
    <article className="nv-reading" aria-label={label}>
      <span className="nv-kicker">{label}</span>
      <h2>{body.title || "Your headline"}</h2>
      <p className="nv-reading-summary">
        {body.summary || "Add a short introduction to your story."}
      </p>
      <div className="nv-byline">
        <span>
          <MediaIcon name="artist" size={15} />
          {body.author || "Byline to come"}
        </span>
        <span>
          <MediaIcon name="clock" size={15} />
          {articleStats(body).minutes} min read
        </span>
      </div>
      {body.imageCaption && <p className="nv-caption">{body.imageCaption}</p>}
      {body.blocks.length ? (
        body.blocks.map((b, i) =>
          b.type === "heading" ? (
            <h3 key={i}>{b.text}</h3>
          ) : b.type === "quote" ? (
            <blockquote key={i}>{b.text}</blockquote>
          ) : (
            <p key={i}>{b.text}</p>
          ),
        )
      ) : (
        <p className="nv-help">
          Add your first paragraph in the Article body editor.
        </p>
      )}
    </article>
  );
}
