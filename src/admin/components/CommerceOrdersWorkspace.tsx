import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { Link, useRouter } from "../router";
import LoadingState from "./LoadingState";
import CommerceIcon from "./CommerceIcon";
import CommerceOrderDetail, {
  orderDate,
  orderMoney,
} from "./CommerceOrderDetail";
const defaults = {
  q: "",
  status: "all",
  kind: "all",
  attention: "all",
  sort: "newest",
  from: "",
  to: "",
  page: 1,
  pageSize: 10,
};
export default function CommerceOrdersWorkspace({
  permissions,
}: {
  permissions: string[];
}) {
  const { route, navigate } = useRouter(),
    id = route.parts[1];
  const [query, setQuery] = useState(defaults),
    [search, setSearch] = useState(""),
    [data, setData] = useState<any>(null),
    [order, setOrder] = useState<any>(null),
    [busy, setBusy] = useState(true),
    [mutating, setMutating] = useState(false),
    [error, setError] = useState(""),
    [reason, setReason] = useState(""),
    [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  const params = new URLSearchParams(
    Object.entries(query)
      .filter(([, v]) => v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  useEffect(() => {
    const token = ++sequence.current;
    setBusy(true);
    setError("");
    setOrder(null);
    setReason("");
    const path = id
      ? "/admin/commerce/orders/" + encodeURIComponent(id)
      : "/admin/commerce/order-browser?" + params;
    api(path)
      .then((result) => {
        if (token !== sequence.current) return;
        if (id) setOrder(result);
        else {
          setData(result);
          if (query.page > Math.max(1, result.totalPages))
            setQuery((q) => ({ ...q, page: Math.max(1, result.totalPages) }));
        }
      })
      .catch((e) => {
        if (token === sequence.current) setError(e.message);
      })
      .finally(() => {
        if (token === sequence.current) setBusy(false);
      });
    return () => {
      sequence.current++;
    };
  }, [id, params, revision]);
  const update = (key: string, value: string | number) =>
    setQuery((q) => ({ ...q, [key]: value, page: 1 }));
  async function perform(path: string, body: any, version?: number) {
    const mutationToken = sequence.current;
    setMutating(true);
    setError("");
    try {
      await api(path, "POST", body, version);
      const refreshed = await api("/admin/commerce/orders/" + id);
      if (mutationToken === sequence.current) {
        setOrder(refreshed);
        setReason("");
      }
    } catch (e) {
      if (mutationToken === sequence.current) setError((e as Error).message);
    } finally {
      setMutating(false);
    }
  }
  const filter = (label: string, key: string, options: string[]) => (
    <label className="orders-field">
      {label}
      <select
        className="input"
        value={(query as any)[key]}
        onChange={(e) => update(key, e.target.value)}
      >
        {options.map((v) => (
          <option key={v} value={v}>
            {v === "all" ? "All " + label.toLowerCase() : v.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
  const rowInfo = (o: any) => (
    <>
      <Link
        className="orders-reference-link"
        to={"/admin/commerce/orders/" + o.id}
      >
        #{o.id.slice(0, 8).toUpperCase()}
      </Link>
      <p className="orders-line-preview">
        {o.lines[0]?.name ?? "Order"}
        {o.lines.length > 1 ? " + " + (o.lines.length - 1) + " more" : ""}
      </p>
    </>
  );
  const status = (o: any) => (
    <>
      <span className={"orders-status status-" + o.status}>
        {o.status.replace(/_/g, " ")}
      </span>
      {o.needs_review && (
        <span className="orders-review">
          <CommerceIcon name="alert" size={13} /> Needs review
        </span>
      )}
    </>
  );
  return (
    <div className="page-pad commerce-orders">
      <div className="orders-topnav">
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/admin/commerce")}
        >
          Products & Inventory
        </button>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/admin/commerce/orders")}
        >
          Orders & Bookings
        </button>
      </div>
      {id && (
        <button
          className="btn btn-ghost"
          onClick={() => navigate("/admin/commerce/orders")}
        >
          ← All orders & bookings
        </button>
      )}
      {error && (
        <div role="alert" className="orders-error">
          <strong>We couldn't complete that request.</strong>
          <p>{error}</p>
          <button
            className="btn btn-secondary"
            disabled={busy || mutating}
            onClick={() => setRevision((v) => v + 1)}
          >
            Try again
          </button>
        </div>
      )}
      {id ? (
        busy ? (
          <LoadingState label="Loading order details…" variant="cards" />
        ) : (
          order && (
            <CommerceOrderDetail
              order={order}
              permissions={permissions}
              busy={mutating}
              reason={reason}
              setReason={setReason}
              perform={perform}
            />
          )
        )
      ) : (
        <>
          <header className="orders-heading">
            <div>
              <p className="orders-eyebrow">COMMERCE OPERATIONS</p>
              <h2>Every order. Every next step.</h2>
              <p className="orders-muted">
                Orders and dated bookings, with payment and fulfillment status
                in focus.
              </p>
            </div>
            <span className="orders-sandbox">Stripe sandbox · JMD</span>
          </header>
          <div className="orders-stats" aria-busy={busy}>
            {[
              ["To fulfill", "truck", "toFulfill"],
              ["Upcoming bookings", "calendar", "upcoming"],
              ["Awaiting payment", "clock", "awaitingPayment"],
              ["Needs review", "alert", "needsReview"],
            ].map(([label, icon, key]) => (
              <div className="orders-stat" key={key}>
                <span
                  className={
                    "orders-icon " +
                    (key === "needsReview" ? "orders-icon-warning" : "")
                  }
                >
                  <CommerceIcon name={icon} />
                </span>
                <div>
                  <span className="orders-muted">{label}</span>
                  <strong>
                    {busy || error ? "—" : (data?.summary[key] ?? "—")}
                  </strong>
                </div>
              </div>
            ))}
          </div>
          <p className="orders-muted orders-count-note">
            Counts reflect all matching orders, not only this page. Upcoming
            bookings are paid orders with a future dated slot; fulfillment
            counts physical orders ready for dispatch or collection.
          </p>
          <section
            className="orders-panel orders-browser"
            aria-label="Order browser"
          >
            <form
              className="orders-toolbar"
              onSubmit={(e) => {
                e.preventDefault();
                update("q", search.trim());
              }}
            >
              <label className="orders-field orders-search">
                Search orders
                <div className="orders-search-wrap">
                  <CommerceIcon name="search" size={18} />
                  <input
                    className="input"
                    value={search}
                    maxLength={100}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Order reference, product or option"
                  />
                </div>
              </label>
              <button className="btn btn-primary" type="submit">
                Search
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                disabled={busy}
                onClick={() => setRevision((v) => v + 1)}
              >
                <CommerceIcon name="refresh" size={16} /> Refresh
              </button>
            </form>
            <div className="orders-filters">
              {filter("Status", "status", [
                "all",
                "awaiting_payment",
                "paid",
                "fulfilled",
                "cancelled",
                "expired",
                "refunded",
              ])}
              {filter("Type", "kind", [
                "all",
                "physical",
                "digital",
                "experience",
                "travel",
                "ticket",
              ])}
              {filter("Attention", "attention", [
                "all",
                "review",
                "fulfillment",
                "upcoming",
              ])}
              {filter("Sort", "sort", [
                "newest",
                "oldest",
                "amount_high",
                "amount_low",
              ])}
              <label className="orders-field">
                From (Jamaica)
                <input
                  className="input"
                  type="date"
                  value={query.from}
                  onChange={(e) => update("from", e.target.value)}
                />
              </label>
              <label className="orders-field">
                To (Jamaica)
                <input
                  className="input"
                  type="date"
                  value={query.to}
                  onChange={(e) => update("to", e.target.value)}
                />
              </label>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setQuery(defaults);
                  setSearch("");
                }}
              >
                <CommerceIcon name="filter" size={16} /> Clear filters
              </button>
            </div>
            <div aria-busy={busy}>
              {busy ? (
                <LoadingState
                  label="Loading matching orders…"
                  variant="table"
                />
              ) : error ? null : data?.items.length ? (
                <>
                  <div className="orders-desktop">
                    <table className="orders-table">
                      <thead>
                        <tr>
                          <th>Order / item</th>
                          <th>Status</th>
                          <th>Type</th>
                          <th>Total</th>
                          <th>Placed · Jamaica</th>
                          <th>
                            <span className="sr-only">Open order</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((o: any) => (
                          <tr key={o.id}>
                            <td>{rowInfo(o)}</td>
                            <td>{status(o)}</td>
                            <td>
                              <span className="orders-type">
                                <CommerceIcon
                                  name={
                                    o.lines.some((i: any) => i.startsAt)
                                      ? "calendar"
                                      : "box"
                                  }
                                  size={16}
                                />
                                {[
                                  ...new Set(o.lines.map((i: any) => i.kind)),
                                ].join(", ")}
                              </span>
                            </td>
                            <td className="orders-amount">
                              {orderMoney(o.total_minor)}
                            </td>
                            <td>{orderDate(o.created_at)}</td>
                            <td>
                              <Link
                                className="orders-open"
                                to={"/admin/commerce/orders/" + o.id}
                              >
                                <span className="sr-only">
                                  View order {o.id.slice(0, 8)}
                                </span>
                                <CommerceIcon name="arrow" size={18} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="orders-mobile">
                    {data.items.map((o: any) => (
                      <article className="orders-mobile-card" key={o.id}>
                        <div className="orders-mobile-head">
                          {rowInfo(o)}
                          <strong>{orderMoney(o.total_minor)}</strong>
                        </div>
                        <div className="orders-mobile-status">{status(o)}</div>
                        <p className="orders-muted">
                          {orderDate(o.created_at)}
                        </p>
                        <Link
                          className="orders-mobile-link"
                          to={"/admin/commerce/orders/" + o.id}
                        >
                          View order <CommerceIcon name="arrow" size={16} />
                        </Link>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="orders-empty">
                  <span className="orders-icon">
                    <CommerceIcon name="receipt" size={26} />
                  </span>
                  <h3>No matching orders</h3>
                  <p className="orders-muted">
                    Try a different reference, date or status.
                  </p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setQuery(defaults);
                      setSearch("");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
            <footer className="orders-pagination">
              <p role="status" className="orders-muted">
                {error
                  ? "Results unavailable"
                  : busy
                    ? "Updating results…"
                    : data?.total
                      ? `${(query.page - 1) * query.pageSize + 1}–${Math.min(query.page * query.pageSize, data.total)} of ${data.total} orders`
                      : "0 orders"}
              </p>
              <label className="orders-field">
                Per page
                <select
                  className="input"
                  value={query.pageSize}
                  onChange={(e) => update("pageSize", Number(e.target.value))}
                >
                  {[10, 25, 50].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <div className="orders-pages">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={busy || !!error || query.page <= 1}
                  onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
                >
                  ← Previous
                </button>
                <span>
                  Page {query.page} of {Math.max(1, data?.totalPages ?? 1)}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={
                    busy || !!error || !data || query.page >= data.totalPages
                  }
                  onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
                >
                  Next →
                </button>
              </div>
            </footer>
          </section>
        </>
      )}
    </div>
  );
}
