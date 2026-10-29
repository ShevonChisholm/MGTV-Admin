import { useState, type ReactNode } from "react";
import MediaIcon from "./MediaIcon";
import "./AccessVisual.css";
export function PermissionGroup({
  initialOpen,
  title,
  count,
  icon,
  children,
}: {
  initialOpen: boolean;
  title: string;
  count: number;
  icon: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <details
      className="av-permission-group"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <MediaIcon name={icon} size={18} />
        {title}
        <span>{count} selected</span>
      </summary>
      {children}
    </details>
  );
}
export function resourceIcon(key: string) {
  return (
    (
      {
        movies: "film",
        shows: "series",
        music: "audio",
        media: "image",
        events: "calendar",
        ticketing: "ticket",
        commerce: "brand",
        artists: "artist",
        albums: "album",
        playlists: "playlist",
        podcasts: "podcast",
        sports: "sport",
        notifications: "bell",
        newsletter: "mail",
        staff: "users",
        customers: "users",
        profiles: "users",
        access: "lock",
        onboarding: "review",
      } as Record<string, string>
    )[key] ?? "grid"
  );
}
export function Identity({
  name,
  detail,
  icon = "users",
}: {
  name: string;
  detail?: string;
  icon?: string;
}) {
  return (
    <div className="av-identity">
      <span className="av-icon">
        <MediaIcon name={icon} />
      </span>
      <div>
        <strong>{name}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </div>
  );
}
export function Summary({
  items,
}: {
  items: { icon: string; label: string; value: number | string }[];
}) {
  return (
    <div className="av-summary">
      {items.map((item) => (
        <div key={item.label}>
          <span className="av-icon">
            <MediaIcon name={item.icon} />
          </span>
          <div>
            <strong>{item.value}</strong>
            <small>{item.label}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
export default function AccessTable<T>({
  rows,
  columns,
  rowKey,
  label,
  empty = "No records match your filters.",
  scope = "returned records",
}: {
  rows: T[];
  columns: { key: string; label: string; render: (row: T) => ReactNode }[];
  rowKey: (row: T) => string;
  label: string;
  empty?: string;
  scope?: string;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / 10)),
    current = Math.min(page, pages - 1),
    start = current * 10;
  return (
    <div className="av-directory">
      <div className="av-table-wrap">
        <table className="av-table" role="table">
          <caption>{label}</caption>
          <thead>
            <tr role="row">
              {columns.map((c) => (
                <th key={c.key} scope="col" role="columnheader">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(start, start + 10).map((row) => (
              <tr key={rowKey(row)} role="row">
                {columns.map((c) => (
                  <td key={c.key} role="cell" data-label={c.label}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="av-empty">
            <MediaIcon name="search" size={30} />
            <h3>No matches</h3>
            <p>{empty}</p>
          </div>
        )}
      </div>
      <div className="av-pagination">
        <p role="status">
          {rows.length
            ? `${start + 1}–${Math.min(start + 10, rows.length)} of ${rows.length}`
            : "0"}{" "}
          {scope}
        </p>
        <div>
          <button
            className="btn"
            type="button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            aria-label={`Previous page of ${label}`}
          >
            <MediaIcon name="back" size={16} />
            Previous
          </button>
          <span>
            Page {current + 1} / {pages}
          </span>
          <button
            className="btn"
            type="button"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
            aria-label={`Next page of ${label}`}
          >
            Next
            <MediaIcon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
