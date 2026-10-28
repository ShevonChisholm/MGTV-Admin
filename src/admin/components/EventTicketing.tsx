import { useEffect, useState } from "react";
import { api } from "../api/client";
import { TextField } from "../ui";
import { Link, useDirtyGuard } from "../router";
import LoadingState from "./LoadingState";
import MediaIcon from "./MediaIcon";
import { eventTime, EventState } from "./EventsVisual";

export default function EventTicketing({
  id,
  manage,
  checkin,
  commerceRead,
  record,
}: {
  id: string;
  manage: boolean;
  checkin: boolean;
  commerceRead: boolean;
  record: any;
}) {
  const [data, setData] = useState<any>(null),
    [products, setProducts] = useState<any[]>([]),
    [product, setProduct] = useState(""),
    [enabled, setEnabled] = useState(false),
    [reason, setReason] = useState(""),
    [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [lookupError, setLookupError] = useState(""),
    [result, setResult] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0),
    [detail, setDetail] = useState<any>(null),
    [detailError, setDetailError] = useState(""),
    [detailLoading, setDetailLoading] = useState(false),
    [detailRevision, setDetailRevision] = useState(0);
  useDirtyGuard(
    () =>
      !!data &&
      (product !== (data.product_id ?? "") ||
        enabled !== data.enabled ||
        !!reason),
  );
  useEffect(() => {
    let live = true;
    setError("");
    setLookupError("");
    if (!manage) return;
    void Promise.all([
      api("/admin/events/" + id + "/ticketing"),
      commerceRead
        ? api("/admin/commerce/products").catch((e) => {
            if (live) setLookupError(e.message);
            return { items: [] };
          })
        : Promise.resolve({ items: [] }),
    ])
      .then(([d, p]) => {
        if (live) {
          setData(d);
          setProduct(d.product_id ?? "");
          setEnabled(d.enabled);
          setReason("");
          setProducts(p.items.filter((x: any) => x.kind === "experience"));
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [id, manage, commerceRead, revision]);
  useEffect(() => {
    let live = true;
    setDetail(null);
    setDetailError("");
    setDetailLoading(false);
    if (!product || !commerceRead) return;
    setDetailLoading(true);
    void api("/admin/commerce/products/" + product)
      .then((p) => {
        if (live) setDetail(p);
      })
      .catch((e) => {
        if (live) setDetailError(e.message);
      })
      .finally(() => {
        if (live) setDetailLoading(false);
      });
    return () => {
      live = false;
    };
  }, [product, commerceRead, detailRevision]);
  if (!manage && !checkin) return null;
  const d = record.draft;
  const settingsDirty =
    !!data &&
    (product !== (data.product_id ?? "") ||
      enabled !== data.enabled ||
      !!reason);
  return (
    <section className="ev-ticketing" aria-label="Event tickets and admission">
      <div className="ev-list-head">
        <div>
          <span className="cv-kicker">Admission desk</span>
          <h2>Make every arrival count.</h2>
          <p>
            Tickets, sales settings and staff admission for the saved event.
          </p>
        </div>
        <EventState label="Event" value={record.lifecycle} />
      </div>
      {error && (
        <div className="ev-notice" role="alert">
          {error}
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => setRevision((n) => n + 1)}
          >
            Reload ticketing
          </button>
        </div>
      )}
      {result && (
        <p role="status" className="ev-ticket-result">
          <MediaIcon name="check" size={18} /> {result}
        </p>
      )}
      {manage && data && (
        <div className="ev-ticket-stats">
          <div>
            <MediaIcon name="ticket" size={25} />
            <span>
              <strong>{data.summary?.issued ?? "—"}</strong>
              <small>Tickets issued</small>
            </span>
          </div>
          <div>
            <MediaIcon name="scan" size={25} />
            <span>
              <strong>{data.summary?.checked_in ?? "—"}</strong>
              <small>Checked in</small>
            </span>
          </div>
          <div>
            <MediaIcon name={data.enabled ? "check" : "lock"} size={25} />
            <span>
              <strong>{data.enabled ? "Enabled" : "Disabled"}</strong>
              <small>Saved sales setting</small>
            </span>
          </div>
        </div>
      )}
      {settingsDirty && (
        <p className="ev-notice" role="status">
          Unsaved ticketing settings. The summary shows the saved sales setting.
        </p>
      )}
      <div className="ev-ticket-layout">
        {manage && (
          <section className="ev-panel">
            <h3>
              <MediaIcon name="ticket" /> Ticket sales
            </h3>
            {!data && !error ? (
              <LoadingState
                variant="form"
                label="Loading ticketing settings…"
              />
            ) : (
              data && (
                <>
                  <p className="ev-muted">
                    General admission through a dedicated Commerce experience
                    product. Each dated option is a ticket type with its own
                    price and capacity. Dates must match the published event.
                  </p>
                  {lookupError && (
                    <p role="alert" className="ev-notice">
                      Admission product lookup: {lookupError}
                    </p>
                  )}
                  {!commerceRead && (
                    <p className="ev-notice">
                      Commerce read permission is required to choose a product
                      or inspect ticket capacity. Your event ticket summary
                      remains available.
                    </p>
                  )}
                  <label className="library-field">
                    Admission product
                    <select
                      className="input"
                      disabled={busy || !!data.product_id || !commerceRead}
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                    >
                      <option value="">Select a dedicated product</option>
                      {product && !products.some((p) => p.id === product) && (
                        <option value={product}>
                          {detail?.name ?? "Linked admission product"}
                        </option>
                      )}
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.status}
                        </option>
                      ))}
                    </select>
                  </label>
                  {data.product_id && (
                    <p className="ev-muted">
                      The linked product stays fixed to preserve ticket and
                      order history.
                    </p>
                  )}
                  <label className="ev-ticket-actions">
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={busy || !commerceRead}
                      onChange={(e) => setEnabled(e.target.checked)}
                    />{" "}
                    Enable MGTV ticket sales
                  </label>
                  <TextField
                    label="Ticketing change reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="ev-ticket-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={
                        busy ||
                        !commerceRead ||
                        !product ||
                        reason.trim().length < 5
                      }
                      onClick={async () => {
                        setBusy(true);
                        setError("");
                        setResult("");
                        try {
                          const saved = await api(
                            "/admin/events/" + id + "/ticketing",
                            "PUT",
                            { productId: product, enabled, reason },
                            data.version,
                            crypto.randomUUID(),
                          );
                          setData({ ...saved, summary: data.summary });
                          setReason("");
                          setResult("Ticketing settings saved.");
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      <MediaIcon name="check" size={16} /> Save ticketing
                    </button>
                    {commerceRead && (
                      <Link
                        className="btn"
                        to={
                          product
                            ? "/admin/commerce/products/" + product
                            : "/admin/commerce"
                        }
                      >
                        <MediaIcon name="arrow" size={16} />{" "}
                        {product
                          ? "Open ticket product"
                          : "Browse Commerce products"}
                      </Link>
                    )}
                  </div>
                </>
              )
            )}
          </section>
        )}
        {checkin && (
          <section className="ev-panel">
            <div className="ev-checkin-head">
              <MediaIcon name="scan" size={30} />
              <div>
                <span className="cv-kicker">Staff admission</span>
                <h3>Check in a ticket</h3>
              </div>
            </div>
            <p className="ev-muted">
              Use the customer's private admission code. Each issued ticket
              admits once. The ticket must be valid for this event. Check-in
              never marks an order paid.
            </p>
            <div className="ev-notice">
              <MediaIcon name="clock" size={16} /> Opens two hours before{" "}
              {eventTime(d.startsAt, d.timezone)} and closes at{" "}
              {eventTime(d.endsAt, d.timezone)} · {d.timezone}. Cancelled,
              postponed, ended or changed bookings require review.
            </div>
            <div className="ev-code">
              <TextField
                label="Admission code"
                value={code}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !/^[A-Za-z0-9_-]{43}$/.test(code)}
              onClick={async () => {
                setBusy(true);
                setError("");
                setResult("");
                try {
                  await api(
                    "/admin/events/" + id + "/ticketing/check-in",
                    "POST",
                    { code },
                    undefined,
                    crypto.randomUUID(),
                  );
                  setCode("");
                  setResult("Ticket checked in. Welcome to the moment.");
                  if (manage) {
                    try {
                      const latest = await api(
                        "/admin/events/" + id + "/ticketing",
                      );
                      setData((old: any) =>
                        old ? { ...old, summary: latest.summary } : latest,
                      );
                    } catch {
                      setError(
                        "Ticket checked in successfully, but the summary could not refresh. Refresh ticketing before relying on the totals.",
                      );
                    }
                  }
                  setDetailRevision((n) => n + 1);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <MediaIcon name="scan" size={17} /> Check in ticket
            </button>
          </section>
        )}
      </div>
      {manage && commerceRead && product && (
        <section className="ev-panel" style={{ marginTop: 20 }}>
          <div className="ev-list-head">
            <h3>
              <MediaIcon name="users" /> Ticket types & capacity
            </h3>
            <button
              type="button"
              className="btn"
              disabled={detailLoading || busy}
              onClick={() => setDetailRevision((n) => n + 1)}
            >
              <MediaIcon name="refresh" size={16} /> Refresh capacity
            </button>
          </div>
          <p className="ev-muted">
            {data?.product_id === product
              ? "Linked admission product"
              : "Selected product · not linked until saved"}
            {detail ? " · " + detail.name : ""}. Availability is a snapshot and
            includes current checkout reservations; checkout validates capacity
            again.
          </p>
          {detailError && <p role="alert">{detailError}</p>}
          {detailLoading ? (
            <LoadingState variant="cards" label="Loading ticket capacity…" />
          ) : (
            detail && (
              <>
                <div className="ev-option-grid">
                  {(detail.options ?? []).map((o: any) => (
                    <article className="ev-option" key={o.id}>
                      <span className="cv-kicker">
                        {o.active ? "Active option" : "Inactive option"}
                      </span>
                      <h4>{o.label}</h4>
                      <p className="ev-option-price">
                        {new Intl.NumberFormat("en-JM", {
                          style: "currency",
                          currency: "JMD",
                          currencyDisplay: "code",
                        }).format(Number(o.price_minor) / 100)}
                      </p>
                      <small>
                        {eventTime(o.starts_at, d.timezone)} —{" "}
                        {eventTime(o.ends_at, d.timezone)}
                        <br />
                        {d.timezone}
                      </small>
                      <div className="ev-capacity">
                        <span>
                          <strong>{o.available}</strong> available
                        </span>
                        <span>
                          <strong>{o.sold}</strong> sold
                        </span>
                        <span>
                          <strong>{o.capacity}</strong> capacity
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
                {!detail.options?.length && (
                  <p className="ev-notice">
                    No dated ticket options are configured on this product. Add
                    prices and capacity in Commerce.
                  </p>
                )}
              </>
            )
          )}
        </section>
      )}
      <p className="ev-notice">
        Sandbox payments only. Cancellation and postponement stop sales and flag
        existing bookings for review. Refund policy and verified payment status
        remain governed by Commerce; this screen does not issue refunds.
        Production email remains pending.
      </p>
    </section>
  );
}
