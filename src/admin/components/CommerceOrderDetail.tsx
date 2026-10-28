import CommerceIcon from "./CommerceIcon";
import CommerceArtwork from "./CommerceArtwork";
export const orderMoney = (n: number) =>
  new Intl.NumberFormat("en-JM", {
    style: "currency",
    currency: "JMD",
    currencyDisplay: "code",
  }).format(n / 100);
export const orderDate = (d: string) =>
  new Intl.DateTimeFormat("en-JM", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Jamaica",
  }).format(new Date(d));
export default function CommerceOrderDetail({
  order: o,
  permissions,
  busy,
  reason,
  setReason,
  perform,
}: {
  order: any;
  permissions: string[];
  busy: boolean;
  reason: string;
  setReason: (v: string) => void;
  perform: (path: string, body: any, version?: number) => Promise<void>;
}) {
  const can = (p: string) => permissions.includes(p),
    ready = reason.trim().length >= 5,
    root = "/admin/commerce/orders/" + o.id;
  return (
    <div className="commerce-orders">
      <header className="orders-detail-header">
        <div>
          <p className="orders-eyebrow">ORDER RECORD</p>
          <h2>Order {o.id.slice(0, 8).toUpperCase()}</h2>
          <p className="orders-muted orders-reference">{o.id}</p>
          <p className="orders-muted">
            Placed {orderDate(o.created_at)} · Jamaica time
          </p>
        </div>
        <div>
          <span className={"orders-status status-" + o.effective_status}>
            {o.effective_status.replace(/_/g, " ")}
          </span>
          <p className="orders-total">{orderMoney(o.total_minor)}</p>
        </div>
      </header>
      <div className="orders-detail-grid">
        <section className="orders-panel">
          <h3>
            <CommerceIcon name="box" /> Items & bookings
          </h3>
          {o.items.map((i: any) => (
            <article className="orders-line" key={i.option_id}>
              <div style={{ width: 64 }}>
                <CommerceArtwork
                  src={
                    "/api/v1/admin/commerce/products/" + i.product_id + "/cover"
                  }
                  alt={i.name}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <strong>{i.name}</strong>
                <p className="orders-muted">
                  {i.option_label} · Quantity {i.quantity}
                </p>
                <small className="orders-muted">
                  Current product artwork · saved order description
                </small>
              </div>
              <strong>{orderMoney(i.unit_price_minor * i.quantity)}</strong>
            </article>
          ))}
          {o.admissions?.map((a: any) => (
            <div className="orders-booking" key={a.optionId}>
              <CommerceIcon name="calendar" />
              <div>
                <strong>{a.title}</strong>
                <p>
                  {new Intl.DateTimeFormat("en-JM", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: a.timezone,
                  }).format(new Date(a.startsAt))}{" "}
                  · {a.timezone}
                </p>
                {a.needsReview && (
                  <p role="status" className="orders-warning">
                    {a.reason}
                  </p>
                )}
                <small className="orders-muted">
                  Admission codes stay private to the customer. Check-in remains
                  on the event editor.
                </small>
              </div>
            </div>
          ))}
          <dl className="orders-totals">
            {[
              ["Subtotal", o.subtotal_minor],
              ["Delivery", o.shipping_minor],
              ["Tax", o.tax_minor],
              ["Total", o.total_minor],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{orderMoney(value as number)}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="orders-panel">
          <h3>
            <CommerceIcon name="truck" /> Delivery & collection
          </h3>
          <p style={{ textTransform: "capitalize" }}>
            {o.delivery === "none" ? "No physical delivery" : o.delivery}
          </p>
          {o.address && (
            <address style={{ fontStyle: "normal", lineHeight: 1.9 }}>
              {o.address.name}
              <br />
              {o.address.line1}
              <br />
              {o.address.parish}
              <br />
              {o.address.phone}
            </address>
          )}
          <p className="orders-muted">
            Customer address details are restricted to this staff detail view.
          </p>
        </section>
        <section className="orders-panel">
          <h3>
            <CommerceIcon name="receipt" /> Payment & actions
          </h3>
          {o.payment ? (
            <>
              <p className="orders-muted">{o.payment.provider}</p>
              <span className={"orders-status status-" + o.payment.state}>
                {o.payment.state.replace(/_/g, " ")}
              </span>
              <p>{o.payment.note}</p>
              {o.payment.refund && (
                <p className="orders-warning">
                  Refund: {o.payment.refund.state} ·{" "}
                  {orderMoney(o.payment.refund.amount_minor)}
                </p>
              )}
              {o.payment_hold && (
                <p role="status" className="orders-warning">
                  {o.status === "refunded"
                    ? "Refunded order: fulfillment, downloads and admission are unavailable."
                    : "Payment hold: fulfillment, downloads and admission are blocked."}
                </p>
              )}
            </>
          ) : (
            <p className="orders-muted">No payment attempt recorded.</p>
          )}
          <label className="orders-field">
            Action reason
            <textarea
              className="input"
              value={reason}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
              placeholder="Explain the action for the audit history"
            />
          </label>
          <p className="orders-muted">
            At least five characters. Actions retain their existing permission
            and payment checks.
          </p>
          <div className="orders-actions">
            {o.payment?.provider === "stripe-sandbox" && (
              <>
                <button
                  className="btn btn-secondary"
                  disabled={busy || !can("commerce.orders.manage")}
                  onClick={() => void perform(root + "/reconcile", {})}
                >
                  <CommerceIcon name="refresh" size={16} /> Reconcile payment
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={
                    busy ||
                    !ready ||
                    !can("commerce.refunds.manage") ||
                    o.payment.state !== "succeeded" ||
                    o.payment.refundedMinor > 0 ||
                    ["pending", "requesting"].includes(o.payment.refund?.state)
                  }
                  onClick={() => {
                    if (
                      confirm(
                        "Refund the full sandbox order? Tickets and downloads will be blocked. Physical stock will not be restocked automatically.",
                      )
                    )
                      void perform(root + "/refunds", { reason });
                  }}
                >
                  {o.payment.refund?.state === "uncertain"
                    ? "Retry refund request"
                    : "Refund full order"}
                </button>
              </>
            )}
            <button
              className="btn btn-secondary"
              disabled={
                busy ||
                !ready ||
                !can("commerce.orders.manage") ||
                o.effective_status !== "awaiting_payment"
              }
              onClick={() =>
                void perform(
                  root + "/actions",
                  { action: "cancel", reason },
                  o.version,
                )
              }
            >
              Cancel unpaid reservation
            </button>
            <button
              className="btn btn-primary"
              disabled={
                busy ||
                !ready ||
                !can("commerce.fulfillment.manage") ||
                o.status !== "paid" ||
                o.payment_hold
              }
              onClick={() =>
                void perform(
                  root + "/actions",
                  { action: "fulfill", reason },
                  o.version,
                )
              }
            >
              <CommerceIcon name="check" size={16} /> Mark fulfilled
            </button>
          </div>
          <p className="orders-muted">
            Payment status is established only by verified provider
            transactions.
          </p>
        </section>
        <section className="orders-panel">
          <h3>
            <CommerceIcon name="clock" /> Order history
          </h3>
          <ol className="orders-timeline">
            {o.history.map((h: any, i: number) => (
              <li key={i}>
                <span className="orders-timeline-dot" />
                <strong>
                  {h.action.replace(/\./g, " ").replace(/_/g, " ")}
                </strong>
                <p>{h.reason}</p>
                <time className="orders-muted">{orderDate(h.created_at)}</time>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
