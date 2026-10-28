import { useEffect, useState } from "react";
function Frame({
  record,
  draft,
  slot,
}: {
  record: any;
  draft: any;
  slot: "portrait" | "landscape";
}) {
  const field = slot + "VersionId",
    [failed, setFailed] = useState(false),
    version = draft[field];
  useEffect(() => setFailed(false), [version]);
  const saved = record?.draft[field] === version;
  return (
    <figure className="min-w-0">
      <div
        className={
          "overflow-hidden rounded-[20px_0_20px_0] border border-[#C9A84C]/20 bg-black/20 " +
          (slot === "portrait" ? "aspect-[2/3] max-w-60" : "aspect-video")
        }
      >
        {version && saved && !failed ? (
          <img
            src={
              "/api/v1/admin/events/" +
              record.id +
              "/artwork/" +
              slot +
              "?v=" +
              record.version
            }
            referrerPolicy="same-origin"
            alt={draft.title + " · " + slot + " artwork preview"}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <p className="flex h-full items-center justify-center p-4 text-center text-xs text-white/60">
            {failed
              ? "Artwork unavailable"
              : version
                ? "Save the draft to preview this selection"
                : "Choose " + slot + " artwork"}
          </p>
        )}
      </div>
      <figcaption className="mt-2 text-xs text-white/60">
        {slot === "portrait"
          ? "Portrait · detail poster"
          : "Landscape · cards and featured moments"}
      </figcaption>
    </figure>
  );
}
export default function EventArtworkPreview({
  record,
  draft,
}: {
  record: any;
  draft: any;
}) {
  return (
    <section
      aria-label="Event campaign artwork preview"
      className="min-w-0 rounded-xl border border-[#C9A84C]/20 p-4"
    >
      <h3 className="mb-2 text-sm text-[#C9A84C]">
        See the moment before you publish
      </h3>
      <p className="mb-4 text-xs text-white/60">
        Private saved-draft preview. Keep dates, ticket prices and status out of
        artwork so the interface can show current information.
      </p>
      <div className="grid min-w-0 gap-5 sm:grid-cols-[1fr_2fr]">
        <Frame record={record} draft={draft} slot="portrait" />
        <Frame record={record} draft={draft} slot="landscape" />
      </div>
    </section>
  );
}
