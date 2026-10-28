import React, { useMemo, useState } from "react";
import { PageActions } from "../components/PageHeader";
import { Link, useRouter } from "../router";
import { useStore } from "../store/store";
import { Badge, ConfirmDialog, EmptyState, MediaThumb, Tabs } from "../ui";
import {
  STATUS_META,
  TYPE_META,
  TYPE_ORDER,
  fmtDate,
  metaLine,
  typeFromTab,
} from "../store/meta";
import { transition, TRANSITION_TOAST } from "../store/validate";
import { homepageUsage } from "../store/store";
import type {
  ContentItem,
  ContentStatus,
  TransitionAction,
} from "../store/types";
import Editor from "./content/Editor";
import ContentPreview from "./content/Preview";
import ConnectedMovies from "./ConnectedMovies";
import ConnectedEditorial from "./ConnectedEditorial";
import ConnectedShows from "./ConnectedShows";
import { connected } from "../api/client";

function List({ tab }: { tab: string }) {
  const type = typeFromTab(tab);
  const meta = TYPE_META[type];
  const { content, assets, homepage, saveContent, toast } = useStore();
  const { navigate } = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ContentStatus>("all");
  const [preview, setPreview] = useState<ContentItem | null>(null);
  const [confirm, setConfirm] = useState<{
    item: ContentItem;
    action: TransitionAction;
  } | null>(null);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    content.forEach((c) => (m[c.type] = (m[c.type] ?? 0) + 1));
    return m;
  }, [content]);

  const rows = content
    .filter((c) => c.type === type)
    .filter((c) => status === "all" || c.status === status)
    .filter((c) => c.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const run = (item: ContentItem, action: TransitionAction) => {
    const res = transition(item, action, assets);
    if (!res.ok) {
      toast(
        "error",
        `Can't ${action} "${item.title}": ${res.issues[0].message} Open it to fix ${res.issues.length} issue${res.issues.length === 1 ? "" : "s"}.`,
      );
      return;
    }
    saveContent(res.item);
    toast("success", TRANSITION_TOAST[action](res.item.title));
  };

  const request = (item: ContentItem, action: TransitionAction) => {
    if (
      action === "archive" ||
      (action === "unpublish" && homepageUsage(item.id, homepage).length)
    )
      setConfirm({ item, action });
    else run(item, action);
  };

  const inline = (
    c: ContentItem,
  ): { action: TransitionAction; label: string }[] => {
    switch (c.status) {
      case "draft":
      case "unpublished":
      case "scheduled":
        return [
          { action: "publish", label: "Publish" },
          { action: "archive", label: "Archive" },
        ];
      case "published":
        return [
          { action: "unpublish", label: "Unpublish" },
          { action: "archive", label: "Archive" },
        ];
      case "archived":
        return [{ action: "restore", label: "Restore" }];
    }
  };

  const base = `/admin/content/${meta.tab}`;
  const cn = confirm ? homepageUsage(confirm.item.id, homepage) : [];

  return (
    <div className="page-pad">
      <PageActions>
        <Link
          to={`${base}/new`}
          className="btn btn-primary"
          style={{ textDecoration: "none" }}
        >
          {meta.cta}
        </Link>
      </PageActions>

      <div className="scroll-x">
        <Tabs
          label="Content types"
          value={meta.tab}
          onChange={(t) => navigate(`/admin/content/${t}`)}
          items={TYPE_ORDER.map((t) => ({
            id: TYPE_META[t].tab,
            label: TYPE_META[t].plural,
            count: counts[t] ?? 0,
          }))}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          margin: "16px 0",
          flexWrap: "wrap",
          alignItems: "end",
        }}
      >
        <div style={{ flex: "1 1 220px", maxWidth: 360 }}>
          <label
            htmlFor="content-q"
            style={{
              display: "block",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            Search {meta.plural.toLowerCase()}
          </label>
          <input
            id="content-q"
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Title"
          />
        </div>
        <div>
          <label
            htmlFor="content-status"
            style={{
              display: "block",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            Status
          </label>
          <select
            id="content-status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | ContentStatus)}
          >
            <option value="all">All statuses</option>
            {(Object.keys(STATUS_META) as ContentStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        counts[type] ? (
          <EmptyState
            title="No matches"
            body="No items match this search and status filter."
            action={
              <button
                className="btn"
                onClick={() => {
                  setQ("");
                  setStatus("all");
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <EmptyState
            title={`No ${meta.plural.toLowerCase()} yet`}
            body={`Create the first ${meta.label.toLowerCase()}. You can save it as a draft and publish once it is complete.`}
            action={
              <Link
                to={`${base}/new`}
                className="btn btn-primary"
                style={{ textDecoration: "none" }}
              >
                {meta.cta}
              </Link>
            }
          />
        )
      ) : (
        <div className="scroll-x">
          <table className="tbl">
            <caption
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
              }}
            >
              {meta.plural}
            </caption>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Details</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const art =
                  assets[c.landscapeId ?? ""] ??
                  assets[c.posterId ?? ""] ??
                  assets[c.squareId ?? ""] ??
                  null;
                return (
                  <tr key={c.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                          minWidth: 200,
                        }}
                      >
                        <div style={{ width: 64, flex: "0 0 auto" }}>
                          <MediaThumb asset={art} crop="landscape" />
                        </div>
                        <div>
                          <Link
                            to={`${base}/${c.id}`}
                            style={{
                              color: "var(--text-primary)",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            {c.title || "Untitled"}
                          </Link>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: "var(--text-muted)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {c.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {metaLine(c) || "—"}
                    </td>
                    <td>
                      <Badge color={STATUS_META[c.status].color}>
                        {STATUS_META[c.status].label}
                      </Badge>
                      {c.status === "scheduled" && (
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "var(--text-secondary)",
                            marginTop: 4,
                          }}
                        >
                          {fmtDate(c.scheduledAt)}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtDate(c.updatedAt)}
                    </td>
                    <td>
                      <div
                        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                      >
                        <Link
                          to={`${base}/${c.id}`}
                          className="btn btn-sm"
                          style={{ textDecoration: "none" }}
                          aria-label={`Edit ${c.title}`}
                        >
                          Edit
                        </Link>
                        <button
                          className="btn btn-sm"
                          onClick={() => setPreview(c)}
                          aria-label={`Preview ${c.title}`}
                        >
                          Preview
                        </button>
                        {inline(c).map((a) => (
                          <button
                            key={a.action}
                            className={`btn btn-sm${a.action === "archive" ? " btn-danger" : ""}`}
                            onClick={() => request(c, a.action)}
                            aria-label={`${a.label} ${c.title}`}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {preview && (
        <ContentPreview item={preview} onClose={() => setPreview(null)} />
      )}
      {confirm && (
        <ConfirmDialog
          title={`${confirm.action === "archive" ? "Archive" : "Unpublish"} "${confirm.item.title}"?`}
          confirmLabel={confirm.action === "archive" ? "Archive" : "Unpublish"}
          danger={confirm.action === "archive"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const { item, action } = confirm;
            setConfirm(null);
            run(item, action);
          }}
        >
          {confirm.action === "archive"
            ? "Archived content is hidden from customers and read-only until restored."
            : "It will stop being visible to customers."}
          {cn.length > 0 && (
            <p style={{ margin: "10px 0 0" }}>
              It is selected in homepage section{cn.length > 1 ? "s" : ""}:{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {cn.map((u) => u.label).join(", ")}
              </strong>
              . They will show it as unavailable.
            </p>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}

export default function Content() {
  const { route } = useRouter();
  const [tab, id] = route.parts;
  if (connected && (!tab || tab === "shows")) return <ConnectedShows />;
  if (connected && ["music", "music-videos", "audio"].includes(tab ?? ""))
    return (
      <ConnectedEditorial
        key={`music:${tab === "audio" ? "track" : "video"}:${id ?? "list"}`}
        id={id}
        entity="music"
        musicKind={tab === "audio" ? "track" : "music-video"}
        basePath={
          "/admin/content/" + (tab === "audio" ? "audio" : "music-videos")
        }
      />
    );
  if (connected && tab === "movies")
    return <ConnectedMovies key={`movies:${id ?? "list"}`} id={id} />;
  if (connected && tab === "sports") return <ConnectedEditorial key={`sports:${id??"list"}`} id={id} entity="sports" basePath="/admin/content/sports"/>;
  if (!tab) return <List tab="shows" />;
  if (!id) return <List tab={tab} />;
  const type = typeFromTab(tab);
  return <Editor key={`${type}:${id}`} type={type} id={id} />;
}
