import { useEffect, useState } from "react";
export default function SponsorPreview({
  draft,
  record,
}: {
  draft: any;
  record: any;
}) {
  const selected = draft.brandAssets.find(
      (a: any) => a.id === draft.publicAssetId,
    ),
    saved =
      selected &&
      record?.draft.brandAssets.some(
        (a: any) => a.mediaVersionId === selected.mediaVersionId,
      ),
    light = selected?.kind === "logo_light";
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [selected?.mediaVersionId]);
  return (
    <section
      aria-label="Draft sponsor presentation preview"
      className="mt-5 min-w-0 rounded-xl border border-[#C9A84C]/25 bg-gradient-to-br from-[#191a16] to-[#121315] p-5"
    >
      <p className="text-xs uppercase tracking-widest text-[#C9A84C]">
        Customer presentation · Draft preview
      </p>
      <p className="my-3 text-xs text-white/60">
        Saving a draft does not change the live credit. Publish separately after
        review. This preview uses private asset access.
      </p>
      <div className="flex min-w-0 flex-wrap gap-5">
        <div
          className={`flex h-28 w-44 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 ${light ? "bg-[#f3efe5] text-[#29251c]" : "bg-[#181b1c] text-[#C9A84C]"}`}
        >
          {saved && !failed ? (
            <img
              src={
                "/api/v1/admin/sponsors/" +
                record.id +
                "/assets/" +
                selected.mediaVersionId
              }
              alt={(draft.name || "Sponsor") + " selected logo"}
              className="h-full w-full object-contain p-4"
              onError={() => setFailed(true)}
            />
          ) : (
            <p className="px-3 text-center text-xs">
              {!selected
                ? "Choose a public logo"
                : !saved
                  ? "Save this draft to preview the selected image"
                  : "Logo unavailable"}
            </p>
          )}
        </div>
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-xs text-[#C9A84C]">Supported by</p>
          <h3 className="mt-2 break-words text-xl font-semibold">
            {draft.name || "Sponsor name"}
          </h3>
          <p className="mt-3 whitespace-pre-line break-words text-sm text-white/70">
            {draft.description ||
              "Your approved sponsor description appears here."}
          </p>
          {draft.website && (
            <p className="mt-4 break-all text-xs text-[#C9A84C]">
              External website: {draft.website}
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs text-white/60">
        Only the selected logo, name, description and website are public after
        publication. Featured credits use the same logo and link to the related
        show's or event's full credit. Series credits also appear below episode
        playback. Gold keeps these editorial credits; advertising uses its own
        rules.
      </p>
    </section>
  );
}
