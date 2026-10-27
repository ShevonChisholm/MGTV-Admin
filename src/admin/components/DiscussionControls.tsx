import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { Card, Modal, TextField } from "../ui";
export default function DiscussionControls({
  discussion,
  canManage,
}: {
  discussion: { kind: string; targetId: string };
  canManage: boolean;
}) {
  const path =
      "/admin/discussions/" +
      encodeURIComponent(discussion.kind) +
      "/" +
      encodeURIComponent(discussion.targetId),
    [state, setState] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [open, setOpen] = useState(false),
    [reason, setReason] = useState(""),
    [revision, setRevision] = useState(0),
    pending = useRef<{ body: string; key: string } | null>(null);
  useEffect(() => {
    let active = true;
    setError("");
    void api(path)
      .then((r) => {
        if (active) setState(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [path, revision]);
  async function save() {
    if (!state) return;
    setBusy(true);
    setError("");
    try {
      const body = { locked: !state.locked, reason: reason.trim() },
        serialized = JSON.stringify([body, state.version]);
      if (pending.current?.body !== serialized)
        pending.current = { body: serialized, key: crypto.randomUUID() };
      const result = await api(
        path + "/lock",
        "POST",
        body,
        state.version,
        pending.current!.key,
      );
      setState(result);
      setReason("");
      pending.current = null;
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Conversation controls">
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Comments and replies are visible only to adult profiles with current
        content access. Removing a comment leaves its film, episode or music
        release published.
      </p>
      {state ? (
        <p>
          <strong>
            {state.locked ? "Conversation paused" : "Conversation open"}
          </strong>
        </p>
      ) : (
        <p role="status">Loading conversation settings…</p>
      )}
      {error && (
        <p
          role="alert"
          style={{ color: "var(--red)", overflowWrap: "anywhere" }}
        >
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className="btn"
          disabled={busy}
          onClick={() => setRevision((n) => n + 1)}
        >
          Refresh settings
        </button>
        {canManage && (
          <button
            className="btn btn-primary"
            disabled={busy || !state}
            onClick={() => {
              setError("");
              setOpen(true);
            }}
          >
            {state?.locked ? "Reopen conversation" : "Pause conversation"}
          </button>
        )}
      </div>
      {open && state && (
        <Modal
          title={
            state.locked
              ? "Reopen this conversation?"
              : "Pause this conversation?"
          }
          onClose={() => {
            if (!busy) setOpen(false);
          }}
          footer={
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={busy || reason.trim().length < 5}
                onClick={() => void save()}
              >
                {busy ? "Saving…" : "Save conversation setting"}
              </button>
            </>
          }
        >
          <p>
            Pausing prevents new comments, edits and likes. People can still
            read, report or remove their own comments. Your reason is recorded
            for staff.
          </p>
          <TextField
            label="Reason · recorded for moderators"
            value={reason}
            maxLength={1000}
            onChange={(e) => setReason(e.target.value)}
          />
          {error && (
            <p role="alert" style={{ color: "var(--red)" }}>
              {error}
            </p>
          )}
        </Modal>
      )}
    </Card>
  );
}
