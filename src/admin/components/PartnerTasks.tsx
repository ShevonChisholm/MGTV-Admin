import { useDirtyGuard } from "../router";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import MediaIcon from "./MediaIcon";
import "./partner-tasks.css";
const base = "/admin/partner-tasks";
const date = (value: string) =>
  new Intl.DateTimeFormat("en-JM", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Jamaica",
  }).format(new Date(value));
export default function PartnerTasks({
  agreement,
  canManage,
}: {
  agreement: any;
  canManage: boolean;
}) {
  const [items, setItems] = useState<any[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [creating, setCreating] = useState(false),
    [kind, setKind] = useState("review"),
    [title, setTitle] = useState("Review your MGTV agreement"),
    [instructions, setInstructions] = useState(
      "Please review the agreed services and responsibilities, then share your response.",
    ),
    [hours, setHours] = useState(48),
    [link, setLink] = useState(""),
    [selected, setSelected] = useState<any>(null),
    [reason, setReason] = useState(""),
    [pending, setPending] = useState<"revoke" | "complete" | null>(null),
    [notice, setNotice] = useState("");
  useDirtyGuard(() => creating || !!pending || !!reason);
  useEffect(() => {
    if (!canManage) setLink("");
  }, [canManage]);
  const current = useRef(agreement.id);
  current.current = agreement.id;
  const createKey = useRef({ body: "", key: crypto.randomUUID() });
  useEffect(() => {
    let ignore = false;
    setItems([]);
    setSelected(null);
    setLink("");
    setLoaded(false);
    setError("");
    api(base + "/agreements/" + agreement.id)
      .then((r) => {
        if (!ignore) {
          setItems(r.items);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (!ignore) {
          setError(e.message);
          setLoaded(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, [agreement.id]);
  async function load() {
    const r = await api(base + "/agreements/" + agreement.id);
    if (current.current === agreement.id) setItems(r.items);
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      if (current.current === agreement.id) setError((e as Error).message);
    } finally {
      if (current.current === agreement.id) setBusy(false);
    }
  }
  return (
    <section className="av-panel partner-tasks" aria-label="Partner requests">
      <div className="ptask-heading">
        <span className="av-icon">
          <MediaIcon name="mail" size={24} />
        </span>
        <div>
          <p className="people-eyebrow">ONE REQUEST · ONE SECURE LINK</p>
          <h3>Move the partnership forward</h3>
          <p>
            Ask the saved partner contact to review this agreement or supply
            information.
          </p>
        </div>
        {canManage && (
          <button
            className="btn btn-primary"
            disabled={
              busy ||
              !["approved", "accepted", "active"].includes(agreement.status)
            }
            onClick={() => setCreating(!creating)}
          >
            <MediaIcon name="plus" size={16} />
            {creating ? "Close request form" : "New request"}
          </button>
        )}
      </div>
      <div className="ptask-note">
        <MediaIcon name="lock" size={18} />
        <p>
          Email verification protects each private request. Responses do not
          sign or activate agreements. Signing, media submission and payment
          integrations remain separate next steps.
        </p>
      </div>
      {!["approved", "accepted", "active"].includes(agreement.status) && (
        <p>Finish staff review before sharing terms with a partner.</p>
      )}
      {error && (
        <p role="alert" className="people-error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {creating && canManage && (
        <form
          className="ptask-form"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const body = { kind, title, instructions, expiresInHours: hours };
              const fingerprint = JSON.stringify(body);
              if (createKey.current.body !== fingerprint)
                createKey.current = {
                  body: fingerprint,
                  key: crypto.randomUUID(),
                };
              await api(
                base + "/agreements/" + agreement.id,
                "POST",
                body,
                agreement.version,
                createKey.current.key,
              );
              createKey.current = { body: "", key: crypto.randomUUID() };
              setCreating(false);
              setNotice(
                "Request created. Generate its link when you are ready to share it.",
              );
              await load();
            });
          }}
        >
          <label>
            Request type
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="review">Agreement review</option>
              <option value="information">Requested information</option>
            </select>
          </label>
          <label>
            Title
            <input
              required
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="ptask-wide">
            Instructions
            <textarea
              required
              minLength={5}
              maxLength={3000}
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </label>
          <label>
            Link expires after (hours)
            <input
              type="number"
              min={1}
              max={168}
              required
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </label>
          <div className="ptask-wide access-actions">
            <button className="btn btn-primary" disabled={busy}>
              Create request
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => setCreating(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {!loaded ? (
        <p role="status">Loading partner requests…</p>
      ) : !items.length ? (
        <div className="ptask-empty">
          <MediaIcon name="file" size={30} />
          <h4>No partner requests yet</h4>
          <p>Create a focused request after the agreement has been reviewed.</p>
        </div>
      ) : (
        <>
          <p className="ptask-caption">
            Latest {items.length} requests · up to 50 shown · dates in Jamaica
            time
          </p>
          <div className="ptask-list">
            {items.map((t) => (
              <article key={t.id}>
                <span className="av-icon">
                  <MediaIcon
                    name={t.kind === "review" ? "review" : "file"}
                    size={22}
                  />
                </span>
                <div>
                  <h4>{t.title}</h4>
                  <p>
                    {t.kind === "review"
                      ? "Agreement review"
                      : "Requested information"}{" "}
                    · Agreement v{t.agreementVersion}
                  </p>
                  <small>Expires {date(t.expiresAt)}</small>
                </div>
                <span className="av-status">{t.status}</span>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const r = await api(base + "/" + t.id);
                      setSelected(r);
                      setPending(null);
                      setLink("");
                      setReason("");
                    })
                  }
                >
                  Open request
                </button>
              </article>
            ))}
          </div>
        </>
      )}
      {selected && (
        <section className="ptask-detail" aria-label="Selected partner request">
          <div className="ptask-heading">
            <div>
              <p className="people-eyebrow">REQUEST DETAILS</p>
              <h4>{selected.title}</h4>
              <p>Recipient: {selected.recipientEmail}</p>
            </div>
            <button
              className="btn"
              disabled={busy}
              onClick={() => {
                setSelected(null);
                setLink("");
                setPending(null);
              }}
            >
              Close details
            </button>
          </div>
          <p>{selected.instructions}</p>
          {selected.response && (
            <blockquote>
              <strong>{selected.response.outcome.replace(/_/g, " ")}</strong>
              <p>{selected.response.message}</p>
            </blockquote>
          )}
          <div className="access-actions">
            {canManage && selected.status === "open" && (
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const r = await api(
                      base + "/" + selected.id + "/link",
                      "POST",
                      {},
                      selected.version,
                    );
                    setLink(r.url);
                    setSelected(await api(base + "/" + selected.id));
                    await load();
                    setNotice(
                      "Link generated. Earlier links and verification sessions for this request are revoked.",
                    );
                  })
                }
              >
                <MediaIcon name="link" size={16} />
                {selected.hasLink
                  ? "Replace secure link"
                  : "Generate secure link"}
              </button>
            )}
            {canManage && selected.status === "submitted" && (
              <button
                className="btn"
                disabled={busy}
                onClick={() => {
                  setPending("complete");
                  setReason("");
                }}
              >
                Mark response reviewed
              </button>
            )}
            {canManage && ["open", "submitted"].includes(selected.status) && (
              <button
                className="btn"
                disabled={busy}
                onClick={() => {
                  setPending("revoke");
                  setReason("");
                }}
              >
                Revoke request
              </button>
            )}
          </div>
          {link && (
            <div className="ptask-link">
              <label>
                Private link — copy now; it will not be shown again
                <input
                  readOnly
                  value={link}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <p>
                Share only with {selected.recipientEmail}. Email codes currently
                go to the private development inbox.
              </p>
              <button
                className="btn"
                onClick={() =>
                  run(async () => {
                    await navigator.clipboard.writeText(link);
                    setNotice("Private link copied.");
                  })
                }
              >
                Copy private link
              </button>
            </div>
          )}
          {pending && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await api(
                    base + "/" + selected.id + "/" + pending,
                    "POST",
                    { reason },
                    selected.version,
                  );
                  setSelected(await api(base + "/" + selected.id));
                  setPending(null);
                  setLink("");
                  await load();
                });
              }}
            >
              <label>
                Audit reason
                <textarea
                  required
                  minLength={5}
                  maxLength={2000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div className="access-actions">
                <button className="btn btn-primary" disabled={busy}>
                  Confirm {pending === "complete" ? "review" : "revocation"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setPending(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          <h4>Request activity</h4>
          <ol className="ptask-history">
            {selected.history.map((h: any, i: number) => (
              <li key={i}>
                <strong>{h.action.replace(/\./g, " ")}</strong>
                <time>{date(h.created_at)}</time>
                {h.reason && <p>{h.reason}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
