import { useEffect, useState } from "react";
import { api } from "../api/client";
export default function PartnershipPicker({
  path,
  label,
  value,
  onChange,
  disabled = false,
  status = "",
}: {
  path: string;
  label: string;
  value: string;
  onChange: (id: string, item: any) => void;
  disabled?: boolean;
  status?: string;
}) {
  const [q, setQ] = useState(""),
    [items, setItems] = useState<any[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setBusy(true);
    const timeout = setTimeout(() => {
      void api(
        path +
          "?q=" +
          encodeURIComponent(q) +
          (status ? "&status=" + encodeURIComponent(status) : ""),
      )
        .then((r) => {
          if (alive) {
            setItems(r.items);
            setCursor(r.nextCursor);
            setError("");
          }
        })
        .catch((e) => {
          if (alive) setError(e.message);
        })
        .finally(() => {
          if (alive) setBusy(false);
        });
    }, 200);
    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [path, q, status]);
  async function more() {
    setBusy(true);
    try {
      const r = await api(
        path +
          "?q=" +
          encodeURIComponent(q) +
          (status ? "&status=" + encodeURIComponent(status) : "") +
          "&after=" +
          encodeURIComponent(cursor!),
      );
      setItems((old) => [...old, ...r.items]);
      setCursor(r.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="pt-picker">
      <label>
        Find {label}
        <input
          className="input"
          value={q}
          disabled={disabled}
          onChange={(e) => setQ(e.target.value)}
          maxLength={120}
          placeholder="Search by name"
        />
      </label>
      <label>
        {label}
        <select
          className="input"
          value={value}
          disabled={disabled || busy}
          onChange={(e) =>
            onChange(
              e.target.value,
              items.find((i) => i.id === e.target.value),
            )
          }
        >
          <option value="">Choose…</option>
          {value && !items.some((i) => i.id === value) && (
            <option value={value}>Current selection · {value}</option>
          )}
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.body?.name ?? item.name}
              {item.status ? " · " + item.status : ""}
            </option>
          ))}
        </select>
      </label>
      {busy && <small role="status">Searching…</small>}
      {error && <p role="alert">{error}</p>}
      {cursor && (
        <button
          type="button"
          className="btn"
          disabled={busy || disabled}
          onClick={() => void more()}
        >
          Load more matches
        </button>
      )}
    </div>
  );
}
