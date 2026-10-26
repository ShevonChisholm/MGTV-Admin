import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useDirtyGuard } from "../router";
import MediaAttachment from "./MediaAttachment";
import { Card } from "../ui";
export default function AwardPresentation({
  id,
  disabled,
  canRead,
  canUpload,
  canPublish,
}: {
  id: string;
  disabled: boolean;
  canRead: boolean;
  canUpload: boolean;
  canPublish: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<any>(null),
    [body, setBody] = useState<any>(null),
    [initial, setInitial] = useState(""),
    [reason, setReason] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [revision, setRevision] = useState(0);
  const retry = useRef<{ payload: string; key: string } | null>(null);
  const dirty = !!body && JSON.stringify(body) !== initial;
  const complete = !!body?.portraitVersionId && !!body?.landscapeVersionId && body.nominees.every((n:any)=>!!n.imageVersionId);
  useDirtyGuard(() => dirty || busy);
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    api("/admin/awards/" + id + "/presentation")
      .then((d) => {
        if (!active) return;
        const b = d.active
          ? {
              portraitVersionId: d.body.portraitVersionId,
              landscapeVersionId: d.body.landscapeVersionId,
              nominees: d.body.nominees,
            }
          : {
              ...d.artwork,
              nominees: d.nominees.map((n: any) => ({
                nomineeId: n.id,
                imageVersionId: n.imageVersionId,
              })),
            };
        setData(d);
        setBody(b);
        setInitial(JSON.stringify(b));
        setReviewed(false);
        setReason("");
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, revision]);
  const change = (patch: any) => {
    setBody((b: any) => ({ ...b, ...patch }));
    setReviewed(false);
    setNotice("");
  };
  const preview = (version: string | null, label: string, portrait = false) =>
    version && canRead ? (
      <img
        src={`/api/v1/admin/awards/${id}/presentation/artwork/${version}`}
        alt={label}
        width={portrait ? 720 : 1200}
        height={portrait ? 1080 : 900}
        loading="lazy"
        style={{
          width: "100%",
          aspectRatio: portrait ? "2 / 3" : "4 / 3",
          objectFit: "cover",
          borderRadius: 8,
          background: "var(--bg)",
        }}
      />
    ) : null;
  async function publish() {
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...body,
        sourceRevisionId: data.sourceRevisionId,
        rightsConfirmed: reviewed,
        reason: reason.trim(),
      };
      const signature = JSON.stringify([payload, data.version]);
      if (retry.current?.payload !== signature)
        retry.current = { payload: signature, key: crypto.randomUUID() };
      await api(
        "/admin/awards/" + id + "/presentation",
        "POST",
        payload,
        data.version,
        retry.current.key,
      );
      retry.current = null;
      setNotice(
        "Artwork published. The frozen ballot, votes and results are unchanged.",
      );
      setRevision((x) => x + 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Awards artwork & presentation">
      <p style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
        Refresh the ceremony and nominee images through a separate reviewed
        presentation. Opening voting keeps the ballot locked; this artwork
        workflow cannot change nominees, dates, eligibility or results.
      </p>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="btn"
            disabled={busy || dirty}
            onClick={() => setRevision((x) => x + 1)}
          >
            Reload presentation
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {!data && !error && <p role="status">Loading artwork presentation…</p>}
      {data && !data.published && (
        <p>Publish the program first, then manage its presentation here.</p>
      )}
      {data?.published && body && (
        <details
          open={expanded}
          onToggle={(e) => setExpanded(e.currentTarget.open)}
        >
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            Manage ceremony &amp; nominee artwork
          </summary>
          {expanded && (
            <fieldset
              disabled={disabled || busy || !canPublish}
              style={{ border: 0, padding: 0, minWidth: 0 }}
            >
              <div className="grid-2">
                {(["landscapeVersionId", "portraitVersionId"] as const).map(
                  (slot) => (
                    <div key={slot} style={{ minWidth: 0 }}>
                      {preview(
                        body[slot],
                        slot === "portraitVersionId"
                          ? "Ceremony poster preview"
                          : "Ceremony hero preview",
                        slot === "portraitVersionId",
                      )}
                      <MediaAttachment
                        selectionHint="Artwork changes stay private until you publish the reviewed presentation. Replacing a selection does not delete its library file."
                        label={
                          slot === "portraitVersionId"
                            ? "Ceremony portrait poster"
                            : "Ceremony landscape hero"
                        }
                        kind="image"
                        value={body[slot]}
                        canRead={canRead}
                        canUpload={canUpload}
                        onBusyChange={setBusy}
                        onChange={(v) => change({ [slot]: v })}
                      />
                    </div>
                  ),
                )}
              </div>
              <div className="grid-2" style={{ marginTop: 20 }}>
                {data.nominees.map((n: any) => (
                  <div
                    key={n.id}
                    style={{
                      minWidth: 0,
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <h3 style={{ fontSize: 16 }}>{n.name}</h3>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {n.category}
                    </p>
                    {preview(
                      body.nominees.find((v: any) => v.nomineeId === n.id)
                        ?.imageVersionId,
                      n.name + " artwork preview",
                    )}
                    <MediaAttachment
                      selectionHint="Artwork changes stay private until you publish the reviewed presentation. Replacing a selection does not delete its library file."
                      label={n.name + " artwork"}
                      kind="image"
                      value={
                        body.nominees.find((v: any) => v.nomineeId === n.id)
                          ?.imageVersionId
                      }
                      canRead={canRead}
                      canUpload={canUpload}
                      onBusyChange={setBusy}
                      onChange={(v) =>
                        change({
                          nominees: body.nominees.map((x: any) =>
                            x.nomineeId === n.id
                              ? { ...x, imageVersionId: v }
                              : x,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <label style={{ display: "block", marginTop: 20 }}>
                Artwork review reason
                <textarea
                  value={reason}
                  maxLength={2000}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: "100%", minHeight: 80 }}
                />
              </label>
              <label style={{ display: "block", margin: "12px 0" }}>
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                />{" "}
                I reviewed every crop and confirm the rights to use this
                ceremony and nominee artwork.
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn primary"
                  disabled={!reviewed || reason.trim().length < 5 || !dirty || !complete}
                  onClick={publish}
                >
                  {busy ? "Publishing artwork…" : "Publish reviewed artwork"}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!dirty}
                  onClick={() => {
                    setBody(JSON.parse(initial));
                    setReviewed(false);
                    setReason("");
                  }}
                >
                  Discard artwork changes
                </button>
              </div>
            </fieldset>
          )}
        </details>
      )}
    </Card>
  );
}
