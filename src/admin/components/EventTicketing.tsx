import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card, TextField } from "../ui";
import { Link, useDirtyGuard } from "../router";
import LoadingState from "./LoadingState";
export default function EventTicketing({
  id,
  manage,
  checkin,
}: {
  id: string;
  manage: boolean;
  checkin: boolean;
}) {
  const [data, setData] = useState<any>(null),
    [products, setProducts] = useState<any[]>([]),
    [product, setProduct] = useState(""),
    [enabled, setEnabled] = useState(false),
    [reason, setReason] = useState(""),
    [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [result, setResult] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
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
    if (!manage) return;
    void Promise.all([
      api("/admin/events/" + id + "/ticketing"),
      api("/admin/commerce/products"),
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
  }, [id, manage, revision]);
  if (!manage && !checkin) return null;
  const style =
    "min-h-11 w-full rounded-lg border border-white/15 bg-black/20 px-3 text-sm";
  return (
    <Card title="Tickets & admission">
      <div className="space-y-4 min-w-0">
        {error && (
          <div role="alert" className="text-red-300 break-words">
            {error}
            <button
              type="button"
              className="block underline"
              onClick={() => setRevision((n) => n + 1)}
            >
              Reload ticketing
            </button>
          </div>
        )}
        {result && <p role="status">{result}</p>}
        {manage &&
          (!data && !error ? (
            <LoadingState />
          ) : (
            data && (
              <>
                <p className="text-sm text-white/60">
                  Use a dedicated Commerce experience product. Each dated option
                  is one ticket type, with its own price and capacity. Match the
                  published event dates exactly. No assigned seating.
                </p>
                <Link to="/admin/commerce">
                  Manage ticket products & capacity in Commerce →
                </Link>
                <label className="block text-sm">
                  Admission product
                  <select
                    className={style}
                    disabled={busy || !!data.product_id}
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                  >
                    <option value="">Select a dedicated product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={busy}
                    onChange={(e) => setEnabled(e.target.checked)}
                  />
                  Enable MGTV ticket sales
                </label>
                <TextField
                  label="Ticketing change reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button
                  type="button"
                  className={style + " text-[#D4AF37]"}
                  disabled={busy || !product || reason.trim().length < 5}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    setResult("");
                    try {
                      const d = await api(
                        "/admin/events/" + id + "/ticketing",
                        "PUT",
                        { productId: product, enabled, reason },
                        data.version,
                        crypto.randomUUID(),
                      );
                      setData({ ...d, summary: data.summary });
                      setReason("");
                      setResult("Ticketing settings saved.");
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Save ticketing
                </button>
                <p className="text-sm">
                  Issued: {data.summary?.issued ?? 0} · Checked in:{" "}
                  {data.summary?.checked_in ?? 0}
                </p>
              </>
            )
          ))}
        {checkin && (
          <div className="border-t border-white/10 pt-4 space-y-3">
            <h3 className="font-semibold">Staff check-in</h3>
            <p className="text-xs text-white/60">
              Enter the customer's private admission code. Each ticket admits
              once. Check-in opens two hours before the event and closes at its end. Cancelled, postponed, ended or changed bookings require
              review; check-in never marks an order paid.
            </p>
            <TextField
              label="Admission code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="button"
              className={style + " text-[#D4AF37]"}
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
                  setRevision((n) => n + 1);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Check in ticket
            </button>
          </div>
        )}
        <p className="text-xs text-white/50">
          Sandbox payments only. Cancellation and postponement stop sales and
          flag existing bookings for review. Automatic refunds and production
          email remain pending.
        </p>
      </div>
    </Card>
  );
}
